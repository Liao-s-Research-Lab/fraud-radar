import './Login.css'; 
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import welcome_user from '../../images/welcome_user.png';
import user from '../../images/user.png';
import padlock from '../../images/padlock.png';
import { collection, query, where, getDocs } from 'firebase/firestore'; 
import { db } from '../../firebase'; 

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState({ usernameError: '', passwordError: '' }); 
  const navigate = useNavigate();

  const handleDragOver = (event) => {
    event.preventDefault(); 
  };

  const handleLogin = async () => {
    setError({ usernameError: '', passwordError: '' }); 
    try {
      const queryDocumentID = query(collection(db, 'Management'), where('Account', '==', username));
      const querySnapshot = await getDocs(queryDocumentID);
      
      if (!querySnapshot.empty) {
        
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
    
        if (userData.Password === password) {
          console.log("登入成功:", userData);
          sessionStorage.setItem('username', username); 
          navigate('/admin'); 
        } else {
          setError(prev => ({ ...prev, passwordError: '密碼錯誤' })); 
        }
      } else {
        setError(prev => ({ ...prev, usernameError: '帳號不存在' }));
      }
    } catch (err) {
      console.error('Firestore 讀取錯誤:', err);
      setError({ usernameError: '登入過程中發生錯誤，請稍後再試', passwordError: '' });
    }
  };

  return (
    <>
      <Helmet>
        <title>登入</title>
      </Helmet>
      <div className="login-background">
        <motion.div className='frame'
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 2.5 }} 
        >
          <div>
            <img src={ welcome_user } alt="welcome_user icon" width="200px" />
          </div>
          <div className="welcome">管理員</div>
          <form className="login" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}> 
            <div className="email" style={{ marginBottom: error.usernameError ? '0' : '20px' }}>
              <input 
                type="text" 
                placeholder="帳號:" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                onDragOver={ handleDragOver }
                className={ error.usernameError ? 'login-error' : ''}
              />
              <img src={ user } alt="user icon" width="23px" />
            </div>
            {error.usernameError && <p style={{ color: 'red' }}>{ error.usernameError }</p>}

            <div className="password" style={{ marginBottom: error.passwordError ? '0' : '20px' }}>
              <input 
                type="password" 
                placeholder="密碼:" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className={ error.passwordError ? 'login-error' : ''}
              />
              <img src={ padlock } alt="padlock icon" width="23px" />
            </div>
            {error.passwordError && <p className='login-error-msg'>{ error.passwordError }</p>} 
            <button type="submit" className="login-btn">
              <span className="btn-txt">登入</span>
            </button>
          </form>
        </motion.div>
      </div>
    </>
  );
}

export default Login;
