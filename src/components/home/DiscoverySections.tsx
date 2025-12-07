/**
 * DiscoverySections
 *
 * Discovery section components for the home page.
 * Each section uses the generic HorizontalPreviewSection component.
 */
import React from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { HorizontalPreviewSection } from "@/components/ui/HorizontalPreviewSection";
import { RecipeCard, RecipeCardSkeleton } from "@/components/recipe/RecipeCard";
import type { Recipe } from "@/types/recipe";
import type { TrendingRecipe, ExtractedRecipe } from "@/types/discovery";
import { DISCOVERY_CONSTANTS } from "@/types/discovery";

const CARD_WIDTH = 280;
const CARD_IMAGE_HEIGHT = 160;

interface DiscoverySectionProps {
  data: Recipe[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Trending This Week section - most cooked recipes
 */
export function TrendingThisWeekSection({
  data,
  isLoading,
  isError,
}: DiscoverySectionProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handleSeeMore = () => {
    router.push("/discovery/trending");
  };

  return (
    <HorizontalPreviewSection<TrendingRecipe>
      title={t("discovery.sections.trending.title")}
      data={data as TrendingRecipe[] | undefined}
      renderItem={(recipe, index) => (
        <RecipeCard
          recipe={recipe}
          index={index}
          width={CARD_WIDTH}
          imageHeight={CARD_IMAGE_HEIGHT}
          statsBadge={{
            type: "cooking",
            count: recipe.cooking_stats?.cook_count ?? 0,
          }}
        />
      )}
      keyExtractor={(recipe) => recipe.id}
      onSeeMore={handleSeeMore}
      isLoading={isLoading}
      isError={isError}
      SkeletonComponent={() => (
        <RecipeCardSkeleton width={CARD_WIDTH} imageHeight={CARD_IMAGE_HEIGHT} />
      )}
      minItems={DISCOVERY_CONSTANTS.MIN_SECTION_RECIPES}
      cardWidth={CARD_WIDTH}
      style={{ marginBottom: 24 }}
    />
  );
}

/**
 * Trending on Socials section - most extracted from video sources
 */
export function TrendingOnSocialsSection({
  data,
  isLoading,
  isError,
}: DiscoverySectionProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handleSeeMore = () => {
    router.push("/discovery/socials");
  };

  return (
    <HorizontalPreviewSection<ExtractedRecipe>
      title={t("discovery.sections.socials.title")}
      data={data as ExtractedRecipe[] | undefined}
      renderItem={(recipe, index) => (
        <RecipeCard
          recipe={recipe}
          index={index}
          width={CARD_WIDTH}
          imageHeight={CARD_IMAGE_HEIGHT}
          statsBadge={{
            type: "extraction",
            count: recipe.extraction_stats?.extraction_count ?? 0,
          }}
        />
      )}
      keyExtractor={(recipe) => recipe.id}
      onSeeMore={handleSeeMore}
      isLoading={isLoading}
      isError={isError}
      SkeletonComponent={() => (
        <RecipeCardSkeleton width={CARD_WIDTH} imageHeight={CARD_IMAGE_HEIGHT} />
      )}
      minItems={DISCOVERY_CONSTANTS.MIN_SECTION_RECIPES}
      cardWidth={CARD_WIDTH}
      style={{ marginBottom: 24 }}
    />
  );
}

/**
 * Popular Recipes Online section - most extracted from website sources
 */
export function PopularOnlineSection({
  data,
  isLoading,
  isError,
}: DiscoverySectionProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handleSeeMore = () => {
    router.push("/discovery/online");
  };

  return (
    <HorizontalPreviewSection<ExtractedRecipe>
      title={t("discovery.sections.online.title")}
      data={data as ExtractedRecipe[] | undefined}
      renderItem={(recipe, index) => (
        <RecipeCard
          recipe={recipe}
          index={index}
          width={CARD_WIDTH}
          imageHeight={CARD_IMAGE_HEIGHT}
          statsBadge={{
            type: "extraction",
            count: recipe.extraction_stats?.extraction_count ?? 0,
          }}
        />
      )}
      keyExtractor={(recipe) => recipe.id}
      onSeeMore={handleSeeMore}
      isLoading={isLoading}
      isError={isError}
      SkeletonComponent={() => (
        <RecipeCardSkeleton width={CARD_WIDTH} imageHeight={CARD_IMAGE_HEIGHT} />
      )}
      minItems={DISCOVERY_CONSTANTS.MIN_SECTION_RECIPES}
      cardWidth={CARD_WIDTH}
      style={{ marginBottom: 24 }}
    />
  );
}

/**
 * Highest Rated section - top rated public recipes
 */
export function HighestRatedSection({
  data,
  isLoading,
  isError,
}: DiscoverySectionProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handleSeeMore = () => {
    router.push("/discovery/rated");
  };

  return (
    <HorizontalPreviewSection<Recipe>
      title={t("discovery.sections.rated.title")}
      data={data}
      renderItem={(recipe, index) => (
        <RecipeCard
          recipe={recipe}
          index={index}
          width={CARD_WIDTH}
          imageHeight={CARD_IMAGE_HEIGHT}
        />
      )}
      keyExtractor={(recipe) => recipe.id}
      onSeeMore={handleSeeMore}
      isLoading={isLoading}
      isError={isError}
      SkeletonComponent={() => (
        <RecipeCardSkeleton width={CARD_WIDTH} imageHeight={CARD_IMAGE_HEIGHT} />
      )}
      minItems={DISCOVERY_CONSTANTS.MIN_SECTION_RECIPES}
      cardWidth={CARD_WIDTH}
      style={{ marginBottom: 24 }}
    />
  );
}
