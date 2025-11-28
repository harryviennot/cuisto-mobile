import { Tabs } from 'expo-router';
import { House, Compass, User, PlusIcon, PlusCircleIcon, BookOpenIcon, BooksIcon, HouseIcon, ForkKnifeIcon } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import React from 'react';

import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <Tabs
        screenListeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#000000',
            borderTopWidth: 0,
            height: 45 + insets.bottom,
            paddingTop: 10,
            paddingBottom: insets.bottom + 10,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
          sceneStyle: {
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            overflow: 'hidden',
            marginBottom: 50 + insets.bottom, // Adjust to overlap slightly or sit above
          },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#666666',
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <ForkKnifeIcon size={28} color={color} weight={focused ? 'fill' : 'regular'} />

              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="new-recipe"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <PlusCircleIcon size={28} color={color} weight={focused ? 'fill' : 'regular'} />

              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <BooksIcon size={28} color={color} weight={focused ? 'fill' : 'regular'} />

              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
