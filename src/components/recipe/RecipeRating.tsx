import "@/global.css";
import { View, Text } from "react-native";
import { StarRating } from "../StarRating";

interface RecipeRatingProps {
  userRating?: number;
  averageRating?: number;
  ratingCount: number;
  onRatingChange: (rating: number) => void;
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
}: RecipeRatingProps) {
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
          {userRating ? "Your Rating" : "Rate Recipe"}
        </Text>
        <StarRating rating={userRating} size={30} editable={true} onRatingChange={onRatingChange} />
      </View>

      {/* Community Rating - Static */}
      <View className="flex  flex-col items-end justify-between gap-2">
        <Text className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
          Average
        </Text>
        <View className="flex-row items-center gap-2">
          {/* Rating Number with superscript decimal */}
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
          <View className="flex flex-col items-center leading-none ">
            <StarRating rating={Math.round(averageRating || 0)} size={12} editable={false} />
            <Text className="text-[10px] text-foreground-tertiary font-medium mt-1">
              {ratingCount > 0
                ? `${ratingCount} ${ratingCount === 1 ? "review" : "reviews"}`
                : "No reviews"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
