import React, { useState, useEffect } from 'react';
import './Cards.css';
import { Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faFire, faCrosshairs, faHashtag } from '@fortawesome/free-solid-svg-icons';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

function Cards() {
  const [totalDataCount, setTotalDataCount] = useState(0);  // 資料總數
  const [topType, setTopType] = useState('');               // 熱門詐騙類型
  const [accuracy, setAccuracy] = useState(0);              // 辨識準確度
  const [topKeyword, setTopKeyword] = useState('');         // 熱門詐騙關鍵字

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("開始獲取數據...");
        
        // 撈取 Statistics 資料
        const querySnapshot = await getDocs(collection(db, 'Statistics'));
        let maxFrequency = 0;
        let topScamType = '';

        // 讀取 finalStatistics 文件
        const finalDocRef = doc(db, 'Statistics', 'finalStatistics');
        const finalDocSnapshot = await getDoc(finalDocRef);

        if (finalDocSnapshot.exists()) {
          const finalData = finalDocSnapshot.data();
          setTotalDataCount(finalData.totalDataCount || 0);
          const formattedAccuracy = finalData.finalAccuracy !== undefined ? finalData.finalAccuracy.toFixed(2) : 0;
          setAccuracy(formattedAccuracy);
          console.log("成功獲取 finalStatistics 數據");
        } else {
          console.log("finalStatistics 文檔不存在");
        }

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.Frequency > maxFrequency) {
            maxFrequency = data.Frequency;
            topScamType = data.Type;
          }
        });

        setTopType(topScamType);
        console.log("熱門詐騙類型:", topScamType);

        
        console.log("正在嘗試讀取 KeywordFrequency/KeywordStats...");
        const keywordStatsRef = doc(db, 'KeywordFrequency', 'KeywordStats');
        const keywordStatsSnap = await getDoc(keywordStatsRef);
        
        console.log("KeywordStats 文檔是否存在:", keywordStatsSnap.exists());
        
        if (keywordStatsSnap.exists()) {
          const keywordStats = keywordStatsSnap.data();
          console.log("KeywordStats 數據:", keywordStats);
          
          if (keywordStats && Object.keys(keywordStats).length > 0) {
            const sortedKeywords = Object.entries(keywordStats).sort((a, b) => b[1] - a[1]);
            console.log("排序後的關鍵字:", sortedKeywords);
            
            if (sortedKeywords.length > 0) {
              setTopKeyword(sortedKeywords[0][0]);
              console.log("設置熱門關鍵字:", sortedKeywords[0][0]);
            } else {
              console.log("沒有關鍵字數據");
              setTopKeyword('暫無數據');
            }
          } else {
            console.log("KeywordStats 文檔為空或沒有數據");
            setTopKeyword('暫無數據');
          }
        } else {
          console.log("KeywordStats 文檔不存在");
          setTopKeyword('文檔不存在');
        }

      } catch (error) {
        console.error('Error fetching data from Firestore:', error);
        setTopKeyword('讀取錯誤');
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <Card className="card-custom bg-gradient-pink">
        <Card.Body className="cardbody-custom">
          <Card.Title><b>資料數量：</b></Card.Title>
          <Card.Text className="cardtext-custom">
            <FontAwesomeIcon icon={faDatabase} /> {totalDataCount}+
          </Card.Text>
        </Card.Body>
      </Card>
      
      <Card className="card-custom bg-gradient-blue">
        <Card.Body className="cardbody-custom">
          <Card.Title><b>熱門詐騙類型：</b></Card.Title>
          <Card.Text className="cardtext-custom">
            <FontAwesomeIcon icon={faFire} /> {topType || '載入中...'}
          </Card.Text>
        </Card.Body>
      </Card>

      <Card className="card-custom bg-gradient-green">
        <Card.Body className="cardbody-custom">
          <Card.Title><b>熱門詐騙關鍵字：</b></Card.Title>
          <Card.Text className="cardtext-custom">
            <FontAwesomeIcon icon={faCrosshairs} /> {topKeyword || '載入中...'}
          </Card.Text>
        </Card.Body>
      </Card>
    </>
  );
}

export default Cards;