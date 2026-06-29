import { useNavigation } from 'expo-router';
import Statistics from '../../components/pages/Statistics';
import ScreenWrap from '../../components/ScreenWrap';

// 統計圖表
export default function Screen() {
  const navigation = useNavigation();
  return (
    <ScreenWrap>
      <Statistics navigation={navigation} />
    </ScreenWrap>
  );
}
