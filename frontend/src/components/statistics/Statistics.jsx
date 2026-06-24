import React, { useEffect, useState } from 'react';
import Cards from './Cards';
import BarChart from './BarChart';
import PieChart from './PieChart';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartColumn } from '@fortawesome/free-solid-svg-icons';
import styles from './Statistics.module.css';

import { doc, getDoc } from "firebase/firestore";
import { db } from '../../firebase'; 

const Statistics = () => {
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  useEffect(() => {
    const fetchUpdateTime = async () => {
      try {
        const docRef = doc(db, "Statistics", "finalStatistics");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.time) {
            const date = data.time.toDate(); // 將 Timestamp 轉成 JS Date
            const formatted = date.toLocaleString('zh-TW', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            setLastUpdateTime(formatted);
          }
        }
      } catch (error) {
        console.error("取得更新時間時發生錯誤:", error);
      }
    };

    fetchUpdateTime();
  }, []);

  return (
    <>
      <div className={styles.statisticsContainer}>
        <div className={styles.statisticsMain}>
          <h3 className={styles.statisticsPageTitle}>
            <FontAwesomeIcon icon={ faChartColumn } /> 統計圖表
          </h3>
          <p className={styles.statisticsSubTitle}>
            透過檢測後的資料，統計了資料數量、熱門詐騙類型、及詐騙類型佔比，讓您快速掌握詐騙趨勢，提高防範意識。
          </p>
        </div>
        <div className={styles.cardsContainer}>
          <Cards />
        </div>
        <div className={styles.chartsContainer}>
          <div className={styles.barChart}>
            <BarChart />
          </div>
          <div className={styles.pieChart}>
            <PieChart />
          </div>
        </div>
        <div className={styles.updateTimeBox}>
          更新時間：{lastUpdateTime ? lastUpdateTime : '讀取中...'}
        </div>
      </div>
    </>
  );
};

export default Statistics;
