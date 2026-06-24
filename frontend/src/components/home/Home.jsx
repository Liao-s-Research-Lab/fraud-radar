import styles from './Home.module.css';
import { useState, useEffect, useRef } from 'react';
import { useLocation } from "react-router-dom";
import Navbar from '../navbar/Navbar';
import NewsList from './NewsList';
import { Link } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion'; 
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

function Home() {
    const [scrollY, setScrollY] = useState(0);
    const [animate, setAnimate] = useState(false); 
    const imagesRef = useRef(null);
      const carouselRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const commonFraudRef = useRef(null);
    const location = useLocation();

      const [isMobile, setIsMobile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalItems = 6;





    if (!sessionStorage.getItem("hasRefreshed")) {
        sessionStorage.clear();  
        sessionStorage.setItem("hasRefreshed", "true");  
        window.location.reload();  
    }

    // 滾動到 statisticsBox
    const scrollToCommonFraudBox = () => {
        if (commonFraudRef.current) {
            commonFraudRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    // 如果網址中帶有 #statisticsBox，自動滾動
    useEffect(() => {
        if (location.hash === "#commonFraudBox") {
            scrollToCommonFraudBox();
        }
    }, [location]);
    

    useEffect(() => {
        const handleScroll = () => {
            if (imagesRef.current) {
                const rect = imagesRef.current.getBoundingClientRect();
                if (Math.floor(rect.top) < Math.ceil(window.innerHeight * 0.05) ) {
                    setAnimate(true); 
                } else {
                    setAnimate(false);
                }
            }

            if (animate) {
                setScrollY(window.scrollY);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [animate]); 

    //---
    useEffect(() => {
        const exampleCards = document.querySelectorAll(`.${styles.exampleCard}`);

        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(styles.scaleUp);
                } else {
                    entry.target.classList.remove(styles.scaleUp);
                }
            });
        };

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        exampleCards.forEach(card => {
            observer.observe(card);
        });

        // 清理 observer
        return () => {
            exampleCards.forEach(card => {
                observer.unobserve(card);
            });
        };
    }, []);

    //---
    const exampleData = [
        {
            id: "01",
            title: "投資詐騙",
            keywords: ["外匯套利", "穩賺不賠", "專人帶牌"],
            description:
                "詐騙集團透過網路社羣或社交媒體接觸受害人，並藉由股票、虛擬通貨、外匯等名義，誘使受害人加入LINE投資羣組。初期讓受害人小額獲利，而後再以投資越多獲利越高的說法引誘更多投資。最後以洗碼量不足或IP異常為由拒絕出金，直到受害人發現帳號凍結或網站消失，才驚覺被詐騙。",
            image: "/bg1.jpg",
            btnColor: "#B6B4CC",
            viewImage: "/scampic1.jpg"
        },
        {
            id: "02",
            title: "解除分期付款",
            keywords: ["重複扣款", "誤設分期", "操作ATM"],
            description:
                "詐騙集團透過電話或簡訊聯繫受害人，聲稱因為系統錯誤或其他原因，將不小心為受害人設置了分期付款或重複扣款。他們以此為藉口，要求受害人前往提款機（ATM）、網路銀行或手機APP進行操作，甚至要求購買一些虛擬商品或點數，藉此“解除”所謂的錯誤設定，並趁機詐取受害人資金。",
            image: "/bg2.jpg",
            btnColor: "#F5D012",
            viewImage: "/scampic2.jpg"
        },
        {
            id: "03",
            title: "網拍詐騙",
            keywords: ["單一頁面", "限時特賣", "過低於市價"],
            description:
                "網站通常僅有一頁且只賣單一商品，沒有其他頁面的超連結。此外，他們會濫用聳動字眼，如限時特賣和倒數計時等手法來誘人上鉤，並以明顯低於市價的優惠來吸引眼球。而這些網站往往沒有提供公司地址或客服聯絡電話，僅留電子郵件聯絡方式，讓消費者在遇到問題時無法得到及時幫助。",
            image: "/bg3.jpg",
            btnColor: "#FFBFD7",
            viewImage: "/scampic3.png"
        },
        {
            id: "04",
            title: "愛情交友詐騙",
            keywords: ["急需用錢", "婉拒見面", "莫名消失"],
            description:
                "詐騙集團透過社交媒體或交友軟體接觸受害人，與受害人建立感情連結。在取得信任後，詐騙者會編造各種緊急的資金需求，例如醫療費用、房租或是聲稱自己在海外工作遭遇困境。藉此利用受害人的同情心，進一步設法騙取金錢。這些詐騙者常常精心設計故事，以讓受害人不疑有他。",
            image: "/bg4.jpg",
            btnColor: "#BAD7FC",
            viewImage: "/scampic4.jpg"
        },
        {
            id: "05",
            title: "假冒詐騙",
            keywords: ["緊急通知", "中獎通知", "帳號資訊"],
            description:
                "詐騙集團會假冒政府機構、金融機構或其他可信的單位，通過電話聯絡受害者，他們可能會聲稱受害者涉及非法活動，或需要儘快提供個資以處理緊急情況，讓受害者誤以為自己處於危險或法律問題中。另一種手法是聲稱受害者獲得了獎金或補助，但需要支付一筆所謂的「手續費」或「稅款」。",
            image: "/bg5.jpg",
            btnColor: "#E6D9C8",
            viewImage: "/scampic5.jpg"
        }
    ];

    const slogans = [
        "簡訊來電多詐騙，防詐意識要上線！",
        "不明連結別亂點，個資錢財不淪陷！",
      ];
    const duration = 10;

    //圖片動畫
    const img1 = useAnimation();
    const img2 = useAnimation();
    const img3 = useAnimation();
    const img4 = useAnimation();
  
    useEffect(() => {
        const loop = async () => {
          await new Promise((r) => setTimeout(r, 3000));
      
          while (true) {
            await img1.start({ scale: 1.05 });
            await new Promise((r) => setTimeout(r, 1000));
            await img1.start({ scale: 1 });
      
            await img2.start({ scale: 1.05 });
            await new Promise((r) => setTimeout(r, 1000));
            await img2.start({ scale: 1 });
      
            await img3.start({ scale: 1.05 });
            await new Promise((r) => setTimeout(r, 1000));
            await img3.start({ scale: 1 });
      
            await img4.start({ scale: 1.05 });
            await new Promise((r) => setTimeout(r, 1000));
            await img4.start({ scale: 1 });
          }
        };
      
        loop();
      }, []);
      

    //輪播
    const [deg, setDeg] = useState(0);

    useEffect(() => {
         if (isMobile) return;
        let animationFrameId;

        const rotate = () => {
        setDeg(prev => prev - 0.075); // 每次轉一點點
        animationFrameId = requestAnimationFrame(rotate);
        };

        rotate(); // 啟動動畫

        return () => cancelAnimationFrame(animationFrameId); // 清除動畫
    }, []);

      // 響應式判斷手機版
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 左右切換邏輯（手機時）
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalItems - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === totalItems - 1 ? 0 : prev + 1));
  };
  
