import type { Icon } from "phosphor-react-native";

export type StepId =
  | "basicInfo"
  | "heardFrom"
  | "cookingFrequency"
  | "recipeSources"
  | "completion";

export interface OnboardingFormData {
  display_name: string;
  age: string;
  heard_from: string;
  cooking_frequency: string;
  recipe_sources: string[];
}

export interface OptionConfig {
  value: string;
  icon: Icon;
}
