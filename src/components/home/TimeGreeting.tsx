/**
 * TimeGreeting
 *
 * Displays a time-of-day contextual greeting on the home page.
 * Uses device local time for appropriate greeting.
 */
import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { PageHeader } from "../ui/PageHeader";

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

interface GreetingConfig {
  greeting: string;
  subtitle: string;
}

const GREETINGS: Record<TimeOfDay, GreetingConfig> = {
  morning: {
    greeting: "Good morning!",
    subtitle: "Ready to cook?",
  },
  afternoon: {
    greeting: "Good afternoon!",
    subtitle: "What's cooking?",
  },
  evening: {
    greeting: "Good evening!",
    subtitle: "Time for dinner?",
  },
  night: {
    greeting: "Late night cravings?",
    subtitle: "Find something delicious",
  },
};

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
}

export function TimeGreeting({ className }: TimeGreetingProps) {
  const timeOfDay = useMemo(() => getTimeOfDay(), []);
  const { greeting, subtitle } = GREETINGS[timeOfDay];

  return (
    <PageHeader
      title={greeting}
      subtitle={subtitle}
      topPadding={0}
      bottomMargin={48}
    />
  );
}

/**
 * Returns the current greeting text for use in sticky headers
 */
export function getGreetingText(): string {
  const timeOfDay = getTimeOfDay();
  return GREETINGS[timeOfDay].greeting;
}
