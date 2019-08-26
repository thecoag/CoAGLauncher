import React, { useState, useEffect } from 'react';
import store from '../../localStore';
import styles from './ChangelogModal.scss';
import Modal from '../Common/Modal/Modal';
import ChangelogRow from './ChangelogRow';

export default props => {
  const [unMount, setUnMount] = useState(false);

  useEffect(() => {
    store.set('showChangelogs', false);
  }, []);

  const openDiscord = () => {
    require('electron').shell.openExternal('https://discord.gg/Z2wexut');
  };

  return (
    <Modal
      history={props.history}
      unMount={unMount}
      title={`WHAT'S NEW IN v${require('../../../package.json').version}`}
      style={{ height: '70vh', width: 540 }}
    >
      <div className={styles.container}>

        <h2 className={styles.hrTextYellow}>WARNING!</h2>
        <span className={styles.summary}>
          This update contains <span style={{ color: '#f39c12' }}>breaking changes</span>. If your instances don't run, try right-clicking on them and select "Repair"
        </span>
        <div style={{ margin: 15 }} />
        <h2 className={styles.hrTextGreen}>SOME COOL NEW STUFF</h2>
        <div className={styles.subHrList}>
          <ul>
            <ChangelogRow
              main="Added a crash handler"
              secondary=" when things go wrong xD"
            />
            <ChangelogRow
              main="Added java memory override for instances"
              secondary=" yeeee"
            />
            <ChangelogRow
              main="Added java arguments override for instances"
              secondary=" yeeee"
            />
            <ChangelogRow
              main="Added support for Minecraft Forge 1.14.4/Snapshots"
              secondary=". Don't tilt if it looks like it's frozen, it may take a while"
            />
          </ul>
        </div>
      </div>
    </Modal >
  );
};
