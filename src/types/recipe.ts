/**
 * Recipe types
 */

export enum RecipeCategory {
  BREAKFAST = "breakfast",
  LUNCH = "lunch",
  DINNER = "dinner",
  DESSERT = "dessert",
  SNACK = "snack",
  APPETIZER = "appetizer",
  BEVERAGE = "beverage",
  OTHER = "other",
}

export enum DifficultyLevel {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

export interface Ingredient {
  name: string;
  quantity?: string | null;
  unit?: string | null;
  notes?: string | null;
  group?: string | null;
}

export interface Instruction {
  step_number: number;
  title: string;
  description: string;
  timer_minutes?: number | null;
  image_url?: string | null;
  group?: string | null;
}

export interface Timings {
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  total_time_minutes?: number;
}

export interface RatingDistribution {
  "0.5": number;
  "1": number;
  "1.5": number;
  "2": number;
  "2.5": number;
  "3": number;
  "3.5": number;
  "4": number;
  "4.5": number;
  "5": number;
}

export interface UserRecipeData {
  rating?: number;
  custom_prep_time_minutes?: number;
  custom_cook_time_minutes?: number;
  custom_difficulty?: DifficultyLevel;
  notes?: string;
  custom_servings?: number;
  times_cooked: number;
  last_cooked_at?: string;
  is_favorite: boolean;
}

export interface Recipe {
  id: string;
  created_by: string;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  timings?: Timings;
  servings?: number;
  categories?: string[];
  difficulty?: DifficultyLevel;
  tags?: string[];
  image_url?: string;
  source_url?: string;
  source_type?: string;
  is_public?: boolean;
  created_at: string;
  updated_at: string;

  // Rating aggregation
  average_rating?: number;
  rating_count: number;
  rating_distribution?: RatingDistribution;

  // User's personal data
  user_data?: UserRecipeData;
}

export interface RecipeTimingsUpdateRequest {
  prep_time_minutes?: number;
  cook_time_minutes?: number;
}

export interface RecipeTimingsUpdateResponse {
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  total_time_minutes?: number;
  updated_base_recipe: boolean;
}

export interface RecipeRatingUpdateResponse {
  user_rating: number;
  previous_user_rating?: number;
  recipe_average_rating?: number;
  recipe_rating_count: number;
  recipe_rating_distribution?: RatingDistribution;
}
