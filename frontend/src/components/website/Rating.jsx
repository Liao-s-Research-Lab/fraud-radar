import React from 'react';
import './Rating.css';
import chroma from 'chroma-js'; 
import { Rate, Row } from 'antd';
import { Card, Button, Popover, OverlayTrigger } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faArrowPointer, faCheck, faPlayCircle } from '@fortawesome/free-solid-svg-icons';
import { db, doc, setDoc } from '../../firebase'; // 確保導入
import { collection, getDocs } from 'firebase/firestore';
import { ThLargeIcon } from '@patternfly/react-icons';

const getBackground = (progress) => {
  const degrees = progress * 3.6;
  return `
    conic-gradient(
      green 0deg, 
      rgb(154, 205, 50) ${Math.min(degrees, 90)}deg, 
      yellow ${Math.min(degrees, 180)}deg, 
      orange ${Math.min(degrees, 270)}deg, 
      rgb(255, 68, 51)${Math.min(degrees, 360)}deg,
      gainsboro ${Math.min(degrees, 360)}deg
    )
  `;
};

const getColorAtProgress = (progress) => {
  const degrees = progress * 3.6;

  const colorStops = [
    { color: 'green', stop: 0 },
    { color: 'rgb(154, 205, 50)', stop: 90 },
    { color: 'yellow', stop: 180 },
    { color: 'orange', stop: 270 },
    { color: 'rgb(255, 68, 51)', stop: 360 },
  ];

  let color1, color2;
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (degrees >= colorStops[i].stop && degrees <= colorStops[i + 1].stop) {
      color1 = colorStops[i];
      color2 = colorStops[i + 1];
      break;
    }
  }

  if (color1 && color2) {
    const ratio = (degrees - color1.stop) / (color2.stop - color1.stop);
    return chroma.mix(color1.color, color2.color, ratio).hex();
  } else {
    return 'gray'; 
  }
};

function Rating({ pythonResult, keywords, types , FraudRate , ID ,prevents ,reminds, data,file ,Emotion}) {
  const [progress, setProgress] = React.useState(0);
  const [riskLevel, setRiskLevel] = React.useState('中風險'); // 默認風險等級
  

  React.useEffect(() => {
  // 處理進度條增加的邏輯
  let progressStartValue = 0;
  const progressEndValue = FraudRate || 1;
  
  // 在組件卸載時清理定時器
  const interval = setInterval(() => {
    progressStartValue++;
    setProgress(progressStartValue);
    
    let newRiskLevel;
    if (progressEndValue <= 40) {
      newRiskLevel = '低風險';
    } else if (progressEndValue <= 60) {
      newRiskLevel = '中風險';
    } else {
      newRiskLevel = '高風險';
    }
    setRiskLevel(newRiskLevel);

    if (progressStartValue >= progressEndValue) {
      clearInterval(interval);
      setProgress(progressEndValue); // 確保進度條停止在目標值
    }
  }, 15);

  // 清理定時器
  return () => clearInterval(interval);
}, [FraudRate]);

 

  const sign = ['非常不滿意', '不滿意', '普通', '滿意', '非常滿意'];
  const [value, setValue] = React.useState(3);

  React.useEffect(() => {
    if (ID) {
      const updateStarsInFirestore = async () => {
        try {
          // 更新指定 ID 的文檔，並將 stars 值設置為當前的 value
          await setDoc(doc(db, "Outcome", ID), { Stars: value }, { merge: true });
          console.log(`Document with ID: ${ID} updated with stars: ${value}`);
        } catch (error) {
          console.error("Error updating document: ", error);
        }
      };

      updateStarsInFirestore();
    }
  }, [value, ID]);  // 監聽 value 和 ID 的變化


  const popover = (
    <Popover id="popover-basic">
      <Popover.Header as="h3">如何防範</Popover.Header>
      <Popover.Body>
        {prevents}
      </Popover.Body>
    </Popover>
  );

  const getRiskLevel = () => {
    if (progress <= 40) {
      return (
        <ul className="rating-ul">
          <li>等級：<FontAwesomeIcon icon={faCheck} style={{color: "#0ec48d"}} /> 低風險</li>
          <li>提醒：{reminds}</li>
        </ul>
      )
    } else if (progress <= 60) {
      return (
        <ul className="rating-ul">
          <li>等級：<FontAwesomeIcon icon={faTriangleExclamation} style={{color: "#FFD43B"}} /> 中風險</li>
          <li>提醒：{reminds}</li>
        </ul>
      )
    } else {
      return (
        <ul className="rating-ul">
          <li>等級：<FontAwesomeIcon icon={faTriangleExclamation} style={{color: "#ff0000"}} /> 高風險</li>
          <li>提醒：{reminds}</li>
        </ul>
      )
    }
  };

  //類型影片
const [videoUrlMap, setVideoUrlMap] = React.useState({});

React.useEffect(() => {
  const fetchVideosFromStatistics = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'Statistics'));
      const newVideoMap = {};

      const typeList = types?.split(',').map(t => t.trim()) || [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.Type && data.Video && typeList.includes(data.Type)) {
          newVideoMap[data.Type] = data.Video;
        }
      });

      setVideoUrlMap(newVideoMap);
    } catch (error) {
      console.error("Error fetching Statistics data:", error);
    }
  };

  if (types) {
    fetchVideosFromStatistics();
  }
}, [types]);



