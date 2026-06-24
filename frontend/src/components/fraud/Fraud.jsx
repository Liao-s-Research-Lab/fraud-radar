import React, { useState, useEffect, useRef } from 'react';
import './Fraud.css';
import Navbar from '../navbar/Navbar';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { images, titles, contents, examples, icons, keys } from '../fraud/FraudContext';

function Fraud() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const sliderRef = useRef(null);
    const thumbnailsRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            handleNext();
        }, 9000); 

        return () => clearInterval(interval);
    }, [currentIndex]);

    // const handleNext = () => {
    //     setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    // };

    // const handlePrev = () => {
    //     setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    // };

    const handleThumbnailClick = (index) => {
        setCurrentIndex(index);
    };

    useEffect(() => {
        if (sliderRef.current) {
            const items = sliderRef.current.querySelectorAll('.item');
            items.forEach((item, index) => {
                item.classList.toggle('active', index === currentIndex);
            });
        }
        
        if (thumbnailsRef.current) {
            const thumbnails = thumbnailsRef.current.querySelectorAll('.item');
            thumbnails.forEach((thumbnail, index) => {
                thumbnail.classList.toggle('active', index === currentIndex);
            });
        }
    }, [currentIndex]);

    return (
        <>
            <Helmet>
                <title>常見手法</title>
            </Helmet>
            <Navbar/>
            <div id="root">
            <div className='fraud-container'>
                <div className="slider" ref={ sliderRef }>
                    <div className="list">
                    {images.map((img, index) => (
                        <div key={ index } className="item">
                            <img className="fraud-img" src={ img } alt={`Slider ${index + 1}`} />
                            <div className="parent-container">
                            <div className="fraud-content-box">
                                <div className="fraud-content">
                                    <p>常見手法-{ index + 1 }</p>
                                    <h2>{ titles[index] }</h2>
                                    <div className="keywords">
                                        <div>【關鍵字】</div>
                                        {keys[index].split('\n').map((keyword, i) => (
                                            <div key={i} className='tags'>{keyword}</div>
                                        ))} 
                                    </div><br></br>
                                    <div className='contents'>{ contents[index] }</div>
                                </div>
                                <div className="fraud-intro">
                                    <img src={examples[index]} alt={`Icon ${index + 1}`} className="examples"/>
                                </div>
                            </div>
                            </div>
                        </div>
                    ))}

                    </div>
                        <motion.div className="sidebar"
                            initial={{ height: 0 }} 
                            animate={{ height: '80px',transition: { ease: 'linear' } }}
                        >
                            <div className="thumbnail" ref={thumbnailsRef}>
                                {/* <button className="left-arrow" onClick={ handlePrev }>{'◀'}</button> */}
                                {images.map((img, index) => (
                                    <div key={ index } className="item" onClick={() => handleThumbnailClick(index)}>
                                        <div className="img-title">
                                            { titles[index] }
                                        </div>
                                        <div className="icon-btn">
                                            <button className="sidebar-burger">
                                                    <img src={ icons[index] } alt={`Icon ${index + 1}`} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {/* <button className="right-arrow" onClick={ handleNext }>{'▶'}</button> */}
                            </div>
                        </motion.div>

                </div>
            </div>
            </div>
        </>
    );
}

export default Fraud;
