import { useNavigation } from 'expo-router';
import Check1 from '../../components/pages/check/check1';
import ScreenWrap from '../../components/ScreenWrap';

// 詐騙檢測
export default function Screen() {
  const navigation = useNavigation();
  return (
    <ScreenWrap>
      <Check1 navigation={navigation} />
    </ScreenWrap>
  );
}
