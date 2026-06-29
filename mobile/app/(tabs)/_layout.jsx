import { Tabs } from 'expo-router';
import Icon from '../../components/Icon';
import theme from '../../constants/theme';

// 底部分頁:首頁 / 檢測 / 手法 / 資訊 / 統計
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textFaint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: theme.bg },
        tabBarStyle: {
          backgroundColor: theme.bgElevated,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '首頁', tabBarIcon: ({ color }) => <Icon name="home" color={color} size={22} /> }} />
      <Tabs.Screen name="check" options={{ title: '檢測', tabBarIcon: ({ color }) => <Icon name="scan" color={color} size={22} /> }} />
      <Tabs.Screen name="method" options={{ title: '手法', tabBarIcon: ({ color }) => <Icon name="warning" color={color} size={22} /> }} />
      <Tabs.Screen name="game" options={{ title: '測驗', tabBarIcon: ({ color }) => <Icon name="shield" color={color} size={22} /> }} />
      <Tabs.Screen name="info" options={{ title: '資訊', tabBarIcon: ({ color }) => <Icon name="news" color={color} size={22} /> }} />
      <Tabs.Screen name="statistics" options={{ title: '統計', tabBarIcon: ({ color }) => <Icon name="stats" color={color} size={22} /> }} />
    </Tabs>
  );
}
