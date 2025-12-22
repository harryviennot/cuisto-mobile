import { View, Text } from "react-native";
import { CoinsIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/utils/date";
import { useCallback } from "react";

interface CreditsInfoBoxProps {
  totalCredits: number;
  standardCredits: number;
  referralCredits: number;
  nextResetAt: Date | null;
}


export default function CreditsInfoBox({ totalCredits, standardCredits, referralCredits, nextResetAt }: CreditsInfoBoxProps) {
  const { t } = useTranslation();

  const formatResetDate = useCallback(() => {
    if (!nextResetAt) return "";
    return formatDate(nextResetAt, "MMM d");
  }, [nextResetAt]);

  const getCountStyle = (count: number) => {
    const digits = count.toString().length;
    if (digits === 1) return { fontSize: 160, right: -20, bottom: -40 };
    if (digits === 2) return { fontSize: 140, right: -20, bottom: -30 };
    return { fontSize: 100, right: -20, bottom: -20 };
  };

  return (
    <View className="gap-2">
      <View className="relative overflow-hidden rounded-2xl bg-primary px-5 py-5">
        {/* Background Number */}
        <Text
          className="absolute font-playfair-bold leading-none text-white/10 -right-4 -top-4"
          style={[{ position: 'absolute' }, getCountStyle(totalCredits)]}
          allowFontScaling={false}
        >
          {totalCredits}
        </Text>

        <View className="z-10 gap-2">
          <View className="flex-row items-center gap-2 mb-2">
            <CoinsIcon size={24} color="#fff" weight="duotone" />
            <Text className="text-sm font-medium tracking-wide text-white/80 uppercase">
              {t("credits.remaining", { count: totalCredits })}
            </Text>
          </View>
          <View className="flex-row items-center gap-8">
            <View>
              <Text className="font-playfair-bold text-5xl text-white">
                {standardCredits}
              </Text>
              <Text className="text-xs text-white/60">
                {t("credits.bottomSheet.standardCredits")}
              </Text>
            </View>
            <View>
              <Text className="font-playfair-bold text-5xl text-white">
                {referralCredits}
              </Text>
              <Text className="text-xs text-white/60">
                {t("credits.bottomSheet.referralCredits")}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <Text className="text-xs text-foreground-tertiary">
        {t("credits.bottomSheet.resetsOn", { date: formatResetDate() })}
      </Text>
    </View>
  );
}