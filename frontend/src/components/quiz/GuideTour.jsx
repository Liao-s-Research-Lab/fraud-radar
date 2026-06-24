import React from 'react'
import Joyride from 'react-joyride';

function GuideTour({ steps, run, setIsGuideTourActive }) {
    const customLocale = {
        next: <strong>下一步</strong>,
        skip: "我要跳過",
        back: "上一步", 
        last: <strong>完成</strong>,
    }

    const customStyles = {
        options: {
            zIndex: 0
        },
        overlay: {
            pointerEvents: "all",
            zIndex: 99
        },
        spotlight: {
            borderRadius: "5px", 
            border: "3px solid lightgray", 
        }
    }

    const handleJoyrideCallback = (event) => {
        const { status } = event;

        if (status === 'finished' || status === 'skipped') {
            setIsGuideTourActive(false);
        }
    };

    return (
        <Joyride
            run={run}
            steps={steps}
            locale={customLocale}
            callback={handleJoyrideCallback}
            continuous={true}
            hideCloseButton={true}
            showSkipButton={true}
            disableScrolling={true} 
            spotlightClicks={true}
            scrollToFirstStep={true}
            disableOverlayClose={true}
            styles={customStyles}
        />
    )
}

export default GuideTour