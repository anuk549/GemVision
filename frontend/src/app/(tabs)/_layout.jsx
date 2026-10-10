import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components';
import { colors } from '../../theme';

const tabIcon = (active, inactive) =>
  function TabBarIcon({ focused, color, size }) {
    return <Icon name={focused ? active : inactive} size={size ?? 22} color={color} />;
  };

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          backgroundColor: colors.backgroundAlt,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 56 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarItemStyle: { paddingVertical: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="identify"
        options={{ title: 'Identify', tabBarIcon: tabIcon('search', 'search-outline') }}
      />
      <Tabs.Screen
        name="detect"
        options={{ title: 'Detect', tabBarIcon: tabIcon('diamond', 'diamond-outline') }}
      />
      <Tabs.Screen
        name="cutting"
        options={{ title: 'Cutting', tabBarIcon: tabIcon('cut', 'cut-outline') }}
      />
      <Tabs.Screen
        name="design"
        options={{ title: 'Design', tabBarIcon: tabIcon('color-palette', 'color-palette-outline') }}
      />
    </Tabs>
  );
}
