import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { getShortMonthName } from "@/lib/date";
import { Text } from "@/components/Typography";
import { Colors, Spacing, Layout, Radius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { PieChart, LineChart } from "react-native-gifted-charts";

const { width } = Dimensions.get("window");

export default function ReportsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeVehicle, setActiveVehicle] = useState<any>(null);

  const [fuelTotal, setFuelTotal] = useState(0);
  const [chargeTotal, setChargeTotal] = useState(0);
  const [maintTotal, setMaintTotal] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [otherTotal, setOtherTotal] = useState(0);

  const [totalKm, setTotalKm] = useState(0);
  const [costPerKm, setCostPerKm] = useState(0);
  const [avgConsumption, setAvgConsumption] = useState(0);

  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadReportData();
    }
  }, [user]);

  const loadReportData = async () => {
    try {
      const { data: vehicle } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .single();

      if (!vehicle) {
        setLoading(false);
        return;
      }
      setActiveVehicle(vehicle);

      // Fetch all costs
      const { data: fuelLogs } = await supabase
        .from("fuel_logs")
        .select("amount_cop, date, consumption_km_gal, odometer")
        .eq("vehicle_id", vehicle.id);

      const { data: maintLogs } = await supabase
        .from("maintenance_logs")
        .select("amount_cop, date, odometer")
        .eq("vehicle_id", vehicle.id);

      const { data: taxLogs } = await supabase
        .from("annual_records")
        .select("amount_cop, issue_date")
        .eq("vehicle_id", vehicle.id);

      const { data: chargeLogs } = await supabase
        .from("electric_charge_logs")
        .select("amount_cop, date, consumption_km_kwh, odometer")
        .eq("vehicle_id", vehicle.id);

      const { data: otherLogs } = await supabase
        .from("other_expenses")
        .select("amount_cop, date")
        .eq("vehicle_id", vehicle.id);

      // Sums
      const fTotal = fuelLogs?.reduce((acc, log) => acc + parseFloat(log.amount_cop || 0), 0) || 0;
      const mTotal = maintLogs?.reduce((acc, log) => acc + parseFloat(log.amount_cop || 0), 0) || 0;
      const tTotal = taxLogs?.reduce((acc, log) => acc + parseFloat(log.amount_cop || 0), 0) || 0;
      const cTotal = chargeLogs?.reduce((acc, log) => acc + parseFloat(log.amount_cop || 0), 0) || 0;
      const oTotal = otherLogs?.reduce((acc, log) => acc + parseFloat(log.amount_cop || 0), 0) || 0;
      const grandTotal = fTotal + mTotal + tTotal + cTotal + oTotal;

      setFuelTotal(fTotal);
      setChargeTotal(cTotal);
      setMaintTotal(mTotal);
      setTaxTotal(tTotal);
      setOtherTotal(oTotal);

      // KM calculations
      let maxOdo = parseFloat(vehicle.initial_odometer);
      fuelLogs?.forEach(log => {
        if (parseFloat(log.odometer) > maxOdo) maxOdo = parseFloat(log.odometer);
      });
      maintLogs?.forEach(log => {
        if (parseFloat(log.odometer) > maxOdo) maxOdo = parseFloat(log.odometer);
      });
      chargeLogs?.forEach(log => {
        if (parseFloat(log.odometer) > maxOdo) maxOdo = parseFloat(log.odometer);
      });

      const kmTraveled = maxOdo - parseFloat(vehicle.initial_odometer);
      setTotalKm(kmTraveled);

      if (kmTraveled > 0) {
        setCostPerKm(grandTotal / kmTraveled);
      } else {
        setCostPerKm(0);
      }

      // Avg Consumption
      if (vehicle.propulsion === 'electric') {
        const consumptionItems = chargeLogs?.filter(log => log.consumption_km_kwh != null) || [];
        if (consumptionItems.length > 0) {
          const sumCons = consumptionItems.reduce((acc, log) => acc + parseFloat(log.consumption_km_kwh), 0);
          setAvgConsumption(sumCons / consumptionItems.length);
        } else {
          setAvgConsumption(0);
        }
      } else {
        const consumptionItems = fuelLogs?.filter(log => log.consumption_km_gal != null) || [];
        if (consumptionItems.length > 0) {
          const sumCons = consumptionItems.reduce((acc, log) => acc + parseFloat(log.consumption_km_gal), 0);
          setAvgConsumption(sumCons / consumptionItems.length);
        } else {
          setAvgConsumption(0);
        }
      }

      // Monthly Evolution Data
      const monthlyMap: Record<string, number> = {};

      const addMonthly = (dateStr: string, amt: number) => {
        if (!dateStr) return;
        const monthKey = dateStr.substring(0, 7); // YYYY-MM
        monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + amt;
      };

      fuelLogs?.forEach(log => addMonthly(log.date, parseFloat(log.amount_cop)));
      maintLogs?.forEach(log => addMonthly(log.date, parseFloat(log.amount_cop)));
      taxLogs?.forEach(log => addMonthly(log.issue_date, parseFloat(log.amount_cop)));
      chargeLogs?.forEach(log => addMonthly(log.date, parseFloat(log.amount_cop)));
      otherLogs?.forEach(log => addMonthly(log.date, parseFloat(log.amount_cop)));

      // Sort months
      const sortedMonths = Object.keys(monthlyMap).sort(); // chronological
      // Take last 6 months
      const last6Months = sortedMonths.slice(-6);

      const chartData = last6Months.map(m => {
        const [year, month] = m.split("-");
        const shortMonth = getShortMonthName(month);
        return {
          value: monthlyMap[m],
          label: shortMonth,
          dataPointText: formatCompactCOP(monthlyMap[m])
        };
      });

      setMonthlyData(chartData);

    } catch (error) {
      console.log("Error loading report", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCOP = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCompactCOP = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const pieData = [
    { value: fuelTotal, color: Colors.primary500, text: "Gasolina" },
    { value: chargeTotal, color: Colors.success, text: "Cargas" },
    { value: maintTotal, color: Colors.warning, text: "Talleres" },
    { value: taxTotal, color: Colors.danger, text: "Impuestos" },
    { value: otherTotal, color: Colors.gray500, text: "Otros" },
  ].filter(d => d.value > 0);

  const totalPie = fuelTotal + chargeTotal + maintTotal + taxTotal + otherTotal;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <ActivityIndicator size="large" color={Colors.primary500} />
      </SafeAreaView>
    );
  }

  if (!activeVehicle) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <Text variant="body" color="gray600">No hay vehículo activo para reportes.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={24} color={Colors.gray900} />
        </TouchableOpacity>
        <Text variant="heading2" color="gray900" weight="700">
          Inteligencia Financiera
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* KPIs */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconBox}>
              <Ionicons name="speedometer-outline" size={20} color={Colors.primary600} />
            </View>
            <Text variant="smallLabel" color="gray500" style={styles.kpiLabel}>Costo x KM</Text>
            <Text variant="heading2" color="gray900" weight="700">{formatCOP(costPerKm)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconBox}>
              <Ionicons name="leaf-outline" size={20} color={Colors.success} />
            </View>
            <Text variant="smallLabel" color="gray500" style={styles.kpiLabel}>Rendimiento</Text>
            <Text variant="heading2" color="gray900" weight="700">
              {avgConsumption > 0 ? avgConsumption.toFixed(1) : "--"}{" "}
              <Text variant="caption" color="gray500">
                {activeVehicle.propulsion === 'electric' ? 'km/kWh' : 'km/gal'}
              </Text>
            </Text>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { width: "100%" }]}>
             <View style={styles.kpiIconBox}>
              <Ionicons name="wallet-outline" size={20} color={Colors.primary600} />
            </View>
            <Text variant="smallLabel" color="gray500" style={styles.kpiLabel}>Gasto Total Acumulado</Text>
            <Text variant="display" color="gray900" weight="700">{formatCOP(totalPie)}</Text>
            <Text variant="caption" color="gray500" style={{marginTop: 4}}>En {totalKm.toLocaleString('es-CO')} km recorridos</Text>
          </View>
        </View>

        {/* Distribución de Gastos */}
        {totalPie > 0 && (
          <View style={styles.chartCard}>
            <Text variant="heading2" color="gray900" weight="700" style={styles.chartTitle}>Distribución de Gastos</Text>
            <View style={styles.pieContainer}>
              <PieChart
                data={pieData}
                donut
                innerRadius={60}
                radius={90}
                innerCircleColor={Colors.white}
                centerLabelComponent={() => {
                  return (
                    <View style={{justifyContent: 'center', alignItems: 'center'}}>
                      <Text variant="caption" color="gray500">Total</Text>
                      <Text variant="body" color="gray900" weight="700">{formatCompactCOP(totalPie)}</Text>
                    </View>
                  );
                }}
              />
              <View style={styles.legendContainer}>
                {pieData.map((d, i) => (
                  <View key={i} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                    <View>
                      <Text variant="smallLabel" color="gray600">{d.text}</Text>
                      <Text variant="caption" color="gray900" weight="600">{((d.value / totalPie) * 100).toFixed(1)}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Evolución Mensual */}
        {monthlyData.length > 0 && (
          <View style={[styles.chartCard, { marginBottom: Spacing.xxl }]}>
            <Text variant="heading2" color="gray900" weight="700" style={styles.chartTitle}>Evolución de Gastos</Text>
            <LineChart
              data={monthlyData}
              width={width - Layout.screenPadding * 2 - 40}
              height={200}
              spacing={50}
              thickness={3}
              color={Colors.primary500}
              dataPointsColor={Colors.primary600}
              textFontSize={10}
              textColor={Colors.gray500}
              xAxisLabelTextStyle={{ color: Colors.gray500, fontSize: 10 }}
              yAxisTextStyle={{ color: Colors.gray500, fontSize: 10 }}
              rulesColor={Colors.gray200}
              yAxisColor={Colors.gray200}
              xAxisColor={Colors.gray200}
              hideRules
              curved
              isAnimated
            />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.gray50 },
  loadingArea: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray50 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Layout.screenPadding,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    backgroundColor: Colors.white,
  },
  backButton: { width: 44, height: 44, justifyContent: "center" },
  scrollContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Layout.verticalRhythm,
    gap: Spacing.md,
  },
  kpiGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: "rgba(77, 77, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  kpiLabel: {
    marginBottom: 2,
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    marginBottom: Spacing.lg,
  },
  pieContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  legendContainer: {
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.xs,
  },
});
