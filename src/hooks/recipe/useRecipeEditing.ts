import { useState, useCallback, useRef, useEffect } from "react";
import type { Recipe } from "@/types/recipe";

/**
 * Hook for managing recipe editing state
 * Handles draft management, validation, and dirty state tracking
 */
export function useRecipeEditing(
  initialRecipe: Recipe | null,
  onSave?: (recipe: Recipe) => Promise<void>,
  onDiscard?: () => void
) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftRecipe, setDraftRecipe] = useState<Recipe | null>(initialRecipe);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Track original recipe for comparison
  const originalRecipeRef = useRef<Recipe | null>(initialRecipe);

  // Update draft when initial recipe changes
  useEffect(() => {
    if (initialRecipe && !isEditing) {
      setDraftRecipe(initialRecipe);
      originalRecipeRef.current = initialRecipe;
    }
  }, [initialRecipe, isEditing]);

  /**
   * Check if recipe has unsaved changes
   */
  const isDirty = useCallback(() => {
    if (!draftRecipe || !originalRecipeRef.current) return false;
    return JSON.stringify(draftRecipe) !== JSON.stringify(originalRecipeRef.current);
  }, [draftRecipe]);

  /**
   * Start editing mode
   */
  const startEditing = useCallback(() => {
    setIsEditing(true);
    setValidationErrors({});
  }, []);

  /**
   * Cancel editing and revert changes
   */
  const cancelEditing = useCallback(() => {
    if (isDirty()) {
      // Could show confirmation dialog here
      const confirmed = window.confirm("Discard unsaved changes?");
      if (!confirmed) return;
    }

    setDraftRecipe(originalRecipeRef.current);
    setIsEditing(false);
    setValidationErrors({});
    onDiscard?.();
  }, [isDirty, onDiscard]);

  /**
   * Update a specific field in the draft recipe
   */
  const updateField = useCallback(<K extends keyof Recipe>(field: K, value: Recipe[K]) => {
    setDraftRecipe((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });

    // Clear validation error for this field
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  /**
   * Update nested fields (like timings)
   */
  const updateNestedField = useCallback(
    <K extends keyof Recipe>(field: K, nestedField: string, value: any) => {
      setDraftRecipe((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [field]: {
            ...(prev[field] as any),
            [nestedField]: value,
          },
        };
      });
    },
    []
  );

  /**
   * Validate recipe before saving
   */
  const validateRecipe = useCallback((recipe: Recipe): boolean => {
    const errors: Record<string, string> = {};

    if (!recipe.title?.trim()) {
      errors.title = "Title is required";
    }

    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      errors.ingredients = "At least one ingredient is required";
    }

    if (!recipe.instructions || recipe.instructions.length === 0) {
      errors.instructions = "At least one instruction is required";
    }

    // Validate servings
    if (recipe.servings && (recipe.servings < 1 || recipe.servings > 100)) {
      errors.servings = "Servings must be between 1 and 100";
    }

    // Validate timings
    if (recipe.timings) {
      if (recipe.timings.prep_time_minutes && recipe.timings.prep_time_minutes < 0) {
        errors.prep_time = "Prep time cannot be negative";
      }
      if (recipe.timings.cook_time_minutes && recipe.timings.cook_time_minutes < 0) {
        errors.cook_time = "Cook time cannot be negative";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  /**
   * Save the recipe
   */
  const saveRecipe = useCallback(async () => {
    if (!draftRecipe) return;

    if (!validateRecipe(draftRecipe)) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave?.(draftRecipe);
      originalRecipeRef.current = draftRecipe;
      setIsEditing(false);
      setValidationErrors({});
    } catch (error) {
      // Handle error (could set error state here)
      console.error("Failed to save recipe:", error);
    } finally {
      setIsSaving(false);
    }
  }, [draftRecipe, validateRecipe, onSave]);

  /**
   * Auto-save functionality (optional)
   */
  const autoSave = useCallback(async () => {
    if (!isDirty() || !draftRecipe || !validateRecipe(draftRecipe)) {
      return;
    }

    await saveRecipe();
  }, [isDirty, draftRecipe, validateRecipe, saveRecipe]);

  return {
    // State
    isEditing,
    draftRecipe,
    isSaving,
    validationErrors,
    isDirty: isDirty(),

    // Actions
    startEditing,
    cancelEditing,
    saveRecipe,
    updateField,
    updateNestedField,
    autoSave,

    // Utilities
    validateRecipe,
  };
}
