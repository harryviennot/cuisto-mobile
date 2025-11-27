/**
 * Collections service
 */
import { api } from "../api-client";
import type {
  Collection,
  CollectionListResponse,
  CollectionWithRecipes,
  CreateCollectionRequest,
  UpdateCollectionRequest,
} from "@/types/collection";
import type { RecipeSaveResponse, SaveRecipeRequest } from "@/types/extraction";

export const collectionService = {
  /**
   * Get all collections for the current user
   */
  getCollections: async (): Promise<Collection[]> => {
    const response = await api.get<CollectionListResponse>("/collections");
    return response.data.collections;
  },

  /**
   * Get a collection with its recipes
   */
  getCollection: async (
    collectionId: string,
    limit = 20,
    offset = 0
  ): Promise<CollectionWithRecipes> => {
    const response = await api.get<CollectionWithRecipes>(
      `/collections/${collectionId}`,
      { params: { limit, offset } }
    );
    return response.data;
  },

  /**
   * Create a new collection
   */
  createCollection: async (request: CreateCollectionRequest): Promise<Collection> => {
    const response = await api.post<Collection>("/collections", request);
    return response.data;
  },

  /**
   * Update a collection
   */
  updateCollection: async (
    collectionId: string,
    request: UpdateCollectionRequest
  ): Promise<Collection> => {
    const response = await api.patch<Collection>(`/collections/${collectionId}`, request);
    return response.data;
  },

  /**
   * Delete a collection
   */
  deleteCollection: async (collectionId: string): Promise<void> => {
    await api.delete(`/collections/${collectionId}`);
  },

  /**
   * Add a recipe to a collection
   */
  addRecipeToCollection: async (
    collectionId: string,
    recipeId: string
  ): Promise<RecipeSaveResponse> => {
    const request: SaveRecipeRequest = { recipe_id: recipeId };
    const response = await api.post<RecipeSaveResponse>(
      `/collections/${collectionId}/recipes`,
      request
    );
    return response.data;
  },

  /**
   * Remove a recipe from a collection
   */
  removeRecipeFromCollection: async (
    collectionId: string,
    recipeId: string
  ): Promise<void> => {
    await api.delete(`/collections/${collectionId}/recipes/${recipeId}`);
  },
};
