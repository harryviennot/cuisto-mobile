import "@/global.css";
import { View, Text, Pressable } from "react-native";
import { Star } from "phosphor-react-native";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
  editable?: boolean;
}

export function StarRating({
  rating,
  onRatingChange,
  size = 32,
  editable = true,
}: StarRatingProps) {
  const handleStarPress = (position: number) => {
    if (!editable) return;

    // Cycle through: empty → half → full → empty
    if (rating === position) {
      // Full star, clear it
      onRatingChange(position - 1);
    } else if (rating === position - 0.5) {
      // Half star, make it full
      onRatingChange(position);
    } else {
      // Empty or lower, make it half
      onRatingChange(position - 0.5);
    }
  };

  return (
    <View className="flex-row items-center gap-2">
      {[1, 2, 3, 4, 5].map((position) => {
        const starValue = rating >= position ? 1 : rating >= position - 0.5 ? 0.5 : 0;

        return (
          <Pressable
            key={position}
            onPress={() => handleStarPress(position)}
            className="relative"
            style={{ width: size, height: size }}
            disabled={!editable}
          >
            {/* Background empty star */}
            <View className="absolute inset-0 items-center justify-center">
              <Star size={size} color="#E8B44F" weight="regular" />
            </View>

            {/* Half star overlay */}
            {starValue === 0.5 && (
              <View
                className="absolute left-0 top-0 bottom-0 overflow-hidden justify-center"
                style={{ width: size / 2 }}
              >
                <Star size={size} color="#E8B44F" weight="fill" />
              </View>
            )}

            {/* Full star overlay */}
            {starValue === 1 && (
              <View className="absolute inset-0 items-center justify-center">
                <Star size={size} color="#E8B44F" weight="fill" />
              </View>
            )}
          </Pressable>
        );
      })}
      <Text className="text-base text-[#2C2416] font-medium ml-1">
        {rating > 0 ? rating.toFixed(1) : "Tap to rate"}
      </Text>
    </View>
  );
}
