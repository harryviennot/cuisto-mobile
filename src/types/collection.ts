/**
 * Collection types
 *
 * Virtual collections system:
 * - "extracted" = user_recipe_data WHERE was_extracted = true
 * - "saved" = user_recipe_data WHERE is_favorite = true
 */

import type { Timings } from "./recipe";

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_system: boolean;
  sort_order: number;
  recipe_count: number;
  created_at?: string | null; // Optional for virtual collections
  updated_at?: string | null; // Optional for virtual collections
}

export interface CollectionRecipe {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  servings?: number;
  difficulty?: string;
  tags: string[];
  source_type: string;
  is_public: boolean;
  added_at: string;
  created_at: string;
  timings?: Timings;
}

export interface CollectionWithRecipes {
  collection: Collection;
  recipes: CollectionRecipe[];
  total_count: number;
}

export interface CollectionCountsResponse {
  extracted: number;
  saved: number;
}
