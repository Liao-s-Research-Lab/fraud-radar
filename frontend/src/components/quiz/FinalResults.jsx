// File: FinalResults.jsx
import React, { useState, useEffect } from 'react';
import styles from './FinalResults.module.css';
import { motion } from 'framer-motion'; 
import { useNavigate } from "react-router-dom";
import CircularScore from './CircularScore';
import { useQuizContext } from "./QuizContext";
import UndoIcon from '@mui/icons-material/Undo';
import { doc, getDoc, setDoc, collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebase"; 

const FinalResults = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isFlipped, setIsFlipped] = useState([false, false, false]);
    const [returnIsDisable, setReturnIsDisable] = useState(true);
    const { svgColor, typeName, allScripts, fraudType, correctAnswer, errorCount, scores } = useQuizContext();
    const [localScores, setLocalScores] = useState([0, 0, 0]);
    const navigate = useNavigate();
    const [averageStats, setAverageStats] = useState(null);
    const [prValues, setPrValues] = useState([0, 0, 0, 0]); // [PR1, PR2, PR3, PR整體]
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingPR, setIsLoadingPR] = useState(true);
    // PR 值顯示組件
    const PRValueDisplay = ({ value }) => {
        let valueClass = styles.prValueZero;
        
        if (value === 0) {
            valueClass = styles.prValueZero;
        } else if (value >= 80) {
            valueClass = styles.prValueHigh;
        } else if (value >= 60) {
            valueClass = styles.prValueMedium;
        } else if (value >= 40) {
            valueClass = styles.prValueLow;
        } else {
            valueClass = styles.prValueVeryLow;
        }
        
        return (
            <span className={`${styles.prValue} ${valueClass}`}>
                {value}
            </span>
        );
    };

    // PR 值說明組件
    const PerformanceExplanation = () => {
        return (
            <div className={styles.prExplanation}>
                <div className={styles.prExplanationTitle}>PR值說明：</div>
                <p>PR值表示您的分數在所有參與者中的百分位排名。</p>
                <p>PR80表示您的表現超越了80%的參與者。</p>
                &nbsp;
                <div className={styles.prExampleContainer}>
                    <span><PRValueDisplay value={85} /> 優秀 (PR ≥ 80)</span>
                    <span><PRValueDisplay value={70} /> 良好 (PR 60-79)</span>
                    <span><PRValueDisplay value={50} /> 普通 (PR 40-59)</span>
                    <span><PRValueDisplay value={25} /> 待加強 (PR ＜ 40)</span>
                    <span><PRValueDisplay value={0} /> 無數據</span>
                </div>
            </div>
        );
    };

    // 只計算PR值，不保存分數（分數已在遊戲結束時保存）
    const calculatePROnly = async () => {
        try {
            console.log("=== 開始計算PR值 ===");
            setIsLoadingPR(true);
            
            // 映射詐騙類型到文檔名稱
            const fraudTypeMap = {
                "交友戀愛詐騙": "RomanceFraud",
                "冒名詐騙": "ImpersonationFraud",
                "購物詐騙": "ShoppingFraud",
                "投資詐騙": "InvestmentFraud"
            };
            
            const docName = fraudTypeMap[typeName];
            console.log("詐騙類型映射:", { typeName, docName });
            
            if (!docName) {
                console.error("無效的詐騙類型:", typeName);
                setIsLoadingPR(false);
                return;
            }
            
            // 創建當前使用者的分數記錄（用於PR計算）
            const currentScore = {
                level1Score: localScores[0] || 0,
                level2Score: localScores[1] || 0,
                level3Score: localScores[2] || 0,
                overallScore: ((localScores[0] || 0) + (localScores[1] || 0) + (localScores[2] || 0)) / 3,
                timestamp: new Date().toISOString(),
                errorCount: [...errorCount]
            };
            
            console.log("當前分數記錄:", currentScore);
            
            // 計算PR值（基於現有數據）
            console.log("開始計算PR值...");
            const calculatedPR = await calculatePRValues(docName, currentScore);
            console.log("PR值計算完成:", calculatedPR);
            setPrValues(calculatedPR);
            
            // 現在保存分數到QuizScore（用於未來的PR計算）
            console.log("保存分數到QuizScore以供未來PR計算使用...");
            const scoresRef = collection(db, "QuizScore", docName, "scores");
            const docRef = await addDoc(scoresRef, currentScore);
            console.log("分數已保存到QuizScore，文檔ID:", docRef.id);
            
            console.log("=== PR值計算和數據保存完成 ===");
            
        } catch (error) {
            console.error("=== 計算PR值時出錯 ===");
            console.error("錯誤:", error);
            console.error("錯誤訊息:", error.message);
            console.error("錯誤堆疊:", error.stack);
            // 如果出錯，設置PR值為0，表示無法計算
            setPrValues([0, 0, 0, 0]);
        } finally {
            setIsLoadingPR(false);
        }
    };

    // 計算PR值的函數
    const calculatePRValues = async (docName, currentScore) => {
        try {
            console.log("開始計算PR值...", { docName, currentScore });
            
            // 獲取所有該類型的分數記錄
            const scoresRef = collection(db, "QuizScore", docName, "scores");
            console.log("查詢路徑:", `QuizScore/${docName}/scores`);
            
            const scoresSnapshot = await getDocs(scoresRef);
            console.log("查詢結果:", {
                empty: scoresSnapshot.empty,
                size: scoresSnapshot.size
            });
            
            if (scoresSnapshot.empty) {
                console.log("沒有歷史分數記錄，這是第一筆數據，返回PR值50");
                return [50, 50, 50, 50]; // 第一筆數據返回50作為基準
            }
            
            // 收集所有分數
            const allScores = {
                level1: [],
                level2: [],
                level3: [],
                overall: []
            };
            
            scoresSnapshot.forEach(doc => {
                const data = doc.data();
                console.log("歷史分數記錄:", data);
                if (data.level1Score !== undefined) allScores.level1.push(data.level1Score);
                if (data.level2Score !== undefined) allScores.level2.push(data.level2Score);
                if (data.level3Score !== undefined) allScores.level3.push(data.level3Score);
                if (data.overallScore !== undefined) allScores.overall.push(data.overallScore);
            });
            
            console.log("收集到的所有分數:", allScores);
            
            // 計算每個測驗的PR值
            const pr1 = calculateSinglePR(currentScore.level1Score, allScores.level1);
            const pr2 = calculateSinglePR(currentScore.level2Score, allScores.level2);
            const pr3 = calculateSinglePR(currentScore.level3Score, allScores.level3);
            const prOverall = calculateSinglePR(currentScore.overallScore, allScores.overall);
            
            const result = [pr1, pr2, pr3, prOverall];
            console.log("計算完成的PR值:", result);
            
            return result;
            
        } catch (error) {
            console.error("計算PR值時出錯:", error);
            console.error("錯誤詳情:", error.message);
            return [0, 0, 0, 0]; // 出錯時返回0，表示無法計算PR值
        }
    };

    // 計算單一PR值
    const calculateSinglePR = (userScore, allScores) => {
        if (allScores.length === 0 || userScore === 0) {
            return 0;
        }
        
        // 計算有多少分數低於用戶分數
        const lowerCount = allScores.filter(score => score < userScore).length;
        
        // 計算PR值 (百分位排名)
        const pr = Math.round((lowerCount / allScores.length) * 100);
        
        console.log(`PR計算 - 用戶分數: ${userScore}, 總數據: ${allScores.length}, 低於用戶的數量: ${lowerCount}, PR值: ${pr}`);
        
        return pr;
    };

    // 初始化分數和獲取統計數據
    useEffect(() => {
        // 確保 isFlipped 在組件加載時被正確初始化
        if (!Array.isArray(isFlipped) || isFlipped.length !== 3) {
            setIsFlipped([false, false, false]);
            console.warn("初始化 isFlipped 為陣列");
        }
        
        // 檢查 scores 是否可用
        if (scores && Object.keys(scores).length > 0) {
            const calculatedScores = [
                scores[0] || 0,
                scores[1] || 0,
                scores[2] || 0
            ];
            setLocalScores(calculatedScores);
        } else {
            // 如果沒有 scores，根據 errorCount 計算分數
            if (errorCount && Array.isArray(errorCount)) {
                const calculatedScores = errorCount.map(err => Math.max(0, 100 - (err * 20)));
                setLocalScores(calculatedScores);
            } else {
                console.error("無法獲取有效的分數或錯誤次數資料");
                return;
            }
        }
        
        // 從 Firebase 獲取實際統計數據（用於平均分數和錯誤次數）
        const fetchRealStatistics = async () => {
            try {
                const scoreStatisticsRef = doc(db, "QuizScore", "ScoreStatistics");
                const docSnap = await getDoc(scoreStatisticsRef);
                
                if (docSnap.exists()) {
                    const firebaseData = docSnap.data();
                    
                    // 將 Firebase 數據轉換為應用需要的格式
                    const calculatedStats = calculateStatistics(firebaseData);
                    setAverageStats(calculatedStats);
                    
                    console.log("Firebase 統計數據:", firebaseData);
                    console.log("計算後的統計數據:", calculatedStats);
                } else {
                    setAverageStats({});
                }
                
                setIsLoadingStats(false);
            } catch (error) {
                console.error("獲取統計數據時出錯:", error);
                setAverageStats({});
                setIsLoadingStats(false);
            }
        };
        
        fetchRealStatistics();
        
        // 輸出各個變量的值，以便調試
        console.log("FinalResults 初始化:", {
            typeName,
            fraudType,
            errorCount,
            scores,
            typeofErrorCount: typeof errorCount,
            isErrorCountArray: Array.isArray(errorCount),
            isFlipped,
            isFlippedType: typeof isFlipped,
            isFlippedArray: Array.isArray(isFlipped)
        });
    }, []);

    // 在localScores設置完成後計算PR值
    useEffect(() => {
        if (localScores.some(score => score > 0) && typeName) {
            console.log("開始執行 calculatePROnly...");
            console.log("localScores:", localScores);
            console.log("typeName:", typeName);
            
            // 使用 timestamp 來防止重複執行
            const currentTime = Date.now();
            const lastExecutedKey = `pr_calculated_${typeName}_time`;
            const lastExecuted = sessionStorage.getItem(lastExecutedKey);
            
            console.log("lastExecuted:", lastExecuted);
            console.log("currentTime:", currentTime);
            
            // 如果距離上次執行超過5秒，或者是首次執行，才執行
            if (!lastExecuted || (currentTime - parseInt(lastExecuted)) > 5000) {
                console.log("執行條件符合，開始計算PR值");
                sessionStorage.setItem(lastExecutedKey, currentTime.toString());
                calculatePROnly();
            } else {
                console.log("距離上次執行時間不足5秒，跳過執行");
                setIsLoadingPR(false); // 確保載入狀態結束
            }
        } else {
            console.log("執行條件不符合:", {
                hasValidScores: localScores.some(score => score > 0),
                typeName: typeName
            });
            setIsLoadingPR(false); // 確保載入狀態結束
        }
    }, [typeName, localScores]); // 重新加入 localScores 依賴，但加上時間檢查防止重複
    
    // 將 Firebase 數據轉換為應用需要的格式（只用於平均分數和錯誤次數）
    const calculateStatistics = (firebaseData) => {
        // 映射英文欄位名稱到中文類型名稱
        const typeNameMap = {
            "romanceFraud": "交友戀愛詐騙",
            "impersonationFraud": "冒名詐騙",
            "shoppingFraud": "購物詐騙",
            "investmentFraud": "投資詐騙"
        };
        
        const stats = {};
        
        // 處理每種詐騙類型
        Object.entries(firebaseData).forEach(([dbType, data]) => {
            const chineseTypeName = typeNameMap[dbType];
            
            if (chineseTypeName && data && data.playCount > 0) {
                // 計算平均分
                const level1Avg = Math.round((data.level1Score / data.playCount) * 100) / 100;
                const level2Avg = Math.round((data.level2Score / data.playCount) * 100) / 100;
                const level3Avg = Math.round((data.level3Score / data.playCount) * 100) / 100;
                const overallAvg = Math.round(((data.level1Score + data.level2Score + data.level3Score) / (data.playCount * 3)) * 100) / 100;
                
                stats[chineseTypeName] = {
                    測驗1: level1Avg,
                    測驗2: level2Avg,
                    測驗3: level3Avg,
                    整體平均: overallAvg,
                    遊玩次數: data.playCount,
                    錯誤1: data.error1Count ? Math.round((data.error1Count / data.playCount) * 100) / 100 : 0,
                    錯誤2: data.error2Count ? Math.round((data.error2Count / data.playCount) * 100) / 100 : 0,
                    錯誤3: data.error3Count ? Math.round((data.error3Count / data.playCount) * 100) / 100 : 0,
                    錯誤平均: data.error1Count && data.error2Count && data.error3Count ? 
                        Math.round(((data.error1Count + data.error2Count + data.error3Count) / (data.playCount * 3)) * 100) / 100 : 0
                };
            } else {
                // 如果沒有遊玩記錄，設置為零
                stats[chineseTypeName] = {
                    測驗1: 0,
                    測驗2: 0,
                    測驗3: 0,
                    整體平均: 0,
                    遊玩次數: 0,
                    錯誤1: 0,
                    錯誤2: 0,
                    錯誤3: 0,
                    錯誤平均: 0
                };
            }
        });
        
        return stats;
    };

    // 修改的 handleFlip 函數，增加安全檢查
    const handleFlip = (index) => {
        // 檢查 isFlipped 是否為陣列
        if (!Array.isArray(isFlipped) || isFlipped.length !== 3) {
            // 如果不是陣列或長度不對，重新初始化為陣列
            const newFlipStates = [false, false, false];
            newFlipStates[index] = true;
            setIsFlipped(newFlipStates);
            console.warn("isFlipped 不是正確的陣列，已重新初始化");
            return;
        }
        
        // 正常處理
        const newFlipStates = [...isFlipped];
        newFlipStates[index] = !newFlipStates[index];
        setIsFlipped(newFlipStates);
    };

    const colorMap = {
        "#ffe4e6": "rose",
        "#e6b976": "amber",
        "#d1fae5": "emerald",
        "#c0a4f5": "purple"
    };

    const getFillColor = (svgColor) => {
        return colorMap[svgColor] || "default"; 
    };
    
    // 安全獲取錯誤次數函數
    const getErrorCount = (index) => {
        if (!errorCount) return 0;
        
        if (Array.isArray(errorCount)) {
            return errorCount[index] || 0;
        }
        
        return errorCount[index] || 0;
    };

    return (
        <div className={styles.finalContainer}>
            <div className={styles.pageTransition}>
                <motion.div 
                    className={styles.nextStage}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{
                        opacity: { duration: 3 }, 
                    }}
                ></motion.div>
            </div>

            <motion.div
                className={styles.finalResultsTitle}
                initial={{ scale: 1, width: "25%", y: 0 }} 
                animate={{ scale: 0.5, width: "45%", height: "15%", y: "-41vh" }}
                transition={{ delay: 1, duration: 1 }} 
                onAnimationComplete={() => {
                    setReturnIsDisable(false);
                    setIsLoading(false);
                }}
            >
                測 驗 結 果
            </motion.div>

            {!returnIsDisable && (
                <div className={styles.returnButton} id="returnButton">
                    <button onClick={() => navigate("/")}>
                        <UndoIcon /> 回首頁
                    </button>
                </div>
            )}

            <motion.div 
                className={styles.finalContent}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
            >
                {!isLoading && (
                    <>
                        <motion.div 
                            className={styles.fraudType}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }} 
                        >
                            測驗類型：
                            <span className={styles.fraudTypeColor}>{typeName}</span>
                        </motion.div>
                        
                        <div className={styles.finalDetails}>
                            {[0, 1, 2].map((index) => (
                                <motion.div 
                                    key={index}
                                    className={`${styles.card} ${Array.isArray(isFlipped) && isFlipped[index] ? styles.rotate : ""}`}
                                    initial={{ opacity: 0 }}  
                                    animate={{ opacity: 1 }}  
                                    transition={{ opacity: { delay: index === 0 ? 0.5 : 0.5 + index * 0.5, duration: 0.5 } }} 
                                >
                                    <div className={styles.front}>
                                        <p className={styles.levelTitle}>測驗 {index + 1}</p>
                                        <CircularScore progress={localScores[index] || 0} />
                                        <div>
                                            <div>
                                                <p className={styles.scores}>{localScores[index] || 0}</p>
                                                <p className={styles.label}>測驗分數</p>
                                            </div>
                                            <div>
                                                <p className={styles.incorrectClicks}>{getErrorCount(index)}</p>
                                                <p className={styles.label}>錯誤次數</p>
                                            </div>
                                        </div>
                                        <div>
                                            Tips：{allScripts && fraudType && allScripts[fraudType] && allScripts[fraudType][index] ? allScripts[fraudType][index].tips : "請保持謹慎，避免上當受騙"}
                                        </div>
                                        <button 
                                            className={`${styles.reviewButton} ${styles[getFillColor(svgColor)]}`}
                                            onClick={() => handleFlip(index)}
                                        >
                                            對話紀錄回顧
                                        </button>
                                    </div>
                                    <div className={styles.back}>
                                        <div className={styles.conversationReview}>
                                            {allScripts && fraudType && allScripts[fraudType] && allScripts[fraudType][index] && allScripts[fraudType][index].script ? 
                                                allScripts[fraudType][index].script.map((message, i) => (
                                                    <div key={i} className={message.character === 'character1' ? styles.recordsLeft : styles.recordsRight}>
                                                        <div
                                                            className={`${
                                                                message.character === 'character1' ? styles.recordsLeftText : styles.recordsRightText
                                                            } 
                                                            ${
                                                                (correctAnswer && correctAnswer[index] === message.text) && styles.correctAnswer 
                                                            }`}
                                                        >
                                                            {message.text}
                                                        </div>
                                                    </div>
                                                ))
                                                : 
                                                <div className={styles.noScripts}>無對話記錄</div>
                                            }
                                        </div>
                                        <button 
                                            className={styles.reviewButton}
                                            onClick={() => handleFlip(index)}
                                        >
                                            返回
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        
                        {/* 顯示統計數據 */}
                        {typeName && averageStats && averageStats[typeName] && !isLoadingStats && !isLoadingPR ? (
                            <motion.div 
                                className={styles.averageStatsContainer}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 1 }}
                            >
                                <h3 className={styles.averageStatsTitle}>{typeName} - 平均分數統計</h3>
                                <div className={styles.statsTable}>
                                    <div className={styles.statsRow}>
                                        <div className={styles.statsHeader}>測驗關卡</div>
                                        <div className={styles.statsHeader}>平均錯誤次數</div>
                                        <div className={styles.statsHeader}>歷史平均分</div>
                                        <div className={styles.statsHeader}>PR值</div>
                                    </div>
                                    <div className={styles.statsRow}>
                                        <div className={styles.statsCell}>測驗 1</div>
                                        <div className={styles.statsCell}>{averageStats[typeName].錯誤1 || 0}</div>
                                        <div className={styles.statsCell}>{averageStats[typeName].測驗1}</div>
                                        <div className={styles.statsCell}>
                                            <PRValueDisplay value={prValues[0] || 0} />
                                        </div>
                                    </div>
                                    <div className={styles.statsRow}>
                                        <div className={styles.statsCell}>測驗 2</div>
                                        <div className={styles.statsCell}>{averageStats[typeName].錯誤2 || 0}</div>
                                        <div className={styles.statsCell}>{averageStats[typeName].測驗2}</div>
                                        <div className={styles.statsCell}>
                                            <PRValueDisplay value={prValues[1] || 0} />
                                        </div>
                                    </div>
                                    <div className={styles.statsRow}>
                                        <div className={styles.statsCell}>測驗 3</div>
                                        <div className={styles.statsCell}>{averageStats[typeName].錯誤3 || 0}</div>
                                        <div className={styles.statsCell}>{averageStats[typeName].測驗3}</div>
                                        <div className={styles.statsCell}>
                                            <PRValueDisplay value={prValues[2] || 0} />
                                        </div>
                                    </div>
                                    <div className={styles.statsRow}>
                                        <div className={styles.statsCell}>整體平均</div>
                                        <div className={styles.statsCell}>{averageStats[typeName].錯誤平均 || 0}</div>
                                        <div className={styles.statsCell}>{averageStats[typeName].整體平均}</div>
                                        <div className={styles.statsCell}>
                                            <PRValueDisplay value={prValues[3] || 0} />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* PR值說明 */}
                                <PerformanceExplanation />
                            </motion.div>
                        ) : isLoadingStats || isLoadingPR ? (
                           <div className={styles.loadingStats} style={{fontSize: '20px'}}>
                                <p>正在加載統計數據和計算PR值...</p>
                                <p>載入狀態：統計數據 {isLoadingStats ? '載入中' : '完成'}，PR值 {isLoadingPR ? '計算中' : '完成'}</p>
                                <p>數據狀態：typeName={typeName}, averageStats={averageStats ? '已載入' : '未載入'}</p>
                            </div>
                        ) : (
                            <div className={styles.loadingStats}>
                                <p>無法載入統計數據</p>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default FinalResults;