useEffect(() => {
  if (!carouselRef.current) return;

  if (isMobile) {
    const gap = 20; 
    const containerWidth = carouselRef.current.offsetWidth;
    const itemWidthWithGap = containerWidth + gap;
    const moveX = currentIndex * itemWidthWithGap;
    
    carouselRef.current.style.transform = `translateX(-${moveX}px)`;
  } else {
    carouselRef.current.style.transform = `rotateY(${deg}deg)`;
  }
}, [deg, currentIndex, isMobile]);

    return (
        <>
            <div className={styles.homeContainer}>
                <Navbar scrollToCommonFraudBox={scrollToCommonFraudBox}></Navbar>
                <div className={styles.displaySlogan} style={{ "--duration": `${duration}s` }}>
                        {slogans.map((text, index) => (
                            <p key={index}><b>{text}</b></p>
                        ))}
                    </div>
                
                <motion.div 
                className={styles.testbg1}
                initial={{ left: '-20vw' }}
                animate={{ left: '13vw' }}
                transition={{ duration: 1, delay: 1 }} 
                >   
                     <motion.img
                        src="/homepic1.jpg"
                        style={{ scale: 1 }}
                        animate={img1}
                        transition={{ duration: 1 }}
                    />
                </motion.div>
                <motion.div 
                    className={styles.testbg2}
                    initial={{ left: '-27.5vw' }}
                    animate={{ left: '27.5vw' }}
                    transition={{ duration: 1, delay: 1}} 
                >  
                    <motion.img
                        src="/homepic2.jpg"
                        initial={{ scale: 1 }}
                        animate={img2}
                        transition={{ duration: 1 }}
                    />
                </motion.div>
                <motion.div 
                    className={styles.testbg3}
                    initial={{ right: '-20vw', rotate:'0' }}
                    animate={{ right: '13vw', rotate:'360' }}
                    transition={{ duration: 1, delay: 1}} 
                >   
                    <motion.img
                        src="/homepic3.jpg"
                        initial={{ scale: 1 }}
                        animate={img4}
                        transition={{ duration: 1 }}
                    />
                </motion.div>
                <motion.div 
                    className={styles.testbg4}
                    initial={{ right: '-20vw' }}
                    animate={{ right: '27.5vw' }}
                    transition={{ duration: 1, delay: 1}} 
                >  
                    <motion.img
                        src="/homepic4.jpg"
                        style={{ filter: 'scale(1)' }}
                        animate={img3}
                        transition={{ duration: 1 }}
                    />
                </motion.div>

                <div className={styles.homeBox}>
                    <div className={styles.homeMain}>
                        <div className={styles.homeTitle}>
                            騙局雷達 
                        </div>
                        <div className={styles.homeSubtitle}>
                            Fraud Radar
                        </div>
                    </div>
                    {/* <div className={styles.radar}><img src='/radar.gif'></img></div> */}
                    <div className={styles.buttonBox}>
                        <Link to='./website'>
                            <button className={styles.buttonBtn}>
                                <span> 立即檢測 </span>
                            </button>
                        </Link>
                        <Link to='./quiz'>
                            <button className={styles.buttonBtnQuiz}>
                                <div className={styles.buttonQuiz}>
                                    <span> 詐騙測驗 </span>
                                </div>
                            </button>
                        </Link>
                    </div>
                    
                </div>
            </div> 


            <div className={styles.imageBox}>
      <div ref={imagesRef} className={styles.images}>
        <div>
          <div className={styles.container}>
            {isMobile && (
              <>
                <button onClick={handlePrev} className={`${styles.arrowButton} ${styles.arrowLeft}`}><ArrowBackIosNewIcon /></button>
                <button onClick={handleNext} className={`${styles.arrowButton} ${styles.arrowRight}`}><ArrowForwardIosIcon /></button>
              </>
            )}
            <div
              className={styles.carousel}
              ref={carouselRef}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={`${styles.item} ${styles[`carousel${i}`]}`}>
                  <img src={`/carousel${i}.png`} alt={`carousel${i}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
             
            <div className={styles.commonFraudBox} ref={commonFraudRef}>
                <div className={styles.commonFraudBoxMain}>
                    <div className={styles.commonFraudTitle}>
                        詐騙常見手法
                    </div>
                    <div className={styles.commonFraudSubtitle}>
                        我們將介紹常見的詐騙手法，幫助您提高警覺，避免成為詐騙的受害者。
                    </div>
                </div>

                {exampleData.map((item, index) => (
                    <div key={index} className={styles.exampleItem}>
                        <div className={styles.exampleCard}>
                            <div className={styles.leftContent}>
                                <div className={styles.exampleTag}>
                                    <div>常見手法</div>
                                    <div>|</div>
                                    <div>{item.id}</div>
                                </div>
                                <div className={styles.exampleTopic}>
                                    <div className={styles.exampleTitle}>{item.title}</div>
                                    <div className={styles.keywords}>
                                        {item.keywords.map((word, i) => (
                                            <p key={i}>{word}</p>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.description}>{item.description}</div>
                                <div className={styles.viewImageBox}>
                                    <button className={styles.viewImage} style={{ backgroundColor: item.btnColor }} onClick={() => setSelectedImage(item.viewImage)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye">
                                                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        <span>查看圖片</span>
                                    </button>
                                </div>
                            </div>
                            <div className={styles.rightContent}>
                                <img src={item.image} alt={`bg${index + 1}`} />
                            </div>
                        </div>
                    </div>
                ))}
                {selectedImage && (
                    <div className={styles.overlay} onClick={() => setSelectedImage(null)}>
                        <div className={styles.modal}>
                        <img src={selectedImage} alt="Selected Preview" />
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default Home