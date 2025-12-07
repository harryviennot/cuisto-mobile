/**
 * DiscoverySections
 *
 * Discovery section components for the home page.
 * Each section uses the generic HorizontalPreviewSection component.
 */
import React from "react";
import { useRouter } from "expo-router";
import { HorizontalPreviewSection } from "@/components/ui/HorizontalPreviewSection";
import { DiscoveryRecipeCard, DiscoveryRecipeCardSkeleton } from "./DiscoveryRecipeCard";
import type { Recipe } from "@/types/recipe";
import type { TrendingRecipe, ExtractedRecipe, DiscoverySectionType } from "@/types/discovery";
import { DISCOVERY_CONSTANTS } from "@/types/discovery";

const CARD_WIDTH = 140;

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

  const handleSeeMore = () => {
    router.push("/discovery/trending");
  };

  return (
    <HorizontalPreviewSection<TrendingRecipe>
      title="Trending This Week"
      data={data as TrendingRecipe[] | undefined}
      renderItem={(recipe) => (
        <DiscoveryRecipeCard recipe={recipe} width={CARD_WIDTH} />
      )}
      keyExtractor={(recipe) => recipe.id}
      onSeeMore={handleSeeMore}
      isLoading={isLoading}
      isError={isError}
      SkeletonComponent={DiscoveryRecipeCardSkeleton}
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

  const handleSeeMore = () => {
    router.push("/discovery/socials");
  };

  return (
    <HorizontalPreviewSection<ExtractedRecipe>
      title="Trending on Socials"
      data={data as ExtractedRecipe[] | undefined}
      renderItem={(recipe) => (
        <DiscoveryRecipeCard recipe={recipe} width={CARD_WIDTH} />
      )}
      keyExtractor={(recipe) => recipe.id}
      onSeeMore={handleSeeMore}
      isLoading={isLoading}
      isError={isError}
      SkeletonComponent={DiscoveryRecipeCardSkeleton}
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

  const handleSeeMore = () => {
    router.push("/discovery/online");
  };

  return (
    <HorizontalPreviewSection<ExtractedRecipe>
      title="Popular Recipes Online"
      data={data as ExtractedRecipe[] | undefined}
      renderItem={(recipe) => (
        <DiscoveryRecipeCard recipe={recipe} width={CARD_WIDTH} />
      )}
      keyExtractor={(recipe) => recipe.id}
      onSeeMore={handleSeeMore}
      isLoading={isLoading}
      isError={isError}
      SkeletonComponent={DiscoveryRecipeCardSkeleton}
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

  const handleSeeMore = () => {
    router.push("/discovery/rated");
  };

  return (
    <HorizontalPreviewSection<Recipe>
      title="Highest Rated"
      data={data}
      renderItem={(recipe) => (
        <DiscoveryRecipeCard recipe={recipe} width={CARD_WIDTH} />
      )}
      keyExtractor={(recipe) => recipe.id}
      onSeeMore={handleSeeMore}
      isLoading={isLoading}
      isError={isError}
      SkeletonComponent={DiscoveryRecipeCardSkeleton}
      minItems={DISCOVERY_CONSTANTS.MIN_SECTION_RECIPES}
      cardWidth={CARD_WIDTH}
      style={{ marginBottom: 24 }}
    />
  );
}
