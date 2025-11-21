import { Instruction } from "@/types/recipe";
import { View, Text } from "react-native";
import { TimerIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";

interface RecipeInstructionsProps {
  instructions: Instruction[];
}

export function RecipeInstructions({ instructions }: RecipeInstructionsProps) {
  const { t } = useTranslation();
  // Group instructions by group field
  const groupedInstructions = instructions.reduce(
    (acc, inst) => {
      const group = inst.group || "Main";
      if (!acc[group]) acc[group] = [];
      acc[group].push(inst);
      return acc;
    },
    {} as Record<string, Instruction[]>
  );

  return (
    <View className="mb-12">
      <Text
        className="font-playfair-bold mb-8 text-2xl uppercase tracking-wide text-foreground-heading"
        style={{ fontFamily: "PlayfairDisplay_700Bold" }}
      >
        {t("recipe.instructions").toUpperCase()}
      </Text>

      <View className="relative gap-0">
        {Object.entries(groupedInstructions).map(([groupName, instructions], groupIdx) => {
          return (
            <View key={groupName}>
              {/* Group Header */}
              {groupName !== "Main" && groupIdx > 0 && (
                <View className="mb-6 mt-10 flex-row items-center">
                  <Text
                    className="font-playfair-italic shrink-0 pr-4 text-2xl text-primary"
                    style={{ fontFamily: "PlayfairDisplay_400Regular_Italic" }}
                  >
                    {groupName}
                  </Text>
                  <View className="h-px mt-1 flex-1 bg-border-light opacity-60" />
                </View>
              )}

              {/* Instructions */}
              {instructions.map((inst, idx) => (
                <View key={idx} className="relative">
                  <View className="flex-row gap-5">
                    {/* Step Indicator */}
                    <View className="z-10 h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary ">
                      <Text className="text-s font-bold text-surface">{inst.step_number}</Text>
                    </View>

                    <View className="flex-1 pb-8">
                      {/* Header */}
                      <View className="mb-2 flex-row items-center justify-between ">
                        <Text className="flex-1 pt-0.5 text-xl font-bold text-foreground-heading">
                          {inst.title}
                        </Text>
                        {inst.timer_minutes && (
                          <View className="flex-row pt-0.5">
                            <TimerIcon size={16} color="#6B6456" weight="regular" />
                            <Text className="text-sm text-[#6B6456] ml-1">
                              {inst.timer_minutes} min
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Description */}
                      <Text className="text-[15px] leading-relaxed text-foreground">
                        {inst.description}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    </View>
  );
}
