import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { GearIcon, ActivitiesIcon, ProfileIcon } from '../components/icons';
import ShoesScreen from '../screens/ShoesScreen';
import ShoeFormScreen from '../screens/ShoeFormScreen';
import GearDetailScreen from '../screens/GearDetailScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import AddActivityScreen from '../screens/AddActivityScreen';
import ActivityEditScreen from '../screens/ActivityEditScreen';
import ProfileScreen from '../screens/ProfileScreen';
import type { MainStackParamList } from './types';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<MainStackParamList>();

function HeaderTitle({ children }: { children: string }) {
  const { tokens } = useTheme();
  return (
    <Text
      style={{
        color: tokens.pageTitleColor,
        fontSize: tokens.pageTitleFontSize,
        fontWeight: tokens.pageTitleFontWeight,
        fontFamily: tokens.pageTitleFontFamily,
      }}
    >
      {children}
    </Text>
  );
}

function ShoesStack() {
  const { tokens } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: tokens.pageBackground },
        headerTintColor: tokens.pageTitleColor,
        headerTitle: ({ children }) => <HeaderTitle>{children}</HeaderTitle>,
      }}
    >
      <Stack.Screen name="Shoes" component={ShoesScreen} options={{ title: 'My Gear', headerShown: true }} />
      <Stack.Screen name="Shoes/Add" component={ShoeFormScreen} options={{ title: 'Add Gear' }} />
      <Stack.Screen name="Shoes/Edit" component={ShoeFormScreen} options={{ title: 'Edit Gear' }} />
      <Stack.Screen name="Shoes/Detail" component={GearDetailScreen} options={{ title: 'Gear Details' }} />
    </Stack.Navigator>
  );
}

function ActivitiesStack() {
  const { tokens } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: tokens.pageBackground },
        headerTintColor: tokens.pageTitleColor,
        headerTitle: ({ children }) => <HeaderTitle>{children}</HeaderTitle>,
      }}
    >
      <Stack.Screen name="Activities" component={ActivitiesScreen} options={{ title: 'Activities', headerShown: true }} />
      <Stack.Screen name="Activities/Add" component={AddActivityScreen} options={{ title: 'Add Activity' }} />
      <Stack.Screen name="Activities/Edit" component={ActivityEditScreen} options={{ title: 'Edit Activity' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  const { tokens } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: tokens.pageBackground },
        headerTintColor: tokens.pageTitleColor,
        headerTitle: ({ children }) => <HeaderTitle>{children}</HeaderTitle>,
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile', headerShown: true }} />
    </Stack.Navigator>
  );
}

export default function MainTabs() {
  const { tokens } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.tabBarActiveTint,
        tabBarInactiveTintColor: tokens.tabBarInactiveTint,
        tabBarStyle: {
          backgroundColor: tokens.tabBarBackground,
        },
      }}
    >
      <Tab.Screen
        name="Shoes"
        component={ShoesStack}
        options={{
          tabBarLabel: 'Gear',
          tabBarIcon: ({ color, size }) => <GearIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Activities"
        component={ActivitiesStack}
        options={{
          tabBarLabel: 'Activities',
          tabBarIcon: ({ color, size }) => <ActivitiesIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <ProfileIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
