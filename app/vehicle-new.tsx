import React, { useState } from "react";
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { supabase } from "@/lib/supabase";
import { getColombiaYear } from "@/lib/date";
import { formatPlate, validatePlate } from "@/lib/validation";
import { Text } from "@/components/Typography";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout, Radius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

type VehicleType = "car" | "moto";
type PropulsionType = "combustion" | "electric";

const CAR_BRANDS = [
  { label: "Audi", value: "Audi" },
  { label: "BMW", value: "BMW" },
  { label: "BYD", value: "BYD" },
  { label: "Changan", value: "Changan" },
  { label: "Chery", value: "Chery" },
  { label: "Chevrolet", value: "Chevrolet" },
  { label: "Fiat", value: "Fiat" },
  { label: "Ford", value: "Ford" },
  { label: "Honda", value: "Honda" },
  { label: "Hyundai", value: "Hyundai" },
  { label: "Kia", value: "Kia" },
  { label: "Mazda", value: "Mazda" },
  { label: "Mercedes-Benz", value: "Mercedes-Benz" },
  { label: "MG", value: "MG" },
  { label: "Nissan", value: "Nissan" },
  { label: "Peugeot", value: "Peugeot" },
  { label: "Renault", value: "Renault" },
  { label: "Subaru", value: "Subaru" },
  { label: "Suzuki", value: "Suzuki" },
  { label: "Toyota", value: "Toyota" },
  { label: "Volkswagen", value: "Volkswagen" },
  { label: "Volvo", value: "Volvo" },
];

const MOTO_BRANDS = [
  { label: "Aima", value: "Aima" },
  { label: "AKT", value: "AKT" },
  { label: "Auteco", value: "Auteco" },
  { label: "Bajaj", value: "Bajaj" },
  { label: "Benelli", value: "Benelli" },
  { label: "BMW", value: "BMW" },
  { label: "Ducati", value: "Ducati" },
  { label: "Hero", value: "Hero" },
  { label: "Honda", value: "Honda" },
  { label: "Kawasaki", value: "Kawasaki" },
  { label: "KTM", value: "KTM" },
  { label: "Kymco", value: "Kymco" },
  { label: "NIU", value: "NIU" },
  { label: "Royal Enfield", value: "Royal Enfield" },
  { label: "Starker", value: "Starker" },
  { label: "Suzuki", value: "Suzuki" },
  { label: "TVS", value: "TVS" },
  { label: "Victory", value: "Victory" },
  { label: "Yamaha", value: "Yamaha" },
];

const { width } = Dimensions.get("window");

const SILHOUETTES = [
  { id: "car_model1.webp", name: "Hatchback Moderno", image: require("../assets/cars/car_model1.webp") },
  { id: "car_model2.webp", name: "Sedán Deportivo", image: require("../assets/cars/car_model2.webp") },
  { id: "car_model3.webp", name: "Camioneta SUV", image: require("../assets/cars/car_model3.webp") },
  { id: "car_model4.webp", name: "Superdeportivo", image: require("../assets/cars/car_model4.webp") },
  { id: "car_model5.webp", name: "Sedán Familiar", image: require("../assets/cars/car_model5.webp") },
];

const FUEL_TYPES = [
  { label: "Gasolina", value: "gasoline" },
  { label: "Diésel (ACPM)", value: "diesel" },
];

const GASOLINE_SUBTYPES = [
  { label: "Corriente", value: "corriente" },
  { label: "Extra (Premium)", value: "extra" },
];

