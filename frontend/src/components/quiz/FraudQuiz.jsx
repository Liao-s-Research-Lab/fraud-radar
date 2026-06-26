// File: FinalResults.jsx
import React, { useState, useEffect, useRef } from 'react';
import styles from './FraudQuiz.module.css';
import UndoIcon from '@mui/icons-material/Undo';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ProgressBar from './ProgressBar';
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuizContext } from "./QuizContext";
import GuideTour from './GuideTour';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import VideocamIcon from '@mui/icons-material/Videocam';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import MicIcon from '@mui/icons-material/Mic';
import TelegramIcon from '@mui/icons-material/Telegram';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PanoramaIcon from '@mui/icons-material/Panorama';
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase"; 
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

function FraudQuiz() {
  // 教學導引步驟
  const [ run ] = useState(true);
  const steps = [
    {
      target: "#gameContainer",
      placement: "center",
      content: <p style={{fontSize: '30px'}}><b>是否要觀看教學引導？</b></p>,
    },
    {
      target: "#returnButton",
      placement: "bottom",
      content: (
        <>
          <h5></h5>
          <p style={{fontSize: '20px'}}><b>返回按鈕：回到測驗類型的選擇。</b></p>
          <h6><span style={{ color: "red" }}>*完成或跳過教學引導後將無法返回*</span></h6> 
        </>
      ),
    },
    {
      target: "#autoPlay",
      placement: "bottom",
      content: <p style={{fontSize: '20px'}}><b>自動播放：點擊後將自動播放對話，再次點擊即可關閉。</b></p>
    },
    {
      target: "#skipClick",
      placement: "bottom",
      content: <p style={{fontSize: '20px'}}><b>跳過對話：點擊後可跳過所有對話。</b></p>
    },
    {
      target: "#dialogueBox",
      placement: "top",
      content: <p style={{fontSize: '20px'}}><b>對話框：點擊以進行對話。</b></p>
    },
    {
      target: "#records",
      placement: typeof window !== "undefined" && window.innerWidth <= 768 ? "center" : "right",
      content: (
        <>
          <p style={{fontSize: '20px'}}><b>紀錄框：顯示當前的對話紀錄。</b></p>
          <hr></hr>
          <p style={{fontSize: '19px'}}><b>可隨時點選<span style={{ color: "goldenrod" }}>最具引誘</span>的關鍵句</b></p>
          <h5><span style={{ color: "green" }}>綠色</span> ➜ "<span style={{ color: "green" }}>回答正確</span>"</h5>
          <h5><span style={{ color: "red" }}>紅色</span> ➜ "<span style={{ color: "red" }}>回答錯誤</span>"</h5>
        </>
      )
    }
  ];

  const [currentConversation, setCurrentConversation] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGuideTourActive, setIsGuideTourActive] = useState(true);
  const [records, setRecords] = useState([
    { character: "character1", text: "OOO先生/小姐您好，我是xxx的客服人員。" },
    { character: "character2", text: "您好，請問有甚麼事嗎?" },
    { character: "character1", text: "我們發現您有一筆交易出現問題，需要您到ATM前進行操作確認。" }
  ]);
  const [showRecords, setShowRecords] = useState(true);
  const [showBackStory, setShowBackStory] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isWaitingForOption, setIsWaitingForOption] = useState(false);
  const [isCharacterNameVisible, setIsCharacterNameVisible] = useState(true);
  const [question, setQuestion] = useState("");
  const [clickedText, setClickedText] = useState(null);
  const [ nextStageTransition, setNextStageTransition] = useState(false);
  const recordsRef = useRef(null); 
  const [dimensions, setDimensions] = useState({width: 0, height: 0})
  const [returnIsDisable, setReturnIsDisable] = useState(false);
  const [goFinalResults, setGoFinalResults] = useState(false);
  const [hiddenDuringTransition, setHiddenDuringTransition] = useState(false)
  const [errorCounts, setErrorCounts] = useState({});
  const { setIsFirstRender, svgColor, characterInformation, typeName, allScripts, fraudType, correctAnswer, errorCount, updateErrorCount} = useQuizContext();
  // 音樂
  const [isPlayingBgm, setIsPlayingBgm] = useState(false); //背景音樂
  const bgmRef = useRef(null); //背景音樂
  const correctSoundRef = useRef(null); //答對音效
  const navigate = useNavigate();

