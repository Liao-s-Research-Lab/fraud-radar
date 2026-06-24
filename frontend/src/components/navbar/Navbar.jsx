import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';
import { useLocation, useNavigate } from 'react-router-dom';

function Navbar({setIsLogoutModalOpen}) {
  const [selectedLink, setSelectedLink] = useState("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminPath = location.pathname === '/admin';


  const isActive = (link) => {
    return selectedLink === link ? styles.active : ''; 
  };

  useEffect(() => {
    if (location.pathname === "/" && location.hash === "#commonFraudBox") {
      setSelectedLink("commonFraudBox");
    } else if (location.pathname === "/") {
      setSelectedLink("home");
      window.scrollTo(0, 0);
    } else if (location.pathname === "/website" && location.hash === "#statisticsBox") {
      setSelectedLink("statisticsBox");
    } else if (location.pathname === "/website") {
      setSelectedLink("website");
      window.scrollTo(0, 0);
    } else if (location.pathname === "/report") {
      setSelectedLink("report");
      window.scrollTo(0, 0);
    } else if (location.pathname === "/promotion") {
      setSelectedLink("promotion");
      window.scrollTo(0, 0);
    } else if (location.pathname === "/admin") {
        setSelectedLink("admin");
    } else if (location.pathname === "/commonfraud") {
        setSelectedLink("commonfraud");
    }
  }, [location.pathname, location.hash]); 
  
  
  


  return (
    <>
      {!isAdminPath ? (
        <div className={styles.navbarContainer}>
          <div className={styles.navbarBox}>
            <div className={styles.navbarIcon}>
              <div>
                <img src="/icon2.PNG" alt="logo" width={150} onClick={() => navigate("/")} />
              </div>
            </div>
            <div className={styles.hamburger} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <div className={styles.bar}></div>
              <div className={styles.bar}></div>
              <div className={styles.bar}></div>
            </div>

            <div className={`${styles.navbarList} ${isMobileMenuOpen ? styles.showMenu : ""}`}>
                <div className={styles.navbarLink}>
                  <a className={`${styles.navbarAnchor} ${isActive("home")}`} onClick={() => {navigate("/"); setIsMobileMenuOpen(!isMobileMenuOpen);}}>首頁</a>
                  <a className={`${styles.navbarAnchor} ${isActive("commonFraudBox")}`} onClick={() => { setSelectedLink("commonFraudBox"); navigate("/#commonFraudBox"); setIsMobileMenuOpen(!isMobileMenuOpen);}}>常見手法</a>
                  <a className={`${styles.navbarAnchor} ${isActive("website")}`} onClick={() => { setSelectedLink("website"); navigate("/website"); setIsMobileMenuOpen(!isMobileMenuOpen);}}>詐騙檢測</a>
                  <a className={`${styles.navbarAnchor} ${isActive("report")}`} onClick={() => { setSelectedLink("report"); navigate("/report"); setIsMobileMenuOpen(!isMobileMenuOpen);}}>詐騙回報</a>
                  <a className={`${styles.navbarAnchor} ${isActive("promotion")}`} onClick={() => { setSelectedLink("promotion"); navigate("/promotion"); setIsMobileMenuOpen(!isMobileMenuOpen);}}>宣導專區</a>
                  <a className={`${styles.navbarAnchor} ${isActive("statisticsBox")}`} onClick={() => { setSelectedLink("statisticsBox"); navigate("/website#statisticsBox"); setIsMobileMenuOpen(!isMobileMenuOpen);}}>統計圖表</a>
                </div>
            </div>
          </div>
        </div>
        ) : (
          <div className={styles.navbarAdminContainer}>
            <div className={styles.navbarAdminBox}>
              <div className={styles.navbarAdminIcon}>
                <div>
                  <img src="/icon2.PNG" alt="logo" width={175} onClick={() => navigate("/")} />
                </div>
              </div>

              <div className={styles.navbarAdminLink}>
                <div
                  className={`${styles.navbarAdminAnchor} ${isActive("commonFraudBox")}`}
                  onClick={() => {
                    setSelectedLink("commonFraudBox");
                    navigate("/#commonFraudBox");
                    setIsMobileMenuOpen(!isMobileMenuOpen);
                  }}
                >
                  常見手法
                </div>

                <div 
                  className={`${styles.navbarAdminAnchor} ${isActive("admin")}`} 
                  onClick={() => {
                    navigate("/admin");
                    setIsMobileMenuOpen(!isMobileMenuOpen);
                  }}
                >
                  資料集更新
              </div>

              <div 
                className={`${styles.navbarAdminAnchor} ${isActive("logout")}`} 
                onClick={() => {
                  setIsLogoutModalOpen(true);
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }}
              >
                登出
              </div>
            </div>
          </div>
        </div>
      )}
    </>
      /* <div className="nav-menu" style={{ justifyContent: 'space-between' }}>

        {!isAdminPath && (<>
          <Link to="/" className={`nav-a ${isActive('/')}`}><div>騙局雷達</div></Link>
          <div className="nav-option">
            <Link to="/Fraud" className={`nav-a ${isActive('/Fraud')}`}><div>常見手法</div></Link>
            <Link to="/Website" className={`nav-a ${isActive('/Website')}`}><div>詐騙檢測</div></Link>
            <Link to="/Statistics" className={`nav-a ${isActive('/Statistics')}`}><div>統計圖表</div></Link>
          </div>
        </>)}


        {isAdminPath && (<>
          <Link to="/Admin" className={`nav-a ${isActive('/')}`}><div>騙局雷達</div></Link>
          <div className="nav-option">
            <div className={`nav-a ${currentView === 'AdminUpload' ? 'active' : ''}`} onClick={onAdminUploadClick} style={{ cursor: 'pointer' }}><div>資料集更新</div></div>
            <div className={`nav-a ${currentView === 'AdminPreview' ? 'active' : ''}`} onClick={onAdminPreviewClick} style={{ cursor: 'pointer' }}><div>準確度回報</div></div>

            <div className="nav-a" onClick={onLogoutClick} style={{ cursor: 'pointer' }}>
              <div>登出</div>
            </div>
          </div>
        </>)}
      </div> */
  );
}

export default Navbar;