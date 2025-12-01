import {
  Megaphone,
  Storefront,
  Article,
  MagnifyingGlass,
  DotsThree,
  CookingPot,
  Timer,
  CalendarBlank,
  Fire,
  TiktokLogo,
  InstagramLogo,
  YoutubeLogo,
  BookOpen,
  BookBookmark,
  UsersThree,
} from "phosphor-react-native";

import type { StepId, OptionConfig } from "./types";

export const HEARD_FROM_OPTIONS: OptionConfig[] = [
  { value: "social_media", icon: Megaphone },
  { value: "friend", icon: UsersThree },
  { value: "app_store", icon: Storefront },
  { value: "blog", icon: Article },
  { value: "search_engine", icon: MagnifyingGlass },
  { value: "other", icon: DotsThree },
];

export const COOKING_FREQUENCY_OPTIONS: OptionConfig[] = [
  { value: "rarely", icon: CalendarBlank },
  { value: "occasionally", icon: Timer },
  { value: "regularly", icon: CookingPot },
  { value: "almost_daily", icon: Fire },
];

export const RECIPE_SOURCES_OPTIONS: OptionConfig[] = [
  { value: "tiktok", icon: TiktokLogo },
  { value: "instagram", icon: InstagramLogo },
  { value: "youtube", icon: YoutubeLogo },
  { value: "blogs", icon: Article },
  { value: "cookbooks", icon: BookBookmark },
  { value: "family", icon: UsersThree },
  { value: "other", icon: BookOpen },
];

export const STEPS: StepId[] = [
  "basicInfo",
  "heardFrom",
  "cookingFrequency",
  "recipeSources",
  "completion",
];

export const TOTAL_QUESTION_STEPS = STEPS.length - 1; // Exclude completion step from count