const submitScoresToFirebase = async () => {
  try {
    console.log("正在提交分數和錯誤次數到 Firebase...");
    console.log("errorCount 原始資料:", errorCount);
    
    // 1. 確保錯誤次數是陣列格式
    let errors = [0, 0, 0]; // 預設錯誤次數
    
    if (Array.isArray(errorCount)) {
      // 如果已經是陣列，直接使用
      errors = [...errorCount];
      console.log("errorCount 是陣列格式:", errors);
    } else if (typeof errorCount === 'object' && errorCount !== null) {
      // 如果是物件格式，轉換為陣列
      for (let i = 0; i < 3; i++) {
        errors[i] = errorCount[i] || 0;
      }
      console.log("errorCount 是物件格式，轉換後:", errors);
    }
    
    // 2. 根據錯誤次數計算分數
    const calculatedScores = errors.map(err => Math.max(0, 100 - (err * 20)));
    console.log("計算的分數:", calculatedScores);
    
    // 3. 映射詐騙類型
    const fraudTypeMap = {
      "交友戀愛詐騙": "romanceFraud",
      "冒名詐騙": "impersonationFraud",
      "購物詐騙": "shoppingFraud",
      "投資詐騙": "investmentFraud"
    };
    
    const dbFraudType = fraudTypeMap[typeName];
    
    if (!dbFraudType) {
      console.error("無效的詐騙類型:", typeName);
      return;
    }
    
    // 獲取 ScoreStatistics Firestore 文檔
    const scoreStatisticsRef = doc(db, "QuizScore", "ScoreStatistics");
    let docSnap = await getDoc(scoreStatisticsRef);
    
    // 5. 如果文檔不存在，則創建完整的初始結構
    if (!docSnap.exists()) {
      console.log("創建新的 ScoreStatistics 文檔...");
      const initialData = {
        romanceFraud: {
          playCount: 0,
          level1Score: 0,
          level2Score: 0,
          level3Score: 0,
          error1Count: 0,
          error2Count: 0,
          error3Count: 0
        },
        impersonationFraud: {
          playCount: 0,
          level1Score: 0,
          level2Score: 0,
          level3Score: 0,
          error1Count: 0,
          error2Count: 0,
          error3Count: 0
        },
        shoppingFraud: {
          playCount: 0,
          level1Score: 0,
          level2Score: 0,
          level3Score: 0,
          error1Count: 0,
          error2Count: 0,
          error3Count: 0
        },
        investmentFraud: {
          playCount: 0,
          level1Score: 0,
          level2Score: 0,
          level3Score: 0,
          error1Count: 0,
          error2Count: 0,
          error3Count: 0
        }
      };
      
      await setDoc(scoreStatisticsRef, initialData);
      docSnap = await getDoc(scoreStatisticsRef);
    }
    
    // 6. 獲取當前數據
    const currentData = docSnap.data();
    console.log("當前 Firebase 數據:", currentData);
    
    // 7. 確保該類型的數據結構存在
    let fraudData = currentData[dbFraudType] || {
      playCount: 0,
      level1Score: 0,
      level2Score: 0,
      level3Score: 0,
      error1Count: 0,
      error2Count: 0,
      error3Count: 0
    };
    
    // 8. 更新數據
    const updatedFraudData = {
      playCount: fraudData.playCount + 1,
      level1Score: fraudData.level1Score + (calculatedScores[0] || 0),
      level2Score: fraudData.level2Score + (calculatedScores[1] || 0),
      level3Score: fraudData.level3Score + (calculatedScores[2] || 0),
      error1Count: fraudData.error1Count + (errors[0] || 0),
      error2Count: fraudData.error2Count + (errors[1] || 0),
      error3Count: fraudData.error3Count + (errors[2] || 0)
    };
    
    console.log("更新後的詐騙數據:", updatedFraudData);
    
    // 9. 更新 Firestore
    await setDoc(scoreStatisticsRef, {
      ...currentData,
      [dbFraudType]: updatedFraudData
    });
    
    console.log(`已成功提交 ${typeName} 的分數和錯誤次數到 ScoreStatistics`);
    
  } catch (error) {
    console.error("提交分數到 Firebase 時出錯:", error);
    console.error("錯誤詳情:", error.message);
    if (error.stack) {
      console.error("錯誤堆疊:", error.stack);
    }
  }
};

