import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    Title,
    ChartDataLabels // 確保註冊 ChartDataLabels 插件
);

function PieChart() {
  const [data, setData] = useState(null); 

  const options = {
    maintainAspectRatio: false,
    plugins: {
        title: {
            display: true, 
            text: '資料數量佔比', 
            font: { size: 18 },
            align: 'start',
            padding: { bottom: 20 },
            color: 'white'
        },
        tooltip: {
            enabled: true,
            callbacks: {
                label: function(tooltipItem) {
                    return `資料佔比: ${tooltipItem.raw}%`;
                }
            },
            color: 'white'
        },
        legend: {
            display: true, 
            position: 'top',
            labels: {
              font: { size: 16 },
              color: 'white'
            }
        },
        datalabels: {
          display: true,
          align: 'end',
          anchor: 'top',
          formatter: (value) => `${value}%`, 
          font: { size: 18 },
          color: 'rgba(255,255,255,0.85)'
        }
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Statistics'));
  
        const labels = [];
        const datasetData = [];
  
        querySnapshot.forEach((doc) => {
          if (doc.id !== 'finalStatistics') { // 忽略 finalStatistics
            const data = doc.data();
            labels.push(data.Type);
            datasetData.push(data.Frequency);
          }
        });
  
        const combinedData = labels.map((label, index) => ({
          label,
          frequency: datasetData[index],
        })).sort((a, b) => b.frequency - a.frequency);
  
        const topFive = combinedData.slice(0, 5);
        const other = combinedData.slice(5);
  
        const otherFrequency = other.reduce((sum, item) => sum + item.frequency, 0);
        const topFiveLabels = topFive.map(item => item.label);
        const topFiveData = topFive.map(item => item.frequency);
  
        const total = [...topFiveData, otherFrequency].reduce((sum, value) => sum + value, 0);
        const percentages = [...topFiveData, otherFrequency].map(value => ((value / total) * 100).toFixed(2));
  
        const newData = {
          labels: [...topFiveLabels, '其他'], 
          datasets: [{
            label: '資料佔比',
            data: percentages,
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(128, 128, 128, 0.2)' 
            ],
            borderColor: [
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(128, 128, 128, 1)' 
            ],
          }]
        };

        setData(newData);
      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
      }
    };
  
    fetchData();
  }, []);
  

  return (
    <>
      {data ? <Pie data={data} options={options} /> : <p>載入資料中...</p>}
    </>
  );
}

export default PieChart;