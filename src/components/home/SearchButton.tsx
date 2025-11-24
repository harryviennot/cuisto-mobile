/**
 * SearchButton component - looks like SearchBar but acts as a button
 * Used on home page to navigate to search overlay
 */
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MagnifyingGlass } from "phosphor-react-native";

interface SearchButtonProps {
  onPress: () => void;
  placeholder?: string;
}

export function SearchButton({ onPress, placeholder }: SearchButtonProps) {
  const { t } = useTranslation();

  // Use translation as default placeholder
  const placeholderText = placeholder || t("search.placeholder");

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3 rounded-xl bg-surface-elevated border border-border active:border-primary"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
      }}
    >
      {/* Search Icon */}
      <MagnifyingGlass size={20} color="#5a4f3e" weight="duotone" />

      {/* Placeholder Text */}
      <Text className="flex-1 ml-3 text-base text-foreground-secondary font-regular">
        {placeholderText}
      </Text>

      {/* Reserved space to match SearchBar layout */}
      <View style={{ width: 32, height: 32 }} />
    </Pressable>
  );
}
