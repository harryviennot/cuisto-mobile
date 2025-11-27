import "@/global.css";
import { View, Text, Pressable } from "react-native";
import { ChefHatIcon, ClockIcon, UsersThreeIcon } from "phosphor-react-native";
import { DifficultyLevel } from "@/types/recipe";
import { useTranslation } from "react-i18next";
import { ShadowItem } from "@/components/ShadowedSection";
import { Skeleton } from "@/components/ui/Skeleton";

interface RecipeQuickInfoProps {
  time: number | undefined;
  difficulty: DifficultyLevel | undefined;
  servings: number | undefined;
  onTimePress: () => void;
  enableUpdate: boolean;
  isLoading?: boolean;
}

export function RecipeQuickInfo({
  time,
  difficulty = DifficultyLevel.MEDIUM,
  servings,
  onTimePress,
  enableUpdate = true,
  isLoading = false,
}: RecipeQuickInfoProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <ShadowItem className="flex-row p-4 mb-4 justify-around">
        {/* Time Skeleton */}
        <View className="items-center flex-1">
          <Skeleton width={20} height={20} borderRadius={4} />
          <Skeleton width={60} height={14} borderRadius={4} style={{ marginTop: 4 }} />
        </View>

        {/* Difficulty Skeleton */}
        <View className="items-center flex-1">
          <Skeleton width={20} height={20} borderRadius={4} />
          <Skeleton width={50} height={14} borderRadius={4} style={{ marginTop: 4 }} />
        </View>

        {/* Servings Skeleton */}
        <View className="items-center flex-1">
          <Skeleton width={20} height={20} borderRadius={4} />
          <Skeleton width={70} height={14} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </ShadowItem>
    );
  }

  return (
    <ShadowItem className="flex-row p-4 mb-4  justify-around">
      {/* Time - Editable */}
      <Pressable onPress={onTimePress} className="items-center flex-1">
        {!enableUpdate && <ClockIcon size={20} color="#6B6456" weight="regular" />}
        <Text className="text-sm text-[#6B6456] mt-1">
          {time} {t("common.min")}
        </Text>
        {enableUpdate && (
          <Text className="text-xs text-[#334d43] font-medium mt-0.5">
            {t("recipe.quickInfo.tapToEdit")}
          </Text>
        )}
      </Pressable>

      {/* Difficulty */}
      <View className="items-center flex-1">
        <ChefHatIcon size={20} color="#6B6456" weight="regular" />
        <Text className="text-sm text-[#6B6456] mt-1">{difficulty}</Text>
      </View>

      {/* Servings */}
      <View className="items-center flex-1">
        <UsersThreeIcon size={20} color="#6B6456" weight="regular" />
        <Text className="text-sm text-[#6B6456] mt-1">
          {servings} {t("common.servings")}
        </Text>
      </View>
    </ShadowItem>
  );
}
