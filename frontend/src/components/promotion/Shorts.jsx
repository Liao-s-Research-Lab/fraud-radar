import { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player/youtube';
import { InstagramEmbed } from 'react-social-media-embed';
import styles from './Shorts.module.css';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

function Shorts() {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    const playerRefs = useRef([]);
    const prevSelectedVideo = useRef(null);

    useEffect(() => {
      const handleResize = () => setViewportHeight(window.innerHeight);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

  useEffect(() => {
    if (prevSelectedVideo.current !== null && prevSelectedVideo.current !== selectedVideo) {
      const prevPlayer = playerRefs.current[prevSelectedVideo.current];
      if (prevPlayer) {
        prevPlayer.seekTo(0, 'seconds');
      }
    }
    prevSelectedVideo.current = selectedVideo;
  }, [selectedVideo]);

  const handleVideoClick = (index) => {
    setSelectedVideo(index);
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    setSelectedVideo(null);
  };



  // const handleWheelScroll = (e) => {
  //   e.preventDefault(); 
  //   const now = Date.now();
  //   if (now - lastScrollTimeRef.current < SCROLL_COOLDOWN) return;

  //   if (e.deltaY > 50 && selectedVideo < videos.length - 1) {
  //     setSelectedVideo((prev) => prev + 1);
  //     lastScrollTimeRef.current = now;
  //   } else if (e.deltaY < -50 && selectedVideo > 0) {
  //     setSelectedVideo((prev) => prev - 1);
  //     lastScrollTimeRef.current = now;
  //   }
  // };

  function convertTiktokUrlToIframeSrc(url) {
    const match = url.match(/video\/(\d+)/);
    if (match && match[1]) {
      const videoId = match[1];
      return `https://www.tiktok.com/player/v1/${videoId}`;
    } else {
      return null; // 無法匹配時回傳 null
    }
  }

  useEffect(() => {
      if (isFullscreen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      return () => {
        document.body.style.overflow = '';
      };
  }, [isFullscreen]);

  const [videos, setVideos] = useState([]);

  useEffect(() => {
    async function fetchVideos() {
      const colRef = collection(db, "ShortVideo");
      const q = query(colRef, orderBy("Timestamp", "desc")); // 最新時間在前面
      const querySnapshot = await getDocs(q);
      const videoArray = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.VideoURL) {
          videoArray.push({ src: data.VideoURL, timestamp: data.Timestamp });
        }
      });
      setVideos(videoArray);
    }
    fetchVideos();
  }, []);
console.log("videos",videos)
const getVideoType = (url) => {
  if (url.includes("youtube.com")) {
    return "youtube";
  } else if (url.includes("tiktok.com")) {
    return "tiktok";
  } else if (url.includes("instagram.com")) {
    return "instagram";
  } else {
    return "unknown";
  }
};


  const SCROLL_COOLDOWN = 500; 
  const lastScrollTimeRef = useRef(0);

useEffect(() => {
  if(isFullscreen) {
  const handleGlobalWheel = (e) => {
    e.preventDefault(); 

    const now = Date.now();
    if (now - lastScrollTimeRef.current < SCROLL_COOLDOWN) return;

    if (e.deltaY > 50 && selectedVideo < videos.length - 1) {
      setSelectedVideo((prev) => prev + 1);
      lastScrollTimeRef.current = now;
    } else if (e.deltaY < -50 && selectedVideo > 0) {
      setSelectedVideo((prev) => prev - 1);
      lastScrollTimeRef.current = now;
    }
  };
console.log("scrolling")
  window.addEventListener("wheel", handleGlobalWheel, { passive: false });

  return () => {
    window.removeEventListener("wheel", handleGlobalWheel);
  };
  }
}, [isFullscreen, selectedVideo]);

  return (
    <>
      <div className={styles.container}>
        <section className={styles.shortsSecion}>
          <div className={styles.shortsFlex}>
            {videos.map((video, index) => (
              <div
                key={index}
                className={styles.shortsVideo}
                onClick={() => handleVideoClick(index)}
              >
                <div
                  className={styles.shortsVideoThumbnail}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {getVideoType(video.src) === "youtube" && (
                    <ReactPlayer
                      url={video.src}
                      playing={hoveredIndex === index}
                      muted={true}
                      width="100%"
                      height="100%"
                      controls={false}
                      loop={true}
                    />
                  )}

                  {getVideoType(video.src) === "instagram" && (
                    <div className={styles.instagramPlayer}>
                      <InstagramEmbed url={video.src} width="100%" height={500}/>
                    </div>

                  )}

                  {getVideoType(video.src) === "tiktok" && (
                    <div className={styles.tiktokPlayer}>
                      <iframe
                        src={convertTiktokUrlToIframeSrc(video.src)}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allow="fullscreen"
                        title="TikTok Player"
                      ></iframe>
                    </div>
                  )}

                  {/* <div className={styles.shortsVideoDuration}>{video.duration}</div> */}
                </div>

                {/* <div className={styles.shortsVideoContent}>
                  <h3 className={styles.shortsVideoTitle}>{video.title}</h3>
                  <div className={styles.shortsVideoMeta}>
                    <span className={styles.shortsVideoViews}>{video.views}</span>
                  </div>
                </div> */}
              </div>
            ))}
          </div>
          <div>
      
        </div>
        </section>
      </div>

      {isFullscreen && (
        <div className={styles.shortsFullscreenMode}>
          <button className={styles.shortsFullscreenClose} onClick={closeFullscreen}>
            ✕
          </button>
          <div className={styles.shortsFullscreenContainer} >
            <div
                className={styles.shortsFullscreenVideo}
                style={{
                  transform: `translateY(-${selectedVideo * (viewportHeight - 40)}px)`
                }}
            >
                {videos.map((video, index) => (
                    <div
                        key={index}
                        className={styles.shortsFullscreenVideoContent}

                    >
                        <div
                            className={styles.shortsFullscreenThumbnail}  
                        >
                          {getVideoType(video.src) === "youtube" && (
                            <ReactPlayer
                                ref={(el) => (playerRefs.current[index] = el)}
                                url={video.src}
                                playing={isFullscreen && selectedVideo === index}
                                width="100%"
                                height="100%"
                                controls={true}
                                loop={true}
                            />
                          )}
                          
                            {getVideoType(video.src) === "instagram" && (
                              <div className={styles.instagramPlayerFullscreen}>
                                <InstagramEmbed url={video.src} width="100%" height="100%" />
                              </div>

                            )}

                            {getVideoType(video.src) === "tiktok" && (
                             <div className={styles.tiktokPlayer}>
                              <iframe
                                src={convertTiktokUrlToIframeSrc(video.src)}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                allow="fullscreen"
                                title="TikTok Player"
                              ></iframe>
                            </div>
                            )}
                            
                            {/* <div className={styles.shortsFullscreenOverlay}>
                                <div className={styles.shortsFullscreenAuthor}>
                                    <div className={styles.authorAvatar}>魚</div>
                                    <span>小魚</span>
                                </div>
                                <h3 className={styles.shortsFullscreenTitle}>{video.title}</h3>
                            </div> */}
                        </div>
                    </div>
                    
                ))}
                  
            </div>
          </div>
          <div className={styles.shortsFullscreenProgress}>
            
          </div>
          <div className={styles.swipeHint}>上下滑動切換影片</div>
        </div>
      )}
    </>
  );
}

export default Shorts;