import './App.css';
import { BrowserRouter } from 'react-router-dom';
import AnimationRoute from './components/animationroute/AnimationRoute';
import { useEffect } from 'react';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { QuizProvider } from './components/quiz/QuizContext';

function App() {
  useEffect(() => {
    const auth = getAuth();
    // 只在尚未登入時才匿名登入；避免覆蓋管理員（Email/密碼）的登入狀態
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch((error) => {
          console.error('匿名登入失敗:', error);
        });
      }
    });
    return () => unsub();
  }, []);

  return (
    <BrowserRouter>
      <QuizProvider>
        <AnimationRoute />
      </QuizProvider>
    </BrowserRouter>
  );
}

export default App;
