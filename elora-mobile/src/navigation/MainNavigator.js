import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import DashboardScreen from '../screens/DashboardScreen';
import StoresScreen from '../screens/StoresScreen';
import UsersScreen from '../screens/UsersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EnquiriesScreen from '../screens/EnquiriesScreen';
import RecceScreen from '../screens/RecceScreen';
import InstallationScreen from '../screens/InstallationScreen';
import RolesScreen from '../screens/RolesScreen';
import ReportsScreen from '../screens/ReportsScreen';
import LoadingScreen from '../screens/LoadingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DashboardMain" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Stack.Screen 
        name="Enquiries" 
        component={EnquiriesScreen}
        options={{ title: 'Enquiries' }}
      />
      <Stack.Screen 
        name="Recce" 
        component={RecceScreen}
        options={{ title: 'Recce Tasks' }}
      />
      <Stack.Screen 
        name="Installation" 
        component={InstallationScreen}
        options={{ title: 'Installation Tasks' }}
      />
      <Stack.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ title: 'Reports' }}
      />
    </Stack.Navigator>
  );
}

function StoresStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="StoresMain" 
        component={StoresScreen}
        options={{ title: 'Stores' }}
      />
    </Stack.Navigator>
  );
}

function UsersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="UsersMain" 
        component={UsersScreen}
        options={{ title: 'Users' }}
      />
      <Stack.Screen 
        name="Roles" 
        component={RolesScreen}
        options={{ title: 'Roles' }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  const { logout } = useAuth();
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerRight: () => (
            <TouchableOpacity
              onPress={logout}
              style={{ marginRight: 16 }}
            >
              <Text style={{ color: '#EF4444', fontWeight: '600' }}>
                Logout
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Stores" 
        component={StoresStack}
        options={{
          tabBarLabel: 'Stores',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏪</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Users" 
        component={UsersStack}
        options={{
          tabBarLabel: 'Users',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👥</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}