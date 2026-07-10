import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Platform,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  Animated,
  FlatList,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { getColombiaYear } from "@/lib/date";
import { formatPlate, validatePlate } from "@/lib/validation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text } from "@/components/Typography";
import { Input } from "@/components/Input";
import { PlateInput } from "@/components/PlateInput";
import { YearStepper } from "@/components/YearStepper";
import { RadioGroup } from "@/components/RadioGroup";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout, Radius, Shadows } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useAlert } from "@/context/AlertContext";
import { VEHICLE_MODELS, VEHICLE_IMAGES, CAR_COLORS, BIKE_MODELS, BIKE_IMAGES, BIKE_COLORS } from "@/constants/vehicles";
import { scheduleWelcomeNotification } from "@/lib/notifications";

const { width } = Dimensions.get("window");

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



const FUEL_TYPES = [
  { label: "Gasolina", value: "gasoline" },
  { label: "Diésel (ACPM)", value: "diesel" },
];

const GASOLINE_SUBTYPES = [
  { label: "Corriente", value: "corriente" },
  { label: "Extra (Premium)", value: "extra" },
];


export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showAlert } = useAlert();
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(params.step ? parseInt(params.step as string, 10) : 1);
  const [loading, setLoading] = useState(false);

  // Vehicle Info (Step 2 & 3)
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const [propulsion, setPropulsion] = useState<PropulsionType>("combustion");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(getColombiaYear().toString());
  const [plate, setPlate] = useState("");
  const [odometer, setOdometer] = useState("");
  const [batteryCapacity, setBatteryCapacity] = useState("");
  const [fuelType, setFuelType] = useState("gasoline");
  const [gasolineSubtype, setGasolineSubtype] = useState("corriente");

  // Silhouette Info (Step 4)
  const [selectedModelId, setSelectedModelId] = useState(VEHICLE_MODELS[0].id);
  const [selectedColor, setSelectedColor] = useState(VEHICLE_MODELS[0].colors[0]);

  // Sign Up Info (Step 5)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 3 Errors
  const [brandError, setBrandError] = useState("");
  const [modelError, setModelError] = useState("");
  const [yearError, setYearError] = useState("");
  const [plateError, setPlateError] = useState("");
  const [odometerError, setOdometerError] = useState("");
  const [batteryError, setBatteryError] = useState("");

  // Step 5 Errors
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Animated Values for interactive selection cards
  const [scaleCar] = useState(new Animated.Value(1));
  const [scaleMoto] = useState(new Animated.Value(1));
  const [scaleComb] = useState(new Animated.Value(1));
  const [scaleElec] = useState(new Animated.Value(1));



  // React to selection changes with smooth spring animations
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
    if (step === 2) {
      animateSelection(vehicleType);
      animateSelection(propulsion);
    } else if (step === 4) {
      if (vehicleType === "moto") {
        setSelectedModelId(BIKE_MODELS[0].id);
        setSelectedColor(BIKE_MODELS[0].colors[0]);
      } else {
        setSelectedModelId(VEHICLE_MODELS[0].id);
        setSelectedColor(VEHICLE_MODELS[0].colors[0]);
      }
    }
  }, [step, vehicleType, propulsion]);

  useEffect(() => {
    if (vehicleType === "moto" && fuelType === "diesel") {
      setFuelType("gasoline");
      setGasolineSubtype("corriente");
    }
  }, [vehicleType, fuelType]);

  const validateVehicleData = () => {
    let isValid = true;
    setBrandError("");
    setModelError("");
    setYearError("");
    setPlateError("");
    setOdometerError("");
    setBatteryError("");

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
    } else if (vehicleType === "moto") {
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
        setBatteryError("La capacidad de batería es requerida");
        isValid = false;
      } else if (isNaN(batNum) || batNum <= 0) {
        setBatteryError("La capacidad debe ser mayor a 0");
        isValid = false;
      }
    }

    return isValid;
  };

  const validateSignupData = () => {
    let isValid = true;
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (!name.trim()) {
      setNameError("El nombre completo es requerido");
      isValid = false;
    }

    if (!email) {
      setEmailError("El correo electrónico es requerido");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Correo electrónico inválido");
      isValid = false;
    }

    if (!password) {
      setPasswordError("La contraseña es requerida");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres");
      isValid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Las contraseñas no coinciden");
      isValid = false;
    }

    return isValid;
  };

  const handleNextStep = () => {
    if (step === 3) {
      if (!validateVehicleData()) return;
    }
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSignup = async () => {
    if (!validateSignupData()) return;

    setLoading(true);

    const vehicleData = {
      brand: brand.trim(),
      model: model.trim(),
      vehicleType,
      propulsion,
      plate: plate.trim() ? plate.toUpperCase() : null,
      year: parseInt(year),
      odometer: parseFloat(odometer),
      batteryCapacity: propulsion === "electric" ? parseFloat(batteryCapacity) : null,
      fuelType: propulsion === "combustion" ? fuelType : null,
      gasolineSubtype: (propulsion === "combustion" && fuelType === "gasoline") ? gasolineSubtype : null,
      model_image: `${selectedModelId}_${selectedColor}.webp`,
    };

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        showAlert("Error de Registro", error.message, [], "error");
        setLoading(false);
        return;
      }

      // Limpiar datos temporales por si quedaron de intentos anteriores
      await AsyncStorage.removeItem("temp_onboarding_vehicle");

      if (data.session && data.user) {
        const { error: vehicleError } = await supabase.from("vehicles").insert({
          user_id: data.user.id,
          custom_brand: vehicleData.brand,
          custom_model: vehicleData.model,
          type: vehicleData.vehicleType,
          propulsion: vehicleData.propulsion,
          plate: vehicleData.plate,
          year: vehicleData.year,
          initial_odometer: vehicleData.odometer,
          battery_capacity_kwh: vehicleData.batteryCapacity,
          fuel_type: vehicleData.fuelType,
          gasoline_subtype: vehicleData.gasolineSubtype,
          model_image: vehicleData.model_image,
          is_active: true,
        });

        if (vehicleError) {
          // console.error("Error creating vehicle post-signup:", vehicleError);
        }

        // Activar trial_started_at al completar onboarding
        await supabase
          .from('profiles')
          .update({
            trial_started_at: new Date().toISOString(),
            access_status: 'trial',
          })
          .eq('id', data.user.id);

        showAlert(
          "¡Registro Exitoso!",
          "Tu cuenta y vehículo han sido configurados correctamente.",
          [
            {
              text: "Entrar",
              onPress: async () => {
                await refreshProfile();
                supabase.functions.invoke('trigger-system-notification', {
                  body: { trigger_event: 'user_welcome', user_id: data.user?.id }
                });
                router.replace("/trial-explain");
              },
            },
          ],
          "success"
        );
      } else {
        await AsyncStorage.setItem("temp_onboarding_vehicle", JSON.stringify(vehicleData));

        showAlert(
          "Verifica tu Correo",
          "Te hemos enviado un enlace de confirmación. Tu vehículo se configurará automáticamente cuando inicies sesión por primera vez.",
          [
            {
              text: "Entendido",
              onPress: () => {
                supabase.functions.invoke('trigger-system-notification', {
                  body: { trigger_event: 'user_welcome', user_id: data.user?.id }
                });
                router.replace("/(auth)/login");
              },
            },
          ],
          "info"
        );
      }
    } catch {
      showAlert("Error", "Ocurrió un error inesperado al procesar el registro", [], "error");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    // El stepper se muestra desde el paso 2 al 5 (4 pasos en total)
    const percentage = Math.round(((step - 1) / 4) * 100);
    return (
      <View style={styles.progressHeaderContainer}>
        <View style={styles.progressBarTrack}>
          <LinearGradient
            colors={[Colors.primary700, Colors.primary500]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${percentage}%` }]}
          />
        </View>
        <Text variant="smallLabel" color="#000000" weight="600" style={styles.progressText}>
          {percentage}%
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, step === 1 && { backgroundColor: 'transparent' }]}>
      {step === 1 && <StatusBar style="light" backgroundColor="transparent" translucent />}
      {step > 1 && (
        <SafeAreaView edges={["top"]} style={{ flex: 0, backgroundColor: Colors.primary500 }} />
      )}
      <SafeAreaView edges={["left", "right", "bottom"]} style={[styles.safeArea, step === 1 && { backgroundColor: 'transparent' }]}>
        {step > 1 && (
          <View style={styles.topHeader}>
            <TouchableOpacity activeOpacity={0.7} onPress={handlePrevStep} style={styles.backButton}>
              <Ionicons name="arrow-back-outline" size={24} color={Colors.gray900} />
            </TouchableOpacity>
            {renderStepIndicator()}
            <View style={{ width: 44 }} />
          </View>
        )}

        <KeyboardAwareScrollView
          style={styles.keyboardView}
          contentContainerStyle={[
            styles.scrollContainer,
            step === 1 && { paddingHorizontal: 0, paddingBottom: 0, flexGrow: 1 },
          ]}
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraHeight={150}
          extraScrollHeight={100}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1: WELCOME SCREEN */}
          {step === 1 && (
            <ImageBackground
              source={require("../assets/backgrounds/welcome_screen_bg.webp")}
              style={styles.welcomeBackground}
              resizeMode="cover"
            >
              <View style={styles.welcomeOverlay} />
              <View style={styles.welcomeBottomContent}>
                <Button
                  title="Configurar mi Vehículo"
                  onPress={() => setStep(2)}
                  style={styles.startButton}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push("/(auth)/login")}
                  style={styles.loginLink}
                >
                  <Text variant="body" color="white" weight="600" align="center">
                    Ya tengo cuenta — Iniciar Sesión
                  </Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          )}

          {/* STEP 2: PROPULSION & VEHICLE TYPE (GAMIFIED CARDS) */}
          {step === 2 && (
            <View style={styles.formContainer}>
              <Text variant="heading1" color="gray900" weight="700" align="center" style={styles.stepTitle}>
                ¿Qué máquina conduces?
              </Text>
              <Text variant="body" color="gray500" align="center" style={styles.stepSubtitle}>
                Elige el tipo de transporte y su motorización para adaptar las métricas y cálculos.
              </Text>

              {/* Vehicle Type Card Selection */}
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

              {/* Propulsion Card Selection */}
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

          {/* STEP 3: DETAILS */}
          {step === 3 && (
            <View style={styles.formContainer}>
              <Text variant="heading1" color="gray900" weight="700" align="center" style={styles.stepTitle}>
                ¡Excelente elección!
              </Text>
              <Text variant="body" color="gray500" align="center" style={styles.stepSubtitle}>
                Completa los datos de tu máquina para registrarla correctamente.
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

                <View style={{ marginBottom: Spacing.md }}>
                  <Text variant="caption" color="gray700" weight="600" style={{ marginBottom: Spacing.xs }}>
                    Año *
                  </Text>
                  <YearStepper
                    minYear={1980}
                    maxYear={getColombiaYear() + 1}
                    value={parseInt(year) || getColombiaYear()}
                    onChange={(val) => setYear(val.toString())}
                  />
                  {yearError ? (
                    <Text variant="caption" color="error" style={{ marginTop: Spacing.xs }}>
                      {yearError}
                    </Text>
                  ) : null}
                </View>

                <PlateInput
                  label={vehicleType === "moto" && propulsion === "electric" ? "Placa" : "Placa *"}
                  optional={vehicleType === "moto" && propulsion === "electric"}
                  value={plate}
                  onChange={(text) => setPlate(formatPlate(text, vehicleType))}
                  error={plateError}
                />

                {propulsion === "combustion" && (
                  <>
                    <RadioGroup
                      label="Tipo de Combustible *"
                      value={fuelType}
                      options={vehicleType === "moto" ? FUEL_TYPES.filter(f => f.value !== "diesel") : FUEL_TYPES}
                      onChange={(val) => {
                        setFuelType(val);
                        if (val === "diesel") {
                          setGasolineSubtype("");
                        } else {
                          setGasolineSubtype("corriente");
                        }
                      }}
                      horizontal
                    />

                    {fuelType === "gasoline" && (
                      <RadioGroup
                        label="Subtipo de Gasolina *"
                        value={gasolineSubtype}
                        options={GASOLINE_SUBTYPES}
                        onChange={setGasolineSubtype}
                        horizontal
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
                  format="number"
                  error={odometerError}
                />

                {propulsion === "electric" && (
                  <Input
                    label="Capacidad de Batería (kWh) *"
                    placeholder="Ej: 40"
                    value={batteryCapacity}
                    onChangeText={setBatteryCapacity}
                    keyboardType="numeric"
                    error={batteryError}
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
              <Text variant="heading1" color="gray900" weight="700" align="center" style={styles.stepTitle}>
                Personaliza tu Vehículo
              </Text>
              <Text variant="body" color="gray500" align="center" style={styles.stepSubtitle}>
                Selecciona la silueta y el color que más se parezca a tu máquina real.
              </Text>

              <View style={styles.carouselWrapper}>
                <FlatList
                  data={vehicleType === 'car' ? VEHICLE_MODELS : BIKE_MODELS}
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
                    const currentImagesList = vehicleType === 'car' ? VEHICLE_IMAGES : BIKE_IMAGES;
                    const currentColorsList = vehicleType === 'car' ? CAR_COLORS : BIKE_COLORS;

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
                          <Image source={currentImagesList[imageKey]} style={styles.carouselImage} />
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
                                { backgroundColor: currentColorsList[color] },
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
                title="Siguiente"
                onPress={handleNextStep}
                style={styles.nextButton}
              />
            </View>
          )}

          {/* STEP 5: SIGN UP */}
          {step === 5 && (
            <View style={styles.formContainer}>
              <Text variant="heading1" color="gray900" weight="700" align="center" style={styles.stepTitle}>
                ¡Casi listo! Crea tu Cuenta
              </Text>
              <Text variant="body" color="gray500" align="center" style={styles.stepSubtitle}>
                Crea tu acceso para sincronizar y guardar tu nuevo garaje digital.
              </Text>

              <View style={styles.formFieldsCard}>
                <Input
                  label="Nombre Completo"
                  placeholder="Ej: Juan Pérez"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  leftIcon="person-outline"
                  error={nameError}
                />

                <Input
                  label="Correo Electrónico"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail-outline"
                  error={emailError}
                />

                <Input
                  label="Contraseña"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  leftIcon="lock-closed-outline"
                  error={passwordError}
                />

                <Input
                  label="Confirmar Contraseña"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                  leftIcon="lock-closed-outline"
                  error={confirmPasswordError}
                />
              </View>

              <Button
                title="Completar Registro"
                onPress={handleSignup}
                loading={loading}
                style={styles.signupButton}
              />
            </View>
          )}
        </KeyboardAwareScrollView>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary500 },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  keyboardView: {
    flex: 1,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Layout.screenPadding,
    height: 56,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  progressHeaderContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.md,
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray200,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    marginLeft: Spacing.sm,
    width: 36,
    textAlign: "right",
  },
  scrollContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xl,
  },
  welcomeBackground: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
  welcomeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  welcomeBottomContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    alignItems: "center",
    width: "100%",
  },
  startButton: {
    width: "100%",
    marginBottom: Spacing.md,
  },
  loginLink: {
    paddingVertical: Spacing.sm,
  },
  formContainer: {
    width: "100%",
    paddingVertical: Spacing.xs,
  },
  stepTitle: {
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    marginBottom: Layout.verticalRhythm,
    lineHeight: 20,
  },
  selectorLabel: {
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  selectionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 110,
  },
  selectionCardActive: {
    borderColor: Colors.primary500,
    backgroundColor: "rgba(77, 77, 255, 0.03)",
  },
  cardSelectLabel: {
    marginTop: Spacing.xs,
  },
  formFieldsCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginBottom: Spacing.lg,
  },
  rowInputs: {
    flexDirection: "row",
    width: "100%",
  },
  nextButton: {
    marginTop: Spacing.md,
    width: "100%",
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
  signupButton: {
    marginTop: Spacing.md,
    width: "100%",
  },
});
