import React from 'react';
import Layout from '@icedesign/layout';
import Logo from '../Logo';

import styles from './index.module.scss';

export default function Footer() {
  return (
    <Layout.Footer className={styles.footer} type={null}>
      <div className={styles.body}>
        <div className={styles.logo}>
          <Logo />
        </div>
        <div className={styles.copyright}>
          © 2018 Theme designed by{' '}
          <a
            href="https://github.com/alibaba/ice"
            target="_blank"
            className={styles.copyrightLink}
            rel="noopener noreferrer"
          >
            ICE
          </a>
        </div>
      </div>
    </Layout.Footer>
  );
}
