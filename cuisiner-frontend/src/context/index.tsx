import React from 'react';
import { AuthProvider } from './AuthContext';
import { RecipeProvider } from './RecipeContext';
import { SocialProvider } from './SocialContext';

// AppProvider combines all context providers
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <RecipeProvider>
        <SocialProvider>
          {/* Add other providers here when they're created */}
          {children}
        </SocialProvider>
      </RecipeProvider>
    </AuthProvider>
  );
};

// Export all contexts for easier imports
export * from './AuthContext';
export * from './RecipeContext';
export * from './SocialContext';
// Export other contexts from here when they're created 