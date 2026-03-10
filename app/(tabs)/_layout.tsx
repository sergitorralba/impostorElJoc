import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide tab bar
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Game',
        }}
      />
    </Tabs>
  );
}