const handlePlayClick = (type) => {
  const url = videoUrlMap[type];
  if (url) {
    window.open(url, '_blank');
  } else {
    alert(`找不到「${type}」對應的影片資源`);
  }
};


  return (
    <div className="rating-container">
      {progress === 0 ? (
        <div id="loading-container">
          <label className="loading-title">檢測中 ...</label>
          <span className="loading-circle sp1">
            <span className="loading-circle sp2">
              <span className="loading-circle sp3"></span>
            </span>
          </span>
        </div>
      ) : (
        <>
          <div className="container-1">
            <div className="circular-progress" style={{ background: getBackground(progress) }}>
              <span className="progress-value" style={{ color: getColorAtProgress(progress) }}>
                {`${progress}%`}
              </span>
              <span className="text" style={{ color: getColorAtProgress(progress) }}>
                {pythonResult} {/* 顯示 pythonResult */}
              </span>
            </div>
            <Row align="middle" justify="center">
              <div style={{ fontSize: '20px' }}>準確度回報：</div>
              <Rate tooltips={sign} onChange={setValue} value={value} />
            </Row>
          </div>
          
          <div className="container-2">
            <Card className="card-rating">
              <Card.Body>
                <Card.Title><b>風險等級：</b></Card.Title>
                <div>
                    {getRiskLevel()}
                </div>
              </Card.Body>
            </Card>

            {(riskLevel === "高風險" || riskLevel === "中風險" || riskLevel === "低風險") && (
              <>
                <Card className="card-rating">
                  <Card.Body>
                    <Card.Title><b>詐騙分析：</b></Card.Title>
                      <div>
                      <ul className="rating-ul">
                          <li>情緒：{Emotion || '無'}</li>
                        </ul>

                        <ul className="rating-ul">
                          <li>
                            類型：
                            {types
                              ? types.split(',').map((type, index) => (
                                  <span key={index} style={{ marginRight: '8px' }}>
                                    {type.trim()}
                                    {videoUrlMap[type.trim()] && (
                                      <a onClick={() => handlePlayClick(type.trim())}>
                                        <FontAwesomeIcon
                                          icon={faPlayCircle}
                                          className="play-icon"
                                          size="1x"
                                        />
                                      </a>
                                    )}
                                  </span>
                                ))
                              : '無'}
                          </li>
                        </ul>


                        
                        <ul className="rating-ul">
                          <li>關鍵字詞：{keywords && keywords.length > 0 ? keywords.join(', ') : '無'}</li>
                        </ul>
                      </div>
                  </Card.Body>
                </Card>

                <OverlayTrigger trigger="click" placement="right" overlay={popover}>
                  <Button variant="success" className="prevent"><b>如何防範 <FontAwesomeIcon icon={faArrowPointer} /></b></Button>
                </OverlayTrigger>
              </>
            )}
          </div>

          {data && data.startsWith('http') ? (
            // 預覽網頁
            <div className='container-3'>
              <div className='container-3-title-url'>
                <div className='container-3-title'><b>預覽網頁：</b></div>
                <a href={data} target='_blank' rel='noopener noreferrer'>{data}</a>
              </div>
              <iframe src={data} style={{ width: "100%", height: "400px" }}></iframe>
            </div>
          ) : Array.isArray(file) && file.length > 0 && file[0].type.startsWith('image/') ? (
            // 預覽多張圖片
            <div className='container-3'>
              <div className='container-3-image-title'><b>預覽圖片：</b></div>
              {file.map((f, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(f)}
                  alt={`預覽圖片 ${index + 1}`}
                  style={{ width: "100%", maxWidth: "100%", height: "auto", maxHeight: "400px", marginBottom: "1rem", objectFit:"contain" }}
                />
              ))}
            </div>
          ) : null}

        
        </>
      )}

      {/* ***當檢測的是圖片***
      <div className='container-3'>
        <div className='container-3-image-title'><b>預覽圖片：</b></div>
        <img src="https://mir-s3-cdn-cf.behance.net/project_modules/max_3840/2d0d73149404331.62e757877ca8b.jpg" width="100%"></img>
      </div> }

      {/* ***當檢測的是網址***
      <div className='container-3'>
        <div className='container-3-title-url'>
          <div className='container-3-title'><b>預覽網頁：</b></div>
          <a href='https://zh.wikipedia.org/zh-tw/LE_SSERAFIM' target='blank'>https://zh.wikipedia.org/zh-tw/LE_SSERAFIM</a>
        </div>
        <iframe src='https://zh.wikipedia.org/?title=%E9%9B%85%E8%99%8E' style={{ width: "100%", height: "400px" }}></iframe>
      </div> */}

    </div>
  );
}

export default Rating;