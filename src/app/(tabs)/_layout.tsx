import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import React from 'react';
import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';
import { useDeviceType } from '@/hooks/useDeviceType';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isTablet } = useDeviceType();

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: isTablet
            ? { overflow: 'hidden' }
            : {
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              overflow: 'hidden',
              marginBottom: 50 + insets.bottom,
            },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#666666',
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="new-recipe" />
        <Tabs.Screen name="library" />
      </Tabs>
    </View>
  );
}
