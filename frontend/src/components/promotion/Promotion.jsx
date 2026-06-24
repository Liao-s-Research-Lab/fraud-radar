import React from 'react'
import Navbar from '../navbar/Navbar';
import NewsList from '../home/NewsList';
import Shorts from './Shorts';
import styles from './Promotion.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNewspaper, faCirclePlay } from "@fortawesome/free-solid-svg-icons";

function Promotion() {
  return (
    <div className={styles.promotionContainer}>
      <div className={styles.promotionContent}>
        <Navbar />
        <div className={styles.newsBox}>
          <div>
            <div className={styles.newsTitle}><FontAwesomeIcon icon={faNewspaper} /> 時事詐騙新聞</div>
            <div className={styles.newsSubTitle}>本區域將提供最新的詐騙事件報導，讓您瞭解當前的詐騙趨勢，並提高防範意識，避免成為受害者。</div>
          </div>
          <NewsList />
        </div>
        <div className={styles.shortsBox}>
            <div className={styles.newsTitle}><FontAwesomeIcon icon={faCirclePlay} /> 短影音專區</div>
            <div className={styles.newsSubTitle}>本專區收錄真實用戶分享的詐騙經驗影片，讓您快速掌握常見詐騙手法，提升防範意識。</div>
          <Shorts />
        </div>
      </div>
    </div>
  )
}

export default Promotion