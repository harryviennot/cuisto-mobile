import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { Controller, Control } from "react-hook-form";
import { Camera } from "phosphor-react-native";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";

import { TextInput } from "@/components/forms/TextInput";
import { ShadowItem } from "@/components/ShadowedSection";
import type { RecipeEditFormData } from "@/schemas/recipe.schema";

interface RecipeMainInfoFormProps {
  control: Control<RecipeEditFormData>;
}

export function RecipeMainInfoForm({ control }: RecipeMainInfoFormProps) {
  const { t } = useTranslation();

  const pickImage = async (onChange: (value: string) => void) => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert(t("recipe.edit.permissionsDenied"));
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // TODO: Upload image to Supabase Storage and get URL
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View>
      {/* Recipe Image */}
      <Controller
        control={control}
        name="image_url"
        render={({ field: { onChange, value } }) => (
          <Pressable onPress={() => pickImage(onChange)} className="mb-6">
            <ShadowItem className="overflow-hidden rounded-xl">
              {value ? (
                <View className="relative aspect-[4/1] w-full">
                  <Image source={{ uri: value }} className="h-full w-full" resizeMode="cover" />
                  <View className="absolute inset-0 items-center justify-center bg-black/40">
                    <Camera size={32} color="#FFFFFF" weight="bold" />
                    <Text className="mt-2 text-sm font-semibold text-white">{t("recipe.edit.changePhoto")}</Text>
                  </View>
                </View>
              ) : (
                <View className="aspect-[3/2] w-full items-center justify-center bg-surface-texture-light">
                  <Camera size={48} color="#334d43" weight="bold" />
                  <Text className="mt-3 text-sm font-semibold text-foreground-heading">
                    {t("recipe.edit.addPhoto")}
                  </Text>
                </View>
              )}
            </ShadowItem>
          </Pressable>
        )}
      />

      {/* Title Input */}
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <TextInput
            label={t("recipe.edit.recipeTitle")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            placeholder={t("recipe.edit.recipeTitlePlaceholder")}
            autoCapitalize="words"
          />
        )}
      />

      {/* Description Input */}
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <TextInput
            label={t("recipe.edit.description")}
            value={value || ""}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            placeholder={t("recipe.edit.descriptionPlaceholder")}
            multiline
            numberOfLines={4}
            inputClassName="min-h-[100px] py-3"
            textAlignVertical="top"
          />
        )}
      />
    </View>
  );
}
