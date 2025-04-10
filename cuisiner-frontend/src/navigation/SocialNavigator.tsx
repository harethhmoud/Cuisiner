import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
// Note: You'll need to create these screen components later
import FeedScreen from '../screens/social/FeedScreen';
import PostDetailScreen from '../screens/social/PostDetailScreen';
import CreatePostScreen from '../screens/social/CreatePostScreen';
import UserProfileScreen from '../screens/social/UserProfileScreen';

// Define the social stack param list
export type SocialStackParamList = {
  Feed: undefined;
  PostDetail: { postId: string };
  CreatePost: { recipeId?: string };
  UserProfile: { userId: string };
};

const Stack = createStackNavigator<SocialStackParamList>();

const SocialNavigator = () => {
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
        name="Feed" 
        component={FeedScreen} 
        options={{ title: 'Social Feed' }}
      />
      <Stack.Screen 
        name="PostDetail" 
        component={PostDetailScreen} 
        options={{ title: 'Post' }}
      />
      <Stack.Screen 
        name="CreatePost" 
        component={CreatePostScreen} 
        options={{ title: 'Share Your Dish' }}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen} 
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
};

export default SocialNavigator; 