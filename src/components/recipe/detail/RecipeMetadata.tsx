import React, { memo } from "react";
import { RecipeRating } from "@/components/recipe/shared/RecipeRating";
import { RecipeQuickInfo } from "@/components/recipe/shared/RecipeQuickInfo";
import { RecipeActionButtons } from "@/components/recipe/shared/RecipeActionButtons";
import { RecipeTags } from "@/components/recipe/shared/RecipeTags";
import { useRouter } from "expo-router";
import type { Recipe } from "@/types/recipe";

interface RecipeMetadataProps {
  recipe: Recipe;
  userRating?: number;
  isOwner: boolean;
  isDraft?: boolean;
  isEditing?: boolean;
  totalTime: number;
  onRatingChange: (rating: number) => void;
  onTimePress: () => void;
  onSave?: () => void;
  onDiscard?: () => void;
  onStartCooking: () => void;
}

export const RecipeMetadata = memo(function RecipeMetadata({
  recipe,
  userRating,
  isOwner,
  isDraft = false,
  isEditing = false,
  totalTime,
  onRatingChange,
  onTimePress,
  onSave,
  onDiscard,
  onStartCooking,
}: RecipeMetadataProps) {
  const router = useRouter();

  return (
    <>
      {/* Rating - Not shown for drafts */}
      {!isDraft && !isEditing && (
        <RecipeRating
          userRating={userRating}
          averageRating={recipe.average_rating}
          ratingCount={recipe.rating_count}
          onRatingChange={onRatingChange}
        />
      )}

      {/* Stats Grid */}
      <RecipeQuickInfo
        time={totalTime}
        difficulty={recipe.difficulty}
        servings={recipe?.servings}
        onTimePress={onTimePress}
        enableUpdate={!isDraft && !isEditing}
      />

      {/* Primary Actions */}
      <RecipeActionButtons
        onDecline={() => onDiscard?.()}
        onSaveRecipe={() => onSave?.()}
        isOwner={isOwner}
        onEdit={() => router.push(`/recipe/${recipe.id}/edit`)}
        onShare={() => {}}
        onStartCooking={onStartCooking}
        isDraft={isDraft}
        isEditing={isEditing}
      />

      {/* Tags */}
      <RecipeTags categories={recipe.categories} tags={recipe.tags} />
    </>
  );
});
