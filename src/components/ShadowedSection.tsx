import { View, Pressable, PressableProps } from "react-native";
import { cn } from "@/utils/cn";

type ShadowItemVariation = "default" | "primary";

interface ShadowItemProps {
  children: React.ReactNode;
  className?: string;
  variant?: ShadowItemVariation;
  onPress?: PressableProps["onPress"];
}

const variants: Record<ShadowItemVariation, string> = {
  default: "bg-white rounded-xl items-center justify-center border border-border-button",
  primary: "bg-primary rounded-xl items-center justify-center",
};

const variationStyles: Record<
  ShadowItemVariation,
  {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
  }
> = {
  default: {
    shadowColor: "#2C2416",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  primary: {
    shadowColor: "#334d43",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
};

export function ShadowItem({ children, className, variant = "default", onPress }: ShadowItemProps) {
  const variantClassName = variants[variant];
  const variantStyles = variationStyles[variant];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={cn(variantClassName, className)}
        style={variantStyles}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={cn(variantClassName, className)} style={variantStyles}>
      {children}
    </View>
  );
}
