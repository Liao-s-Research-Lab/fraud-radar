import React, { useEffect } from 'react'
import Home from '../home/Home';
import Website from '../website/Website';
import Statistics from '../statistics/Statistics';
import Report from '../report/Report';
import Login from '../login/Login';
import Admin from '../admin/Admin';
import Quiz from '../quiz/Quiz';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import FraudQuiz from '../quiz/FraudQuiz';
import QuizTypeSelection from '../quiz/QuizTypeSelection';
import FinalResults from '../quiz/FinalResults';
import Promotion from '../promotion/Promotion';

function AnimationRoute() {
    const location = useLocation();
    useEffect(() => {
      switch (location.pathname) {
        case '/':
          document.title = '首頁';
          break;
        case '/fraud':
          document.title = '常見手法';
          break;
        case '/report':
          document.title = '詐騙回報';
          break;
        case '/website':
          document.title = '網站檢測';
          break;
        case '/statistics':
          document.title = '統計數據';
          break;
        case '/login':
          document.title = '登入頁面';
          break;
        case '/admin':
          document.title = '管理頁面';
          break;
        case '/quiz':
          document.title = '詐騙測驗';
          break;
        case '/quiz/shoppingfraud':
          document.title = '測驗類型：購物詐騙';
          break;
        case '/quiz/finalresults':
          document.title = '測驗結果';
          break;
        default:
          document.title = '防詐雷達'; 
      }
    }, [location]);
  return (
    <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/website" element={<Website />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/login" element={<Login />} />
            <Route path="/report" element={<Report />} />
            <Route path="/promotion" element={<Promotion />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/quiz/fraudquiz" element={<FraudQuiz />} />
            <Route path="/quiz/quiztypeselection" element={<QuizTypeSelection />}/>
            <Route path="/quiz/finalresults" element={<FinalResults />}/>
        </Routes>
    </AnimatePresence>
  )
}

export default AnimationRoute


