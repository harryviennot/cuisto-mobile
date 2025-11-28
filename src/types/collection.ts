/**
 * Collection types
 */

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_system: boolean;
  sort_order: number;
  recipe_count: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionListResponse {
  collections: Collection[];
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
}

export interface CollectionWithRecipes {
  collection: Collection;
  recipes: CollectionRecipe[];
  total_count: number;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  sort_order?: number;
}
