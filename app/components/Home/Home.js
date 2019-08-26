// @flow
import React, { Component } from 'react';
import { Input, Button } from 'antd';
import { Link } from 'react-router-dom';
import { push } from 'connected-react-router';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { PACKS_PATH, THEMES } from '../../constants';
import styles from './Home.scss';
import News from './components/News/News';
import Card from '../Common/Card/Card';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  constructor(props) {
    super(props);
    this.state = {
      latestBtnClicked: false,
      latestInstalled: false
    };
  }
  /* eslint-disable */
  openLink(url) {
    require('electron').shell.openExternal(url);
  }

  componentDidMount = async () => {
    try {
      await promisify(fs.access)(path.join(PACKS_PATH, '1.13.2'));
      this.setState({ latestInstalled: true });
    } catch (e) {
      this.setState({ latestInstalled: false });
    }
    // Downloads the versions list just the first time
    if (this.props.versionsManifest.length === 0) {
      this.props.getVanillaMCVersions();
    }
  };

  /* eslint-enable */

  render() {
    return (
      <div>
        <main className={styles.content}>
          <div className={styles.innerContent}>
            <div className={styles.cards}>
              <Card
                style={{
                  height: 'auto',
                  width: '100%',
                  minWidth: 420,
                  display: 'block',
                  marginTop: 15,
                  textAlign: 'center'
                }}
                title={`Welcome ${this.props.username} to the new CoAG Launcher`}
              >
                <div className={styles.firstCard}>
                  <div>
                    <span className={styles.titleHeader}>
                      To get access to the modded servers go to our{' '}
                      <a
                        href="https://www.patreon.com/thecoag"
                        className={styles.patreonText}
                      >
                        Patreon
                      </a>
                    </span>
                    <div className={styles.patreonContent}>
                      The Collective of Average Gamers was founded with a dream in mind to bring gamers of all caliber together strictly for the enjoyment of playing games. A safe place where bullies aren't tolerated, everyone is welcome and we can all enjoy video games together. With high hopes of having physical locations around the world to host E-Sports events, the Collective of Average Gamers is open to players of all skill.
                    </div>
                  </div>
                  <div>
                    You can find us here:
                    <div className={styles.discord}>
                      <a href="https://discord.gg/Z2wexut">Discord</a>
                    </div>
                    <div className={styles.github}>
                      <a href="https://github.com/thecoag/">
                        Github
                      </a>
                    </div>
                    <div className={styles.instagram}>
                      <a href="https://www.instagram.com/officialcoag/?utm_source=ig_embed">Instagram</a>
                    </div>
                    <div className={styles.facebook}>
                      <a href="https://twitter.com/TheCowEgg">Twitter</a>
                    </div>
                  </div>
                </div>
              </Card>
			  <Card
                style={{
                  height: 'auto',
                  width: '100%',
                  minWidth: 420,
                  display: 'block',
                  marginTop: 15,
                  textAlign: 'center'
                }}
                title={`IMPORTANT: Please Read Me :IMPORTANT`}
              >
			  <div className={styles.firstCard}>
                  <div>
                    <div className={styles.patreonContent}>
                      If you find any issues with the launcher, please post them to our Github linked above. It's allows me to track 
					  issues and reminding me to do things. Thank you for making my life easier. 
                    </div>
                  </div>
                </div>
			   </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }
}
