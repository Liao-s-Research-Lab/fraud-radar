import { useNavigation } from 'expo-router';
import Method from '../../components/pages/method';
import ScreenWrap from '../../components/ScreenWrap';

// 常見手法
export default function Screen() {
  const navigation = useNavigation();
  return (
    <ScreenWrap>
      <Method navigation={navigation} />
    </ScreenWrap>
  );
}
