import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Confetti } from "phosphor-react-native";
import { TextInput } from "@/components/forms/TextInput";
import { authService } from "@/api/services/auth.service";
import Toast from "react-native-toast-message";

interface OnboardingFormData {
  heard_from: string;
  cooking_frequency: string;
  recipe_sources: string[];
  display_name: string;
}

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingFormData, string>>>({});

  const [formData, setFormData] = useState<OnboardingFormData>({
    heard_from: "",
    cooking_frequency: "",
    recipe_sources: [],
    display_name: "",
  });

  // Options for "How did you hear about us?"
  const heardFromOptions = [
    { label: "Social Media", value: "social_media" },
    { label: "Friend", value: "friend" },
    { label: "App Store", value: "app_store" },
    { label: "Blog/Article", value: "blog" },
    { label: "Search Engine", value: "search_engine" },
    { label: "Other", value: "other" },
  ];

  // Options for "How often do you cook?"
  const cookingFrequencyOptions = [
    { label: "Rarely", value: "rarely" },
    { label: "Occasionally", value: "occasionally" },
    { label: "Regularly", value: "regularly" },
    { label: "Almost Daily", value: "almost_daily" },
  ];

  // Options for "Where do you get recipes?"
  const recipeSourceOptions = [
    { label: "TikTok", value: "tiktok" },
    { label: "Instagram", value: "instagram" },
    { label: "YouTube", value: "youtube" },
    { label: "Blogs", value: "blogs" },
    { label: "Cookbooks", value: "cookbooks" },
    { label: "Family & Friends", value: "family" },
    { label: "Other", value: "other" },
  ];

  const handleHeardFromSelect = (value: string) => {
    setFormData({ ...formData, heard_from: value });
    setErrors({ ...errors, heard_from: undefined });
  };

  const handleCookingFrequencySelect = (value: string) => {
    setFormData({ ...formData, cooking_frequency: value });
    setErrors({ ...errors, cooking_frequency: undefined });
  };

  const handleRecipeSourceToggle = (value: string) => {
    const newSources = formData.recipe_sources.includes(value)
      ? formData.recipe_sources.filter((s) => s !== value)
      : [...formData.recipe_sources, value];

    setFormData({ ...formData, recipe_sources: newSources });
    setErrors({ ...errors, recipe_sources: undefined });
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof OnboardingFormData, string>> = {};

    if (!formData.heard_from) {
      newErrors.heard_from = "Please select how you heard about us";
    }

    if (!formData.cooking_frequency) {
      newErrors.cooking_frequency = "Please select your cooking frequency";
    }

    if (formData.recipe_sources.length === 0) {
      newErrors.recipe_sources = "Please select at least one recipe source";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = async () => {
    if (!validate()) {
      Toast.show({
        type: "error",
        text1: "Missing information",
        text2: "Please complete all required fields",
      });
      return;
    }

    setIsLoading(true);

    try {
      await authService.submitOnboarding({
        heard_from: formData.heard_from,
        cooking_frequency: formData.cooking_frequency,
        recipe_sources: formData.recipe_sources,
        display_name: formData.display_name.trim() || undefined,
      });

      Toast.show({
        type: "success",
        text1: "Welcome to Cuistudio!",
        text2: "Your account is all set up",
      });

      // Navigate to main app
      router.replace("/(tabs)");
    } catch (err: any) {
      console.error("Onboarding submission error:", err);

      Toast.show({
        type: "error",
        text1: "Failed to complete setup",
        text2: err.response?.data?.message || "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-surface"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mb-8">
          <View className="bg-primary/10 rounded-full p-4 mb-4">
            <Confetti size={48} color="#334d43" weight="duotone" />
          </View>
          <Text
            className="text-3xl font-playfair-bold text-foreground-heading mb-2 text-center"
            style={{ fontFamily: "PlayfairDisplay_700Bold" }}
          >
            Welcome to Cuistudio!
          </Text>
          <Text className="text-base text-foreground-secondary text-center">
            Help us personalize your experience
          </Text>
        </View>

        {/* Display Name (Optional) */}
        <View className="mb-8">
          <TextInput
            label="Display Name (Optional)"
            placeholder="What should we call you?"
            value={formData.display_name}
            onChangeText={(text) => setFormData({ ...formData, display_name: text })}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
          />
        </View>

        {/* Question 1: How did you hear about us? */}
        <View className="mb-8">
          <Text className="font-bold text-sm uppercase tracking-widest text-foreground-tertiary mb-3">
            How did you hear about us? *
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {heardFromOptions.map((option) => {
              const isSelected = formData.heard_from === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleHeardFromSelect(option.value)}
                  className="active:opacity-60"
                >
                  <View
                    className={`rounded-full px-4 py-2.5 border ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border-button bg-white"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {errors.heard_from && (
            <Text className="mt-2 text-sm text-danger">{errors.heard_from}</Text>
          )}
        </View>

        {/* Question 2: How often do you cook? */}
        <View className="mb-8">
          <Text className="font-bold text-sm uppercase tracking-widest text-foreground-tertiary mb-3">
            How often do you cook? *
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {cookingFrequencyOptions.map((option) => {
              const isSelected = formData.cooking_frequency === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleCookingFrequencySelect(option.value)}
                  className="active:opacity-60"
                >
                  <View
                    className={`rounded-full px-4 py-2.5 border ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border-button bg-white"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {errors.cooking_frequency && (
            <Text className="mt-2 text-sm text-danger">{errors.cooking_frequency}</Text>
          )}
        </View>

        {/* Question 3: Where do you get recipes? (Multi-select) */}
        <View className="mb-8">
          <Text className="font-bold text-sm uppercase tracking-widest text-foreground-tertiary mb-3">
            Where do you get recipes from? * (Select all that apply)
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {recipeSourceOptions.map((option) => {
              const isSelected = formData.recipe_sources.includes(option.value);
              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleRecipeSourceToggle(option.value)}
                  className="active:opacity-60"
                >
                  <View
                    className={`rounded-full px-4 py-2.5 border ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border-button bg-white"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {errors.recipe_sources && (
            <Text className="mt-2 text-sm text-danger">{errors.recipe_sources}</Text>
          )}
        </View>

        {/* Complete Button */}
        <Pressable
          onPress={handleComplete}
          disabled={isLoading}
          className="bg-primary rounded-xl py-4 items-center justify-center active:opacity-80 disabled:opacity-50 mb-6"
        >
          {isLoading ? (
            <ActivityIndicator color="#f4f1e8" />
          ) : (
            <Text className="text-white font-semibold text-base">Complete Setup</Text>
          )}
        </Pressable>

        {/* Helper Text */}
        <Text className="text-sm text-foreground-tertiary text-center mb-8">
          * Required fields
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
