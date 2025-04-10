import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import AuthService from '../services/auth.service';

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuthStatus = async () => {
      setIsLoading(true);
      const isAuth = await AuthService.isAuthenticated();
      setIsAuthenticated(isAuth);
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  if (isLoading) {
    // You can return a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator; 