import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { requestNotificationPermissions } from "@/lib/notifications";
import { getColombia30DaysAgoString, getColombiaDateString } from "@/lib/date";
import { Text } from "@/components/Typography";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout, Radius, Shadows } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { VehiclePicker, VehiclePickerPill } from "@/components/VehiclePicker";
import { QuickActionMenu } from "@/components/QuickActionMenu";
import { LineChart } from "react-native-gifted-charts";
import { VEHICLE_IMAGES, BIKE_IMAGES } from "@/constants/vehicles";
import { useActionGuard } from "@/hooks/useActionGuard";
import { UpgradeModal } from "@/components/UpgradeModal";
import { InsightsCard } from "@/components/home/InsightsCard";
import { useInsights } from "@/hooks/useInsights";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

let dashboardCache: any = null;

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { guardAction, showUpgradeModal, closeUpgradeModal } = useActionGuard();

  const lastUserIdRef = React.useRef<string | null>(null);
  if (user && lastUserIdRef.current !== user.id) {
    lastUserIdRef.current = user.id;
    dashboardCache = null;
  }

  const [profileName, setProfileName] = useState(dashboardCache?.profileName || user?.user_metadata?.name || "Conductor");
  const [vehicles, setVehicles] = useState<any[]>(dashboardCache?.vehicles || []);
  
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(() => {
    if (dashboardCache?.vehicles && dashboardCache.vehicles.length === 1) {
      return dashboardCache.vehicles[0].id;
    }
    return null;
  });
  
  const [pickerVisible, setPickerVisible] = useState(false);

  const { insights, savedInsights, loading: insightsLoading, saveInsight, unsaveInsight } = useInsights();

  const [recentLogs, setRecentLogs] = useState<any[]>(dashboardCache?.recentLogs || []);
  const [loading, setLoading] = useState(vehicles.length === 0);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // New metrics states
  const [monthlyStats, setMonthlyStats] = useState(dashboardCache?.monthlyStats || { total: 0, fuel: 0, maint: 0, tax: 0, other: 0 });
  const [fuelMetrics, setFuelMetrics] = useState(dashboardCache?.fuelMetrics || { lastDate: null, daysSince: null, minPrice: null, maxPrice: null, minPriceType: null, maxPriceType: null, avgKmPerDay: null, avgDaysBetweenLogs: null });
  const [soatDays, setSoatDays] = useState<number | null>(dashboardCache?.soatDays ?? null);
  const [chartDataMaster, setChartDataMaster] = useState<any>(dashboardCache?.chartDataMaster || []);
  
  const [chartFilter, setChartFilter] = useState<"total" | "fuel" | "maint" | "tax" | "other">("total");

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) ?? null;
  const activeVehicle = vehicles.find(v => v.is_active) ?? vehicles[0] ?? null;
  const actionVehicle = selectedVehicle ?? activeVehicle;
  const isAllMode = vehicles.length > 1 ? selectedVehicleId === null : false;

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (!user) return;

      const loadDashboardData = async () => {
        try {
          if (vehicles.length === 0) setLoading(true);

          const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
          if (isMounted && profile?.name) setProfileName(profile.name);

          const { data: vhs } = await supabase.from("vehicles").select("*").eq("user_id", user.id);

          if (!vhs || vhs.length === 0) {
            if (isMounted) {
              setVehicles([]);
              setRecentLogs([]);
              setLoading(false);
            }
            return;
          }

          if (isMounted) {
            setVehicles(vhs);
            if (vhs.length === 1 && selectedVehicleId === null) {
              setSelectedVehicleId(vhs[0].id);
            }
          }

          const activeId = selectedVehicleId || (vhs.length === 1 ? vhs[0].id : null);
          const vehicleIds = activeId ? [activeId] : vhs.map((v: any) => v.id);

          // Fetch Data for Metrics and Charts (last 6 months roughly, or all for min/max)
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          const sixMonthsAgoStr = sixMonthsAgo.toISOString().split("T")[0];

          const [fuelRes, maintRes, taxRes, chargeRes, otherRes, soatRes] = await Promise.all([
            supabase.from("fuel_logs").select("*").in("vehicle_id", vehicleIds).order("date", { ascending: false }),
            supabase.from("maintenance_logs").select("*").in("vehicle_id", vehicleIds).gte("date", sixMonthsAgoStr).order("date", { ascending: false }),
            supabase.from("annual_records").select("*").in("vehicle_id", vehicleIds).gte("issue_date", sixMonthsAgoStr).order("issue_date", { ascending: false }),
            supabase.from("electric_charge_logs").select("*").in("vehicle_id", vehicleIds).gte("date", sixMonthsAgoStr).order("date", { ascending: false }),
            supabase.from("other_expenses").select("*").in("vehicle_id", vehicleIds).gte("date", sixMonthsAgoStr).order("date", { ascending: false }),
            supabase.from("annual_records").select("expiry_date").in("vehicle_id", vehicleIds).eq("type", "soat").order("expiry_date", { ascending: false }).limit(1)
          ]);

          // Recent Logs
          const allLogs: any[] = [];
          if (fuelRes.data) allLogs.push(...fuelRes.data.slice(0, 5).map(l => ({ ...l, record_type: 'fuel' })));
          if (maintRes.data) allLogs.push(...maintRes.data.slice(0, 5).map(l => ({ ...l, record_type: 'maintenance' })));
          if (taxRes.data) allLogs.push(...taxRes.data.slice(0, 5).map(l => ({ ...l, record_type: 'tax', date: l.issue_date })));
          if (chargeRes.data) allLogs.push(...chargeRes.data.slice(0, 5).map(l => ({ ...l, record_type: 'electric-charge' })));
          if (otherRes.data) allLogs.push(...otherRes.data.slice(0, 5).map(l => ({ ...l, record_type: 'other-expense' })));
          allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const sliceLogs = allLogs.slice(0, 3);
          
          if (isMounted) setRecentLogs(sliceLogs);

          // Fuel Metrics
          let lastDate = null;
          let daysSince = null;
          let minPrice: number | null = null;
          let maxPrice: number | null = null;
          let minPriceType = null;
          let maxPriceType = null;
          let avgKmPerDay = null;
          let avgDaysBetweenLogs = null;

          if (fuelRes.data && fuelRes.data.length > 0) {
            lastDate = fuelRes.data[0].date;
            const diffTime = Math.abs(new Date(getColombiaDateString()).getTime() - new Date(lastDate).getTime());
            daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            fuelRes.data.forEach(l => {
              const p = parseFloat(l.amount_cop) / parseFloat(l.gallons);
              if (!isNaN(p) && p > 0) {
                const vehicle = vhs.find((v: any) => v.id === l.vehicle_id);
                let rawType = "Corriente";
                if (vehicle) {
                  rawType = vehicle.gasoline_subtype || vehicle.fuel_type || "Corriente";
                }
                const fType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
                
                if (minPrice === null || p < minPrice) { minPrice = p; minPriceType = fType; }
                if (maxPrice === null || p > maxPrice) { maxPrice = p; maxPriceType = fType; }
              }
            });
          }

          // Compute new metrics using fuel and charge logs
          const allFuelAndCharge = [
            ...(fuelRes.data || []).map(l => ({ date: l.date, odo: parseFloat(l.current_odometer) })),
            ...(chargeRes.data || []).map(l => ({ date: l.date, odo: parseFloat(l.current_odometer) }))
          ].filter(l => !isNaN(l.odo) && l.date).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          if (allFuelAndCharge.length > 1) {
            const latestLog = allFuelAndCharge[0];
            const oldestLog = allFuelAndCharge[allFuelAndCharge.length - 1];
            const totalDays = (new Date(latestLog.date).getTime() - new Date(oldestLog.date).getTime()) / (1000 * 60 * 60 * 24);
            const totalKm = latestLog.odo - oldestLog.odo;

            if (totalDays > 0) {
              avgKmPerDay = Math.max(0, totalKm / totalDays);
              avgDaysBetweenLogs = Math.max(0, totalDays / (allFuelAndCharge.length - 1));
            }
          }

          if (isMounted) setFuelMetrics({ lastDate, daysSince, minPrice, maxPrice, minPriceType, maxPriceType, avgKmPerDay, avgDaysBetweenLogs });

          // SOAT
          let daysSoat = null;
          if (soatRes.data && soatRes.data.length > 0 && soatRes.data[0].expiry_date) {
            const expDate = soatRes.data[0].expiry_date;
            const diffTime = new Date(expDate).getTime() - new Date(getColombiaDateString()).getTime();
            daysSoat = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
          if (isMounted) setSoatDays(daysSoat);

          // Last 30 days stats
          const thirtyDaysAgoStr = getColombia30DaysAgoString();
          const stats = { total: 0, fuel: 0, maint: 0, tax: 0, other: 0 };
          
          fuelRes.data?.forEach(l => { if (l.date >= thirtyDaysAgoStr) { stats.fuel += parseFloat(l.amount_cop); stats.total += parseFloat(l.amount_cop); }});
          chargeRes.data?.forEach(l => { if (l.date >= thirtyDaysAgoStr) { stats.fuel += parseFloat(l.amount_cop); stats.total += parseFloat(l.amount_cop); }});
          maintRes.data?.forEach(l => { if (l.date >= thirtyDaysAgoStr) { stats.maint += parseFloat(l.total_amount_cop ?? l.amount_cop ?? 0); stats.total += parseFloat(l.total_amount_cop ?? l.amount_cop ?? 0); }});
          taxRes.data?.forEach(l => { if (l.issue_date >= thirtyDaysAgoStr) { stats.tax += parseFloat(l.amount_cop); stats.total += parseFloat(l.amount_cop); }});
          otherRes.data?.forEach(l => { if (l.date >= thirtyDaysAgoStr) { stats.other += parseFloat(l.amount_cop); stats.total += parseFloat(l.amount_cop); }});
          
          if (isMounted) setMonthlyStats(stats);

          // Chart Data (Last 6 months grouped)
          const chartMap: { [month: string]: { total: number, fuel: number, maint: number, tax: number, other: number } } = {};
          
          const getMonthKey = (d: string) => d.substring(0, 7); // YYYY-MM
          
          const processLog = (log: any, dateField: string, type: "fuel" | "maint" | "tax" | "other") => {
            if (!log[dateField]) return;
            const key = getMonthKey(log[dateField]);
            if (!chartMap[key]) chartMap[key] = { total: 0, fuel: 0, maint: 0, tax: 0, other: 0 };
            const amt = parseFloat(log.total_amount_cop ?? log.amount_cop ?? 0);
            chartMap[key][type] += amt;
            chartMap[key].total += amt;
          };

          fuelRes.data?.filter(l => l.date >= sixMonthsAgoStr).forEach(l => processLog(l, "date", "fuel"));
          chargeRes.data?.forEach(l => processLog(l, "date", "fuel"));
          maintRes.data?.forEach(l => processLog(l, "date", "maint"));
          taxRes.data?.forEach(l => processLog(l, "issue_date", "tax"));
          otherRes.data?.forEach(l => processLog(l, "date", "other"));

          const sortedKeys = Object.keys(chartMap).sort();
          const masterData = sortedKeys.map(k => {
            const dateObj = new Date(k + "-01T12:00:00");
            const label = dateObj.toLocaleString('es-CO', { month: 'short' }).substring(0,3).toUpperCase();
            return {
              label,
              ...chartMap[k]
            };
          });

          if (isMounted) setChartDataMaster(masterData);

          dashboardCache = {
            vehicles: vhs,
            recentLogs: sliceLogs,
            monthlyStats: stats,
            fuelMetrics: { lastDate, daysSince, minPrice, maxPrice, minPriceType, maxPriceType, avgKmPerDay, avgDaysBetweenLogs },
            soatDays: daysSoat,
            chartDataMaster: masterData,
            profileName: profile?.name || "Conductor",
          };

        } catch (e) {
          if (isMounted) setFetchError("No se pudieron cargar los datos. Toca para reintentar.");
        } finally {
          if (isMounted) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      };

      loadDashboardData();
      return () => { isMounted = false; };
    }, [user, selectedVehicleId, refreshTrigger])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    // Pedir permisos de notificaciones 1.5s después de montar el Dashboard
    // para evitar conflictos con el Splash Screen o AuthContext
    const timer = setTimeout(() => {
      requestNotificationPermissions();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const formatShortCOP = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  const handleQuickAction = (action: "fuel" | "charge" | "maintenance" | "tax" | "other") => {
    const params = actionVehicle ? { vehicleId: actionVehicle.id } : undefined;
    guardAction(() => {
      switch (action) {
        case "fuel": router.push({ pathname: "/fuel-log-new", params }); break;
        case "charge": router.push({ pathname: "/electric-charge-new", params }); break;
        case "maintenance": router.push({ pathname: "/maintenance-new", params }); break;
        case "tax": router.push({ pathname: "/tax-new", params }); break;
        case "other": router.push({ pathname: "/other-expense-new", params }); break;
      }
    });
  };

  const chartDataToRender = useMemo(() => {
    if (!chartDataMaster.length) return [];
    return chartDataMaster.map((d: any) => {
      const val = d[chartFilter] || 0;
      return {
        value: val,
        label: d.label,
        dataPointText: val > 0 ? formatShortCOP(val) : "",
        textShiftY: -10,
        textColor: Colors.gray600,
        textFontSize: 10,
      };
    });
  }, [chartDataMaster, chartFilter]);

  const chartMaxValue = useMemo(() => {
    if (!chartDataToRender.length) return 100;
    const max = Math.max(...chartDataToRender.map((d: any) => d.value));
    return max > 0 ? max * 1.3 : 100; // Add 30% padding at top to prevent cutoff
  }, [chartDataToRender]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <ActivityIndicator size="large" color={Colors.primary500} />
      </SafeAreaView>
    );
  }

  const hasVehicles = vehicles.length > 0;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={{ flex: 0, backgroundColor: Colors.primary500 }} />
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
      <VehiclePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        vehicles={vehicles}
        selectedId={selectedVehicleId}
        showAll={vehicles.length > 1}
        onSelect={(id) => {
          setLoading(true);
          setSelectedVehicleId(id);
        }}
      />

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={closeUpgradeModal}
        onUpgrade={() => { closeUpgradeModal(); router.push('/upgrade' as any); }}
      />

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
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[Colors.primary500]} 
            tintColor={Colors.primary500} 
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="caption" color="gray500">Bienvenido de vuelta,</Text>
            <Text variant="heading2" color="gray900" weight="700">{profileName}</Text>
          </View>
          <View style={styles.headerRight}>
            {hasVehicles && vehicles.length > 1 && (
              <VehiclePickerPill
                vehicles={vehicles}
                selectedId={selectedVehicleId}
                showAll={true}
                onPress={() => setPickerVisible(true)}
              />
            )}
            <QuickActionMenu 
              onAction={handleQuickAction} 
              disabled={!hasVehicles} 
              propulsionType={actionVehicle?.propulsion}
            />
          </View>
        </View>

        {hasVehicles ? (
          <>
            {/* Total Spent Breakdown Card */}
            <View style={styles.summaryCardContainer}>
              <Card variant="primary" style={styles.summaryCard}>
                <View style={[styles.cardHeader, { maxWidth: "55%" }]}>
                  <Text variant="caption" color="white" style={styles.cardSubtitle}>
                    Gastos Últimos 30 Días
                  </Text>
                  <Text variant="display" color="white" weight="700" style={styles.cardTitle}>
                    {formatCOP(monthlyStats.total)}
                  </Text>
                </View>

                <View style={styles.cardDivider} />

                {/* Breakdown */}
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownCol}>
                    <Text variant="smallLabel" color="white" style={styles.opacityLabel}>Combustible</Text>
                    <Text variant="body" color="white" weight="600">{formatCOP(monthlyStats.fuel)}</Text>
                  </View>
                  <View style={styles.breakdownCol}>
                    <Text variant="smallLabel" color="white" style={styles.opacityLabel}>Impuestos</Text>
                    <Text variant="body" color="white" weight="600">{formatCOP(monthlyStats.tax)}</Text>
                  </View>
                  <View style={styles.breakdownCol}>
                    <Text variant="smallLabel" color="white" style={styles.opacityLabel}>Talleres</Text>
                    <Text variant="body" color="white" weight="600">{formatCOP(monthlyStats.maint)}</Text>
                  </View>
                </View>

                {isAllMode ? (
                  <View style={styles.allVehiclesContainer}>
                    {[...vehicles]
                      .slice(0, 3)
                      .reverse()
                      .sort((a, b) => {
                        if (a.type === "moto" && b.type !== "moto") return 1;
                        if (a.type !== "moto" && b.type === "moto") return -1;
                        return 0;
                      })
                      .map((v, i) => !!v.model_image && (
                      <Image
                        key={v.id}
                        source={v.type === "moto" ? BIKE_IMAGES[v.model_image] : VEHICLE_IMAGES[v.model_image]}
                        style={[styles.allVehiclesImage, { zIndex: i }]}
                      />
                    ))}
                    {vehicles.length > 3 && (
                      <View style={styles.moreVehiclesBadge}>
                        <Text variant="caption" color="white" weight="700">+{vehicles.length - 3}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  !!(selectedVehicle?.model_image || activeVehicle?.model_image) && (
                    <Image
                      source={(selectedVehicle || activeVehicle)?.type === "moto" ? BIKE_IMAGES[(selectedVehicle || activeVehicle)?.model_image] : VEHICLE_IMAGES[(selectedVehicle || activeVehicle)?.model_image]}
                      style={styles.cardCarOverlay}
                    />
                  )
                )}
              </Card>
            </View>

            <InsightsCard 
              insights={insights}
              hasSavedInsights={savedInsights.length > 0}
              loading={insightsLoading}
              onSaveInsight={saveInsight}
              onUnsaveInsight={unsaveInsight}
            />

            {/* Line Chart Section */}
            <View style={styles.sectionDivider} />
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text variant="sectionTitle" color="gray900" style={styles.sectionTitle}>
                  Tendencia de Gastos
                </Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/reports" as any)}>
                  <Text variant="body" color="primary500" weight="600">Ver todas</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContainer}>
                {["total", "fuel", "maint", "tax", "other"].map((filter) => (
                  <TouchableOpacity activeOpacity={0.7}
                    key={filter}
                    style={[styles.filterChip, chartFilter === filter && styles.filterChipActive]}
                    onPress={() => setChartFilter(filter as any)}
                  >
                    <Text variant="smallLabel" color={chartFilter === filter ? "white" : "gray600"} weight="600">
                      {filter === "total" ? "Total" : filter === "fuel" ? "Combustible" : filter === "maint" ? "Talleres" : filter === "tax" ? "Impuestos" : "Otros"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <Card variant="secondary" style={styles.chartCard}>
                {chartDataToRender.length > 0 ? (
                  <LineChart
                    data={chartDataToRender}
                    width={SCREEN_WIDTH - Layout.screenPadding * 2 - Spacing.md * 2 - 20}
                    height={180}
                    thickness={3}
                    color={Colors.primary500}
                    dataPointsColor={Colors.primary500}
                    hideRules
                    hideYAxisText
                    yAxisLabelWidth={0}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    maxValue={chartMaxValue}
                    xAxisLabelsHeight={25}
                    yAxisTextStyle={{ color: Colors.gray400, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: Colors.gray400, fontSize: 12, textAlign: 'center' }}
                    isAnimated
                    curved
                    areaChart
                    startFillColor={Colors.primary500}
                    startOpacity={0.2}
                    endFillColor={Colors.primary50}
                    endOpacity={0.05}
                    spacing={60}
                    initialSpacing={20}
                    textFontSize={10}
                  />
                ) : (
                  <View style={styles.emptyChartContainer}>
                    <Text variant="body" color="gray500">No hay datos para mostrar la gráfica.</Text>
                  </View>
                )}
              </Card>
            </View>

            {/* Metrics Section */}
            <View style={styles.sectionDivider} />
            <View style={styles.metricsGrid}>
              <Card variant="secondary" style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.primary500} />
                  <Text variant="smallLabel" color="gray500" weight="600">ÚLT. TANQUEO</Text>
                </View>
                <Text variant="heading2" color="gray900" weight="700" style={{ marginTop: Spacing.xs }}>
                  {fuelMetrics.daysSince !== null ? `${fuelMetrics.daysSince} días` : "--"}
                </Text>
                <Text variant="caption" color="gray500">{fuelMetrics.lastDate || "Sin datos"}</Text>
              </Card>

              <Card variant="secondary" style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="document-text-outline" size={16} color={Colors.warning} />
                  <Text variant="smallLabel" color="gray500" weight="600">VENCE SOAT</Text>
                </View>
                <Text variant="heading2" color={soatDays !== null && soatDays < 30 ? "danger" : "gray900"} weight="700" style={{ marginTop: Spacing.xs }}>
                  {soatDays !== null ? `${soatDays} días` : "--"}
                </Text>
                <Text variant="caption" color="gray500">
                  {soatDays !== null && soatDays < 0 ? "¡Vencido!" : "Restantes"}
                </Text>
              </Card>
            </View>

            <View style={styles.metricsGrid}>
              <Card variant="secondary" style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="speedometer-outline" size={16} color={Colors.primary500} />
                  <Text variant="smallLabel" color="gray500" weight="600">PROM. KM / DÍA</Text>
                </View>
                <Text variant="heading2" color="gray900" weight="700" style={{ marginTop: Spacing.xs }}>
                  {fuelMetrics.avgKmPerDay !== null ? `${fuelMetrics.avgKmPerDay.toFixed(1)} km` : "--"}
                </Text>
              </Card>

              <Card variant="secondary" style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="time-outline" size={16} color={Colors.primary500} />
                  <Text variant="smallLabel" color="gray500" weight="600">DÍAS E. TANQUEO</Text>
                </View>
                <Text variant="heading2" color="gray900" weight="700" style={{ marginTop: Spacing.xs }}>
                  {fuelMetrics.avgDaysBetweenLogs !== null ? `${fuelMetrics.avgDaysBetweenLogs.toFixed(1)} días` : "--"}
                </Text>
              </Card>
            </View>

            <View style={styles.metricsGrid}>
              <Card variant="secondary" style={[styles.metricCard, { flex: 1 }] as any}>
                <View style={styles.metricHeader}>
                  <Ionicons name="pricetag-outline" size={16} color={Colors.success} />
                  <Text variant="smallLabel" color="gray500" weight="600">PRECIO GALÓN HISTÓRICO</Text>
                </View>
                <View style={styles.priceRow}>
                  <View>
                    <Text variant="caption" color="gray500">Menor{fuelMetrics.minPriceType ? ` (${fuelMetrics.minPriceType})` : ""}</Text>
                    <Text variant="body" color="success" weight="700">{fuelMetrics.minPrice ? formatCOP(fuelMetrics.minPrice) : "--"}</Text>
                  </View>
                  <View style={styles.priceDivider} />
                  <View>
                    <Text variant="caption" color="gray500">Mayor{fuelMetrics.maxPriceType ? ` (${fuelMetrics.maxPriceType})` : ""}</Text>
                    <Text variant="body" color="danger" weight="700">{fuelMetrics.maxPrice ? formatCOP(fuelMetrics.maxPrice) : "--"}</Text>
                  </View>
                </View>
              </Card>
            </View>

            {/* Recent Activity */}
            <View style={styles.sectionDivider} />
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text variant="sectionTitle" color="gray900" style={styles.sectionTitle}>
                  Historial Reciente
                </Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/history")}>
                  <Text variant="body" color="primary500" weight="600">Ver todo</Text>
                </TouchableOpacity>
              </View>

              {recentLogs.length > 0 ? (
                <Card variant="secondary" style={styles.transactionsCard}>
                  {recentLogs.map((log, index) => (
                    <React.Fragment key={`${log.record_type}-${log.id}`}>
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
                              : log.record_type === 'electric-charge' ? "Carga Eléctrica"
                              : log.record_type === 'maintenance' ? (log.items?.length > 1 ? `${log.items[0].item} y ${log.items.length - 1} más` : (log.items?.[0]?.item || log.type))
                              : log.record_type === 'tax' ? (log.type === "soat" ? "SOAT" : log.type === "tax" ? "Impuesto" : "Documento")
                              : log.description}
                          </Text>
                          <Text variant="caption" color="gray500">
                            {log.record_type === 'maintenance' && log.taller ? `${log.taller} • ` : ''}{log.date}
                          </Text>
                        </View>
                        <View style={styles.transAmount}>
                          <Text variant="body" color="primary500" weight="600">
                            {formatCOP(parseFloat(log.total_amount_cop ?? log.amount_cop ?? 0))}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      {index < recentLogs.length - 1 && <View style={styles.rowDivider} />}
                    </React.Fragment>
                  ))}
                </Card>
              ) : (
                <Card variant="secondary" style={styles.emptyLogsCard}>
                  <Ionicons name="receipt-outline" size={32} color={Colors.gray400} style={styles.emptyLogsIcon} />
                  <Text variant="body" color="gray600" align="center">
                    Aún no has registrado ningún gasto.
                  </Text>
                </Card>
              )}
            </View>
          </>
        ) : (
          <Card variant="secondary" style={styles.emptyVehicleCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="car-outline" size={32} color={Colors.primary500} />
            </View>
            <Text variant="heading2" color="gray900" weight="700" align="center" style={styles.emptyTitle}>
              No tienes vehículos registrados
            </Text>
            <Text variant="body" color="gray600" align="center" style={styles.emptySubtitle}>
              Registra tu primer carro o moto para comenzar a monitorear tus consumos y gastos financieros.
            </Text>
            <Button title="Registrar mi primer vehículo" onPress={() => router.push("/vehicle-new")} style={styles.emptyCardButton} />
          </Card>
        )}
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary500 },
  safeArea: { flex: 1, backgroundColor: Colors.gray50 },
  loadingArea: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray50 },
  scrollContainer: { paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Layout.verticalRhythm, zIndex: 10 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
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
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  errorBannerText: { flex: 1, marginLeft: 4 },
  summaryCardContainer: { marginBottom: 0 },
  summaryCard: { marginBottom: 0, position: "relative" },
  cardCarOverlay: {
    position: "absolute",
    right: -15,
    top: 5,
    width: 150,
    height: 100,
    resizeMode: "contain",
  },
  cardHeader: { width: "100%" },
  cardSubtitle: { opacity: 0.8, marginBottom: Spacing.xs },
  cardTitle: { fontSize: 28 },
  cardDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: Spacing.md },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", marginTop: Spacing.xs, zIndex: 2 },
  breakdownCol: { flex: 1 },
  opacityLabel: { opacity: 0.7, marginBottom: 2 },
  allVehiclesContainer: {
    position: "absolute",
    right: 12,
    top: 5,
    flexDirection: "row",
    alignItems: "center",
    height: 80,
  },
  allVehiclesImage: {
    width: 85,
    height: 60,
    resizeMode: "contain",
    marginLeft: -45,
  },
  moreVehiclesBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -32,
    zIndex: 99,
    elevation: 5,
  },
  
  metricsGrid: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm },
  metricCard: { flex: 1, padding: Spacing.md, marginBottom: 0 },
  metricHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  priceRow: { flexDirection: "row", justifyContent: "space-around", marginTop: Spacing.sm },
  priceDivider: { width: 1, backgroundColor: Colors.gray200, marginHorizontal: Spacing.sm },

  section: { marginBottom: 0 },
  sectionDivider: { height: 1, backgroundColor: Colors.gray200, marginVertical: Layout.verticalRhythm },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Layout.sectionGap },
  sectionTitle: { marginBottom: 0, fontWeight: "700" },
  
  filtersScroll: { marginBottom: Spacing.md },
  filtersContainer: { gap: Spacing.sm, paddingRight: Spacing.xl },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray200,
  },
  filterChipActive: { backgroundColor: Colors.primary500 },
  
  chartCard: { padding: Spacing.md, alignItems: "center", justifyContent: "center" },
  emptyChartContainer: { height: 180, justifyContent: "center", alignItems: "center" },

  transactionsCard: { paddingVertical: Spacing.xs },
  transactionRow: { flexDirection: "row", alignItems: "center", height: 64, paddingHorizontal: Spacing.sm },
  transIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.gray100, justifyContent: "center", alignItems: "center", marginRight: Spacing.md },
  transInfo: { flex: 1 },
  transAmount: { alignItems: "flex-end" },
  rowDivider: { height: 1, backgroundColor: Colors.gray100, marginLeft: 56 },
  
  emptyVehicleCard: { padding: 24, alignItems: "center", marginBottom: Layout.verticalRhythm },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.gray100, justifyContent: "center", alignItems: "center", marginBottom: Spacing.md },
  emptyTitle: { marginBottom: Spacing.xs },
  emptySubtitle: { marginBottom: Spacing.lg, lineHeight: 20, color: Colors.gray600 },
  emptyCardButton: { width: "100%" },
  emptyLogsCard: { padding: 24, alignItems: "center" },
  emptyLogsIcon: { marginBottom: Spacing.sm },
});
