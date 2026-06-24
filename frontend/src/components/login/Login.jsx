import './Login.css'; 
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import welcome_user from '../../images/welcome_user.png';
import user from '../../images/user.png';
import padlock from '../../images/padlock.png';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../firebase';

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
      // 後端驗證帳密（查 Management、比對在伺服器端，密碼不外洩），成功會回傳帶 admin 權限的 token
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: username, password }),
      });
      if (!res.ok) {
        setError(prev => ({ ...prev, passwordError: '帳號或密碼錯誤' }));
        return;
      }
      const { token } = await res.json();
      // 用 custom token 登入 Firebase Auth → 取得帶 admin claim 的登入狀態，規則才認得
      await signInWithCustomToken(auth, token);
      navigate('/admin');
    } catch (err) {
      console.error('登入失敗:', err);
      setError(prev => ({ ...prev, passwordError: '登入失敗，請稍後再試' }));
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
