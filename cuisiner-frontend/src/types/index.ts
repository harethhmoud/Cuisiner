// Basic User type
export interface User {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  following: string[];
  followers: string[];
  authProvider: 'local' | 'google' | 'apple';
  socialId?: string;
  savedRecipes: string[];
  createdAt: string;
  updatedAt: string;
}

// Auth response types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Recipe related types
export enum Cuisine {
  CHINESE = 'chinese',
  JAPANESE = 'japanese',
  KOREAN = 'korean',
  THAI = 'thai',
  VIETNAMESE = 'vietnamese',
  INDIAN = 'indian',
  ITALIAN = 'italian',
  FRENCH = 'french',
  SPANISH = 'spanish',
  MEXICAN = 'mexican',
  AMERICAN = 'american',
  MEDITERRANEAN = 'mediterranean',
  MIDDLE_EASTERN = 'middle_eastern',
  ARABIC = 'arabic',
  GREEK = 'greek',
  TURKISH = 'turkish',
  BRAZILIAN = 'brazilian',
  CARIBBEAN = 'caribbean',
  MOROCCAN = 'moroccan'
}

export enum Equipment {
  KNIFE = 'knife',
  CUTTING_BOARD = 'cutting_board',
  MIXING_BOWL = 'mixing_bowl',
  MEASURING_CUPS = 'measuring_cups',
  MEASURING_SPOONS = 'measuring_spoons',
  WOODEN_SPOON = 'wooden_spoon',
  SPATULA = 'spatula',
  WHISK = 'whisk',
  TONGS = 'tongs',
  LADLE = 'ladle',
  SAUCEPAN = 'saucepan',
  FRYING_PAN = 'frying_pan',
  DUTCH_OVEN = 'dutch_oven',
  BAKING_SHEET = 'baking_sheet',
  CASSEROLE_DISH = 'casserole_dish',
  POT = 'pot',
  WOK = 'wok',
  OVEN = 'oven',
  STOVETOP = 'stovetop',
  MICROWAVE = 'microwave',
  BLENDER = 'blender',
  FOOD_PROCESSOR = 'food_processor',
  HAND_MIXER = 'hand_mixer',
  STAND_MIXER = 'stand_mixer',
  MORTAR_AND_PESTLE = 'mortar_and_pestle',
  ROLLING_PIN = 'rolling_pin',
  PASTRY_BRUSH = 'pastry_brush',
  SIEVE = 'sieve',
  STRAINER = 'strainer',
  GRILL = 'grill',
  SLOW_COOKER = 'slow_cooker',
  PRESSURE_COOKER = 'pressure_cooker'
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  notes?: string;
}

export interface CookingStep {
  order: number;
  description: string;
  duration: number; // in minutes
  isParallel: boolean; // whether this step can be done in parallel with others
}

export interface Recipe {
  _id: string;
  title: string;
  description: string;
  author: string | User;
  ingredients: Ingredient[];
  steps: CookingStep[];
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  totalTime: number; // in minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: Cuisine;
  dietaryInfo?: string[];
  photos: string[];
  likes: string[];
  calories?: number;
  equipment: Equipment[];
  createdAt: string;
  updatedAt: string;
}

// Post related types
export interface Post {
  _id: string;
  author: string | User;
  recipe: string | Recipe;
  photos: string[];
  caption: string;
  date: string;
  likes: string[];
  commentCount: number;
  modifications?: string;
  createdAt: string;
  updatedAt: string;
}

// Comment related types
export interface Comment {
  _id: string;
  post: string;
  user: string | User;
  content: string;
  likes: string[];
  parentComment?: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

// Pagination response type
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

// Recipe filter options
export interface RecipeFilterOptions {
  page?: number;
  limit?: number;
  cuisine?: Cuisine;
  difficulty?: 'easy' | 'medium' | 'hard';
  maxTotalTime?: number; // in minutes
  includeIngredients?: string[];
  equipment?: Equipment[];
  dietaryInfo?: string[];
} 