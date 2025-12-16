import "@/global.css";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { StarRating } from "@/components/StarRating";

interface RecipeRatingProps {
  userRating?: number;
  averageRating?: number;
  ratingCount: number;
  onRatingChange: (rating: number) => void;
  showAverageRating?: boolean;
}

/**
 * Recipe rating component with interactive user rating and static average rating display
 * Left side: Interactive user rating with hover states
 * Right side: Community average rating (static display)
 */
export function RecipeRating({
  userRating = 0,
  averageRating,
  ratingCount,
  onRatingChange,
  showAverageRating = true,
}: RecipeRatingProps) {
  const { t } = useTranslation();

  // Split the rating into integer and decimal parts for custom positioning
  const ratingValue = averageRating ? averageRating.toFixed(1) : "—";
  const [integerPart, decimalPart] = ratingValue.includes(".")
    ? ratingValue.split(".")
    : [ratingValue, null];

  return (
    <View className="flex-row items-start justify-between mb-6">
      {/* User Rating - Interactive */}
      <View className="flex flex-col gap-2">
        <Text className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
          {userRating ? t("recipe.rating.yourRating") : t("recipe.rating.rateRecipe")}
        </Text>
        <StarRating rating={userRating} size={30} editable={true} onRatingChange={onRatingChange} />
      </View>

      {/* Community Rating - Static */}
      {showAverageRating && (
        <View className="flex  flex-col items-end justify-between gap-2">
          <Text className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
            {t("recipe.rating.average")}
          </Text>
          <View className="flex-row items-center gap-2">
            {/* Rating Number with superscript decimal */}
            {averageRating && ratingCount > 0 && (
              <View className="flex-row items-end">
                <Text
                  className="font-playfair-bold text-3xl text-foreground-heading leading-none"
                  style={{ fontFamily: "PlayfairDisplay_700Bold" }}
                >
                  {integerPart}
                </Text>
                {decimalPart && (
                  <Text
                    className="font-playfair-bold text-3xl text-foreground-heading leading-none mb-1"
                    style={{ fontFamily: "PlayfairDisplay_700Bold" }}
                  >
                    .{decimalPart}
                  </Text>
                )}
              </View>
            )}
            <View className="flex flex-col items-center leading-none ">
              <StarRating rating={Math.round(averageRating || 0)} size={12} editable={false} />
              <Text className="text-[10px] text-foreground-tertiary font-medium mt-1">
                {ratingCount > 0
                  ? `${ratingCount} ${ratingCount === 1 ? t("recipe.rating.review") : t("recipe.rating.reviews")}`
                  : t("recipe.rating.noReviews")}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
