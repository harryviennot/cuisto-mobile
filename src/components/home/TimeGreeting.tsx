/**
 * TimeGreeting
 *
 * Displays a time-of-day contextual greeting on the home page.
 * Uses device local time for appropriate greeting.
 */
import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { PageHeader } from "../ui/PageHeader";
import { MagnifyingGlassIcon } from "phosphor-react-native";

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

interface GreetingConfig {
  greeting: string;
  subtitle: string;
}

const GREETINGS: Record<TimeOfDay, GreetingConfig> = {
  morning: {
    greeting: "Good morning!",
    subtitle: "Ready for a nice breakfast?",
  },
  afternoon: {
    greeting: "Good afternoon!",
    subtitle: "What's cooking?",
  },
  evening: {
    greeting: "Good evening!",
    subtitle: "Time for some dinner?",
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
  rightElement?: React.ReactNode;
}

export function TimeGreeting({ className, rightElement }: TimeGreetingProps) {
  const timeOfDay = useMemo(() => getTimeOfDay(), []);
  const { greeting, subtitle } = GREETINGS[timeOfDay];

  return (
    <PageHeader
      title={subtitle}
      subtitle={greeting}
      topPadding={0}
      bottomMargin={48}
      highlightLastWord
      newLine
      rightElement={rightElement}
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
