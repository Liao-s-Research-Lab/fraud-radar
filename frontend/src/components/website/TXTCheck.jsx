import React, { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';  // 移除 Spinner 引用
import 'bootstrap/dist/css/bootstrap.min.css'; 
import Rating from './Rating';
import './TXTCheck.css';
import UploadFileIcon from '@mui/icons-material/UploadFile';

function TXTCheckUpload() {
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); // 添加新的狀態來跟蹤加載完成
  const [pythonResult, setPythonResult] = useState('未知');
  const [keywords, setKeywords] = useState([]); // 存儲多個關鍵字
  const [types, setType] = useState('無');
  const [reminds, setReminds] = useState('無');
  const [prevents, setPrevent] = useState('無');
  const [FraudRate, setFraudRate] = useState(null); // 存儲 FraudRate
  const [ID, setID] = useState('');
  const [file, setFile] = useState(null); // 添加一個狀態來存儲上傳的文件
  const [Emotion, setEmotion] = useState('無');


  const handleClose = () => {
    setShow(false);
    setIsLoading(false);
    setIsLoaded(false);
  }

  const handleFileUpload = async (event) => {
    event.preventDefault();
    const fileInput = document.getElementById('file-input');
    const files = fileInput.files; // FileList 物件
    setFile(Array.from(files));

    if (files.length > 0) {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files[]', files[i]);  // 多檔用陣列方式傳遞
      }

      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
    
      try {
        const response = await fetch('/api/fetch-content', { 
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        // 處理後端返回的 Python 結果
        if (data.pythonResult) {
          setID(data.ID);
          const matchedKeywords = data.pythonResult.Match || [];
          console.log('Response from server:', data);
          const types = matchedKeywords.map(keywordObj => keywordObj.MatchType);
          const keywords = matchedKeywords.map(keywordObj => keywordObj.MatchKeyword);
          const remind = matchedKeywords.map(keywordObj => keywordObj.Remind);
          const prevent = matchedKeywords.map(keywordObj => keywordObj.Prevent);
          
          setPythonResult(data.pythonResult.FraudResult || '未知');
          setKeywords(keywords);
          setType(types.join(', ')); // 將所有類型拼接成字符串
          setReminds(remind.join(', '));
          setPrevent(prevent.join(', '));
          const fraudRate = parseFloat(data.pythonResult.FraudRate);
          setFraudRate(Math.round(fraudRate * 100) / 100); // 保留兩位小數
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
        console.error('Error while uploading the file:', error);
        return false;
      }
    }
  };

  
  const handleCombinedClick = async (event) => {
    const fileInput = document.getElementById('file-input');
    if (fileInput.files.length > 0) {
      setShow(true);
      setIsLoading(true);
      const isValid = await handleFileUpload(event);
      if (isValid) {
        setIsLoading(false);
        setIsLoaded(true);
      } else {
        setIsLoading(false);
        setShow(false);
        alert("檢測失敗。");
      }
    } else {
      alert("請選擇一個文件。");
    }
  };

  return (
    <>  <div className='txtContainer'>
        <div className='fileInputContainer'>

          <label htmlFor="file-input" className="drop-container">
            <span className="dropTitle">
              <UploadFileIcon fontSize='large'/>拖曳檔案至此 或
            </span>
            {/* <span className="dropTitleOr">或</span> */}
            <input type="file" accept="image/*" required id="file-input" multiple/>
            <span style={{ fontSize: '16px' }}>檔案類型：TXT, JPG, JPEG, PNG </span>
          </label>

          <div>
            
          <div className="btn-txt-area">
            <button type='submit' className='txt-submit' onClick={handleCombinedClick}>
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
        </div>

          <Modal dialogClassName="modal-auto-width" show={show} onHide={handleClose} backdrop="static" centered size="lg">
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
              <Rating pythonResult={pythonResult} keywords={keywords} types={types} FraudRate={FraudRate} ID={ID} reminds={reminds} prevents={prevents} file={file} Emotion={Emotion}/>
            )}
          </Modal.Body>
          {isLoaded && (
            <Modal.Footer>  
              <Button className='txt-jump' onClick={handleClose}>
                跳過
              </Button>
              <Button className='txt-enter' onClick={handleClose}>
                送出
              </Button>
            </Modal.Footer>
          )}
          </Modal>
        </div>
    </>
  );
}

export { TXTCheckUpload };