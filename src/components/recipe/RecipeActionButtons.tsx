import "@/global.css";
import { View, Pressable, Text } from "react-native";
import {
  CheckIcon,
  TrashIcon,
  ShareNetworkIcon,
  PencilIcon,
  PlayIcon,
} from "phosphor-react-native";

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
  return (
    <View className="flex-row gap-3 mb-6">
      {/* Start Cooking Button */}
      {isDraft ? (
        <Pressable
          onPress={onSaveRecipe}
          className="flex-1 bg-primary py-4 rounded-lg flex-row items-center justify-center"
          style={{
            shadowColor: "#334d43",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
          }}
        >
          <CheckIcon size={20} color="white" weight="fill" />
          <Text className="text-white font-semibold text-base ml-2">Save Recipe</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={onStartCooking}
          className="flex-1 bg-primary py-4 rounded-lg flex-row items-center justify-center"
          style={{
            shadowColor: "#334d43",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
          }}
        >
          <PlayIcon size={20} color="white" weight="fill" />
          <Text className="text-white font-semibold text-base ml-2">Start Cooking</Text>
        </Pressable>
      )}

      {/* Edit Button */}
      <Pressable
        onPress={onEdit}
        className="w-14 h-14 bg-white rounded-lg items-center justify-center"
        style={{
          borderWidth: 1,
          borderColor: "#E8E3D6",
          shadowColor: "#2C2416",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        }}
      >
        <PencilIcon size={20} color="#334d43" weight="regular" />
      </Pressable>

      {/* Share Button */}
      {isDraft ? (
        <Pressable
          onPress={onDecline}
          className="w-14 h-14 bg-white rounded-lg items-center justify-center"
          style={{
            borderWidth: 1,
            borderColor: "#E8E3D6",
            shadowColor: "#2C2416",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
          }}
        >
          <TrashIcon size={20} color="#334d43" weight="regular" />
        </Pressable>
      ) : (
        <Pressable
          onPress={onShare}
          className="w-14 h-14 bg-white rounded-lg items-center justify-center"
          style={{
            borderWidth: 1,
            borderColor: "#E8E3D6",
            shadowColor: "#2C2416",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
          }}
        >
          <ShareNetworkIcon size={20} color="#334d43" weight="regular" />
        </Pressable>
      )}
    </View>
  );
}