const handleNextStage = () => {
    if ((currentConversation + 1) === allScripts[fraudType].length) {
      
        navigate("/quiz/finalresults");
      

      // 確保在導航前提交分數和錯誤次數
      submitScoresToFirebase().then(() => {
        setGoFinalResults(true);
        setNextStageTransition(true);
      }).catch(error => {
        console.error("提交分數時出錯，但仍然繼續到結果頁:", error);
        setGoFinalResults(true);
        setNextStageTransition(true);
      });
    } else {
      setCurrentConversation(currentConversation + 1);
      setCurrentIndex(0);  
      setRecords([]); 
      setShowRecords(false);
      setIsAutoPlay(false);
      setQuestion("");
      setHiddenDuringTransition(true);
      setNextStageTransition(true);
      togglePlayBgm();
    }
};

  const handleDialogueClick = () => {
    if (Array.isArray(allScripts[fraudType][currentConversation].script[currentIndex]?.text)) {
      return;
    }

    if (currentIndex < allScripts[fraudType][currentConversation].script.length) {
      if (currentIndex === 0) {
        setShowRecords(true);
      }
        setRecords([...records, allScripts[fraudType][currentConversation].script[currentIndex]]);
        setCurrentIndex(currentIndex + 1);
    }

    if (currentIndex + 1 === allScripts[fraudType][currentConversation].script.length) {
        setIsCharacterNameVisible(false);
        setTimeout(() => {
            setQuestion("請選擇對話中，對方進行詐騙的關鍵句。");
        }, 500);
    }
  };

  const toggleAutoPlay = () => {
    setIsAutoPlay((prev) => {
      if (!prev && currentIndex === 0 && !showRecords) {
        setShowRecords(true);
        setRecords([allScripts[fraudType][currentConversation].script[currentIndex]]);
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }
      return !prev;
    });
  };

  const handleRecordClick = (clickedCharacter, clickedText) => {
  // 如果點擊的是角色2的對話，直接返回
  if (clickedCharacter === "character2") {
    return;
  } else {
    setClickedText(clickedText);
  }

  // 檢查是否選擇正確答案
  if (correctAnswer[currentConversation] !== clickedText) {
    // 選擇錯誤，增加錯誤計數
    setErrorCounts(prevCounts => {
      const newCount = (prevCounts[currentConversation] || 0) + 1;
      
      // 記錄錯誤次數變化
      console.log(`錯誤次數變化: ${currentConversation} 階段從 ${prevCounts[currentConversation] || 0} 增加到 ${newCount}`);
      
      // 立即更新 context 中的錯誤計數
      setTimeout(() => {
        console.log(`更新第 ${currentConversation} 個對話的錯誤次數為: ${newCount}`);
        updateErrorCount(currentConversation, newCount);
      }, 0);

      return { ...prevCounts, [currentConversation]: newCount };
    });
  } else {
    // 選擇正確，保持當前錯誤次數
    playCorrectSound();
    const currentMistakes = errorCount[currentConversation] || 0;
    console.log(`第 ${currentConversation} 個對話選擇正確，保持錯誤次數為: ${currentMistakes}`);
    updateErrorCount(currentConversation, currentMistakes);
  }
};

  const handleSkipClick = () => {
    if (currentIndex === 0) {
      setShowRecords(true);
    }
    
    setRecords((prevRecords) => [
      ...prevRecords,
      ...allScripts[fraudType][currentConversation].script.slice(currentIndex)
    ]);
    setCurrentIndex(allScripts[fraudType][currentConversation].script.length);
    setIsAutoPlay(false);
    setIsCharacterNameVisible(false);
    setTimeout(() => {
        setQuestion("請選擇對話中，對方進行詐騙的關鍵句。");
    }, 500);
  };

  const handleBack = () => {
    setIsFirstRender(false);
    navigate("/quiz");
  };

  useEffect(() => {
    if (!isGuideTourActive) {
      setRecords([]);
      setShowRecords(false);
      setNextStageTransition(true);
      setReturnIsDisable(true);
      setHiddenDuringTransition(true);
    }
  }, [isGuideTourActive]);
  
  useEffect(() => {
    let interval;
    if (isAutoPlay && !isWaitingForOption) {
      interval = setInterval(() => {
        if (currentIndex < allScripts[fraudType][currentConversation].script.length) {

          if (Array.isArray(allScripts[fraudType][currentConversation].script[currentIndex]?.text)) {
            setIsWaitingForOption(true);
            clearInterval(interval);
            return;
          }

          setRecords((prevRecords) => [...prevRecords, allScripts[fraudType][currentConversation].script[currentIndex]]);
          setCurrentIndex((prevIndex) => prevIndex + 1);

          if (currentIndex + 1 === allScripts[fraudType][currentConversation].script.length) {
            setIsAutoPlay(false);
            clearInterval(interval);
            setIsCharacterNameVisible(false);
            setTimeout(() => {
                setQuestion("請選擇對話中，對方進行詐騙的關鍵句。");
            }, 1000);
          }
        } else {
          clearInterval(interval);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isAutoPlay, currentIndex, allScripts[fraudType][currentConversation].script, isWaitingForOption]);

  useEffect(() => {
    if (recordsRef.current) {
      recordsRef.current.scrollTop = recordsRef.current.scrollHeight;
    }
  }, [records]);


  useEffect (() => {
    const resize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    resize();
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])

  useEffect(() => {
    const preventScroll = () => {
      document.body.style.overflow = 'hidden'; 
    };
    const resetScroll = () => {
      document.body.style.overflow = ''; 
    };

    if (run) {
      preventScroll(); 
    } else {
      resetScroll(); 
    }

    return () => {
      resetScroll(); 
    };
  }, [run]);

// 背景音樂
  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
  
    let audioSrc = '/bgm.mp3'; 
  
    if (fraudType === 'romanceFraud') {
      audioSrc = '/romanceBgm.mp3';
    } else if (fraudType === 'imposterFraud') {
      audioSrc = '/imposterBgm.mp3';
    } else if (fraudType === 'shoppingFraud') {
      audioSrc = '/shoppingBgm.mp3';
    } else if (fraudType === 'investmentFraud') {
      audioSrc = '/investmentBgm.mp3';
    }
  
    const audio = new Audio(audioSrc);
    audio.loop = true;
    audio.volume = 0.5;
    bgmRef.current = audio;
  
    correctSoundRef.current = new Audio('/correct.mp3');
    correctSoundRef.current.volume = 0.7; 

    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
      if (correctSoundRef.current) {
        correctSoundRef.current = null;
      }
    };
  }, [fraudType]);

  const togglePlayBgm = () => {
    if (isPlayingBgm) {
      bgmRef.current.pause();
    } else {
      bgmRef.current.play().catch(error => {
        console.error("BGM播放失敗:", error);
      });
    }
    setIsPlayingBgm(!isPlayingBgm);
  };
  
  const playCorrectSound = () => {
    correctSoundRef.current.currentTime = 0; 
    correctSoundRef.current.play().catch(error => {
      console.error("正確音效播放失敗:", error);
    });
  };

  useEffect(() => {
    if (correctAnswer[currentConversation] === clickedText) {
      setTimeout(() => handleNextStage(), 1000); 
    }
  }, [clickedText])
  
  const stages = [
    { title: "測 驗 一", stage: "Stage 1" },
    { title: "測 驗 二", stage: "Stage 2" },
    { title: "測 驗 三", stage: "Stage 3" },
  ];

  const colorMap = {
    "#ffe4e6": "rgb(255, 154, 184)",
    "#fef3c7": "rgb(255, 204, 128)",
    "#d1fae5": "rgb(79, 218, 169)",
    "#EDE9FE": "rgb(201, 172, 255)"
  };

  const getFillColor = (svgColor) => {
    return colorMap[svgColor] || "white"; 
    };

  const getFraudBackgroundClass = (fraudType) => {
    if (fraudType === 'shoppingFraud') return styles.shoppingFraud;
    if (fraudType === 'romanceFraud') return styles.romanceFraud;
    if (fraudType === 'investmentFraud') return styles.investmentFraud;
    return '';
  };
    
  return (
    <div className={styles.gameContainer} id="gameContainer">
      
      <GuideTour 
      steps={steps} 
      run={run} 
      setIsGuideTourActive={setIsGuideTourActive} 
      />

      <div className={styles.pageTransition}>
        <div className={styles.tempbg} style={{opacity: dimensions.width > 0 ? 0 : 1, backgroundColor: svgColor}}></div>
        {dimensions.width > 0 && <SVG {...dimensions} svgColor={svgColor} goFinalResults={goFinalResults}></SVG>}
        <motion.p
          className={styles.temptitle} 
          style={{ color: getFillColor(svgColor) || 'white' }}
          initial={{ opacity: 1, x: 0}}
          animate={{ opacity: 0, x: -300}}
          transition={{
            duration: 0.5,
            delay: 0.5,
            ease: [0.32, 0, 0.67, 0]
          }}
        >
          {typeName}
        </motion.p>

        { nextStageTransition && (
          <motion.div 
            className={styles.nextStage}
            initial={{ opacity: 0}}
            animate={{ opacity: [0, 1, 1, 0] }} 
            transition={{
              duration: 2.4, 
              times: [0, 0.25, 0.75, 1], 
              ease: "easeInOut", 
            }}
            onAnimationComplete={() => {
              setNextStageTransition(false);
              setShowBackStory(true)
              setIsCharacterNameVisible(true);
            }}
          >
            <p>{ !goFinalResults ? stages[currentConversation]?.title : "測驗結束" }</p>
            <p>{ !goFinalResults ? stages[currentConversation]?.stage : "Completed" }</p>
          </motion.div>
        )}
      </div>

      <div className={`${styles.background} ${getFraudBackgroundClass(fraudType)}`}></div>

      { showBackStory && (
        <div className={styles.backStory}>
          <p style={{ fontSize: '50px' }}><b>【情境 - {currentConversation + 1}】</b></p>
          <p style={{ fontSize: '30px' }}><b>{allScripts[fraudType][currentConversation].background}</b></p>
          <div className={styles.kickOff}>
            <button onClick={() => {
              setHiddenDuringTransition(false);
              setShowBackStory(false);
              setShowRecords(true);
              togglePlayBgm();
              }}>
                開始測驗
            </button>
          </div>
          
        </div>
      )}

      {!returnIsDisable && (
        <div className={styles.returnButton} id="returnButton">
          <button onClick={handleBack}><UndoIcon /> 返回</button>
        </div>
      )}
      
      {!hiddenDuringTransition && (
        <ProgressBar currentConversation={currentConversation}></ProgressBar>
      )}

      {!hiddenDuringTransition && (
        <div className={styles.dialogueBox} id="dialogueBox" onClick={handleDialogueClick}>
        {isCharacterNameVisible && (
          <div className={allScripts[fraudType][currentConversation].script[currentIndex]?.character === "character1" ? styles.characterName1 : styles.characterName2}>
           {allScripts[fraudType][currentConversation].script[currentIndex]?.character === "character1" ? "詐騙犯" : (characterInformation.confirmNickname || "我")}
          </div>
        )}

        <div>
          {Array.isArray(allScripts[fraudType][currentConversation].script[currentIndex]?.text) ? (
            <div className={styles.options}>
              {allScripts[fraudType][currentConversation].script[currentIndex]?.text.map((option, index) => (
                <button key={index} className={styles.option} onClick={() => handleOptionClick(option)}>
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.dialogueText}>
              {isGuideTourActive ? records[2].text : allScripts[fraudType][currentConversation].script[currentIndex]?.text}
            </div>
          )}
          {question && <div className={styles.question}>{question}</div>}
        </div>
      </div>
      )}


      <div className={styles.content}>
        {!hiddenDuringTransition && (
          <div className={styles.characterLeft}>
              <img src="/faurd.PNG" alt="Character 1" className={`${styles.characterLeftImage} ${allScripts[fraudType][currentConversation].script[currentIndex]?.character === "character1" ? styles.myturn : null}`} />
          </div>
        )}
        <div className={styles.records} id="records" style={{ visibility: showRecords ? 'visible' : 'hidden' }}>
          <div className={styles.recordsHeader}>
            <AccountCircleIcon sx={{ fontSize: 42 }} />
            <div className={styles.state}>
            <p style={{fontSize: '20px'}}><b>賣家</b></p>
              <p>🟢上線中</p>
            </div>
            <div className={styles.function}>
              <LocalPhoneIcon sx={{ fontSize: 27.5 }}/>
              <VideocamIcon sx={{ fontSize: 27.5 }} />
              <MoreVertIcon sx={{ fontSize: 27.5 }} />
            </div>
          </div>
          <div className={styles.recordsContent} ref={recordsRef}>
            {records.map((entry, index) => (
              <div
                key={index}
                className={entry.character === 'character1' ? styles.recordsLeft : styles.recordsRight}
                onClick={() => handleRecordClick(entry.character, entry.text)} 
              >
                <div
                  className={`
                    ${
                      entry.character === 'character1' ? styles.recordsLeftText : styles.recordsRightText
                    } 
                    ${
                      entry.text.includes("OOO先生/小姐您好，我是xxx的客服人員。") ? styles.incorrectAnswer : 
                      entry.text.includes("我們發現您有一筆交易出現問題，需要您到ATM前進行操作確認。") ? styles.correctAnswer : ''
                    }
                    ${
                      (correctAnswer[currentConversation] === clickedText && entry.text === clickedText) ? styles.correctAnswer : 
                      (correctAnswer[currentConversation] !== clickedText && entry.text === clickedText) ? styles.incorrectAnswer : ''
                    }
                  `}
                >
                  {entry.text}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.recordsBottom}>
            <div className={styles.typingContainer}>
              <EmojiEmotionsIcon sx={{ marginLeft: "10px", color: "gray", fontSize: 27.5}}/>
              <p>發送訊息 . . .</p>
              <MicIcon sx={{ marginLeft: "auto", marginRight: "10px", color: "gray", fontSize: 27.5}}/>
            </div>
            <div className={styles.otherButtonContainer}>
              <CameraAltIcon 
              sx={{
                  backgroundColor:"rgba(255, 255, 255, 0.5)", 
                  boxSizing: "content-box", 
                  padding: "10px", 
                  borderRadius: "50%", 
                  color: "gray",
                  fontSize: 27.5}} 
              />
              <PanoramaIcon
                sx={{
                  backgroundColor:"rgba(255, 255, 255, 0.5)", 
                  boxSizing: "content-box", 
                  padding: "10px", 
                  borderRadius: "50%", 
                  color: "gray",
                  fontSize: 27.5}} 
              />
              <TelegramIcon 
                sx={{
                  backgroundColor:"rgba(255, 255, 255, 0.5)", 
                  boxSizing: "content-box", 
                  padding: "10px", 
                  borderRadius: "50%", 
                  color: "gray",
                  fontSize: 27.5}} 
              />
            </div>
          </div>
        </div>
        
        {!hiddenDuringTransition && (
          <div className={styles.characterRight}>
              <img src={`/${characterInformation.selectedRole}.PNG`} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/c1.PNG"; }}   alt="Character 2" className={`${styles.characterRightImage} ${allScripts[fraudType][currentConversation].script[currentIndex]?.character === "character2" ? styles.myturn : null}`} />
          </div>
        )}
      </div>

      {!hiddenDuringTransition && (
        <div className={styles.recordsControls}>
                    <button onClick={togglePlayBgm} id="bgm">
            {isPlayingBgm ? <VolumeUpIcon /> : <VolumeOffIcon />}
          </button>
          <button onClick={toggleAutoPlay} id="autoPlay">
            {isAutoPlay ? (<><PauseIcon /> 暫停播放</>) : (<><PlayArrowIcon /> 自動播放</>)}
          </button>
          <button onClick={handleSkipClick} id="skipClick">
            <SkipNextIcon /> 跳過對話
          </button>
        </div>
      )}
    </div>
  );
}

export default FraudQuiz;


function SVG({ width, height, svgColor, goFinalResults}) {
  const svgPath = `
    M0 0
    L${width + 300} 0
    Q${width + 600} ${height / 2} ${width + 300} ${height} 
    L0 ${height}
    L0 0
  `
  
  return (
    <motion.svg 
      className={styles.svg}
      initial={{ x: 0 }}
      animate={{ x: "calc(-100vw - 600px)" }}
      exit={!goFinalResults ? { x: 0 } : null}
      transition={{ duration: 1, delay: 0.5, ease: [0.75, 0, 0.24, 1]}}
      fill={svgColor}
      >
      <path d={svgPath}></path>
    </motion.svg>
    );
}