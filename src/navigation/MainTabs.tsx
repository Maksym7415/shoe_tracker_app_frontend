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
import { MainRoutes, type MainStackParamList } from './types';

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
        name={MainRoutes.ShoesList}
        component={ShoesScreen as React.ComponentType}
        options={{ title: 'My Gear', headerShown: true }}
      />
      <Stack.Screen
        name={MainRoutes.ShoesAdd}
        component={ShoeFormScreen}
        options={{ title: 'Add Gear' }}
      />
      <Stack.Screen
        name={MainRoutes.ShoesEdit}
        component={ShoeFormScreen}
        options={{ title: 'Edit Gear' }}
      />
      <Stack.Screen
        name={MainRoutes.ShoesDetail}
        component={GearDetailScreen}
        options={({ route, navigation }) => ({
          title: 'Gear',
          headerRight: () => (
            <Text
              onPress={() => navigation.navigate(MainRoutes.ShoesEdit, { id: route.params.id })}
              style={{ paddingHorizontal: 8 }}
            >
              <PencilIcon size={20} color={tokens.accent} />
            </Text>
          ),
        })}
      />
      <Stack.Screen
        name={MainRoutes.ShoesComponents}
        component={GearComponentsScreen}
        options={{ title: 'My Gear' }}
      />
      <Stack.Screen
        name={MainRoutes.ShoesServiceAdd}
        component={ServiceFormScreen}
        options={{ title: 'Add Service' }}
      />
      <Stack.Screen
        name={MainRoutes.ShoesServiceEdit}
        component={ServiceFormScreen}
        options={{ title: 'Edit Service' }}
      />
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
        name={MainRoutes.ActivitiesList}
        component={ActivitiesScreen as React.ComponentType}
        options={{ title: 'Activities', headerShown: true }}
      />
      <Stack.Screen
        name={MainRoutes.ActivitiesDetail}
        component={ActivityDetailScreen}
        options={{ title: 'Activity' }}
      />
      <Stack.Screen
        name={MainRoutes.ActivitiesAdd}
        component={AddActivityScreen}
        options={{ title: 'Add Activity' }}
      />
      <Stack.Screen
        name={MainRoutes.ActivitiesEdit}
        component={ActivityEditScreen}
        options={{ title: 'Edit Activity' }}
      />
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
        name={MainRoutes.ProfileView}
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: 'Profile',
          headerShown: true,
          headerRight: () => (
            <Text
              onPress={() => navigation.navigate(MainRoutes.ProfileEdit)}
              style={{ paddingHorizontal: 8 }}
            >
              <PencilIcon size={20} color={tokens.accent} />
            </Text>
          ),
        })}
      />
      <Stack.Screen
        name={MainRoutes.ProfileEdit}
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
            navigation.navigate('Shoes', { screen: MainRoutes.ShoesList });
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
            navigation.navigate('Activities', { screen: MainRoutes.ActivitiesList });
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
            navigation.navigate('Profile', { screen: MainRoutes.ProfileView });
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
