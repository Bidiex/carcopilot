import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { formatMonthYear } from "@/lib/date";
import { Text } from "@/components/Typography";
import { Colors, Spacing, Layout, Radius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { VehiclePicker, VehiclePickerPill } from "@/components/VehiclePicker";

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: 'list-outline' },
  { id: 'fuel', label: 'Gasolina', icon: 'water-outline' },
  { id: 'electric-charge', label: 'Eléctrico', icon: 'flash-outline' },
  { id: 'maintenance', label: 'Talleres', icon: 'build-outline' },
  { id: 'tax', label: 'SOAT/Imp.', icon: 'document-text-outline' },
  { id: 'other-expense', label: 'Otros', icon: 'cube-outline' },
];

export default function HistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null); // null = Todos
  const [pickerVisible, setPickerVisible] = useState(false);
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [fetchError, setFetchError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (!user) return;

      const loadData = async () => {
        try {
          // 1. Obtener todos los vehículos
          const { data: vhs, error: vhsErr } = await supabase
            .from("vehicles")
            .select("*")
            .eq("user_id", user.id);

          if (vhsErr || !vhs || vhs.length === 0) {
            if (isMounted) {
              setVehicles([]);
              setLogs([]);
              setLoading(false);
            }
            return;
          }

          if (isMounted) setVehicles(vhs);

          // 2. Determinar los IDs a consultar: uno o todos
          const vehicleIds = selectedVehicleId
            ? [selectedVehicleId]
            : vhs.map((v: any) => v.id);

          // 3. Obtener todos los logs para los vehículos seleccionados
          const [fuelRes, maintRes, taxRes, chargeRes, otherRes] = await Promise.all([
            supabase.from("fuel_logs").select("*").in("vehicle_id", vehicleIds),
            supabase.from("maintenance_logs").select("*").in("vehicle_id", vehicleIds),
            supabase.from("annual_records").select("*").in("vehicle_id", vehicleIds),
            supabase.from("electric_charge_logs").select("*").in("vehicle_id", vehicleIds),
            supabase.from("other_expenses").select("*").in("vehicle_id", vehicleIds),
          ]);

          const allLogs: any[] = [];
          if (fuelRes.data) allLogs.push(...fuelRes.data.map(l => ({ ...l, record_type: 'fuel' })));
          if (maintRes.data) allLogs.push(...maintRes.data.map(l => ({ ...l, record_type: 'maintenance' })));
          if (taxRes.data) allLogs.push(...taxRes.data.map(l => ({ ...l, record_type: 'tax', date: l.issue_date })));
          if (chargeRes.data) allLogs.push(...chargeRes.data.map(l => ({ ...l, record_type: 'electric-charge' })));
          if (otherRes.data) allLogs.push(...otherRes.data.map(l => ({ ...l, record_type: 'other-expense' })));

          allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          if (isMounted) setLogs(allLogs);

        } catch (error) {
          if (isMounted) setFetchError("No se pudo cargar el historial. Toca para reintentar.");
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      loadData();

      return () => { isMounted = false; };
    }, [user, selectedVehicleId])
  );

  const formatCOP = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const filteredLogs = useMemo(() => {
    if (selectedCategory === 'all') return logs;
    return logs.filter(log => log.record_type === selectedCategory);
  }, [logs, selectedCategory]);

  const dynamicCategories = useMemo(() => {
    const activeVehicles = selectedVehicleId
      ? vehicles.filter(v => v.id === selectedVehicleId)
      : vehicles;
    
    const hasCombustion = activeVehicles.some(v => v.propulsion === 'combustion' || v.propulsion === 'hybrid' || !v.propulsion);
    const hasElectric = activeVehicles.some(v => v.propulsion === 'electric' || v.propulsion === 'hybrid');

    return CATEGORIES.filter(cat => {
      if (cat.id === 'fuel' && !hasCombustion) return false;
      if (cat.id === 'electric-charge' && !hasElectric) return false;
      return true;
    });
  }, [vehicles, selectedVehicleId]);

  const sections = useMemo(() => {
    const grouped = filteredLogs.reduce((acc, log) => {
      // Create a key for the month (e.g. "Junio 2026")
      const monthName = formatMonthYear(log.date);
      if (!monthName) return acc;
      
      // Capitalize first letter
      const sectionTitle = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      
      if (!acc[sectionTitle]) {
        acc[sectionTitle] = [];
      }
      acc[sectionTitle].push(log);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.keys(grouped).map(title => ({
      title,
      data: grouped[title]
    }));
  }, [filteredLogs]);

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={["top"]} style={{ flex: 0, backgroundColor: Colors.primary500 }} />
        <SafeAreaView edges={["left", "right", "bottom"]} style={styles.loadingArea}>
          <ActivityIndicator size="large" color={Colors.primary500} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={{ flex: 0, backgroundColor: Colors.primary500 }} />
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
      {/* Vehicle Picker Modal */}
      <VehiclePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        vehicles={vehicles}
        selectedId={selectedVehicleId}
        showAll={true}
        onSelect={(id) => {
          setLoading(true);
          setSelectedVehicleId(id);
        }}
      />

      <View style={styles.header}>
        <Text variant="heading2" color="gray900" weight="700">Historial</Text>
        {vehicles.length > 0 && (
          <VehiclePickerPill
            vehicles={vehicles}
            selectedId={selectedVehicleId}
            showAll={true}
            onPress={() => setPickerVisible(true)}
          />
        )}
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          data={dynamicCategories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.7}
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Ionicons 
                name={item.icon as any} 
                size={16} 
                color={selectedCategory === item.id ? Colors.white : Colors.gray600} 
                style={styles.categoryIcon}
              />
              <Text 
                variant="smallLabel" 
                color={selectedCategory === item.id ? "white" : "gray600"}
                weight="600"
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {fetchError && (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.errorBanner}
          onPress={() => { setFetchError(null); setLoading(true); }}
        >
          <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
          <Text variant="caption" color="danger" style={styles.errorBannerText}>{fetchError}</Text>
          <Text variant="caption" color="primary500" weight="600">Reintentar</Text>
        </TouchableOpacity>
      )}

      {sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => `${item.record_type}-${item.id}`}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section: { title } }) => (
            <Text variant="smallLabel" color="gray500" weight="600" style={styles.sectionHeader}>
              {title}
            </Text>
          )}
          renderItem={({ item: log }) => (
            <TouchableOpacity activeOpacity={0.7}
              style={styles.transactionRow}
              onPress={() => router.push(`/${log.record_type === 'fuel' ? 'fuel-log' : log.record_type === 'electric-charge' ? 'electric-charge' : log.record_type === 'maintenance' ? 'maintenance' : log.record_type === 'tax' ? 'tax' : 'other-expense'}/${log.id}` as any)}
            >
              <View style={styles.transIconContainer}>
                {log.record_type === 'fuel' && <Ionicons name="water-outline" size={20} color={Colors.primary500} />}
                {log.record_type === 'electric-charge' && <Ionicons name="flash-outline" size={20} color={Colors.primary500} />}
                {log.record_type === 'maintenance' && <Ionicons name="build-outline" size={20} color={Colors.primary500} />}
                {log.record_type === 'tax' && <Ionicons name="document-text-outline" size={20} color={Colors.primary500} />}
                {log.record_type === 'other-expense' && <Ionicons name="cube-outline" size={20} color={Colors.primary500} />}
              </View>
              <View style={styles.transInfo}>
                <Text variant="body" color="gray900" weight="600">
                  {log.record_type === 'fuel'
                    ? (log.full_tank ? "Tanqueo Lleno" : "Carga Parcial")
                    : log.record_type === 'electric-charge'
                    ? "Carga Eléctrica"
                    : log.record_type === 'maintenance'
                    ? log.type
                    : log.record_type === 'tax'
                    ? (log.type === "soat" ? "SOAT" : log.type === "tax" ? "Impuesto" : "Documento")
                    : log.description}
                </Text>
                <Text variant="caption" color="gray500">
                  {log.date}
                  {log.record_type === 'fuel' && ` • ${parseFloat(log.gallons).toFixed(2)} gal`}
                  {log.record_type === 'electric-charge' && ` • ${parseFloat(log.kwh_charged).toFixed(1)} kWh`}
                  {log.record_type === 'maintenance' && ` • ${log.odometer} km`}
                </Text>
              </View>
              <View style={styles.transAmount}>
                <Text variant="body" color="danger" weight="600">
                  -{formatCOP(parseFloat(log.amount_cop))}
                </Text>
                {log.record_type === 'fuel' && log.consumption_km_gal && (
                  <Text variant="smallLabel" color="success" weight="600">
                    {parseFloat(log.consumption_km_gal).toFixed(1)} km/gal
                  </Text>
                )}
                {log.record_type === 'electric-charge' && log.consumption_km_kwh && (
                  <Text variant="smallLabel" color="success" weight="600">
                    {parseFloat(log.consumption_km_kwh).toFixed(1)} km/kWh
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color={Colors.gray300} style={styles.emptyIcon} />
          <Text variant="sectionTitle" color="gray900" weight="600" align="center" style={styles.emptyTitle}>
            No hay registros
          </Text>
          <Text variant="body" color="gray500" align="center">
            {selectedCategory === 'all' 
              ? "Aún no has registrado ningún gasto."
              : "No hay gastos registrados en esta categoría."}
          </Text>
        </View>
      )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary500,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  categoriesContainer: {
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  categoriesList: {
    paddingHorizontal: Layout.screenPadding,
    gap: Spacing.xs,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary500,
    borderColor: Colors.primary500,
  },
  categoryIcon: {
    marginRight: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xxl,
  },
  sectionHeader: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  transIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.gray50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  transInfo: {
    flex: 1,
  },
  transAmount: {
    alignItems: "flex-end",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Layout.screenPadding,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    marginBottom: Spacing.xs,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(220,38,38,0.08)",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.2)",
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Layout.screenPadding,
    marginVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  errorBannerText: { flex: 1, marginLeft: 4 },
});
