import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import RecipeService from '../services/recipe.service';
import { Recipe, RecipeFilterOptions, PaginatedResponse, Cuisine, Equipment } from '../types';

// Define the context types
interface RecipeContextType {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  selectedRecipe: Recipe | null;
  cuisineTypes: Cuisine[];
  equipmentTypes: Equipment[];
  filterOptions: RecipeFilterOptions;
  
  // Methods
  fetchRecipes: (options?: RecipeFilterOptions) => Promise<void>;
  fetchRecipeById: (id: string) => Promise<Recipe | null>;
  setSelectedRecipe: (recipe: Recipe | null) => void;
  updateFilterOptions: (options: Partial<RecipeFilterOptions>) => void;
  resetFilters: () => void;
  likeRecipe: (id: string) => Promise<void>;
  unlikeRecipe: (id: string) => Promise<void>;
  isRecipeLiked: (id: string, userId: string) => boolean;
  refreshCuisineTypes: () => Promise<void>;
  refreshEquipmentTypes: () => Promise<void>;
}

// Create the context with a default value
const RecipeContext = createContext<RecipeContextType>({
  recipes: [],
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  selectedRecipe: null,
  cuisineTypes: [],
  equipmentTypes: [],
  filterOptions: { page: 1, limit: 10 },
  
  fetchRecipes: async () => {},
  fetchRecipeById: async () => null,
  setSelectedRecipe: () => {},
  updateFilterOptions: () => {},
  resetFilters: () => {},
  likeRecipe: async () => {},
  unlikeRecipe: async () => {},
  isRecipeLiked: () => false,
  refreshCuisineTypes: async () => {},
  refreshEquipmentTypes: async () => {},
});

// Custom hook to use the recipe context
export const useRecipes = () => useContext(RecipeContext);

// Provider component that wraps the app and provides the recipe context
export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [cuisineTypes, setCuisineTypes] = useState<Cuisine[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<Equipment[]>([]);
  const [filterOptions, setFilterOptions] = useState<RecipeFilterOptions>({
    page: 1,
    limit: 10,
  });

  // Fetch all recipes with optional filters
  const fetchRecipes = useCallback(async (options?: RecipeFilterOptions) => {
    setLoading(true);
    setError(null);
    try {
      const updatedOptions = options ? options : filterOptions;
      
      if (options) {
        setFilterOptions(options);
      }
      
      const response = await RecipeService.getRecipes(updatedOptions);
      setRecipes(response.data);
      setTotalPages(response.totalPages);
      setCurrentPage(response.page);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recipes');
      console.error('Error fetching recipes:', err);
    } finally {
      setLoading(false);
    }
  }, [filterOptions]);

  // Fetch a single recipe by ID
  const fetchRecipeById = async (id: string): Promise<Recipe | null> => {
    setLoading(true);
    setError(null);
    try {
      const recipe = await RecipeService.getRecipeById(id);
      return recipe;
    } catch (err: any) {
      setError(err.message || `Failed to fetch recipe with ID: ${id}`);
      console.error(`Error fetching recipe with ID ${id}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update filter options and fetch recipes
  const updateFilterOptions = useCallback((options: Partial<RecipeFilterOptions>) => {
    setFilterOptions(prev => {
      const updated = { ...prev, ...options, page: options.page || 1 };
      fetchRecipes(updated);
      return updated;
    });
  }, [fetchRecipes]);

  // Reset filters to default
  const resetFilters = useCallback(() => {
    const defaultFilters = { page: 1, limit: 10 };
    setFilterOptions(defaultFilters);
    fetchRecipes(defaultFilters);
  }, [fetchRecipes]);

  // Like a recipe
  const likeRecipe = async (id: string) => {
    try {
      await RecipeService.likeRecipe(id);
      
      // Update the recipes list to reflect the like
      setRecipes(prevRecipes => 
        prevRecipes.map(recipe => 
          recipe._id === id 
            ? { ...recipe, likes: [...recipe.likes, 'current-user-id'] } // This will be replaced with actual user ID
            : recipe
        )
      );
      
      // Also update selected recipe if it's the one that was liked
      if (selectedRecipe && selectedRecipe._id === id) {
        setSelectedRecipe({
          ...selectedRecipe,
          likes: [...selectedRecipe.likes, 'current-user-id'] // This will be replaced with actual user ID
        });
      }
    } catch (err: any) {
      setError(err.message || `Failed to like recipe with ID: ${id}`);
      console.error(`Error liking recipe with ID ${id}:`, err);
    }
  };

  // Unlike a recipe
  const unlikeRecipe = async (id: string) => {
    try {
      await RecipeService.unlikeRecipe(id);
      
      // Update the recipes list to reflect the unlike
      setRecipes(prevRecipes => 
        prevRecipes.map(recipe => 
          recipe._id === id 
            ? { ...recipe, likes: recipe.likes.filter(userId => userId !== 'current-user-id') } // This will be replaced with actual user ID
            : recipe
        )
      );
      
      // Also update selected recipe if it's the one that was unliked
      if (selectedRecipe && selectedRecipe._id === id) {
        setSelectedRecipe({
          ...selectedRecipe,
          likes: selectedRecipe.likes.filter(userId => userId !== 'current-user-id') // This will be replaced with actual user ID
        });
      }
    } catch (err: any) {
      setError(err.message || `Failed to unlike recipe with ID: ${id}`);
      console.error(`Error unliking recipe with ID ${id}:`, err);
    }
  };

  // Check if a recipe is liked by the user
  const isRecipeLiked = (id: string, userId: string): boolean => {
    const recipe = recipes.find(r => r._id === id);
    return recipe ? recipe.likes.includes(userId) : false;
  };

  // Fetch cuisine types
  const refreshCuisineTypes = async () => {
    try {
      const types = await RecipeService.getCuisineTypes();
      setCuisineTypes(types);
    } catch (err: any) {
      console.error('Error fetching cuisine types:', err);
    }
  };

  // Fetch equipment types
  const refreshEquipmentTypes = async () => {
    try {
      const types = await RecipeService.getEquipmentTypes();
      setEquipmentTypes(types);
    } catch (err: any) {
      console.error('Error fetching equipment types:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchRecipes();
    refreshCuisineTypes();
    refreshEquipmentTypes();
  }, [fetchRecipes]);

  // Create the value object with all the methods and state
  const value = {
    recipes,
    loading,
    error,
    totalPages,
    currentPage,
    selectedRecipe,
    cuisineTypes,
    equipmentTypes,
    filterOptions,
    
    fetchRecipes,
    fetchRecipeById,
    setSelectedRecipe,
    updateFilterOptions,
    resetFilters,
    likeRecipe,
    unlikeRecipe,
    isRecipeLiked,
    refreshCuisineTypes,
    refreshEquipmentTypes,
  };

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}; 