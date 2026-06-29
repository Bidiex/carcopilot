import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions, FlatList } from "react-native";
import { Text } from "@/components/Typography";
import { Colors, Spacing, Radius, Layout } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from "react-native-reanimated";
import { AiInsight } from "@/types/app";
import { useRouter } from "expo-router";

const { width: screenWidth } = Dimensions.get("window");
// Screen padding is Layout.screenPadding (20), so content width is screenWidth - 40.
// Card width is slightly smaller to hint there's more.
const CARD_WIDTH = screenWidth - 40 - 24;
const PRIMARY_300 = "#8080FF";

interface InsightsCardProps {
  insights: AiInsight[];
  hasSavedInsights?: boolean;
  loading: boolean;
  onSaveInsight: (id: string) => void;
  onUnsaveInsight: (id: string) => void;
}

const INSIGHT_ICONS: Record<string, { name: any }> = {
  alert: { name: "warning-outline" },
  tip: { name: "bulb-outline" },
  achievement: { name: "trophy-outline" },
  prediction: { name: "trending-up-outline" },
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={18} color={Colors.primary500} />
          <Text variant="sectionTitle" color="gray900" weight="700">COPILOTO IA</Text>
        </View>
      </View>
      <LinearGradient
        colors={[PRIMARY_300, Colors.primary600]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.skeletonCard}
      >
        <View style={styles.skeletonContent}>
          <Animated.View style={[styles.skeletonLine, animatedStyle, { width: '90%' }]} />
          <Animated.View style={[styles.skeletonLine, animatedStyle, { width: '75%' }]} />
          <Animated.View style={[styles.skeletonLine, animatedStyle, { width: '40%' }]} />
        </View>
      </LinearGradient>
    </View>
  );
}

export function InsightsCard({ insights, hasSavedInsights, loading, onSaveInsight, onUnsaveInsight }: InsightsCardProps) {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  // Limpiar timer si el usuario toca la lista
  const handleScrollBeginDrag = () => {
    setIsAutoScrolling(false);
  };

  useEffect(() => {
    if (!insights || insights.length <= 1 || !isAutoScrolling) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % insights.length;
      flatListRef.current?.scrollToIndex({
        index: currentIndex,
        animated: true,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [insights, isAutoScrolling]);

  if (loading) {
    return <SkeletonLoader />;
  }

  if ((!insights || insights.length === 0) && !hasSavedInsights) {
    return null;
  }

  const renderItem = ({ item, index }: { item: AiInsight, index: number }) => {
    const iconData = INSIGHT_ICONS[item.type] || INSIGHT_ICONS.tip;
    return (
      <Animated.View entering={FadeIn.delay(100 * index).duration(400)}>
        <LinearGradient
          colors={[PRIMARY_300, Colors.primary600]}
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.insightCard}
        >
          <View style={styles.insightRow}>
            <View style={[styles.iconContainer, { backgroundColor: `rgba(255, 255, 255, 0.2)` }]}>
              <Ionicons name={iconData.name} size={20} color={Colors.white} />
            </View>
            
            <View style={styles.contentContainer}>
              <Text variant="body" color="white" numberOfLines={3} style={styles.insightText}>
                {item.content}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={() => item.is_saved ? onUnsaveInsight(item.id) : onSaveInsight(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={item.is_saved ? "bookmark" : "bookmark-outline"} 
                size={22} 
                color={Colors.white} 
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={18} color={Colors.primary500} />
          <Text variant="sectionTitle" color="gray900" weight="700">COPILOTO IA</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/saved-insights" as any)}>
          <Text variant="body" color="primary500" weight="600">Ver todas</Text>
        </TouchableOpacity>
      </View>

      {(!insights || insights.length === 0) ? (
        <LinearGradient
          colors={[PRIMARY_300, Colors.primary600]}
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={[styles.insightCard, { width: '100%', marginRight: 0 }]}
        >
          <View style={{ paddingVertical: Spacing.sm }}>
            <Text variant="body" color="white" align="center" style={{ opacity: 0.9 }}>
              No hay nuevos insights por ahora.
            </Text>
          </View>
        </LinearGradient>
      ) : (
        <FlatList
          ref={flatListRef}
          data={insights}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + Spacing.sm}
          decelerationRate="fast"
          onScrollBeginDrag={handleScrollBeginDrag}
          // Evita error visual al scrollear rápido si la lista es corta
          getItemLayout={(data, index) => ({
            length: CARD_WIDTH + Spacing.sm,
            offset: (CARD_WIDTH + Spacing.sm) * index,
            index,
          })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Layout.verticalRhythm,
    marginBottom: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Layout.sectionGap,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  insightCard: {
    width: CARD_WIDTH,
    marginRight: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
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
    justifyContent: "center",
    minHeight: 36,
  },
  insightText: {
    lineHeight: 20,
  },
  saveButton: {
    padding: Spacing.xs,
    marginLeft: 'auto',
  },
  skeletonCard: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  skeletonContent: {
    gap: Spacing.sm,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: Radius.sm,
  },
});
