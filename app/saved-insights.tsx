import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/Typography";
import { Colors, Spacing, Layout, Radius, Shadows } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useInsights } from "@/hooks/useInsights";
import { supabase } from "@/lib/supabase";
import { AiInsight } from "@/types/app";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const INSIGHT_ICONS: Record<string, { name: any; color: string }> = {
  alert: { name: "warning-outline", color: Colors.danger },
  tip: { name: "bulb-outline", color: Colors.primary500 },
  achievement: { name: "trophy-outline", color: Colors.success },
  prediction: { name: "trending-up-outline", color: Colors.warning500 },
};

export default function SavedInsightsScreen() {
  const router = useRouter();
  const { savedInsights, loading, unsaveInsight } = useInsights();
  const [vehiclesMap, setVehiclesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch vehicle names for better display
    const fetchVehicles = async () => {
      const { data } = await supabase.from('vehicles').select('id, brand, model');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(v => {
          map[v.id] = `${v.brand} ${v.model}`;
        });
        setVehiclesMap(map);
      }
    };
    fetchVehicles();
  }, []);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
  };

  const renderItem = ({ item }: { item: AiInsight }) => {
    const iconData = INSIGHT_ICONS[item.type] || INSIGHT_ICONS.tip;
    const vehicleName = item.vehicle_id ? vehiclesMap[item.vehicle_id] : null;

    return (
      <View style={styles.card}>
        <View style={styles.insightRow}>
          <View style={[styles.iconContainer, { backgroundColor: `${iconData.color}15` }]}>
            <Ionicons name={iconData.name} size={24} color={iconData.color} />
          </View>
          
          <View style={styles.contentContainer}>
            <Text variant="body" color="gray900" style={styles.contentText}>
              {item.content}
            </Text>
            <View style={styles.metaRow}>
              <Text variant="caption" color="gray500">
                {formatDate(item.generated_at)}
              </Text>
              {!!vehicleName && (
                <>
                  <View style={styles.dot} />
                  <Text variant="caption" color="gray500">
                    {vehicleName}
                  </Text>
                </>
              )}
            </View>
          </View>

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={() => unsaveInsight(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="bookmark" size={24} color={Colors.primary500} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
        </TouchableOpacity>
        <Text variant="heading2" weight="700" color="gray900" style={styles.title}>Pendientes</Text>
        <View style={{ width: 40 }} /> {/* Placeholder for balance */}
      </View>

      {/* Content */}
      {loading && savedInsights.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="sparkles-outline" size={48} color={Colors.gray300} style={styles.emptyIcon} />
          <Text variant="body" color="gray500">Cargando...</Text>
        </View>
      ) : savedInsights.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="bookmark-outline" size={48} color={Colors.primary500} />
          </View>
          <Text variant="heading2" color="gray900" weight="700" align="center" style={styles.emptyTitle}>
            Aún no tienes insights guardados
          </Text>
          <Text variant="body" color="gray600" align="center" style={styles.emptySubtitle}>
            Cuando la IA detecte algo importante sobre tu vehículo, podrás guardarlo aquí para revisarlo después.
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedInsights}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: {
    flex: 1,
    textAlign: "center",
  },
  listContent: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  contentContainer: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  contentText: {
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray400,
    marginHorizontal: Spacing.xs,
  },
  saveButton: {
    padding: Spacing.xs,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Layout.screenPadding * 2,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    lineHeight: 22,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
});
