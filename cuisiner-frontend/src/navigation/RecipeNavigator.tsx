import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
// Note: You'll need to create these screen components later
import RecipeListScreen from '../screens/recipes/RecipeListScreen';
import RecipeDetailScreen from '../screens/recipes/RecipeDetailScreen';
import CreateRecipeScreen from '../screens/recipes/CreateRecipeScreen';
import EditRecipeScreen from '../screens/recipes/EditRecipeScreen';

// Define the recipe stack param list
export type RecipeStackParamList = {
  RecipeList: undefined;
  RecipeDetail: { recipeId: string };
  CreateRecipe: undefined;
  EditRecipe: { recipeId: string };
};

const Stack = createStackNavigator<RecipeStackParamList>();

const RecipeNavigator = () => {
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
        name="RecipeList" 
        component={RecipeListScreen} 
        options={{ title: 'Recipes' }}
      />
      <Stack.Screen 
        name="RecipeDetail" 
        component={RecipeDetailScreen} 
        options={{ title: 'Recipe Details' }}
      />
      <Stack.Screen 
        name="CreateRecipe" 
        component={CreateRecipeScreen} 
        options={{ title: 'Create Recipe' }}
      />
      <Stack.Screen 
        name="EditRecipe" 
        component={EditRecipeScreen} 
        options={{ title: 'Edit Recipe' }}
      />
    </Stack.Navigator>
  );
};

export default RecipeNavigator; 