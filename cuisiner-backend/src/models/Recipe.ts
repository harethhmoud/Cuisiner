import mongoose, { Document } from 'mongoose';

// Interfaces for nested documents
interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  notes?: string;
}
/**

 * const ingredient: Ingredient = {
  name: "all-purpose flour",
  amount: 2.5,
  unit: "cups",
  notes: "sifted"  // optional, can be omitted
}
 */

interface CookingStep {
  order: number;
  description: string;
  duration: number;  // in minutes
  isParallel: boolean;  // whether this step can be done in parallel with others
}

/**
 * const step: CookingStep = {
 *  order: 1,   
 *  description: "Preheat oven to 350 degrees F (175 degrees C).",
 *  duration: 10,
 *  isParallel: false
 * }
 */

// Enums for standardization
enum Cuisine {
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

enum Equipment {
  // Basic Equipment
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
  
  // Cookware
  SAUCEPAN = 'saucepan',
  FRYING_PAN = 'frying_pan',
  DUTCH_OVEN = 'dutch_oven',
  BAKING_SHEET = 'baking_sheet',
  CASSEROLE_DISH = 'casserole_dish',
  POT = 'pot',
  WOK = 'wok',
  
  // Appliances
  OVEN = 'oven',
  STOVETOP = 'stovetop',
  MICROWAVE = 'microwave',
  BLENDER = 'blender',
  FOOD_PROCESSOR = 'food_processor',
  HAND_MIXER = 'hand_mixer',
  STAND_MIXER = 'stand_mixer',
  
  // Specialized Equipment
  MORTAR_AND_PESTLE = 'mortar_and_pestle',
  ROLLING_PIN = 'rolling_pin',
  PASTRY_BRUSH = 'pastry_brush',
  SIEVE = 'sieve',
  STRAINER = 'strainer',
  GRILL = 'grill',
  SLOW_COOKER = 'slow_cooker',
  PRESSURE_COOKER = 'pressure_cooker'
}

// Main Recipe interface
export interface IRecipe extends Document {
  title: string;
  description: string;
  author: mongoose.Types.ObjectId; // user id of the author of the recipe
  ingredients: Ingredient[];
  steps: CookingStep[];
  prepTime: number;  
  cookTime: number;  
  totalTime: number;  
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: Cuisine;
  dietaryInfo?: string[]; // array of dietary information
  photos: string[];
  likes: mongoose.Types.ObjectId[];  // User IDs who liked this recipe
  calories?: number;  // optional calories per serving
  equipment: Equipment[];  // list of required kitchen equipment
}

// Recipe Schema
const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    index: true  // for search functionality
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ingredients: [{
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative']
    },
    unit: {
      type: String,
      required: true
    },
    notes: String
  }],
  steps: [{
    order: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true,
      min: [0, 'Duration cannot be negative']
    },
    isParallel: {
      type: Boolean,
      default: false
    }
  }],
  prepTime: {
    type: Number,
    required: true,
    min: [0, 'Prep time cannot be negative']
  },
  cookTime: {
    type: Number,
    required: true,
    min: [0, 'Cook time cannot be negative']
  },
  totalTime: {
    type: Number,
    required: true,
    min: [0, 'Total time cannot be negative']
  },
  servings: {
    type: Number,
    required: true,
    min: [1, 'Recipe must serve at least 1 person']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  cuisine: {
    type: String,
    enum: Object.values(Cuisine), 
    required: true,
    index: true  // for filtering
  },
  dietaryInfo: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher'],
    index: true  // for filtering
  }],
  photos: [{
    type: String,  // URLs to photos stored in cloud storage
    required: [true, 'At least one photo is required']
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  calories: {
    type: Number,
    required: false,
    min: [0, 'Calories cannot be negative']
  },
  equipment: [{
    type: String,
    enum: Object.values(Equipment),
    required: [true, 'At least one piece of equipment is required']
  }]
}, {
  timestamps: true
});

// In the future this will allow us to search for recipes by title, difficulty, time, or author
recipeSchema.index({ title: 'text', description: 'text' });
recipeSchema.index({ difficulty: 1 });
recipeSchema.index({ totalTime: 1 });
recipeSchema.index({ author: 1 });

recipeSchema.pre('save', function(next) {
  // Ensure totalTime matches prepTime + cookTime
  if (this.prepTime + this.cookTime !== this.totalTime) {
    this.totalTime = this.prepTime + this.cookTime;
  }
  next();
});

// Export the enums for use in other files
export { Cuisine, Equipment };

// Create and export the Recipe model
export const Recipe = mongoose.model<IRecipe>('Recipe', recipeSchema); 