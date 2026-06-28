import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Text } from "@/components/Typography";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout, Radius, Shadows } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { VEHICLE_IMAGES, VEHICLE_MODELS, CAR_COLORS, BIKE_IMAGES, BIKE_MODELS, BIKE_COLORS } from "@/constants/vehicles";
import { useAlert } from "@/context/AlertContext";
import { useActionGuard } from "@/hooks/useActionGuard";
import { UpgradeModal } from "@/components/UpgradeModal";

const { width } = Dimensions.get("window");

export default function VehiclesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { guardAction, showUpgradeModal, closeUpgradeModal } = useActionGuard();

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Edit Model State
  const { showAlert } = useAlert();
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [savingModel, setSavingModel] = useState(false);

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
      setFetchError("No se pudieron cargar los vehículos.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [fetchVehicles])
  );

  const openEditModal = (vehicle: any) => {
    setEditingVehicle(vehicle);
    if (vehicle.model_image) {
      const [modelId, colorExt] = vehicle.model_image.split("_");
      const color = colorExt ? colorExt.replace(".webp", "") : "";
      setSelectedModelId(modelId);
      setSelectedColor(color);
    } else {
      const models = vehicle.type === "moto" ? BIKE_MODELS : VEHICLE_MODELS;
      setSelectedModelId(models[0].id);
      setSelectedColor(models[0].colors[0]);
    }
  };

  const handleSaveModel = async () => {
    if (!editingVehicle) return;
    setSavingModel(true);
    
    const imageKey = `${selectedModelId}_${selectedColor}.webp`;

    try {
      const { error } = await supabase
        .from("vehicles")
        .update({ model_image: imageKey })
        .eq("id", editingVehicle.id);

      if (error) throw error;

      // Update local state
      setVehicles((prev) => 
        prev.map(v => v.id === editingVehicle.id ? { ...v, model_image: imageKey } : v)
      );

      showAlert("Vehículo Actualizado", "El modelo ha sido cambiado exitosamente.", [], "success");
      setEditingVehicle(null);
    } catch (e: any) {
      showAlert("Error", "No se pudo actualizar el modelo: " + e.message, [], "error");
    } finally {
      setSavingModel(false);
    }
  };

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
              activeOpacity={0.8}
              style={styles.headerAddButton}
              onPress={() => guardAction(() => router.push("/vehicle-new"))}
            >
              <Ionicons name="add" size={24} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>

        {fetchError && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.errorBanner}
            onPress={() => { setFetchError(null); setLoading(true); fetchVehicles(); }}
          >
            <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
            <Text variant="caption" color="danger" style={styles.errorBannerText}>{fetchError}</Text>
            <Text variant="caption" color="primary500" weight="600">Reintentar</Text>
          </TouchableOpacity>
        )}

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
                    {vehicle.model_image && (vehicle.type === "moto" ? BIKE_IMAGES[vehicle.model_image] : VEHICLE_IMAGES[vehicle.model_image]) ? (
                      <Image
                        source={vehicle.type === "moto" ? BIKE_IMAGES[vehicle.model_image] : VEHICLE_IMAGES[vehicle.model_image]}
                        style={styles.vehicleImage}
                      />
                    ) : (
                      <View style={styles.placeholderIcon}>
                        <Ionicons name={vehicle.type === "moto" ? "bicycle" : "car"} size={40} color={Colors.gray300} />
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity activeOpacity={0.7} 
                  style={styles.editModelButton}
                  onPress={() => openEditModal(vehicle)}
                >
                  <Ionicons name="pencil" size={16} color={Colors.white} />
                </TouchableOpacity>
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

      {/* Edit Model Modal */}
      <Modal
        visible={!!editingVehicle}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingVehicle(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="heading2" color="gray900" weight="700">Editar Modelo</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setEditingVehicle(null)}>
                <Ionicons name="close" size={24} color={Colors.gray900} />
              </TouchableOpacity>
            </View>

            <View style={styles.carouselWrapper}>
              <FlatList
                data={editingVehicle?.type === "moto" ? BIKE_MODELS : VEHICLE_MODELS}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={width * 0.7 + Spacing.md}
                decelerationRate="fast"
                contentContainerStyle={styles.carouselContainer}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                  const isSelected = selectedModelId === item.id;
                  const currentColor = isSelected ? selectedColor : item.colors[0];
                  const imageKey = `${item.id}_${currentColor}.webp`;

                  return (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[styles.carouselItem, isSelected && styles.carouselItemSelected]}
                      onPress={() => {
                        setSelectedModelId(item.id);
                        if (!item.colors.includes(selectedColor)) {
                          setSelectedColor(item.colors[0]);
                        }
                      }}
                    >
                      <View style={styles.carouselImageContainer}>
                        <Image source={editingVehicle?.type === "moto" ? BIKE_IMAGES[imageKey] : VEHICLE_IMAGES[imageKey]} style={styles.carouselImage} />
                      </View>
                      <Text variant="body" color={isSelected ? "primary500" : "gray700"} weight={isSelected ? "700" : "600"} align="center" style={styles.carouselModelName}>
                        {item.name}
                      </Text>
                      
                      <View style={styles.colorDotsContainer}>
                        {item.colors.map(color => (
                          <TouchableOpacity activeOpacity={0.7}
                            key={color}
                            style={[
                              styles.colorDot,
                              color !== "wrapper" && { backgroundColor: editingVehicle?.type === "moto" ? BIKE_COLORS[color as keyof typeof BIKE_COLORS] : CAR_COLORS[color as keyof typeof CAR_COLORS] },
                              (isSelected && selectedColor === color) && styles.colorDotSelected,
                              color === "wrapper" && { overflow: "hidden", borderWidth: 0 }
                            ]}
                            onPress={() => {
                              setSelectedModelId(item.id);
                              setSelectedColor(color);
                            }}
                          >
                            {color === "wrapper" && (
                              <LinearGradient
                                colors={['#EF4444', '#FFFFFF']}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                              />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Ionicons name="checkmark" size={16} color={Colors.white} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            <Button
              title={savingModel ? "Guardando..." : "Guardar Cambios"}
              onPress={handleSaveModel}
              disabled={savingModel || !selectedModelId}
              style={styles.saveButton}
            />
          </View>
        </View>
      </Modal>
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={closeUpgradeModal}
        onUpgrade={() => { closeUpgradeModal(); router.push('/upgrade' as any); }}
      />
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
    alignItems: "center",
    position: "relative",
  },
  vehicleImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  placeholderIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  editModelButton: {
    position: "absolute",
    right: Spacing.md,
    top: Spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary500,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.card,
  },
  emptyCard: {
    padding: Spacing.xxl,
    alignItems: "center",
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
    marginBottom: Spacing.xl,
    lineHeight: 20,
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
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  errorBannerText: { flex: 1, marginLeft: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  carouselWrapper: {
    marginHorizontal: -Spacing.lg,
    marginBottom: Spacing.xl,
  },
  carouselContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  carouselItem: {
    width: width * 0.7,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.gray100,
    position: "relative",
  },
  carouselItemSelected: {
    borderColor: Colors.primary500,
    backgroundColor: Colors.primary50,
  },
  carouselImageContainer: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  carouselImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  carouselModelName: {
    marginBottom: Spacing.sm,
  },
  colorDotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorDotSelected: {
    borderColor: Colors.gray900,
  },
  selectedBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary500,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    width: "100%",
  },
});
