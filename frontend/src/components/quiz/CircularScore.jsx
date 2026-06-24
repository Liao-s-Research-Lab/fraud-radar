import React, { useState, useEffect } from 'react';
import chroma from 'chroma-js'; 
import styles from './CircularScore.module.css'
import { useQuizContext } from "./QuizContext";

function CircularScore({progress}) {
  const { svgColor } = useQuizContext();
  const colorMap = {
    "#ffe4e6": "rgb(255, 154, 184)",
    "#fef3c7": "rgb(255, 204, 128)",
    "#d1fae5": "rgb(79, 218, 169)",
    "#EDE9FE": "rgb(201, 172, 255)"
  };
  
  const getFillColor = (svgColor) => {
  return colorMap[svgColor] || "undefined";  
  };

 const getBackground = (progress) => {
   const degrees = progress * 3.6;
   return `
    conic-gradient(
      ${getFillColor(svgColor)} 0deg, 
      ${getFillColor(svgColor)} ${Math.min(degrees, 90)}deg, 
      ${getFillColor(svgColor)} ${Math.min(degrees, 180)}deg, 
      ${getFillColor(svgColor)} ${Math.min(degrees, 270)}deg, 
      ${getFillColor(svgColor)} ${Math.min(degrees, 360)}deg,
      gainsboro ${Math.min(degrees, 360)}deg
    )
  `;
 };
 
 const getColorAtProgress = (progress) => {
   const degrees = progress * 3.6;
 
   const colorStops = [
     { color: `${getFillColor(svgColor)}`, stop: 0 },
     { color: `${getFillColor(svgColor)}`, stop: 90 },
     { color: `${getFillColor(svgColor)}`, stop: 180 },
     { color: `${getFillColor(svgColor)}`, stop: 270 },
     { color: `${getFillColor(svgColor)}`, stop: 360 },
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


  return (
    <div className={styles.circularProgressContainer}>
      <div className={styles.circularProgress} style={{ background: getBackground(progress) }}>
          <span className={styles.progressValue} style={{ color: getColorAtProgress(progress) }}>
          {progress}
          </span>
      </div>
    </div>
  );
}

export default CircularScore;
