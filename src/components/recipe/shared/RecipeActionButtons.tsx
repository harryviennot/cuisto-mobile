import "@/global.css";
import { View, Text, Linking } from "react-native";
import {
  CheckIcon,
  TrashIcon,
  ShareNetworkIcon,
  PencilIcon,
  PlayIcon,
  TiktokLogoIcon,
  InstagramLogoIcon,
  YoutubeLogoIcon,
  LinkIcon
} from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { ShadowItem } from "@/components/ShadowedSection";
import { Skeleton } from "@/components/ui/Skeleton";

interface RecipeActionButtonsProps {
  onStartCooking: () => void;
  onEdit: () => void;
  onShare: () => void;
  onSaveRecipe: () => void;
  onDecline: () => void;
  isDraft: boolean;
  isOwner: boolean;
  isEditing?: boolean;
  isLoading?: boolean;
  platform?: string;
  source_url?: string;
}

export function RecipeActionButtons({
  onStartCooking,
  onEdit,
  onShare,
  onDecline,
  onSaveRecipe,
  isDraft,
  isOwner,
  isEditing = false,
  isLoading = false,
  platform = undefined,
  source_url,
}: RecipeActionButtonsProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View className="flex-row gap-3 mb-6">
        {/* Primary Action Button Skeleton */}
        <Skeleton height={56} borderRadius={12} style={{ flex: 1 }} />
        {/* Secondary Button Skeleton */}
        <Skeleton width={56} height={56} borderRadius={12} />
      </View>
    );
  }

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
        <ShadowItem
          variant="primary"
          onPress={onStartCooking}
          disabled={isEditing}
          className="flex-1 py-4 flex-row"
        >
          <PlayIcon size={20} color="white" weight="fill" />
          <Text className="text-white font-semibold text-base ml-2">
            {t("recipe.actions.startCooking")}
          </Text>
        </ShadowItem>
      )}

      {source_url && (
        <ShadowItem onPress={() => Linking.openURL(source_url)} className="w-14 h-14">
          {platform === "tiktok" && <TiktokLogoIcon size={20} color="#334d43" weight="regular" />}
          {platform === "instagram" && <InstagramLogoIcon size={20} color="#334d43" weight="regular" />}
          {platform === "youtube" && <YoutubeLogoIcon size={20} color="#334d43" weight="regular" />}
          {platform === undefined && <LinkIcon size={20} color="#334d43" weight="regular" />}
        </ShadowItem>
      )
      }

      {/* Edit Button
      {isOwner && !isEditing && (
        <ShadowItem onPress={onEdit} className="w-14 h-14 bg-white">
          <PencilIcon size={20} color="#334d43" weight="regular" />
        </ShadowItem>
      )} */}

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
