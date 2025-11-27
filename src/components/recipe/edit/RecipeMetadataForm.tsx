import React from "react";
import { View, Text, Pressable } from "react-native";
import { Control, useController } from "react-hook-form";
import { MinusIcon, PlusIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";

import { ShadowItem } from "@/components/ShadowedSection";
import { TimeAdjuster } from "@/components/recipe/shared/TimeAdjuster";
import { DifficultyLevel } from "@/types/recipe";
import type { RecipeEditFormData } from "@/schemas/recipe.schema";

const formatTime = (minutes: number) => {
  if (minutes === 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

interface RecipeMetadataFormProps {
  control: Control<RecipeEditFormData, any>;
}

export function RecipeMetadataForm({ control }: RecipeMetadataFormProps) {
  const { t } = useTranslation();

  const difficultyOptions: { label: string; value: DifficultyLevel; color: string }[] = [
    { label: t("recipe.difficulty.easy"), value: DifficultyLevel.EASY, color: "#10b981" },
    { label: t("recipe.difficulty.medium"), value: DifficultyLevel.MEDIUM, color: "#f59e0b" },
    { label: t("recipe.difficulty.hard"), value: DifficultyLevel.HARD, color: "#ef4444" },
  ];

  const {
    field: { value: servings, onChange: onServingsChange },
    fieldState: { error: servingsError },
  } = useController({ control, name: "servings" });

  const {
    field: { value: prepTime, onChange: onPrepTimeChange },
    fieldState: { error: prepTimeError },
  } = useController({ control, name: "prep_time_minutes" });

  const {
    field: { value: cookTime, onChange: onCookTimeChange },
    fieldState: { error: cookTimeError },
  } = useController({ control, name: "cook_time_minutes" });

  const {
    field: { value: difficulty, onChange: onDifficultyChange },
    fieldState: { error: difficultyError },
  } = useController({ control, name: "difficulty" });

  return (
    <View className="gap-2">
      {/* Section Header */}
      <Text
        className="font-playfair-bold mb-4 text-2xl uppercase tracking-wide text-foreground-heading"
        style={{ fontFamily: "PlayfairDisplay_700Bold" }}
      >
        {t("recipe.edit.cookingInfo")}
      </Text>

      {/* Servings Control */}
      <View className="mb-4">
        <Text className="font-bold shrink-0 text-sm uppercase tracking-widest text-foreground-tertiary mb-2">
          {t("recipe.edit.servings")}
        </Text>
        <ShadowItem className="flex-row items-center justify-between rounded-xl p-4">
          <Pressable
            onPress={() => {
              const newValue = Math.max(1, servings - 1);
              onServingsChange(newValue);
            }}
            className="h-10 w-10 items-center justify-center"
          >
            <MinusIcon size={24} color="#3a3226" weight="bold" />
          </Pressable>

          <Text
            className="text-3xl text-foreground-heading"
            style={{ fontFamily: "PlayfairDisplay_700Bold" }}
          >
            {servings}
          </Text>

          <Pressable
            onPress={() => {
              const newValue = Math.min(100, servings + 1);
              onServingsChange(newValue);
            }}
            className="h-10 w-10 items-center justify-center"
          >
            <PlusIcon size={24} color="#3a3226" weight="bold" />
          </Pressable>
        </ShadowItem>
        {servingsError && (
          <Text className="mt-1.5 text-sm text-red-600">{servingsError.message}</Text>
        )}
      </View>

      {/* Prep & Cook Time Controls - Side by Side */}
      <View>
        <View className="mb-4 flex-row gap-4">
          {/* Prep Time Control */}
          <TimeAdjuster
            label={t("recipe.edit.prepTime")}
            value={prepTime}
            onChange={onPrepTimeChange}
            increment={1}
            className="flex-1 mb-0"
          />

          {/* Cook Time Control */}
          <TimeAdjuster
            label={t("recipe.edit.cookTime")}
            value={cookTime}
            onChange={onCookTimeChange}
            increment={1}
            className="flex-1 mb-0"
          />
        </View>

        {/* Error Messages */}
        {(prepTimeError || cookTimeError) && (
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              {prepTimeError && (
                <Text className="text-sm text-red-600">{prepTimeError.message}</Text>
              )}
            </View>
            <View className="flex-1">
              {cookTimeError && (
                <Text className="text-sm text-red-600">{cookTimeError.message}</Text>
              )}
            </View>
          </View>
        )}

        {/* Total Time Display */}
        <ShadowItem variant="primary" className="mb-6 items-start rounded-xl p-4">
          <Text className="mb-1 text-sm uppercase tracking-wide text-white/80">
            {t("recipe.edit.totalTime")}
          </Text>
          <Text className="text-3xl text-white" style={{ fontFamily: "PlayfairDisplay_700Bold" }}>
            {formatTime(prepTime + cookTime)}
          </Text>
        </ShadowItem>
      </View>

      {/* Difficulty Selection */}
      <View className="mb-4">
        <Text className="font-bold shrink-0 text-sm uppercase tracking-widest text-foreground-tertiary mb-2">
          {t("recipe.edit.difficulty")}
        </Text>
        <View className="flex-row gap-3">
          {difficultyOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onDifficultyChange(option.value);
              }}
              className="flex-1"
            >
              <ShadowItem
                className={`rounded-xl p-4`}
                style={{ borderColor: difficulty === option.value ? option.color : "#e8e3d6" }}
              >
                <Text
                  className="text-center text-base font-semibold"
                  style={{ color: difficulty === option.value ? option.color : "#3a3226" }}
                >
                  {option.label}
                </Text>
              </ShadowItem>
            </Pressable>
          ))}
        </View>
        {difficultyError && (
          <Text className="mt-1.5 text-sm text-red-600">{difficultyError.message}</Text>
        )}
      </View>
    </View>
  );
}
