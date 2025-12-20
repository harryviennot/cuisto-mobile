import "@/global.css";
import { View, Text, Linking } from "react-native";
import {
  CheckIcon,
  XIcon,
  ShareNetworkIcon,
  // PencilIcon,
  FacebookLogoIcon,
  PlayIcon,
  TiktokLogoIcon,
  InstagramLogoIcon,
  YoutubeLogoIcon,
  LinkIcon,
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
  isEditing = false,
  platform = undefined,
  source_url,
}: RecipeActionButtonsProps) {
  const { t } = useTranslation();

  console.log("source_url", source_url);
  console.log("platform", platform);

  return (
    <View className="flex-row gap-3 mb-6">
      {/* Start Cooking Button */}
      {isDraft ? (
        <ShadowItem variant="primary" onPress={onSaveRecipe} className="flex-1 py-4 flex-row">
          <CheckIcon size={20} color="white" weight="bold" />
          <Text className="text-white font-semibold text-base ml-2" adjustsFontSizeToFit numberOfLines={1}>
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
          <Text className="text-white font-semibold text-base ml-2" adjustsFontSizeToFit numberOfLines={1}>
            {t("recipe.actions.startCooking")}
          </Text>
        </ShadowItem>
      )}

      {source_url && platform && (
        <ShadowItem
          onPress={() => Linking.openURL(source_url)}
          className="aspect-square"
          disabled={!source_url || isEditing || isDraft}
        >
          {platform === "tiktok" && <TiktokLogoIcon size={20} color="#334d43" weight="regular" />}
          {platform === "instagram" && (
            <InstagramLogoIcon size={20} color="#334d43" weight="regular" />
          )}
          {platform === "youtube" && <YoutubeLogoIcon size={20} color="#334d43" weight="regular" />}
          {platform === "facebook" && <FacebookLogoIcon size={20} color="#334d43" weight="regular" />}
          {platform === null && <LinkIcon size={20} color="#334d43" weight="regular" />}
        </ShadowItem>
      )}

      {/* Share Button */}
      {isDraft ? (
        <ShadowItem onPress={onDecline} className=" aspect-square border border-danger ">
          <XIcon size={20} color="#c65d47" weight="regular" />
        </ShadowItem>
      ) : (
        <ShadowItem onPress={onShare} className=" aspect-square">
          <ShareNetworkIcon size={20} color="#334d43" weight="regular" />
        </ShadowItem>
      )}
    </View>
  );
}
