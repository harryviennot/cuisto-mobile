import React from "react";
import { View, Text, Pressable, TextInput as RNTextInput } from "react-native";
import { XIcon, PlusIcon } from "phosphor-react-native";
import { ShadowItem } from "@/components/ShadowedSection";
import { useDeviceType } from "@/hooks/useDeviceType";
import { cn } from "@/utils/cn";

export interface FormGroupInputProps {
  label: string;
  placeholder: string;
  items: string[];
  newItemValue: string;
  onNewItemChange: (value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (item: string) => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  maxItems?: number;
  /** Prefix to show before each item (e.g., "#" for tags) */
  itemPrefix?: string;
  className?: string;
}

export function FormGroupInput({
  label,
  placeholder,
  items,
  newItemValue,
  onNewItemChange,
  onAddItem,
  onRemoveItem,
  autoCapitalize = "words",
  maxItems,
  itemPrefix,
  className,
}: FormGroupInputProps) {
  const { isTablet } = useDeviceType();

  const canAdd = newItemValue.trim() && !items.includes(newItemValue.trim());
  const isDisabled = !canAdd || (maxItems !== undefined && items.length >= maxItems);

  return (
    <View className={cn("", className)}>
      <Text className="font-bold shrink-0 text-sm uppercase tracking-widest text-foreground-tertiary mb-2">
        {label}
      </Text>

      {/* Add Item Input */}
      <View className={`mb-3 flex-row ${isTablet ? "gap-4" : "gap-2"}`}>
        <View className="flex-1">
          <RNTextInput
            value={newItemValue}
            onChangeText={onNewItemChange}
            onSubmitEditing={onAddItem}
            placeholder={placeholder}
            placeholderTextColor="#a89f8d"
            className="rounded-xl border border-border-button bg-white px-4 py-3.5 text-base text-foreground"
            returnKeyType="done"
            autoCapitalize={autoCapitalize}
          />
        </View>

        <ShadowItem
          variant="primary"
          className={`items-center justify-center rounded-xl px-4 ${
            isDisabled ? "opacity-50" : ""
          }`}
          onPress={onAddItem}
          disabled={isDisabled}
        >
          <PlusIcon size={20} color="#FFFFFF" weight="bold" />
        </ShadowItem>
      </View>

      {/* Current Items with Green Tint */}
      {items.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {items.map((item) => (
            <ShadowItem
              key={item}
              className="flex-row items-center gap-2 rounded-full bg-primary/5 border border-primary/20 px-3.5 py-2"
            >
              <Text className="text-sm font-medium text-foreground">
                {itemPrefix}
                {item}
              </Text>
              <Pressable
                onPress={() => onRemoveItem(item)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <XIcon size={16} color="#334d43" weight="bold" />
              </Pressable>
            </ShadowItem>
          ))}
        </View>
      )}
    </View>
  );
}
