import "@patternfly/react-core/dist/styles/base.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './Admin.module.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignOutAltIcon } from '@patternfly/react-icons';
import { motion } from 'framer-motion';
import Navbar from '../navbar/Navbar';
import AdminUpload from './AdminUpload';
import AdminPreview from './AdminPreview';
import AdminUserReport from './AdminUserReport';

export const MultipleFileUploadBasic = () => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("file");
  const navigate = useNavigate();
  const alertShownRef = useRef(false);

  // 計算 Tab 樣式位置
  const getTabStyle = () => {
    switch (activeTab) {
      case "file":
        return { width: "33.33%", left: "0%" };
      case "report":
        return { width: "33.33%", left: "33.33%" };
      case "userreport":
        return { width: "33.33%", left: "66.66%" };
      default:
        return { width: "33.33%", left: "0%" };
    }
  };
  

  // 檢查登入狀態
  useEffect(() => {
    const userAuthenticated = sessionStorage.getItem('username');
    if (!userAuthenticated && !alertShownRef.current) {
      alert('請先登入帳號及密碼');
      alertShownRef.current = true; 
      navigate('/login'); 
    }
  }, [navigate]); 

  const handleLogout = () => {
    sessionStorage.clear();
    alertShownRef.current = false; 
    navigate("/login");
  };

  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  const userAuthenticated = sessionStorage.getItem('username');

  return (
    <>
      <div className={styles.adminRoot}>
        {userAuthenticated && (
          <Navbar setIsLogoutModalOpen={setIsLogoutModalOpen}/>
        )}

        <motion.div className={styles.adminContent}
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 2 }}
        >
        <div className={styles.adminMain}>
            <div className={styles.adminTopic}>
              <div className={styles.adminTitle}>
                資料集更新 Dataset Update
              </div>
            </div>
            
            {/* Tabs 選單 */}
            <div className={styles.tabs}>
              <a onClick={() => setActiveTab("file")}>上傳檔案</a>
              <a onClick={() => setActiveTab("report")}>檢測紀錄</a>
              <a onClick={() => setActiveTab("userreport")}>使用者回報</a>
              <div className={styles.tabsTransition} style={getTabStyle()}></div>
            </div>
        </div>

        {/* 根據 activeTab 顯示對應內容 */}
        <div>
            {activeTab === "file" && <AdminUpload />}
            {activeTab === "report" && <AdminPreview />}
            {activeTab === "userreport" && <AdminUserReport />}
        </div>

        </motion.div>

        {/* 登出提示框 */}
        {isLogoutModalOpen && (
            <div className={styles.mOverlay}>
              <div className={styles.mContent}>
                <SignOutAltIcon style={{ fontSize: '80px', marginTop: '35px' }} />
                <h4 className={styles.mTitle}>是否要登出？</h4>
                <div className={styles.adminColArea}>
                  <button className={styles.adminLogout} onClick={handleLogout}>登出</button>
                  <button className={styles.adminSkip} onClick={closeLogoutModal}>取消</button>
                </div>
              </div>
            </div>
          )}
      </div>
    </>
  );
};

export default MultipleFileUploadBasic;
