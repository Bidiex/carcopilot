import React, { useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Text } from "@/components/Typography";
import { Colors, Shadows, Spacing, Radius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from "react-native-reanimated";
import { AiInsight } from "@/types/app";
import { useRouter } from "expo-router";

// We use Ionicons which has similar icons to Lucide, since Ionicons is already in the project.
// AlertTriangle -> alert-circle or warning
// Lightbulb -> bulb
// Trophy -> trophy
// TrendingUp -> trending-up

interface InsightsCardProps {
  insights: AiInsight[];
  loading: boolean;
  onSaveInsight: (id: string) => void;
  onUnsaveInsight: (id: string) => void;
}

const INSIGHT_ICONS: Record<string, { name: any; color: string }> = {
  alert: { name: "warning-outline", color: Colors.danger },
  tip: { name: "bulb-outline", color: Colors.primary500 },
  achievement: { name: "trophy-outline", color: Colors.success },
  prediction: { name: "trending-up-outline", color: Colors.warning500 }, // using warning500 as accent
};

function SkeletonLoader() {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.5, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.white, Colors.white]}
        style={styles.gradientContainer}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="sparkles" size={18} color={Colors.primary500} />
            <Text variant="smallLabel" color="primary500" weight="700">COPILOTO IA</Text>
          </View>
        </View>
        <View style={styles.skeletonContent}>
          <Animated.View style={[styles.skeletonLine, animatedStyle, { width: '90%' }]} />
          <Animated.View style={[styles.skeletonLine, animatedStyle, { width: '75%' }]} />
          <Animated.View style={[styles.skeletonLine, animatedStyle, { width: '40%' }]} />
        </View>
      </LinearGradient>
    </View>
  );
}

export function InsightsCard({ insights, loading, onSaveInsight, onUnsaveInsight }: InsightsCardProps) {
  const router = useRouter();

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        // Hex primary with 8% opacity: #4D4DFF14, with 0% opacity: #4D4DFF00
        // We use rgba for clarity
        colors={["rgba(77, 77, 255, 0.08)", "rgba(255, 255, 255, 1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="sparkles" size={18} color={Colors.primary500} />
            <Text variant="smallLabel" color="primary500" weight="700">COPILOTO IA</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/saved-insights" as any)}>
            <Text variant="smallLabel" color="gray600" weight="600">Ver guardados →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          {insights.map((insight, index) => {
            const iconData = INSIGHT_ICONS[insight.type] || INSIGHT_ICONS.tip;
            return (
              <Animated.View 
                key={insight.id} 
                entering={FadeIn.delay(100 * index).duration(400)}
              >
                <View style={styles.insightRow}>
                  <View style={[styles.iconContainer, { backgroundColor: `${iconData.color}15` }]}>
                    <Ionicons name={iconData.name} size={20} color={iconData.color} />
                  </View>
                  
                  <View style={styles.contentContainer}>
                    <Text variant="body" color="gray900" style={styles.contentText}>
                      {insight.content}
                    </Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={() => insight.is_saved ? onUnsaveInsight(insight.id) : onSaveInsight(insight.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={insight.is_saved ? "bookmark" : "bookmark-outline"} 
                      size={22} 
                      color={insight.is_saved ? Colors.primary500 : Colors.gray400} 
                    />
                  </TouchableOpacity>
                </View>
                {index < insights.length - 1 && <View style={styles.divider} />}
              </Animated.View>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    ...Shadows.floating,
    overflow: "hidden", // So the gradient doesn't bleed out of borderRadius
  },
  gradientContainer: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  list: {
    flexDirection: "column",
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: Spacing.xs,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  contentContainer: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  contentText: {
    lineHeight: 20,
  },
  saveButton: {
    padding: Spacing.xs,
    marginLeft: 'auto',
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: Spacing.sm,
    marginLeft: 44, // Align with text
  },
  skeletonContent: {
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: Colors.gray200,
    borderRadius: Radius.sm,
  },
});
