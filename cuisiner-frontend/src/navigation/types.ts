import { NavigatorScreenParams } from '@react-navigation/native';
import { AuthStackParamList } from './AuthNavigator';
import { MainTabParamList } from './MainNavigator';
import { RecipeStackParamList } from './RecipeNavigator';
import { SocialStackParamList } from './SocialNavigator';
import { ProfileStackParamList } from './ProfileNavigator';

// Root navigation types
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Re-export all the nested navigators for convenience
export type {
  AuthStackParamList,
  MainTabParamList,
  RecipeStackParamList,
  SocialStackParamList,
  ProfileStackParamList,
};

// Type declaration for useNavigation hook to make navigation fully typed
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 