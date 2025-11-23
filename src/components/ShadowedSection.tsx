import { View, Pressable, PressableProps, ViewProps } from "react-native";
import { cn } from "@/utils/cn";

type ShadowItemVariation = "default" | "primary";

type BaseShadowItemProps = {
  children: React.ReactNode;
  className?: string;
  variant?: ShadowItemVariation;
};

type PressableShadowItemProps = BaseShadowItemProps &
  Omit<PressableProps, keyof BaseShadowItemProps> & {
    onPress: PressableProps["onPress"]; // Make onPress required for pressable variant
  };

type ViewShadowItemProps = BaseShadowItemProps &
  Omit<ViewProps, keyof BaseShadowItemProps> & {
    onPress?: never; // Explicitly exclude onPress when it's a View
  };

type ShadowItemProps = PressableShadowItemProps | ViewShadowItemProps;

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

export function ShadowItem({
  children,
  className,
  variant = "default",
  ...rest
}: ShadowItemProps) {
  const variantClassName = variants[variant];
  const variantStyles = variationStyles[variant];

  if ('onPress' in rest && rest.onPress) {
    const { onPress, style, ...pressableProps } = rest;
    return (
      <Pressable
        onPress={onPress}
        {...pressableProps}
        className={cn(variantClassName, className)}
        style={(state) => [
          variantStyles,
          typeof style === 'function' ? style(state) : style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  const { style, ...viewProps } = rest as ViewProps;
  return (
    <View
      {...viewProps}
      className={cn(variantClassName, className)}
      style={[variantStyles, style]}
    >
      {children}
    </View>
  );
}
