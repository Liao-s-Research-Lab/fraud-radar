import "@patternfly/react-core/dist/styles/base.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './AdminUpload.module.css';
import { useState, useEffect, useRef } from 'react';
import UploadIcon from '@patternfly/react-icons/dist/esm/icons/upload-icon';
import { CheckCircleIcon } from '@patternfly/react-icons';

const AdminUpload = () => {
  const [fileUploadShouldFail, setFileUploadShouldFail] = useState(false);
  const [currentFiles, setCurrentFiles] = useState([]);
  const [readFileData, setReadFileData] = useState([]);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (!showStatus && currentFiles.length > 0) {
      setShowStatus(true);
    }
  }, [currentFiles, showStatus]);

  const removeFiles = (namesOfFilesToRemove) => {
    const newCurrentFiles = currentFiles.filter(currentFile => !namesOfFilesToRemove.includes(currentFile.name));
    setCurrentFiles(newCurrentFiles);
    const newReadFiles = readFileData.filter(readFile => !namesOfFilesToRemove.includes(readFile.fileName));
    setReadFileData(newReadFiles);
  };

  const updateCurrentFiles = (files) => {
    if (fileUploadShouldFail) {
      const corruptedFiles = files.map(file => ({
        ...file,
        name: file.name,
        lastModified: 'foo'
      }));
      setCurrentFiles(prevFiles => [...prevFiles, ...corruptedFiles]);
    } else {
      setCurrentFiles(prevFiles => [...prevFiles, ...files]);
      files.forEach(file => simulateFileRead(file)); // 開始讀取文件
    }
  };

  const handleFileDrop = (event) => {
    const files = event.target.files;
    const currentFileCount = currentFiles.length;
    const newFileCount = files.length;

    if (currentFileCount + newFileCount > 3) {
      alert('一次最多隻能上傳3個檔案');
      return;
    }

    updateCurrentFiles(Array.from(files));
  };

  const simulateFileRead = (file) => {
    const totalSteps = 10; // 讀取過程的總步數
    let progress = 0;

    const intervalId = setInterval(() => {
      progress += 10; // 每次增加10%
      
      if (progress > 100) {
        progress = 100; // 限制最大進度爲100
      }

      setReadFileData(prevReadFiles => {
        const updatedReadFiles = prevReadFiles.filter(readFile => readFile.fileName !== file.name);
        return [...updatedReadFiles, {
          fileName: file.name,
          loadResult: progress === 100 ? 'success' : 'loading',
          fileSize: file.size,
          progress // 更新當前文件的進度
        }];
      });

      if (progress === 100) {
        clearInterval(intervalId); // 讀取完成後清除定時器
      }
    }, 500); // 每500毫秒更新一次進度
  };

  const handleFileUpload = async () => {
    try {
        // 創建一個 FormData 實例來上傳文件
        const formData = new FormData();

        // 添加文件到 FormData
        currentFiles.forEach((file) => {
            formData.append('file', file); // 將每個文件添加到 FormData 中
        });

        // 發送 POST 請求到後端的文件上傳端點
        const response = await fetch('/api/fetch-content', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('文件上傳失敗');
        }

        // 獲取文件上傳成功後的響應
        const result = await response.json();
        console.log('上傳結果:', result);

        // 這裏可以選擇直接處理結果，或者做進一步的操作
        alert('文件上傳成功，返回消息: ' + result.message);

    } catch (error) {
        console.error('上傳文件時出錯:', error);
        alert('上傳文件時出錯: ' + error.message);
    }
};

  const successfullyReadFileCount = readFileData.filter(fileData => fileData.loadResult === 'success').length;

  return (
    <>
        <div className={styles.adminUploadContainer}>
            <label className={styles.adminDropContainer}>
            <UploadIcon style={{ fontSize: '50px' }} />
            <div className={styles.adminDropTitle}>
                <span>拖曳檔案至此</span>
                <span>或</span>
            </div>
                <input
                type="file"
                multiple
                onChange={handleFileDrop}
                />
                <div className={styles.adminUploadButton}>選擇檔案</div>
                <span style={{ fontSize: '16px',marginTop:'20px' }}>檔案類型：JPEG, DOC, PDF, PNG, XLS, XLSX</span>
            </label>
            <div>
                {showStatus && currentFiles.length > 0 && (
                <div className={styles.adminDropText}>
                    <p>{`${successfullyReadFileCount} / ${currentFiles.length} 檔案讀取成功`}</p>
                    {currentFiles.map(file => {
                    const fileData = readFileData.find(readFile => readFile.fileName === file.name);
                    const fileSize = fileData ? fileData.fileSize : 0; // 獲取文件大小

                    return (
                        <div className={styles.adminTxtArea} key={file.name}>
                        <div className={styles.adminLeft}>
                            <button className={styles.adminSkip} onClick={() => removeFiles([file.name])}>移除</button>
                            <span className={styles.adminFileName}>{file.name.length > 8 ? file.name.slice(0, 8) + '...' : file.name}</span>
                            <span style={{ width: 'auto',paddingLeft:'10px' }}>({(fileSize / 1024).toFixed(2)} KB)</span>
                        </div>
                        <div className={styles.adminRight}>
                            {fileData && (
                            <>
                            <div className={styles.progressBar}>
                                <div className={styles.progress} style={{ width: `${fileData.progress}%` }} />
                            </div>
                            {fileData.loadResult === 'success' && (
                                <CheckCircleIcon style={{ color: "goldenrod", marginLeft: '10px' ,fontSize:'30px'}} />
                            )}
                            </>
                        )}
                        </div>
                        </div>
                    );
                    })}
                </div>
                )}
            </div>
            <div className={styles.adminSubmit}>
                <button className={styles.adminEnter} onClick={handleFileUpload}>更新</button>
            </div>
        </div>
    </>
  );
};

export default AdminUpload;
