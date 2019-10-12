import axios from 'axios';
import { push } from 'connected-react-router';
import { message } from 'antd';
import path from 'path';
import fsa from 'fs-extra';
import os from 'os';
import log from 'electron-log';
import store from '../localStore';
import {
  LOGIN_API,
  ACCESS_TOKEN_VALIDATION_URL,
  ACCESS_TOKEN_REFRESH_URL
} from '../constants';

export const LOGOUT = 'LOGOUT';
export const START_AUTH_LOADING = 'START_AUTH_LOADING';
export const STOP_AUTH_LOADING = 'STOP_AUTH_LOADING';
export const START_TOKEN_CHECK_LOADING = 'START_TOKEN_CHECK_LOADING';
export const STOP_TOKEN_CHECK_LOADING = 'STOP_TOKEN_CHECK_LOADING';
export const AUTH_SUCCESS = 'AUTH_SUCCESS';
export const AUTH_FAILED = 'AUTH_FAILED';
export const START_NATIVE_LOADING = 'START_NATIVE_LOADING';
export const STOP_NATIVE_LOADING = 'STOP_NATIVE_LOADING';

export function login(username, password, remember) {
  return async dispatch => {
    dispatch({
      type: START_AUTH_LOADING
    });
    try {
      const { data, status } = await axios.post(
        LOGIN_API,
        {
          agent: {
            name: 'Minecraft',
            version: 1
          },
          username,
          password,
          requestUser: true,
          clientToken: getClientToken()
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (status === 200 && data && data.accessToken) {
        const payload = {
          email: username,
          username: data.user.username,
          displayName: data.selectedProfile.name,
          accessToken: data.accessToken,
          uuid: data.selectedProfile.id,
          userID: data.user.id
        };
        console.log(data);
        if (remember) {
          store.set({
            user: {
              ...payload
            },
            lastUsername: username
          });
        }
        dispatch({
          type: AUTH_SUCCESS,
          payload: {
            ...payload,
            clientToken: getClientToken()
          }
        });

        const { newUser } = store.get('settings');

        if (newUser === false) {
          dispatch(push('/home'));
        } else {
          store.set('settings.newUser', false);
          dispatch(push('/newUserPage'));
        }
      } else {
        message.error('Wrong username or password');
        dispatch({
          type: AUTH_FAILED
        });
      }
    } catch (err) {
      console.error(err);
      message.error('Wrong username or password');
    } finally {
      dispatch({
        type: STOP_AUTH_LOADING
      });
    }
  };
}

export function logout() {
  return dispatch => {
    store.delete('user');
    dispatch({
      type: LOGOUT
    });
    dispatch(push('/'));
  };
}

export function checkAccessToken() {
  return async dispatch => {
    const userData = store.get('user');
    if (userData) {
      dispatch({
        type: START_TOKEN_CHECK_LOADING
      });
      try {
        // First of all we try validating the stored access token
        const res = await axios.post(
          ACCESS_TOKEN_VALIDATION_URL,
          {
            accessToken: userData.accessToken,
            clientToken: getClientToken()
          },
          { headers: { 'Content-Type': 'application/json' } }
        );
        if (res.status === 204) {
          dispatch({
            type: AUTH_SUCCESS,
            payload: {
              ...userData,
              clientToken: getClientToken()
            }
          });
          dispatch(push('/home'));
        }
        return res;
      } catch (error) {
        if (error.response && error.response.status === 403) {
          // Trying refreshing the stored access token
          const newUserData = await refreshAccessToken(
            userData.accessToken,
            getClientToken(),
            true
          );
          if (newUserData) {
            const payload = {
              username: newUserData.selectedProfile.name,
              accessToken: newUserData.accessToken,
              uuid: newUserData.selectedProfile.id,
              userID: newUserData.user.id
            };
            store.set({
              user: {
                ...payload
              }
            });
            dispatch({
              type: AUTH_SUCCESS,
              payload: {
                ...payload,
                clientToken: getClientToken()
              }
            });
            dispatch(push('/home'));
          } else {
            message.error('Token Not Valid. You Need To Log-In Again :(');
            store.delete('user');
            dispatch({
              type: AUTH_FAILED
            });
          }
        } else if (error.message === 'Network Error') {
          message.info('You are offline. Logging in in offline-mode');
          dispatch({
            type: AUTH_SUCCESS,
            payload: {
              ...userData,
              clientToken: getClientToken()
            }
          });
          dispatch(push('/home'));
        }
      } finally {
        dispatch({
          type: STOP_TOKEN_CHECK_LOADING
        });
      }
    } else {
      dispatch(push('/'));
    }
  };
}

export function tryNativeLauncherProfiles() {
  /*
  / Since there is no way of checking the validity of an access token
  / while also getting the user data attached to that access token, the
  / "hacky" solution is to refresh the access token (it will send the user
  / data in the response). After getting a 200 status response, we get the
  / user data and the access token but also update it in the native launcher
  / profiles json.
  */
  return async dispatch => {
    const homedir = process.env.APPDATA || os.homedir();
    const vanillaMCPath = path.join(homedir, '.minecraft');
    dispatch({ type: START_NATIVE_LOADING });
    const vnlJson = await fsa.readJson(
      path.join(vanillaMCPath, 'launcher_profiles.json')
    );
    const { clientToken } = vnlJson;
    const { account } = vnlJson.selectedUser;
    const { accessToken } = vnlJson.authenticationDatabase[account];
    const newUserData = await refreshAccessToken(accessToken, clientToken, true);
    if (newUserData) {
      const payload = {
        username: newUserData.selectedProfile.name,
        displayName: newUserData.selectedProfile.name,
        accessToken: newUserData.accessToken,
        uuid: newUserData.selectedProfile.id,
        userID: newUserData.user.id
      };
      // We need to update the accessToken in launcher_profiles.json
      vnlJson.authenticationDatabase[
        newUserData.user.id
      ].accessToken = newUserData.accessToken;
      await fsa.writeJson(
        path.join(vanillaMCPath, 'launcher_profiles.json'),
        vnlJson
      );
      store.set({
        user: { ...payload },
        clientToken: getClientToken(),
        lastUsername: null
      });
      dispatch({
        type: AUTH_SUCCESS,
        payload: {
          ...payload,
          clientToken: getClientToken()
        }
      });
      const { newUser } = store.get('settings');

      if (!newUser) {
        dispatch(push('/home'));
      } else {
        store.set('settings.newUser', false);
        dispatch(push('/newUserPage'));
      }
    } else {
      message.error(
        'We could not log you in through Minecraft Launcher. Invalid data.'
      );
      dispatch({
        type: AUTH_FAILED
      });
    }
    dispatch({ type: STOP_NATIVE_LOADING });
  };
}

// Util functions

const uuidv4 = () => {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
};

const getClientToken = () => {
  const clientToken = store.get('clientToken');
  if (clientToken) {
    return clientToken;
  }
  const newToken = uuidv4().replace('-', '');
  store.set('clientToken', newToken);
  return newToken;
};

// Returns the user data if successful, otherwise returns false
const refreshAccessToken = async (
  accessToken: string,
  clientToken: string,
  requestUser: boolean = false
): boolean | {} => {
  try {
    const response = await axios.post(
      ACCESS_TOKEN_REFRESH_URL,
      {
        accessToken,
        clientToken,
        requestUser
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.status === 200 && response.data && response.data.accessToken) {
      return response.data;
    }
  } catch (err) {
    return false;
  }
};
