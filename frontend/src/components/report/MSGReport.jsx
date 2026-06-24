import React, { useState } from 'react';
import { db } from "../../firebase";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './MSGReport.module.css';
import { collection, addDoc } from "firebase/firestore";

function MSGReport() {
  const [text, setText] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [otherSource, setOtherSource] = useState('');
  const [ShortVideo, setShortVideo] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sourceOptions = [
    { value: "", label: "-- 請選擇來源 --" },
    { value: "手機簡訊", label: "手機簡訊" },
    { value: "電子郵件", label: "電子郵件" },
    { value: "社羣軟體", label: "社羣軟體" },
    { value: "購物平臺", label: "購物平臺" },
    { value: "網路廣告", label: "網路廣告" },
    { value: "假冒官方網站", label: "假冒官方網站" },
    { value: "其他", label: "其他" }
  ];

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const handleSourceTypeChange = (e) => {
    setSourceType(e.target.value);
    // 當選擇非"其他"時，清空otherSource欄位
    if (e.target.value !== "其他") {
      setOtherSource("");
    }
  };

  const handleOtherSourceChange = (e) => {
    setOtherSource(e.target.value);
  };

  const handleShortVideoChange = (e) => {
    setShortVideo(e.target.value);
  }; 
 
  const handleAdditionalInfoChange = (e) => {
    setAdditionalInfo(e.target.value);
  }; 

  const clearAllFields = () => {
    setText('');
    setSourceType('');
    setOtherSource('');
    setShortVideo('');
    setAdditionalInfo('');
  };

  const handleReportSubmit = async () => {
    if (!text) {
      alert('請輸入或貼上內容。');
      return;
    }

    if (!sourceType) {
      alert('請選擇資料來源。');
      return;
    }

    if (sourceType === "其他" && !otherSource) {
      alert('請輸入其他資料來源。');
      return;
    }

    setIsSubmitting(true);
    try {
      // 檢查文字是否包含URL
      const urlPattern = /(https?:\/\/[^\s]+)/g;
      const containsUrl = urlPattern.test(text);
      
      // 根據內容類型設定不同的檢測類型
      const detectionType = containsUrl ? 1 : 2; // 1 for URL, 2 for text

      // 確定最終要儲存的資料來源值
      const finalSource = sourceType === "其他" ? otherSource : sourceType;

      // 添加到 Firebase，移除 SourceType 欄位
      await addDoc(collection(db, "Report"), {
        Report: text,
        Source: finalSource,
        // SourceType 欄位已被移除
        ShortVideo:ShortVideo|| '未提供',
        AddNote: additionalInfo || '未提供',
        Timestamp: new Date().toISOString(),
        DetectionType: detectionType
      });
      
      console.log(`已成功上傳${containsUrl ? 'URL' : '文字'}資料至 Firebase`);
      
      alert("回報成功！");
      clearAllFields();
    } catch (error) {
      console.error('Error saving report:', error);
      alert("回報失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.reportContainer}>
      <div className={styles.msgInput}>
        <div className={styles.inputsArea}>
          <div className={styles.fieldGroup}>
            <div className={styles.inputLabel}>文字回報</div>
            <textarea 
              rows="5" 
              value={text} 
              onChange={handleTextChange} 
              placeholder='請輸入或貼上內容...' 
              className={styles.textArea}
            />
          </div>
          
          <div className={styles.fieldGroup}>
            <div className={styles.inputLabel}>資料來源</div>
            <select 
              value={sourceType} 
              onChange={handleSourceTypeChange}
              className={styles.selectField}
            >
              {sourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {sourceType === "其他" && (
              <textarea 
                rows="2" 
                value={otherSource} 
                onChange={handleOtherSourceChange} 
                placeholder='請輸入其他資料來源...' 
                className={`${styles.textArea} ${styles.marginTop10}`}
              />
            )}
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.inputLabel}>影片連結</div>
            <textarea 
              rows="1" 
              value={ShortVideo} 
              onChange={handleShortVideoChange} 
              placeholder='請輸入影片網址...' 
              className={styles.textArea}
            />
          </div>
          
          <div className={styles.fieldGroup}>
            <div className={styles.inputLabel}>補充說明</div>
            <textarea 
              rows="3" 
              value={additionalInfo} 
              onChange={handleAdditionalInfoChange} 
              placeholder='請輸入補充說明...' 
              className={styles.textArea}
            />
          </div>
        </div>
        
        <div className={styles.btnArea}>
          <button 
            className={styles.msgSubmit} 
            onClick={handleReportSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "處理中..."
            ) : (
              <>
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
                <span>回報</span>
              </>
            )}
          </button>
          <button 
            className={styles.msgClear} 
            onClick={clearAllFields} 
            disabled={isSubmitting}
          >
            清除
          </button>
        </div>
      </div>
    </div>
  );
}

export { MSGReport };