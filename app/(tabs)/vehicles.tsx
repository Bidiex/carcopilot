import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Text } from "@/components/Typography";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout, Radius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function VehiclesScreen() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const router = useRouter();

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setVehicles(data);
      }
    } catch {
      // Errores silenciados
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Carga periódica al enfocar la pestaña
  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [fetchVehicles])
  );

  const handleActivateVehicle = async (vehicleId: string) => {
    if (!user || updatingId) return;

    setUpdatingId(vehicleId);
    try {
      // 1. Desactivar todos los vehículos
      await supabase
        .from("vehicles")
        .update({ is_active: false })
        .eq("user_id", user.id);

      // 2. Activar el vehículo seleccionado
      const { error } = await supabase
        .from("vehicles")
        .update({ is_active: true })
        .eq("id", vehicleId);

      if (error) {
        showAlert("Error", "No se pudo cambiar el vehículo activo", [], "error");
      } else {
        showAlert("Vehículo Seleccionado", "Has cambiado el vehículo activo con éxito.", [], "success");
        await fetchVehicles();
      }
    } catch {
      showAlert("Error", "Ocurrió un error inesperado", [], "error");
    } finally {
      setUpdatingId(null);
    }
  };

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
        {/* Header */}
        <View style={styles.header}>
          <Text variant="heading1" color="gray900" weight="700">
            Mis Vehículos
          </Text>
          <Text variant="caption" color="gray500">
            Selecciona o gestiona tu flota de vehículos
          </Text>
        </View>

        {/* List Section */}
        {vehicles.length > 0 ? (
          <View style={styles.listSection}>
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} variant="secondary" style={styles.vehicleCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.vehicleInfo}>
                    <Text variant="heading2" color="gray900" weight="700">
                      {vehicle.custom_brand} {vehicle.custom_model}
                    </Text>
                    <Text variant="caption" color="gray500" style={styles.plateText}>
                      Placa: {vehicle.plate || "Sin Placa"} • Año: {vehicle.year}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  {vehicle.is_active ? (
                    <View style={[styles.badge, styles.activeBadge]}>
                      <Text variant="smallLabel" color="white" weight="600">
                        Activo
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      disabled={updatingId !== null}
                      onPress={() => handleActivateVehicle(vehicle.id)}
                      style={[styles.badge, styles.inactiveBadge]}
                    >
                      {updatingId === vehicle.id ? (
                        <ActivityIndicator size="small" color={Colors.primary500} />
                      ) : (
                        <Text variant="smallLabel" color="primary500" weight="600">
                          Activar
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardFooter}>
                  <View style={styles.propulsionRow}>
                    <Ionicons
                      name={vehicle.propulsion === "electric" ? "flash-outline" : "water-outline"}
                      size={16}
                      color={Colors.primary500}
                      style={styles.footerIcon}
                    />
                    <Text variant="caption" color="gray600" weight="500">
                      {vehicle.propulsion === "electric" ? "Eléctrico" : "Combustión"}
                    </Text>
                  </View>

                  <View style={styles.odometerRow}>
                    <Ionicons name="speedometer-outline" size={16} color={Colors.gray500} style={styles.footerIcon} />
                    <Text variant="caption" color="gray600" weight="500">
                      Ini: {vehicle.initial_odometer.toLocaleString()} km
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          /* Empty State */
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

        {/* Add Vehicle Button (only if list is not empty, to avoid double button) */}
        {vehicles.length > 0 && (
          <View style={styles.addButtonContainer}>
            <Button
              title="Registrar Nuevo Vehículo"
              icon="add-outline"
              onPress={() => router.push("/vehicle-new")}
              style={styles.addButton}
            />
          </View>
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
    marginBottom: Layout.verticalRhythm,
  },
  listSection: {
    gap: Spacing.md,
    marginBottom: Layout.verticalRhythm,
  },
  vehicleCard: {
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  vehicleInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  plateText: {
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBadge: {
    backgroundColor: Colors.success,
  },
  inactiveBadge: {
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.primary500,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.gray100,
    marginVertical: Spacing.md,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  propulsionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  odometerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerIcon: {
    marginRight: 4,
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
