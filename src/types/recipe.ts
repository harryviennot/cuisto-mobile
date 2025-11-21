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
  quantity?: string;
  unit?: string;
  notes?: string;
  group?: string;
}

export interface Instruction {
  step_number: number;
  title: string;
  description: string;
  timer_minutes?: number;
  image_url?: string;
  group?: string;
}

export interface Timings {
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  total_time_minutes?: number;
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
}
