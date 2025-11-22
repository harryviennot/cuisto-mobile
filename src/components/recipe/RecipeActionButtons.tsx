import "@/global.css";
import { View, Text } from "react-native";
import {
  CheckIcon,
  TrashIcon,
  ShareNetworkIcon,
  PencilIcon,
  PlayIcon,
} from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { ShadowItem } from "@/components/ShadowedSection";

interface RecipeActionButtonsProps {
  onStartCooking: () => void;
  onEdit: () => void;
  onShare: () => void;
  onSaveRecipe: () => void;
  onDecline: () => void;
  isDraft: boolean;
}

export function RecipeActionButtons({
  onStartCooking,
  onEdit,
  onShare,
  onDecline,
  onSaveRecipe,
  isDraft,
}: RecipeActionButtonsProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row gap-3 mb-6">
      {/* Start Cooking Button */}
      {isDraft ? (
        <ShadowItem variant="primary" onPress={onSaveRecipe} className="flex-1 py-4 flex-row">
          <CheckIcon size={20} color="white" weight="bold" />
          <Text className="text-white font-semibold text-base ml-2">
            {t("recipe.actions.saveRecipe")}
          </Text>
        </ShadowItem>
      ) : (
        <ShadowItem variant="primary" onPress={onStartCooking} className="flex-1 py-4 flex-row">
          <PlayIcon size={20} color="white" weight="fill" />
          <Text className="text-white font-semibold text-base ml-2">
            {t("recipe.actions.startCooking")}
          </Text>
        </ShadowItem>
      )}

      {/* Edit Button */}
      <ShadowItem onPress={onEdit} className="w-14 h-14 bg-white">
        <PencilIcon size={20} color="#334d43" weight="regular" />
      </ShadowItem>

      {/* Share Button */}
      {isDraft ? (
        <ShadowItem onPress={onDecline} className="w-14 h-14  border border-danger ">
          <TrashIcon size={20} color="#c65d47" weight="regular" />
        </ShadowItem>
      ) : (
        <ShadowItem onPress={onShare} className="w-14 h-14">
          <ShareNetworkIcon size={20} color="#334d43" weight="regular" />
        </ShadowItem>
      )}
    </View>
  );
}
