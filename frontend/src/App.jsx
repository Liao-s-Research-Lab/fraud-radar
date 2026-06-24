import './App.css';
import { BrowserRouter } from 'react-router-dom';
import AnimationRoute from './components/animationroute/AnimationRoute';
import { useEffect } from 'react';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { QuizProvider } from './components/quiz/QuizContext';

function App() {
  useEffect(() => {
    const auth = getAuth();
    signInAnonymously(auth)
      .then(() => {
        console.log('User signed in anonymously');
      })
      .catch((error) => {
        console.error('Error signing in anonymously:', error);
      });
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
