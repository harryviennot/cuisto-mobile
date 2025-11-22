import "@/global.css";
import { View, Pressable, PanResponder } from "react-native";
import { StarIcon } from "phosphor-react-native";
import { useState, useRef, useMemo } from "react";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  editable?: boolean;
}

export function StarRating({
  rating,
  onRatingChange = () => {},
  size = 32,
  editable = true,
}: StarRatingProps) {
  const [displayRating, setDisplayRating] = useState(rating);
  const containerRef = useRef<View>(null);
  const containerX = useRef(0);
  const containerWidth = useRef(0);
  const lastRating = useRef(rating);

  // Measure container position and size
  const onLayout = () => {
    containerRef.current?.measureInWindow((x, _y, width) => {
      containerX.current = x;
      containerWidth.current = width;
    });
  };

  const calculateRating = (pageX: number) => {
    const relativeX = pageX - containerX.current;
    const percentage = relativeX / containerWidth.current;
    const clampedPercentage = Math.max(0, Math.min(1, percentage));
    const rawRating = clampedPercentage * 5;
    const roundedRating = Math.round(rawRating * 2) / 2;
    return Math.max(0, Math.min(5, roundedRating));
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => editable,
        onMoveShouldSetPanResponder: () => editable,
        onPanResponderGrant: (evt) => {
          const newRating = calculateRating(evt.nativeEvent.pageX);
          setDisplayRating(newRating);
          lastRating.current = newRating;
        },
        onPanResponderMove: (evt) => {
          const newRating = calculateRating(evt.nativeEvent.pageX);
          setDisplayRating(newRating);
          lastRating.current = newRating;
        },
        onPanResponderRelease: () => {
          onRatingChange(lastRating.current);
        },
      }),
    [editable, onRatingChange]
  );

  const handleStarPress = (position: number) => {
    if (!editable) return;

    let newRating;
    if (rating === position) {
      newRating = position - 1;
    } else if (rating === position - 0.5) {
      newRating = position;
    } else {
      newRating = position - 0.5;
    }

    setDisplayRating(newRating);
    onRatingChange(newRating);
  };

  const currentRating = displayRating;

  return (
    <View
      ref={containerRef}
      className="flex-row items-center gap"
      onLayout={onLayout}
      {...panResponder.panHandlers}
    >
      {[1, 2, 3, 4, 5].map((position) => {
        const starValue = currentRating >= position ? 1 : currentRating >= position - 0.5 ? 0.5 : 0;

        return (
          <Pressable
            key={position}
            onPress={() => handleStarPress(position)}
            className="relative"
            style={{ width: size, height: size }}
            disabled={!editable}
          >
            {/* Background empty star */}
            <StarIcon size={size} color="#E8B44F" weight="regular" />

            {/* Half star overlay - positioned absolutely on top */}
            {starValue === 0.5 && (
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: size / 2,
                  height: size,
                  overflow: "hidden",
                }}
              >
                <StarIcon size={size} color="#E8B44F" weight="fill" />
              </View>
            )}

            {/* Full star overlay */}
            {starValue === 1 && (
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: size,
                  height: size,
                }}
              >
                <StarIcon size={size} color="#E8B44F" weight="fill" />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
