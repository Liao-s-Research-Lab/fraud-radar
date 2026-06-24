import React, { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';  // 移除 Spinner 引用
import 'bootstrap/dist/css/bootstrap.min.css';
import Rating from './Rating';
import styles from './MSGCheck.module.css';
import './MSGCheck.css';   // 載入 bubblingG 載入動畫的全域樣式（否則等待時只剩空白框）

function MSGCheckInput() {
  const [text, setText] = useState('');
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 控制加載狀態
  const [isLoaded, setIsLoaded] = useState(false);  // 加載完成標誌
  const [result, setPythonResult] = useState('未知'); 
  const [keywords, setKeywords] = useState([]); 
  const [type, setType] = useState('無'); 
  const [reminds, setReminds] = useState('無');
  const [prevents, setPrevent] = useState('無');
  const [FraudRate, setFraudRate] = useState(); 
  const [ID, setID] = useState('');
  const [Emotion, setEmotion] = useState('無');

  const handleChange = (e) => {
    setText(e.target.value);
  };

  const clearTextarea = () => {
    setText(''); 
  };

  const handleClose = () => {
    setShow(false);
    setIsLoading(false);
    setIsLoaded(false); // 重置加載狀態
  };

  const handleTextSubmit = async (event) => {
    event.preventDefault();
    if (text) {
      try { 
        const response = await fetch('/api/fetch-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        const data = await response.json();
        console.log('Response data:', data);

        if (data.pythonResult) {
          setID(data.ID);
          const matchedKeywords = data.pythonResult.Match || [];
          const keywords = matchedKeywords.map(keywordObj => keywordObj.MatchKeyword);
          const types = matchedKeywords.map(keywordObj => keywordObj.MatchType);
          const remind = matchedKeywords.map(keywordObj => keywordObj.Remind);
          const prevent = matchedKeywords.map(keywordObj => keywordObj.Prevent);

          setPythonResult(data.pythonResult.FraudResult || '未知');
          setKeywords(keywords);
          setType(types.join(', '));
          setReminds(remind.join(', '));
          setPrevent(prevent.join(', '));
          const fraudRate = parseFloat(data.pythonResult.FraudRate);
          const roundedFraudRate = Math.round(fraudRate * 100) / 100; 
          setFraudRate(roundedFraudRate);
          setEmotion(data.pythonResult.Emotion);
          return true;
        } else {
          setID('');
          setPythonResult('未知');
          setKeywords([]);
          setType('無');
          setReminds('無');
          setPrevent('無');
          setFraudRate(null);
          setEmotion('無')
 
          return false;
        }
      } catch (error) {
        console.error('Error:', error);
        return false;
      }
    } 
  };

  const handleCombinedClick = async (event) => {
    if (text) {
      setShow(true);
      setIsLoading(true);
      const isValid = await handleTextSubmit(event);
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
      <div className={styles.msgContainer}>
        <div className={styles.msgInput}>
          <textarea rows="5" cols="75" value={text} onChange={handleChange} placeholder='請輸入或貼上內容...' />
          <div className={styles.btnArea}>
            <button className={styles.msgSubmit} onClick={handleCombinedClick} >
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
            <button className={styles.msgClear} onClick={clearTextarea}>清除</button>
          </div>
        </div>
        <div>
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
                <Rating pythonResult={result} keywords={keywords} types={type} FraudRate={FraudRate} ID={ID} reminds={reminds} prevents={prevents} data={""} Emotion={Emotion}/>
              )}
            </Modal.Body>
            {isLoaded && (
              <Modal.Footer>
                <Button className={styles.msgSkip} onClick={handleClose}>
                  跳過
                </Button>
                <Button className={styles.msgEnter} onClick={handleClose}>
                  送出
                </Button>
              </Modal.Footer>
            )}
          </Modal>
        </div>
      </div>
    </>
  );
}

export { MSGCheckInput };
