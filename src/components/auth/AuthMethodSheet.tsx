import React, { forwardRef, useState, useCallback } from "react";
import { View, Text, Pressable, ActivityIndicator, Platform } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { AppleLogoIcon, EnvelopeSimpleIcon, GoogleLogoIcon } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import * as AppleAuthentication from "expo-apple-authentication";
import { useTranslation } from "react-i18next";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { PremiumBottomSheet } from "@/components/ui/PremiumBottomSheet";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/utils/cn";

interface AuthMethodSheetProps {
  onClose?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AuthMethodButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  variant?: "apple" | "default";
}

/**
 * Styled button for auth method selection
 */
const AuthMethodButton: React.FC<AuthMethodButtonProps> = ({
  icon,
  label,
  onPress,
  isLoading = false,
  variant = "default",
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 50, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 50, stiffness: 400 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isApple = variant === "apple";

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isLoading}
      style={animatedStyle}
      className={cn(
        "h-16 flex-row items-center justify-center rounded-2xl px-6",
        isApple ? "bg-black" : "bg-white border border-stone-200",
        isLoading && "opacity-70"
      )}
    >
      {isLoading ? (
        <ActivityIndicator color={isApple ? "#ffffff" : "#1c1917"} size="small" />
      ) : (
        <View className="flex-row items-center gap-3 h-16">
          {icon}
          <Text
            className={cn("text-base font-semibold", isApple ? "text-white" : "text-stone-900")}
          >
            {label}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

/**
 * AuthMethodSheet - Bottom sheet for selecting authentication method
 * Shows Apple Sign In (iOS only) and Email options
 */
export const AuthMethodSheet = forwardRef<BottomSheetModal, AuthMethodSheetProps>(
  ({ onClose }, ref) => {
    const { t } = useTranslation();
    const { signInWithApple, signInWithGoogle, isAppleSignInAvailable, isGoogleSignInAvailable } =
      useAuth();
    const [isAppleLoading, setIsAppleLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleAppleSignIn = useCallback(async () => {
      setIsAppleLoading(true);
      try {
        await signInWithApple();
        // Success - AuthContext will update user state, navigation happens automatically
        onClose?.();
      } catch (error) {
        // Check if user cancelled (not a real error)
        if (
          error instanceof Error &&
          (error as any).code ===
            AppleAuthentication.AppleAuthenticationCredentialState.REVOKED.toString()
        ) {
          // User cancelled, silently ignore
          return;
        }
        // For AppleAuthenticationError, check the code
        if ((error as any)?.code === "ERR_REQUEST_CANCELED") {
          // User cancelled, silently ignore
          return;
        }
        console.error("Apple Sign In error:", error);
        // Could show a toast here for real errors
      } finally {
        setIsAppleLoading(false);
      }
    }, [signInWithApple, onClose]);

    const handleGoogleSignIn = useCallback(async () => {
      setIsGoogleLoading(true);
      try {
        await signInWithGoogle();
        // Success - AuthContext will update user state, navigation happens automatically
        onClose?.();
      } catch (error) {
        // User cancellation is handled silently in AuthContext
        console.error("Google Sign In error:", error);
        // Could show a toast here for real errors
      } finally {
        setIsGoogleLoading(false);
      }
    }, [signInWithGoogle, onClose]);

    const handleEmailPress = useCallback(() => {
      onClose?.();
      router.push("/(auth)/login");
    }, [onClose]);

    const showAppleButton = Platform.OS === "ios" && isAppleSignInAvailable;

    return (
      <PremiumBottomSheet
        ref={ref}
        title={t("auth.chooseMethod")}
        subtitle={t("auth.chooseMethodSubtitle")}
        onClose={onClose}
      >
        <View className="px-6 pb-4 pt-4 space-y-3 gap-4">
          {showAppleButton && (
            <AuthMethodButton
              icon={<AppleLogoIcon size={24} color="#ffffff" weight="fill" />}
              label={t("auth.continueWithApple")}
              onPress={handleAppleSignIn}
              isLoading={isAppleLoading}
              variant="apple"
            />
          )}

          {isGoogleSignInAvailable && (
            <AuthMethodButton
              icon={<GoogleLogoIcon size={22} color="#1c1917" weight="bold" />}
              label={t("auth.continueWithGoogle")}
              onPress={handleGoogleSignIn}
              isLoading={isGoogleLoading}
            />
          )}

          <AuthMethodButton
            icon={<EnvelopeSimpleIcon size={22} color="#1c1917" weight="bold" />}
            label={t("auth.continueWithEmail")}
            onPress={handleEmailPress}
          />
        </View>
      </PremiumBottomSheet>
    );
  }
);

AuthMethodSheet.displayName = "AuthMethodSheet";
