/**
 * TimeGreeting
 *
 * Displays a time-of-day contextual greeting on the home page.
 * Uses device local time for appropriate greeting.
 */
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "../ui/PageHeader";

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export interface TimeGreetingProps {
  /** Optional custom className for the container */
  className?: string;
  rightElement?: React.ReactNode;
}

export function TimeGreeting({ className, rightElement }: TimeGreetingProps) {
  const { t } = useTranslation();
  const timeOfDay = useMemo(() => getTimeOfDay(), []);

  const greeting = t(`discovery.greeting.${timeOfDay}.greeting` as any) as string;
  const subtitle = t(`discovery.greeting.${timeOfDay}.subtitle` as any) as string;

  return (
    <PageHeader
      title={subtitle}
      subtitle={greeting}
      topPadding={0}
      bottomMargin={32}
      highlightLastWord
      // newLine
      rightElement={rightElement}
    />
  );
}

/**
 * Returns the current greeting text for use in sticky headers
 * Note: This is a non-hook function, so it uses English as fallback
 * For proper i18n support in components, use the TimeGreeting component
 */
export function getGreetingText(): string {
  const timeOfDay = getTimeOfDay();
  // Fallback to English for non-React contexts
  const greetings: Record<TimeOfDay, string> = {
    morning: "Good morning!",
    afternoon: "Good afternoon!",
    evening: "Good evening!",
    night: "Late night cravings?",
  };
  return greetings[timeOfDay];
}
