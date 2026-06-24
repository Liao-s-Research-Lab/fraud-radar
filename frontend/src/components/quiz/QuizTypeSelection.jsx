import React from 'react';
import { CircleDollarSign, UserX, ShoppingBag, MessageCircleHeart, ChevronRight, MousePointerClick } from 'lucide-react';
import styles from './QuizTypeSelection.module.css';
import { useNavigate } from 'react-router-dom'; 
import { useQuizContext } from './QuizContext';

const QuizTypeSelection = ({setReturnIsDisable}) => {
  const navigate = useNavigate(); 
  const { setIsFirstRender, setSvgColor, characterInformation, setTypeName, setFraudType } = useQuizContext()
  const fraudTypes = [
    {
      id: 1,
      name: '交友戀愛詐騙',
      icon: MessageCircleHeart,
      color: 'rose',
      description: '預防虛假感情的陷阱',
      type: 'romanceFraud',
    },
    {
      id: 2,
      name: '冒名詐騙',
      icon: UserX,
      color: 'amber',
      description: '守護個人身份資料',
      type: 'imperFraud'
    },
    {
      id: 3,
      name: '購物詐騙',
      icon: ShoppingBag,
      color: 'emerald',
      description: '安全網購交易須知',
      type: 'shoppingFraud',
    },
    {
			id: 4,
			name: '投資詐騙',
			icon: CircleDollarSign,
			color: 'purple',
			description: '警惕不合理的高額利潤回報',
      type: 'investmentFraud'
    }
  ];

  const handleButtonClick = (name, color, type) => {
    setIsFirstRender(false);
    setTypeName(name)
    setSvgColor(colorMap[color]);
    setFraudType(type);
    setReturnIsDisable(true);
    navigate('/quiz/fraudquiz');
  };

  const colorMap = {
    rose: "#ffe4e6",
    amber: "#fef3c7",
    emerald: "#d1fae5",
    purple: "#EDE9FE" 
  };

  return (
    <>
      <div className={styles.header}>
        <p className={styles.title}>請選擇詐騙類型進行測驗</p>
				<MousePointerClick className={styles.clickingIcon} />
      </div>

      <div className={styles.grid}>
        {fraudTypes.map((type) => (
          <button
            key={type.id}
            className={`${styles.button} ${styles[type.color]}`}
            onClick={() => handleButtonClick(type.name, type.color, type.type)}
            disabled={!characterInformation.confirmNickname}
          >
            <div className={styles.buttonContent}>
              <div className={`${styles.iconContainer} ${styles[type.color]}`}>
                <type.icon className={styles[`icon${type.color.charAt(0).toUpperCase() + type.color.slice(1)}`]} />
              </div>
              
              <div className={styles.textContainer}>
                <div className={styles.buttonTitle}>{type.name}</div>
                <div className={styles.description}>{type.description}</div>
              </div>
            </div>
            <ChevronRight
                className={`${styles.arrow} ${styles[`icon${type.color.charAt(0).toUpperCase() + type.color.slice(1)}`]}`}
              />
          </button>
        ))}
      </div>
    </>
  );
};

export default QuizTypeSelection;