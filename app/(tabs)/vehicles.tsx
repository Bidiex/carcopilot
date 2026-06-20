import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Text } from "@/components/Typography";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout, Radius, Shadows } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { VEHICLE_IMAGES } from "@/constants/vehicles";

export default function VehiclesScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Calcular el odómetro actual basado en los registros más recientes
        const vehiclesWithOdo = await Promise.all(
          data.map(async (v) => {
            const [fuelRes, chargeRes, maintRes] = await Promise.all([
              supabase.from("fuel_logs").select("odometer").eq("vehicle_id", v.id).order("date", { ascending: false }).limit(1),
              supabase.from("electric_charge_logs").select("odometer").eq("vehicle_id", v.id).order("date", { ascending: false }).limit(1),
              supabase.from("maintenance_logs").select("odometer").eq("vehicle_id", v.id).order("date", { ascending: false }).limit(1),
            ]);

            let maxOdo = parseFloat(v.initial_odometer || 0);

            const checkOdo = (res: any) => {
              if (res.data && res.data.length > 0 && res.data[0].odometer) {
                const odo = parseFloat(res.data[0].odometer);
                if (!isNaN(odo) && odo > maxOdo) maxOdo = odo;
              }
            };

            checkOdo(fuelRes);
            checkOdo(chargeRes);
            checkOdo(maintRes);

            return { ...v, calculated_current_odometer: maxOdo };
          })
        );
        setVehicles(vehiclesWithOdo);
      }
    } catch {
      // Errores silenciados
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [fetchVehicles])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <ActivityIndicator size="large" color={Colors.primary500} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text variant="heading1" color="gray900" weight="700">
              Mis Vehículos
            </Text>
            <Text variant="caption" color="gray500">
              Selecciona o gestiona tu flota de vehículos
            </Text>
          </View>
          {vehicles.length > 0 && (
            <TouchableOpacity 
              style={styles.headerAddButton}
              onPress={() => router.push("/vehicle-new")}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>

        {vehicles.length > 0 ? (
          <View style={styles.listSection}>
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} variant="secondary" style={styles.vehicleCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.vehicleInfo}>
                    <Text variant="heading2" color="gray900" weight="700">
                      {vehicle.custom_brand} {vehicle.custom_model}
                    </Text>
                    <Text variant="body" color="gray600" style={styles.plateText} weight="500">
                      {vehicle.plate || "Sin Placa"} • Año {vehicle.year}
                    </Text>

                    <View style={styles.specsContainer}>
                      <View style={styles.specBadge}>
                        <Ionicons
                          name={vehicle.propulsion === "electric" ? "flash" : "water"}
                          size={14}
                          color={Colors.primary500}
                          style={styles.specIcon}
                        />
                        <Text variant="caption" color="gray700" weight="600">
                          {vehicle.propulsion === "electric"
                            ? "Eléctrico"
                            : vehicle.fuel_type === "diesel"
                            ? "Diésel"
                            : `Gasolina ${
                                vehicle.gasoline_subtype === "extra" ? "Extra" : "Cte"
                              }`}
                        </Text>
                      </View>

                      <View style={styles.specBadge}>
                        <Ionicons name="speedometer" size={14} color={Colors.gray500} style={styles.specIcon} />
                        <Text variant="caption" color="gray700" weight="600">
                          {(vehicle.calculated_current_odometer || vehicle.initial_odometer).toLocaleString()} km
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* 3D Model Image */}
                  <View style={styles.imageContainer}>
                    {vehicle.model_image && VEHICLE_IMAGES[vehicle.model_image] ? (
                      <Image
                        source={VEHICLE_IMAGES[vehicle.model_image]}
                        style={styles.vehicleImage}
                      />
                    ) : (
                      <View style={styles.placeholderIcon}>
                        <Ionicons name="car" size={40} color={Colors.gray300} />
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <Card variant="secondary" style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="car-outline" size={32} color={Colors.gray400} />
            </View>
            <Text variant="heading2" color="gray900" weight="700" style={styles.emptyTitle}>
              No hay vehículos registrados
            </Text>
            <Text variant="body" color="gray600" align="center" style={styles.emptySubtitle}>
              Aún no has agregado vehículos a tu cuenta. Registra uno para comenzar a llevar el control financiero.
            </Text>
            <Button
              title="Registrar mi primer vehículo"
              onPress={() => router.push("/vehicle-new")}
              style={{ width: "100%" }}
            />
          </Card>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  loadingArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.gray50,
  },
  scrollContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Layout.verticalRhythm,
  },
  headerAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary500,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.floating,
  },
  listSection: {
    gap: Spacing.lg,
    marginBottom: Layout.verticalRhythm,
  },
  vehicleCard: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vehicleInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  plateText: {
    marginTop: 4,
    marginBottom: 12,
  },
  specsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  specBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray50,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  specIcon: {
    marginRight: 4,
  },
  imageContainer: {
    width: 140,
    height: 90,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  vehicleImage: {
    width: 160,
    height: 110,
    resizeMode: "contain",
  },
  placeholderIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.gray50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  addButtonContainer: {
    marginTop: Spacing.sm,
  },
  addButton: {
    backgroundColor: Colors.primary500,
  },
  emptyCard: {
    padding: 24,
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.gray100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
});
