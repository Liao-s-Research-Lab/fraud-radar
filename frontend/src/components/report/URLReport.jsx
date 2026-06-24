import React, { useState } from 'react';
import { db } from "../../firebase";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './URLReport.module.css';
import { collection, addDoc } from "firebase/firestore";

function URLReport() {
  const [url, setUrl] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [otherSource, setOtherSource] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
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

  const clearAllFields = () => {
    setUrl('');
    setSourceType('');
    setOtherSource('');
    setAdditionalNotes('');
  };

  const handleReportSubmit = async () => {
    if (!url) {
      alert('請輸入或貼上網址。');
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
      // 確定最終要儲存的資料來源值
      const finalSource = sourceType === "其他" ? otherSource : sourceType;
      
      // 添加到 Firebase，移除 SourceType 欄位
      await addDoc(collection(db, "Report"), {
        Report: url,
        Source: finalSource,
        // SourceType: sourceType, // 已移除此欄位
        AddNote: additionalNotes || '未提供',
        Timestamp: new Date().toISOString(),
        DetectionType: 1 // 明確設定URL檢測類型為1
      });

      // 同時直接向 Python 後端發送檢測請求
      try {
        // 確保URL格式正確
        let formattedUrl = url;
        if (!url.match(/^https?:\/\//i)) {
          formattedUrl = 'https://' + url;
        }
        
        const response = await fetch('/api/fetch-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: formattedUrl, // 使用格式化後的URL
            detectionType: 1    // 明確告訴後端這是URL檢測
          })
        });
        
        if (response.ok) {
          console.log('已成功發送URL檢測請求至後端');
        }
      } catch (apiError) {
        console.error('向檢測API發送URL請求時出錯:', apiError);
        // 即使 API 請求失敗，我們仍然讓用戶知道報告已成功儲存
      }

      alert("回報成功！");
      clearAllFields();
    } catch (error) {
      console.error('回報失敗:', error);
      alert("回報失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.reportContainer}>
      <div className={styles.urlInput}>
        <div className={styles.inputsArea}>
          <div className={styles.fieldGroup}>
            <label className={styles.inputLabel}>網址回報</label>
            <input
              className={styles.textArea}
              type="text"
              placeholder="請輸入或貼上網址..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          {/* 資料來源下拉選單 */}
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
            
            {/* 其他來源的文字輸入框，只在選擇"其他"時顯示 */}
            {sourceType === "其他" && (
              <input
                className={`${styles.textArea} ${styles.marginTop10}`}
                type="text"
                placeholder="請輸入其他資料來源..."
                value={otherSource}
                onChange={handleOtherSourceChange}
              />
            )}
          </div>

          {/* 補充說明輸入欄位 */}
          <div className={styles.fieldGroup}>
            <div className={styles.inputLabel}>補充說明</div>
            <textarea
              className={styles.textArea}
              placeholder="請輸入補充說明..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        {/* 按鈕區域 */}
        <div className={styles.btnArea}>
          <button 
            className={styles.urlSubmit} 
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
            className={styles.urlClear} 
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

export { URLReport };