export default function VehicleNewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plate, setPlate] = useState("");
  const [odometer, setOdometer] = useState("");
  const [batteryCapacity, setBatteryCapacity] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const [propulsion, setPropulsion] = useState<PropulsionType>("combustion");
  const [fuelType, setFuelType] = useState("gasoline");
  const [gasolineSubtype, setGasolineSubtype] = useState("corriente");
  const [selectedSilhouette, setSelectedSilhouette] = useState("car_model1.webp");

  const [loading, setLoading] = useState(false);

  // Errors state
  const [brandError, setBrandError] = useState("");
  const [modelError, setModelError] = useState("");
  const [yearError, setYearError] = useState("");
  const [plateError, setPlateError] = useState("");
  const [odometerError, setOdometerError] = useState("");
  const [batteryCapacityError, setBatteryCapacityError] = useState("");

  const validate = () => {
    let isValid = true;
    setBrandError("");
    setModelError("");
    setYearError("");
    setPlateError("");
    setOdometerError("");

    if (!brand) {
      setBrandError("La marca es requerida");
      isValid = false;
    }

    if (!model.trim()) {
      setModelError("El modelo es requerido");
      isValid = false;
    }

    const yearNum = parseInt(year);
    const currentYear = getColombiaYear();
    if (!year) {
      setYearError("El año es requerido");
      isValid = false;
    } else if (!/^\d{4}$/.test(year) || isNaN(yearNum) || yearNum < 1980 || yearNum > currentYear + 1) {
      setYearError(`El año debe ser válido (1980 - ${currentYear + 1})`);
      isValid = false;
    }

    const cleanPlate = plate.trim().toUpperCase();
    if (vehicleType === "car") {
      if (!cleanPlate) {
        setPlateError("La placa es requerida");
        isValid = false;
      } else if (!validatePlate(cleanPlate, "car")) {
        setPlateError("Formato de carro inválido (ej: ABC123)");
        isValid = false;
      }
    } else {
      if (propulsion === "combustion" && !cleanPlate) {
        setPlateError("La placa es requerida");
        isValid = false;
      } else if (cleanPlate) {
        if (!validatePlate(cleanPlate, "moto")) {
          setPlateError("Formato de moto inválido (ej: ABC12A)");
          isValid = false;
        }
      }
    }

    const odoNum = parseFloat(odometer);
    if (!odometer) {
      setOdometerError("El odómetro inicial es requerido");
      isValid = false;
    } else if (isNaN(odoNum) || odoNum < 0) {
      setOdometerError("El odómetro no puede ser negativo");
      isValid = false;
    }

    if (propulsion === "electric") {
      const batNum = parseFloat(batteryCapacity);
      if (!batteryCapacity) {
        setBatteryCapacityError("La capacidad de batería es requerida");
        isValid = false;
      } else if (isNaN(batNum) || batNum <= 0) {
        setBatteryCapacityError("La capacidad debe ser mayor a 0");
        isValid = false;
      }
    }

    return isValid;
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!validate()) return;

    setLoading(true);
    try {
      // 1. Desactivar todos los vehículos existentes del usuario
      await supabase
        .from("vehicles")
        .update({ is_active: false })
        .eq("user_id", user.id);

      // 2. Insertar nuevo vehículo como activo
      const { error } = await supabase.from("vehicles").insert({
        user_id: user.id,
        custom_brand: brand.trim(),
        custom_model: model.trim(),
        type: vehicleType,
        propulsion: propulsion,
        plate: plate.trim() ? plate.toUpperCase() : null,
        year: parseInt(year),
        initial_odometer: parseFloat(odometer),
        battery_capacity_kwh: propulsion === "electric" ? parseFloat(batteryCapacity) : null,
        fuel_type: propulsion === "combustion" ? fuelType : null,
        gasoline_subtype: (propulsion === "combustion" && fuelType === "gasoline") ? gasolineSubtype : null,
        model_image: selectedSilhouette,
        is_active: true,
      });

      if (error) {
        showAlert("Error de Creación", error.message, [], "error");
      } else {
        showAlert(
          "Vehículo Registrado",
          "¡Tu vehículo ha sido creado y seleccionado como activo!",
          [
            {
              text: "Excelente",
              onPress: () => {
                router.back();
              },
            },
          ],
          "success"
        );
      }
    } catch {
      showAlert("Error", "Ocurrió un error inesperado al guardar el vehículo", [], "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <Text variant="heading2" color="gray900" weight="700">
            Registrar Vehículo
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Segment Selector: Vehicle Type */}
          <View style={styles.selectorGroup}>
            <Text variant="caption" color="gray600" style={styles.selectorLabel}>
              Tipo de Vehículo
            </Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                onPress={() => {
                  setVehicleType("car");
                  setBrand("");
                }}
                style={[
                  styles.segmentOption,
                  vehicleType === "car" && styles.segmentOptionActive,
                ]}
              >
                <Text
                  variant="caption"
                  color={vehicleType === "car" ? "white" : "gray600"}
                  weight="600"
                >
                  Carro
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setVehicleType("moto");
                  setBrand("");
                }}
                style={[
                  styles.segmentOption,
                  vehicleType === "moto" && styles.segmentOptionActive,
                ]}
              >
                <Text
                  variant="caption"
                  color={vehicleType === "moto" ? "white" : "gray600"}
                  weight="600"
                >
                  Moto
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Segment Selector: Propulsion */}
          <View style={styles.selectorGroup}>
            <Text variant="caption" color="gray600" style={styles.selectorLabel}>
              Tipo de Combustible / Energía
            </Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                onPress={() => setPropulsion("combustion")}
                style={[
                  styles.segmentOption,
                  propulsion === "combustion" && styles.segmentOptionActive,
                ]}
              >
                <Text
                  variant="caption"
                  color={propulsion === "combustion" ? "white" : "gray600"}
                  weight="600"
                >
                  Combustión
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPropulsion("electric")}
                style={[
                  styles.segmentOption,
                  propulsion === "electric" && styles.segmentOptionActive,
                ]}
              >
                <Text
                  variant="caption"
                  color={propulsion === "electric" ? "white" : "gray600"}
                  weight="600"
                >
                  Eléctrico
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {propulsion === "combustion" && (
            <>
              <Select
                label="Tipo de Combustible *"
                placeholder="Seleccionar tipo de combustible"
                value={fuelType}
                options={FUEL_TYPES}
                onSelect={(val) => {
                  setFuelType(val);
                  if (val === "diesel") {
                    setGasolineSubtype("");
                  } else {
                    setGasolineSubtype("corriente");
                  }
                }}
              />

              {fuelType === "gasoline" && (
                <Select
                  label="Subtipo de Gasolina *"
                  placeholder="Seleccionar subtipo de gasolina"
                  value={gasolineSubtype}
                  options={GASOLINE_SUBTYPES}
                  onSelect={setGasolineSubtype}
                />
              )}
            </>
          )}

          <Select
            label="Marca *"
            placeholder="Seleccionar marca"
            value={brand}
            options={vehicleType === "car" ? CAR_BRANDS : MOTO_BRANDS}
            onSelect={setBrand}
            error={brandError}
          />

          <Input
            label="Modelo *"
            placeholder="Ej: 3, Corolla, Crypton..."
            value={model}
            onChangeText={setModel}
            error={modelError}
          />

          <Input
            label="Año *"
            placeholder="Ej: 2022"
            value={year}
            onChangeText={setYear}
            keyboardType="number-pad"
            error={yearError}
          />

          <Input
            label={
              vehicleType === "moto" && propulsion === "electric"
                ? "Placa (Opcional)"
                : "Placa *"
            }
            placeholder={vehicleType === "car" ? "Ej: ABC123" : "Ej: ABC12A"}
            value={plate}
            onChangeText={(text) => setPlate(formatPlate(text, vehicleType))}
            autoCapitalize="characters"
            error={plateError}
          />

          <Input
            label="Kilometraje Actual (Odómetro Inicial) *"
            placeholder="Ej: 15400"
            value={odometer}
            onChangeText={setOdometer}
            keyboardType="numeric"
            error={odometerError}
          />

          {propulsion === "electric" && (
            <Input
              label="Capacidad de Batería (kWh) *"
              placeholder="Ej: 40"
              value={batteryCapacity}
              onChangeText={setBatteryCapacity}
              keyboardType="numeric"
              error={batteryCapacityError}
            />
          )}

          {/* Silhouette Selection */}
          <View style={styles.selectorGroup}>
            <Text variant="caption" color="gray600" style={styles.selectorLabel}>
              Silueta del Vehículo
            </Text>
            <Text variant="caption" color="gray500" style={styles.selectorSubtitle}>
              {vehicleType === "moto"
                ? "Puedes seleccionar una silueta representativa de carro para el panel principal o continuar con el ícono de moto estándar."
                : "Elige la silueta que mejor represente a tu vehículo en el panel principal."}
            </Text>
            <View style={styles.silhouetteGrid}>
              {SILHOUETTES.map((sil) => {
                const isSelected = selectedSilhouette === sil.id;
                return (
                  <TouchableOpacity
                    key={sil.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedSilhouette(sil.id)}
                    style={[
                      styles.silhouetteCard,
                      isSelected && styles.silhouetteCardSelected,
                    ]}
                  >
                    <Image source={sil.image} style={styles.silhouetteImg} />
                    <Text
                      variant="caption"
                      color={isSelected ? "primary500" : "gray700"}
                      weight={isSelected ? "600" : "500"}
                      style={styles.silhouetteName}
                      align="center"
                    >
                      {sil.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark-circle" size={18} color={Colors.primary500} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Button
            title="Crear Vehículo"
            onPress={handleCreate}
            loading={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  keyboardView: {
    flex: 1,
  },
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
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
  },
  scrollContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Layout.verticalRhythm,
    gap: Spacing.sm,
  },
  selectorGroup: {
    marginBottom: Spacing.md,
  },
  selectorLabel: {
    marginBottom: Spacing.xs,
    marginLeft: 4,
    fontWeight: "500",
  },
  segmentedControl: {
    height: 52,
    flexDirection: "row",
    backgroundColor: Colors.gray100,
    borderRadius: Radius.sm, // matches input border radius (14)
    padding: 4,
  },
  segmentOption: {
    flex: 1,
    height: "100%",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  segmentOptionActive: {
    backgroundColor: Colors.primary500,
  },
  submitButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  selectorSubtitle: {
    fontSize: 12,
    color: Colors.gray500,
    marginLeft: 4,
    marginBottom: Spacing.xs,
  },
  silhouetteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  silhouetteCard: {
    width: (width - Layout.screenPadding * 2 - Spacing.md) / 2,
    backgroundColor: Colors.white,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    padding: Spacing.sm,
    alignItems: "center",
    position: "relative",
  },
  silhouetteCardSelected: {
    borderColor: Colors.primary500,
    backgroundColor: "rgba(77, 77, 255, 0.02)",
  },
  silhouetteImg: {
    width: "100%",
    height: 70,
    resizeMode: "contain",
  },
  silhouetteName: {
    marginTop: Spacing.xs,
  },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
  },
});
