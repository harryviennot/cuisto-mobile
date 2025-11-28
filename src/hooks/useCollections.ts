/**
 * useCollections Hook
 *
 * React Query hooks for managing user collections.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collectionService } from "@/api/services/collection.service";
import type {
  Collection,
  CollectionWithRecipes,
  CreateCollectionRequest,
  UpdateCollectionRequest,
} from "@/types/collection";

const COLLECTIONS_KEY = "collections";

/**
 * Hook to fetch all user collections
 */
export function useCollections() {
  return useQuery<Collection[], Error>({
    queryKey: [COLLECTIONS_KEY],
    queryFn: collectionService.getCollections,
  });
}

/**
 * Hook to fetch a single collection with its recipes
 */
export function useCollection(collectionId: string, limit = 20, offset = 0) {
  return useQuery<CollectionWithRecipes, Error>({
    queryKey: [COLLECTIONS_KEY, collectionId, { limit, offset }],
    queryFn: () => collectionService.getCollection(collectionId, limit, offset),
    enabled: !!collectionId,
  });
}

/**
 * Hook to create a new collection
 */
export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateCollectionRequest) => collectionService.createCollection(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] });
    },
  });
}

/**
 * Hook to update a collection
 */
export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      collectionId,
      request,
    }: {
      collectionId: string;
      request: UpdateCollectionRequest;
    }) => collectionService.updateCollection(collectionId, request),
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY, collectionId] });
    },
  });
}

/**
 * Hook to delete a collection
 */
export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collectionId: string) => collectionService.deleteCollection(collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] });
    },
  });
}

/**
 * Hook to add a recipe to a collection
 */
export function useAddToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, recipeId }: { collectionId: string; recipeId: string }) =>
      collectionService.addRecipeToCollection(collectionId, recipeId),
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY, collectionId] });
    },
  });
}

/**
 * Hook to remove a recipe from a collection
 */
export function useRemoveFromCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, recipeId }: { collectionId: string; recipeId: string }) =>
      collectionService.removeRecipeFromCollection(collectionId, recipeId),
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [COLLECTIONS_KEY, collectionId] });
    },
  });
}
