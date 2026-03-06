import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ShoesScreen from '../screens/ShoesScreen';
import ShoeFormScreen from '../screens/ShoeFormScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import AddActivityScreen from '../screens/AddActivityScreen';
import ActivityEditScreen from '../screens/ActivityEditScreen';
import ProfileScreen from '../screens/ProfileScreen';
import type { MainStackParamList } from './types';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<MainStackParamList>();

function ShoesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Shoes" component={ShoesScreen} options={{ title: 'My Shoes' }} />
      <Stack.Screen name="Shoes/Add" component={ShoeFormScreen} options={{ title: 'Add Shoe' }} />
      <Stack.Screen name="Shoes/Edit" component={ShoeFormScreen} options={{ title: 'Edit Shoe' }} />
    </Stack.Navigator>
  );
}

function ActivitiesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Activities" component={ActivitiesScreen} options={{ title: 'Activities' }} />
      <Stack.Screen name="Activities/Add" component={AddActivityScreen} options={{ title: 'Add Activity' }} />
      <Stack.Screen name="Activities/Edit" component={ActivityEditScreen} options={{ title: 'Edit Activity' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen
        name="Shoes"
        component={ShoesStack}
        options={{ tabBarLabel: 'Shoes' }}
      />
      <Tab.Screen
        name="Activities"
        component={ActivitiesStack}
        options={{ tabBarLabel: 'Activities' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
