import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
// Note: You'll need to create these screen components later
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SavedRecipesScreen from '../screens/profile/SavedRecipesScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';

// Define the profile stack param list
export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  SavedRecipes: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<ProfileStackParamList>();

const ProfileNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#F8F8F8',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'My Profile' }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen 
        name="SavedRecipes" 
        component={SavedRecipesScreen} 
        options={{ title: 'Saved Recipes' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
};

export default ProfileNavigator; 