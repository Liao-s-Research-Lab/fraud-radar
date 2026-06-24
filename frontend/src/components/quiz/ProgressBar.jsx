import React from 'react';
import { useState, useEffect } from 'react';
import { Steps } from 'antd';
import './ProgressBar.css'

function ProgressBar({currentConversation}) {
//   const description = 'This is a description.';
const [percent, setPercent] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setPercent(prevPercent => (prevPercent + 1) % 100); 
  }, 50); 

  return () => clearInterval(interval); 
}, []);
  return (
    <div id="container" style={{ width: '50%', padding: '6px', position: 'absolute', left:'50%', transform: 'translateX(-50%)' }}>
      <Steps
        current={currentConversation}
        percent={percent}
        labelPlacement="vertical"
        items={[
            { title: '測驗一',
            // subTitle: 'Round 2',
            // description, 
            },
            { title: '測驗二' },
            { title: '測驗三' },
        ]}
      />
    </div>
  );
};

export default ProgressBar;
