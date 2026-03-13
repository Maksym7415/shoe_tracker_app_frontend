import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { GearIcon, ActivitiesIcon, ProfileIcon, PencilIcon } from '../components/icons';
import ShoesScreen from '../screens/ShoesScreen';
import ShoeFormScreen from '../screens/ShoeFormScreen';
import GearDetailScreen from '../screens/GearDetailScreen';
import GearComponentsScreen from '../screens/GearComponentsScreen';
import ServiceFormScreen from '../screens/ServiceFormScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import AddActivityScreen from '../screens/AddActivityScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';
import ActivityEditScreen from '../screens/ActivityEditScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
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
      <Stack.Screen
        name="Shoes/List"
        component={ShoesScreen as React.ComponentType}
        options={{ title: 'My Gear', headerShown: true }}
      />
      <Stack.Screen name="Shoes/Add" component={ShoeFormScreen} options={{ title: 'Add Gear' }} />
      <Stack.Screen name="Shoes/Edit" component={ShoeFormScreen} options={{ title: 'Edit Gear' }} />
      <Stack.Screen
        name="Shoes/Detail"
        component={GearDetailScreen}
        options={({ route, navigation }) => ({
          title: 'Gear',
          headerRight: () => (
            <Text
              onPress={() => navigation.navigate('Shoes/Edit', { id: route.params.id })}
              style={{ paddingHorizontal: 8 }}
            >
              <PencilIcon size={20} color={tokens.accent} />
            </Text>
          ),
        })}
      />
      <Stack.Screen name="Shoes/Components" component={GearComponentsScreen} options={{ title: 'My Gear' }} />
      <Stack.Screen name="Shoes/Service/Add" component={ServiceFormScreen} options={{ title: 'Add Service' }} />
      <Stack.Screen name="Shoes/Service/Edit" component={ServiceFormScreen} options={{ title: 'Edit Service' }} />
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
      <Stack.Screen
        name="Activities/List"
        component={ActivitiesScreen as React.ComponentType}
        options={{ title: 'Activities', headerShown: true }}
      />
      <Stack.Screen name="Activities/Detail" component={ActivityDetailScreen} options={{ title: 'Activity' }} />
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
      <Stack.Screen
        name="Profile/View"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: 'Profile',
          headerShown: true,
          headerRight: () => (
            <Text
              onPress={() => navigation.navigate('Profile/Edit')}
              style={{ paddingHorizontal: 8 }}
            >
              <PencilIcon size={20} color={tokens.accent} />
            </Text>
          ),
        })}
      />
      <Stack.Screen
        name="Profile/Edit"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
        }}
      />
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
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Shoes', { screen: 'Shoes/List' });
          },
        })}
        options={{
          tabBarLabel: 'Gear',
          tabBarIcon: ({ color, size }) => <GearIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Activities"
        component={ActivitiesStack}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Activities', { screen: 'Activities/List' });
          },
        })}
        options={{
          tabBarLabel: 'Activities',
          tabBarIcon: ({ color, size }) => <ActivitiesIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Profile', { screen: 'Profile/View' });
          },
        })}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <ProfileIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
