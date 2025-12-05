/**
 * Smart Collection Card Skeleton
 *
 * Loading placeholder for SmartCollectionCard.
 */
import React from "react";
import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";

export interface SmartCollectionCardSkeletonProps {
  /** Visual variant - primary (dark bg) or secondary (light bg) */
  variant?: "primary" | "secondary";
}

export function SmartCollectionCardSkeleton({
  variant = "primary",
}: SmartCollectionCardSkeletonProps) {
  const isPrimary = variant === "primary";

  return (
    <View
      className={`relative flex-1 max-h-48 rounded-2xl overflow-hidden aspect-[4/3] p-5 justify-between ${
        isPrimary ? "bg-primary/20" : "bg-white border border-border-light"
      }`}
    >
      {/* Icon placeholder */}
      <Skeleton width={40} height={40} borderRadius={20} />

      {/* Title & Subtitle placeholders */}
      <View>
        <Skeleton width={96} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width={64} height={12} borderRadius={4} />
      </View>
    </View>
  );
}
