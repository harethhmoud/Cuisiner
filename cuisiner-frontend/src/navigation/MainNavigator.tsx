import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens or screen navigators
// Note: You'll need to create these screen components later
import HomeScreen from '../screens/HomeScreen';
import RecipeNavigator from './RecipeNavigator';
import SocialNavigator from './SocialNavigator';
import ProfileNavigator from './ProfileNavigator';

// Define the main tab param list
export type MainTabParamList = {
  Home: undefined;
  Recipes: undefined;
  Social: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Recipes') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Social') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4C9A2A',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Recipes" component={RecipeNavigator} />
      <Tab.Screen name="Social" component={SocialNavigator} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
};

export default MainNavigator; 