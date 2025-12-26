/**
 * Zod validation schemas for recipe editing
 */
import { z } from "zod";
import { DifficultyLevel } from "@/types/recipe";

// Main info schema
export const recipeMainInfoSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  image_url: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

export type RecipeMainInfoFormData = z.infer<typeof recipeMainInfoSchema>;

// Metadata schema
export const recipeMetadataSchema = z.object({
  servings: z
    .number()
    .int("Servings must be a whole number")
    .min(1, "Servings must be at least 1")
    .max(100, "Servings must be less than 100"),
  prep_time_minutes: z
    .number()
    .int("Prep time must be a whole number")
    .min(0, "Prep time cannot be negative")
    .max(1440, "Prep time must be less than 24 hours"),
  cook_time_minutes: z
    .number()
    .int("Cook time must be a whole number")
    .min(0, "Cook time cannot be negative")
    .max(1440, "Cook time must be less than 24 hours"),
  difficulty: z.nativeEnum(DifficultyLevel, {
    message: "Please select a difficulty level",
  }),
});

export type RecipeMetadataFormData = z.infer<typeof recipeMetadataSchema>;

// Category and tags schema
export const recipeCategoriesTagsSchema = z.object({
  category_slug: z.string().nullable().optional(), // Single category slug
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed"),
});

export type RecipeCategoriesTagsFormData = z.infer<typeof recipeCategoriesTagsSchema>;

// Ingredient schema
export const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  quantity: z.union([z.string(), z.null(), z.undefined()]).optional(),
  unit: z.union([z.string(), z.null(), z.undefined()]).optional(),
  notes: z.union([z.string(), z.null(), z.undefined()]).optional(),
  group: z.union([z.string(), z.null(), z.undefined()]).optional(),
});

export const ingredientsArraySchema = z
  .array(ingredientSchema)
  .min(1, "At least one ingredient is required");

export type IngredientFormData = z.infer<typeof ingredientSchema>;

// Instruction schema
export const instructionSchema = z.object({
  step_number: z
    .number()
    .int("Step number must be a whole number")
    .min(1, "Step number must be at least 1"),
  title: z
    .string()
    .min(1, "Instruction title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .min(1, "Instruction description is required")
    .max(2000, "Description must be less than 2000 characters"),
  timer_minutes: z
    .union([
      z
        .number()
        .int("Timer must be a whole number")
        .min(0, "Timer cannot be negative")
        .max(1440, "Timer must be less than 24 hours"),
      z.null(),
      z.undefined(),
    ])
    .optional(),
  image_url: z
    .union([z.string().url("Invalid image URL"), z.literal(""), z.null(), z.undefined()])
    .optional(),
  group: z.union([z.string(), z.null(), z.undefined()]).optional(),
});

export const instructionsArraySchema = z
  .array(instructionSchema)
  .min(1, "At least one instruction is required");

export type InstructionFormData = z.infer<typeof instructionSchema>;

// Complete recipe edit schema (combination of all, for single form)
export const recipeEditSchema = z.object({
  // Main info
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  image_url: z.string().url("Invalid image URL").optional().or(z.literal("")),

  // Metadata
  servings: z
    .number()
    .int("Servings must be a whole number")
    .min(1, "Servings must be at least 1")
    .max(100, "Servings must be less than 100"),
  prep_time_minutes: z
    .number()
    .int("Prep time must be a whole number")
    .min(0, "Prep time cannot be negative")
    .max(1440, "Prep time must be less than 24 hours"),
  cook_time_minutes: z
    .number()
    .int("Cook time must be a whole number")
    .min(0, "Cook time cannot be negative")
    .max(1440, "Cook time must be less than 24 hours"),
  difficulty: z.nativeEnum(DifficultyLevel, {
    message: "Please select a difficulty level",
  }),

  // Category and tags
  category_slug: z.string().nullable().optional(), // Single category slug
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed"),

  // Ingredients
  ingredients: ingredientsArraySchema,

  // Instructions
  instructions: instructionsArraySchema,
});

export type RecipeEditFormData = z.infer<typeof recipeEditSchema>;
