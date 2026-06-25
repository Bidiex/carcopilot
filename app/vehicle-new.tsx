import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  FlatList,
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
import { Colors, Spacing, Layout, Radius, Shadows } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { VEHICLE_MODELS, VEHICLE_IMAGES, CAR_COLORS } from "@/constants/vehicles";
import { useActionGuard } from "@/hooks/useActionGuard";
import { UpgradeModal } from "@/components/UpgradeModal";

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
  { label: "Tesla", value: "Tesla" },
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
  { label: "Mobulaa", value: "Mobulaa" },
  { label: "NIU", value: "NIU" },
  { label: "Ofero", value: "Ofero" },
  { label: "Royal Enfield", value: "Royal Enfield" },
  { label: "Starker", value: "Starker" },
  { label: "Suzuki", value: "Suzuki" },
  { label: "TVS", value: "TVS" },
  { label: "Victory", value: "Victory" },
  { label: "Yamaha", value: "Yamaha" },
];

const { width } = Dimensions.get("window");

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
  const { guardAction, showUpgradeModal, closeUpgradeModal } = useActionGuard();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const [propulsion, setPropulsion] = useState<PropulsionType>("combustion");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plate, setPlate] = useState("");
  const [odometer, setOdometer] = useState("");
  const [batteryCapacity, setBatteryCapacity] = useState("");
  const [fuelType, setFuelType] = useState("gasoline");
  const [gasolineSubtype, setGasolineSubtype] = useState("corriente");

  // Visuals
  const [selectedModelId, setSelectedModelId] = useState(VEHICLE_MODELS[0].id);
  const [selectedColor, setSelectedColor] = useState(VEHICLE_MODELS[0].colors[0]);

  // Errors
  const [brandError, setBrandError] = useState("");
  const [modelError, setModelError] = useState("");
  const [yearError, setYearError] = useState("");
  const [plateError, setPlateError] = useState("");
  const [odometerError, setOdometerError] = useState("");
  const [batteryCapacityError, setBatteryCapacityError] = useState("");

  const [scaleCar] = useState(new Animated.Value(1));
  const [scaleMoto] = useState(new Animated.Value(1));
  const [scaleComb] = useState(new Animated.Value(1));
  const [scaleElec] = useState(new Animated.Value(1));

  const animateSelection = (type: "car" | "moto" | "combustion" | "electric") => {
    if (type === "car") {
      Animated.parallel([
        Animated.spring(scaleCar, { toValue: 1.06, useNativeDriver: true, tension: 80, friction: 6 }),
        Animated.spring(scaleMoto, { toValue: 0.94, useNativeDriver: true, tension: 80, friction: 6 }),
      ]).start();
    } else if (type === "moto") {
      Animated.parallel([
        Animated.spring(scaleCar, { toValue: 0.94, useNativeDriver: true, tension: 80, friction: 6 }),
        Animated.spring(scaleMoto, { toValue: 1.06, useNativeDriver: true, tension: 80, friction: 6 }),
      ]).start();
    } else if (type === "combustion") {
      Animated.parallel([
        Animated.spring(scaleComb, { toValue: 1.06, useNativeDriver: true, tension: 80, friction: 6 }),
        Animated.spring(scaleElec, { toValue: 0.94, useNativeDriver: true, tension: 80, friction: 6 }),
      ]).start();
    } else if (type === "electric") {
      Animated.parallel([
        Animated.spring(scaleComb, { toValue: 0.94, useNativeDriver: true, tension: 80, friction: 6 }),
        Animated.spring(scaleElec, { toValue: 1.06, useNativeDriver: true, tension: 80, friction: 6 }),
      ]).start();
    }
  };

  useEffect(() => {
    if (step === 1) {
      animateSelection(vehicleType);
      animateSelection(propulsion);
    }
  }, [step, vehicleType, propulsion]);

  const validateStep2 = () => {
    let isValid = true;
    setBrandError("");
    setModelError("");
    setYearError("");
    setPlateError("");

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

    return isValid;
  };

  const validateStep3 = () => {
    let isValid = true;
    setOdometerError("");
    setBatteryCapacityError("");

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

  const handleNextStep = () => {
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await supabase
        .from("vehicles")
        .update({ is_active: false })
        .eq("user_id", user.id);

      const finalImage = `${selectedModelId}_${selectedColor}.webp`;

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
        model_image: finalImage,
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

  const renderStepIndicator = () => {
    return (
      <View style={styles.indicatorContainer}>
        {[1, 2, 3, 4].map((s) => (
          <View
            key={s}
            style={[
              styles.indicatorDot,
              s <= step && styles.indicatorDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.topHeader}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => step > 1 ? handlePrevStep() : router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          {renderStepIndicator()}
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 1: PROPULSION & VEHICLE TYPE */}
          {step === 1 && (
            <View style={styles.formContainer}>
              <Text variant="heading1" color="gray900" weight="700" style={styles.stepTitle}>
                ¿Qué máquina conduces? ⚡
              </Text>
              <Text variant="body" color="gray500" style={styles.stepSubtitle}>
                Elige el tipo de transporte y su motorización para adaptar las métricas y cálculos.
              </Text>

              <Text variant="body" color="gray700" weight="600" style={styles.selectorLabel}>
                Tipo de Transporte
              </Text>
              <View style={styles.cardRow}>
                <Animated.View style={{ transform: [{ scale: scaleCar }], flex: 1 }}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setVehicleType("car")}
                    style={[
                      styles.selectionCard,
                      vehicleType === "car" && styles.selectionCardActive,
                    ]}
                  >
                    <Ionicons
                      name="car"
                      size={36}
                      color={vehicleType === "car" ? Colors.primary500 : Colors.gray500}
                    />
                    <Text
                      variant="body"
                      color={vehicleType === "car" ? "primary500" : "gray800"}
                      weight="600"
                      style={styles.cardSelectLabel}
                    >
                      Carro
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: scaleMoto }], flex: 1 }}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setVehicleType("moto")}
                    style={[
                      styles.selectionCard,
                      vehicleType === "moto" && styles.selectionCardActive,
                    ]}
                  >
                    <Ionicons
                      name="bicycle"
                      size={36}
                      color={vehicleType === "moto" ? Colors.primary500 : Colors.gray500}
                    />
                    <Text
                      variant="body"
                      color={vehicleType === "moto" ? "primary500" : "gray800"}
                      weight="600"
                      style={styles.cardSelectLabel}
                    >
                      Moto
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              <Text variant="body" color="gray700" weight="600" style={styles.selectorLabel}>
                Tipo de Propulsión
              </Text>
              <View style={styles.cardRow}>
                <Animated.View style={{ transform: [{ scale: scaleComb }], flex: 1 }}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setPropulsion("combustion")}
                    style={[
                      styles.selectionCard,
                      propulsion === "combustion" && styles.selectionCardActive,
                    ]}
                  >
                    <Ionicons
                      name="water"
                      size={36}
                      color={propulsion === "combustion" ? Colors.primary500 : Colors.gray500}
                    />
                    <Text
                      variant="body"
                      color={propulsion === "combustion" ? "primary500" : "gray800"}
                      weight="600"
                      style={styles.cardSelectLabel}
                    >
                      Combustión
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: scaleElec }], flex: 1 }}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setPropulsion("electric")}
                    style={[
                      styles.selectionCard,
                      propulsion === "electric" && styles.selectionCardActive,
                    ]}
                  >
                    <Ionicons
                      name="flash"
                      size={36}
                      color={propulsion === "electric" ? Colors.primary500 : Colors.gray500}
                    />
                    <Text
                      variant="body"
                      color={propulsion === "electric" ? "primary500" : "gray800"}
                      weight="600"
                      style={styles.cardSelectLabel}
                    >
                      Eléctrico
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              <Button
                title="Siguiente"
                onPress={handleNextStep}
                style={styles.nextButton}
              />
            </View>
          )}

          {/* STEP 2: IDENTIFICATION */}
          {step === 2 && (
            <View style={styles.formContainer}>
              <Text variant="heading1" color="gray900" weight="700" style={styles.stepTitle}>
                Información Básica 📝
              </Text>
              <Text variant="body" color="gray500" style={styles.stepSubtitle}>
                Cuéntanos sobre la marca y modelo de tu máquina.
              </Text>

              <View style={styles.formFieldsCard}>
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
                  placeholder="Ej: Corolla, Onix, Crypton..."
                  value={model}
                  onChangeText={setModel}
                  error={modelError}
                />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: Spacing.sm }}>
                    <Input
                      label="Año *"
                      placeholder="Ej: 2022"
                      value={year}
                      onChangeText={setYear}
                      keyboardType="numeric"
                      error={yearError}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label={vehicleType === "moto" && propulsion === "electric" ? "Placa (Opcional)" : "Placa *"}
                      placeholder={vehicleType === "car" ? "ABC123" : "ABC12A"}
                      value={plate}
                      onChangeText={(text) => setPlate(formatPlate(text, vehicleType))}
                      autoCapitalize="characters"
                      error={plateError}
                    />
                  </View>
                </View>
              </View>

              <Button
                title="Siguiente"
                onPress={handleNextStep}
                style={styles.nextButton}
              />
            </View>
          )}

          {/* STEP 3: TECHNICAL DETAILS */}
          {step === 3 && (
            <View style={styles.formContainer}>
              <Text variant="heading1" color="gray900" weight="700" style={styles.stepTitle}>
                Detalles Técnicos ⚙️
              </Text>
              <Text variant="body" color="gray500" style={styles.stepSubtitle}>
                Especifica el tipo de energía que usa y su kilometraje actual.
              </Text>

              <View style={styles.formFieldsCard}>
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

                <Input
                  label="Kilometraje Inicial *"
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
              </View>

              <Button
                title="Siguiente"
                onPress={handleNextStep}
                style={styles.nextButton}
              />
            </View>
          )}

          {/* STEP 4: CAROUSEL & COLORS */}
          {step === 4 && (
            <View style={styles.formContainer}>
              <Text variant="heading1" color="gray900" weight="700" style={styles.stepTitle}>
                Personaliza tu Vehículo 🎨
              </Text>
              <Text variant="body" color="gray500" style={styles.stepSubtitle}>
                Selecciona la silueta y el color que más se parezca a tu máquina real.
              </Text>

              <View style={styles.carouselWrapper}>
                <FlatList
                  data={VEHICLE_MODELS}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={width * 0.8 + Spacing.md}
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
                          <Image source={VEHICLE_IMAGES[imageKey]} style={styles.carouselImage} />
                        </View>
                        <Text variant="heading2" color={isSelected ? "primary500" : "gray700"} weight={isSelected ? "700" : "600"} align="center" style={styles.carouselModelName}>
                          {item.name}
                        </Text>
                        
                        <View style={styles.colorDotsContainer}>
                          {item.colors.map(color => (
                            <TouchableOpacity activeOpacity={0.7}
                              key={color}
                              style={[
                                styles.colorDot,
                                { backgroundColor: CAR_COLORS[color] },
                                (isSelected && selectedColor === color) && styles.colorDotSelected
                              ]}
                              onPress={() => {
                                setSelectedModelId(item.id);
                                setSelectedColor(color);
                              }}
                            />
                          ))}
                        </View>
                        
                        {isSelected && (
                          <View style={styles.checkBadge}>
                            <Ionicons name="checkmark-circle" size={24} color={Colors.primary500} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>

              <Button
                title="Completar Registro"
                onPress={() => guardAction(handleCreate)}
                loading={loading}
                style={styles.submitButton}
              />
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={closeUpgradeModal}
        onUpgrade={() => { closeUpgradeModal(); router.push('/upgrade' as any); }}
      />
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
  topHeader: {
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
  indicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  indicatorDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray200,
  },
  indicatorDotActive: {
    backgroundColor: Colors.primary500,
  },
  scrollContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Layout.verticalRhythm,
  },
  formContainer: {
    flex: 1,
  },
  stepTitle: {
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  selectorLabel: {
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  cardRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  selectionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.gray200,
    height: 120,
  },
  selectionCardActive: {
    borderColor: Colors.primary500,
    backgroundColor: "rgba(77, 77, 255, 0.03)",
  },
  cardSelectLabel: {
    marginTop: Spacing.sm,
  },
  formFieldsCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.gray100,
    marginBottom: Spacing.xl,
  },
  rowInputs: {
    flexDirection: "row",
  },
  nextButton: {
    marginTop: "auto",
  },
  submitButton: {
    marginTop: Spacing.xl,
  },
  carouselWrapper: {
    marginHorizontal: -Layout.screenPadding,
  },
  carouselContainer: {
    paddingHorizontal: Layout.screenPadding,
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  carouselItem: {
    width: width * 0.8,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.gray200,
    position: "relative",
    minHeight: 280,
  },
  carouselItemSelected: {
    borderColor: Colors.primary500,
    backgroundColor: "rgba(77, 77, 255, 0.02)",
  },
  carouselImageContainer: {
    width: "100%",
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  carouselImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  carouselModelName: {
    marginBottom: Spacing.md,
  },
  colorDotsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: Spacing.xs,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.gray800,
    ...Shadows.sm,
  },
  colorDotSelected: {
    borderColor: Colors.primary500,
    transform: [{ scale: 1.25 }],
  },
  checkBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
});
