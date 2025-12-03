export { OnboardingProgress } from "./OnboardingProgress";
export { OnboardingOptionCard } from "./OnboardingOptionCard";
export { OnboardingBackground } from "./OnboardingBackground";
export { OnboardingComplete } from "./OnboardingComplete";
export { OnboardingControls } from "./OnboardingControls";
export { OnboardingCard } from "./OnboardingCard";

// Steps
export { BasicInfoStep, HeardFromStep, CookingFrequencyStep, RecipeSourcesStep } from "./steps";

// Types and constants
export type { StepId, OnboardingFormData, OptionConfig } from "./types";
export { STEPS, TOTAL_QUESTION_STEPS } from "./constants";

// Hooks
export { useOnboardingAnimations } from "./hooks/useOnboardingAnimations";
