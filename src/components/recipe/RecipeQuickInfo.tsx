import "@/global.css";
import { View, Text, Pressable } from "react-native";
import { ChefHatIcon, UsersThreeIcon } from "phosphor-react-native";
import { DifficultyLevel } from "@/types/recipe";
import { useTranslation } from "react-i18next";

interface RecipeQuickInfoProps {
  time: number | undefined;
  difficulty: DifficultyLevel | undefined;
  servings: number | undefined;
  onTimePress: () => void;
}

export function RecipeQuickInfo({
  time,
  difficulty = DifficultyLevel.MEDIUM,
  servings,
  onTimePress,
}: RecipeQuickInfoProps) {
  const { t } = useTranslation();

  return (
    <View
      className="bg-white rounded-lg p-4 mb-4"
      style={{
        borderWidth: 1,
        borderColor: "#E8E3D6",
        shadowColor: "#2C2416",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      }}
    >
      <View className="flex-row items-center justify-around">
        {/* Time - Editable */}
        <Pressable onPress={onTimePress} className="items-center flex-1">
          <Text className="text-sm text-[#6B6456] mt-1">{time} {t("common.min")}</Text>
          <Text className="text-xs text-[#334d43] font-medium mt-0.5">{t("recipe.quickInfo.tapToEdit")}</Text>
        </Pressable>

        {/* Difficulty */}
        <View className="items-center flex-1">
          <ChefHatIcon size={20} color="#6B6456" weight="regular" />
          <Text className="text-sm text-[#6B6456] mt-1">{difficulty}</Text>
        </View>

        {/* Servings */}
        <View className="items-center flex-1">
          <UsersThreeIcon size={20} color="#6B6456" weight="regular" />
          <Text className="text-sm text-[#6B6456] mt-1">{servings} {t("common.servings")}</Text>
        </View>
      </View>
    </View>
  );
}
