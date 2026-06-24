import { useEffect, useState } from 'react';
import styles from './NewsList.module.css';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { motion } from 'framer-motion';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

function NewsList() {
  const [articles, setArticles] = useState([]);  // 用來存放從後端抓取到的資料
  const [loading, setLoading] = useState(true);  // 設置加載狀態
  const [currentIndex, setCurrentIndex] = useState(0);
  const articlesPerPage = 3; // 一次顯示 3 篇新聞
  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(articles.length / articlesPerPage);

  // 計算當前頁顯示的文章索引區間
  const startIndex = (currentPage - 1) * articlesPerPage;
  const currentArticles = articles.slice(startIndex, startIndex + articlesPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return; // 超出範圍不動作
    setCurrentPage(page);
  };


  // const handleNext = () => {
  //   setCurrentIndex((prevIndex) => (prevIndex + articlesPerPage) % articles.length);
  // };

  // const handlePrev = () => {
  //   setCurrentIndex((prevIndex) =>
  //     prevIndex - articlesPerPage < 0 ? articles.length - articlesPerPage : prevIndex - articlesPerPage
  //   );
  // };

  useEffect(() => {
    // 定義抓取資料的函數
    async function fetchArticles() {
      try {
        const response = await fetch('/api/news');
        const data = await response.json();
        setArticles(data);  // 將抓取到的資料存放到 state
        setLoading(false);  // 資料加載完成，更新 loading 狀態
      } catch (error) {
        console.error('Error fetching articles:', error);
        setLoading(false);
      }
    }

    fetchArticles();  // 請求資料
  }, []);  // useEffect 中的空依賴陣列表示這個效果只在元件第一次渲染時執行

  if (loading) {
    return <div>載入中...</div>;
  }

  function convertRelativeTimeToDateOrToday(text) {
  const now = new Date();

  // 先找「幾分鐘前」、「幾小時前」、「幾天前」
  const minuteMatch = text.match(/(\d+)\s*分鐘前/);
  if (minuteMatch) {
    const minutesAgo = parseInt(minuteMatch[1], 10);
    const targetTime = new Date(now.getTime() - minutesAgo * 60 * 1000);
    return formatOutput(targetTime, now, text, minuteMatch[0]);
  }

  const hourMatch = text.match(/(\d+)\s*小時前/);
  if (hourMatch) {
    const hoursAgo = parseInt(hourMatch[1], 10);
    const targetTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    return formatOutput(targetTime, now, text, hourMatch[0]);
  }

  const dayMatch = text.match(/(\d+)\s*天前/);
  if (dayMatch) {
    const daysAgo = parseInt(dayMatch[1], 10);
    const targetTime = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    // 天以上直接顯示日期
    return text.replace(dayMatch[0], formatDate(targetTime));
  }

  // 沒匹配到就回原字串
  return text;

  function formatOutput(targetTime, now, originalText, matchedText) {
    // 直接回傳日期，不再顯示「今天」
    return originalText.replace(matchedText, formatDate(targetTime));
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

function formatSourceTime(text) {
  // 用正則找到「•」之後的時間文字
  const timePartMatch = text.match(/•\s*(.+)$/);
  if (!timePartMatch) {
    // 找不到就回原字串
    return text;
  }

  const timePart = timePartMatch[1]; // 取得「43 分鐘前」或「3 天前」那段

  // 把時間文字轉成日期字串
  const dateStr = convertRelativeTimeToDateOrToday(timePart);

  // 回傳 「• 日期」格式
  return `• ${dateStr}`;
}


  return (
  <>
    {articles.length === 0 ? (
      <p style={{ color: "white", textAlign: "center" }}>載入失敗 QAQ</p>
    ) : (
      <div className={styles.newsCarousel}>

        {/* 文章區塊，用 currentPage 當 key，讓動畫可以套用 */}
        <motion.div
          className={styles.articlesContainer}
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          
            {currentArticles.map((article, index) => (
              <motion.div
                key={index}
                className={styles.article}
                initial="hidden"
                whileInView="visible"
                variants={fadeInVariants}
                transition={{ duration: 0.5 }}
              >
                <Card className={styles.customCard}>
                  <Card.Img variant="top" src={article.img} className={styles.customCardImg} alt="載入中..." />
                  <Card.Body style={{ display: "flex", flexDirection: "column" }}>
                    <Card.Title className={styles.ellipsisTitle}>
                      <b>{article.title}</b>
                    </Card.Title>
                    <Card.Text className={styles.customCardText}>
                      {article.description.length > 70 ? `${article.description.substring(0, 70)}...` : article.description}
                    </Card.Text>
                    <div className={styles.seeMore}>
                      {formatSourceTime(article.sourceTime)}
                      <Button variant="dark" href={article.link} target="_blank" className={styles.seeMoreButton}>
                        查看更多
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          
        </motion.div>
      </div>
    )}

    {/* 分頁標籤 */}
    <div className={styles.pagination}>
      <button
        className={styles.pageButton}
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
      >
        &laquo;
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <button
          key={page}
          className={`${styles.pageButton} ${page === currentPage ? styles.activePage : ''}`}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        className={styles.pageButton}
        onClick={() => handlePageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        &raquo;
      </button>
    </div>
  </>
);
}

export default NewsList;
