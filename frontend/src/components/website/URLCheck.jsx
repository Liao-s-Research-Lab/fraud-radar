import React, { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import Rating from './Rating';
import styles from './URLCheck.module.css';
import './URLCheck.css';   // 載入 bubblingG 載入動畫的全域樣式（否則等待時只剩空白框）
import ClearIcon from '@mui/icons-material/Clear';

function URLCheckTextArea() {
  const [url, setUrl] = useState('');
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);  // 加載狀態
  const [isLoaded, setIsLoaded] = useState(false);    // 加載完成狀態
  const [pythonResult, setPythonResult] = useState('未知');
  const [keywords, setKeyword] = useState([]); // 設爲數組以存儲多個關鍵字
  const [type, setType] = useState('無');
  const [reminds, setReminds] = useState('無');
  const [prevents, setPrevent] = useState('無');
  const [FraudRate, setFraudRate] = useState(null); // 存儲 FraudRate
  const [ID, setID] = useState('');
  const [Emotion, setEmotion] = useState('無');


  const handleClose = () => {
    setShow(false);
    setIsLoading(false);
    setIsLoaded(false); // 重置加載狀態
  };


  const handleButtonClick = async () => {
    console.log('Button clicked with URL:', url); // 確認按鈕點擊事件

    try {
      const response = await fetch('/api/fetch-content', { // 更新 API 路徑
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }), // 傳送 URL 作爲請求內容
      });
  
      const data = await response.json();
      console.log('Response from server:', data);
  
      // 輸出到終端機
      if (data.pythonResult) {
          setID(data.ID);
          // 提取 matched_keywords 並拆解
          const matchedKeywords = data.pythonResult.Match || [];

          // 處理 matched_keywords 數組
          const keywords = matchedKeywords.map(keywordObj => keywordObj.MatchKeyword);
          const types = matchedKeywords.map(keywordObj => keywordObj.MatchType);
          const remind = matchedKeywords.map(keywordObj => keywordObj.Remind);
          const prevent = matchedKeywords.map(keywordObj => keywordObj.Prevent);
                    
          setPythonResult(data.pythonResult.FraudResult || '未知');
          setKeyword(keywords); // 存儲關鍵字數組
          setType(types.join(', ')); // 存儲所有類型的組合
          setReminds(remind.join(', '));
          setPrevent(prevent.join(', '));
          
          const fraudRate = parseFloat(data.pythonResult.FraudRate);
          const roundedFraudRate = Math.round(fraudRate * 100) / 100; // 保留兩位小數
          setFraudRate(roundedFraudRate);
          setEmotion(data.pythonResult.Emotion);
          return true;
      } else {
          setID('');
          console.log('Python Result: 未知');
          console.log('Matched Keywords: []');
          setPythonResult('未知');
          setKeyword([]);
          setType('無');
          setReminds('無');
          setPrevent('無');
          setFraudRate(null); // 無 FraudRate 數據
          setEmotion('無')
          return false;
      }
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
  };

  const handleCombinedClick = async () => {
    if (url) {
      setShow(true);   
      setIsLoading(true);  
      const isValid = await handleButtonClick(); 
      if (isValid) {
        setIsLoading(false);
        setIsLoaded(true);
      } else {
        setIsLoading(false);
        setShow(false);
        alert("檢測失敗。");
      }
    } else {
      alert('請輸入或貼上網址。');
    }
  };

  return (
    <>
      <div className={styles.urlInputContainer}>
        <div className={styles.inputWrapper}>
          <input
              className={styles.urlInput}
              type="text"
              placeholder="請輸入或貼上網址..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
          />
          <button
              className={styles.clearBtn}
              onClick={() => setUrl('')} // 清除輸入框內容
          >
              <ClearIcon />
          </button>
        </div>
        <div className={styles.btnUrlArea}>
          <button className={styles.urlSubmit} onClick={handleCombinedClick}>
            <svg
              height="24"
              width="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 0h24v24H0z" fill="none"></path>
              <path
                d="M5 13c0-5.088 2.903-9.436 7-11.182C16.097 3.564 19 7.912 19 13c0 .823-.076 1.626-.22 2.403l1.94 1.832a.5.5 0 0 1 .095.603l-2.495 4.575a.5.5 0 0 1-.793.114l-2.234-2.234a1 1 0 0 0-.707-.293H9.414a1 1 0 0 0-.707.293l-2.234 2.234a.5.5 0 0 1-.793-.114l-2.495-4.575a.5.5 0 0 1 .095-.603l1.94-1.832C5.077 14.626 5 13.823 5 13zm1.476 6.696l.817-.817A3 3 0 0 1 9.414 18h5.172a3 3 0 0 1 2.121.879l.817.817.982-1.8-1.1-1.04a2 2 0 0 1-.593-1.82c.124-.664.187-1.345.187-2.036 0-3.87-1.995-7.3-5-8.96C8.995 5.7 7 9.13 7 13c0 .691.063 1.372.187 2.037a2 2 0 0 1-.593 1.82l-1.1 1.039.982 1.8zM12 13a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
                fill="currentColor"
              ></path>
            </svg>
            <span>檢測</span>
          </button>
        </div>
      </div>


        <Modal show={show} onHide={handleClose} backdrop="static" centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title><b>檢測結果：</b></Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {isLoading && (
              <div className="bubblingG">
                <span id="bubblingG_1"></span>
                <span id="bubblingG_2"></span>
                <span id="bubblingG_3"></span>
              </div>
            )}
            {isLoaded && (
              <Rating pythonResult={pythonResult} keywords={keywords} types={type} FraudRate={FraudRate} ID={ID} reminds={reminds} prevents={prevents} data={url} Emotion={Emotion}/>
            )}
          </Modal.Body>
          {isLoaded && (
            <Modal.Footer>
              <Button className={styles.urlSkip} onClick={handleClose}>
                跳過
              </Button>
              <Button className={styles.urlEnter} onClick={handleClose}>
                送出
              </Button>
            </Modal.Footer>
          )}
        </Modal>
    </>
  );
}

export { URLCheckTextArea };
