import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { supabase } from "@/lib/supabase";
import { getColombiaDateString } from "@/lib/date";
import * as Location from "expo-location";
import { useLastOdometer } from "@/hooks/useLastOdometer";
import { Text } from "@/components/Typography";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout, Radius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { ChronologyWarningModal } from "@/components/ChronologyWarningModal";
import { checkChronologyBreak } from "@/lib/chronology";
import { recalculateConsumption } from "@/lib/consumption";
import { useActionGuard } from "@/hooks/useActionGuard";
import { UpgradeModal } from "@/components/UpgradeModal";

export default function FuelLogNewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { guardAction, showUpgradeModal, closeUpgradeModal } = useActionGuard();

  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [fetchingVehicle, setFetchingVehicle] = useState(true);

  const activeVehicle = vehicles.find(v => v.id === selectedVehicleId) || null;

  // Hook for last odometer
  const { data: lastOdo } = useLastOdometer(activeVehicle?.id);

  // States
  const [dateStr, setDateStr] = useState(getColombiaDateString());
  const [odometer, setOdometer] = useState("");

  // Tridente calculator states
  const [calcMode, setCalcMode] = useState<"gallons" | "price">("gallons");
  const [gallons, setGallons] = useState("");
  const [amount, setAmount] = useState("");
  const [pricePerGallon, setPricePerGallon] = useState("");

  // Gas station states
  const [stationName, setStationName] = useState("");
  const [stationAddress, setStationAddress] = useState("");
  const [stationCity, setStationCity] = useState("");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "denied" | "error">("idle");
  const [gpsMessage, setGpsMessage] = useState("");

  const [fullTank, setFullTank] = useState(true);
  const [loading, setLoading] = useState(false);

  // Errors state
  const [dateError, setDateError] = useState("");
  const [odometerError, setOdometerError] = useState("");
  const [gallonsError, setGallonsError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [showChronologyModal, setShowChronologyModal] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchVehicles = async () => {
        try {
          const { data, error } = await supabase
            .from("vehicles")
            .select("*")
            .eq("user_id", user.id);

          if (!error && data && data.length > 0) {
            setVehicles(data);
            const initialId = vehicleId || data.find((v: any) => v.is_active)?.id || data[0].id;
            setSelectedVehicleId(initialId);
          }
        } finally {
          setFetchingVehicle(false);
        }
      };

      fetchVehicles();
    }
  }, [user, vehicleId]);

  // Tridente Calculator Handlers
  const handleAmountChange = (val: string) => {
    setAmount(val);
    const amtVal = parseFloat(val);
    if (calcMode === "gallons") {
      const priceVal = parseFloat(pricePerGallon);
      if (!isNaN(amtVal) && !isNaN(priceVal) && priceVal > 0) {
        setGallons((amtVal / priceVal).toFixed(3));
      } else {
        setGallons("");
      }
    } else {
      const galVal = parseFloat(gallons);
      if (!isNaN(amtVal) && !isNaN(galVal) && galVal > 0) {
        setPricePerGallon((amtVal / galVal).toFixed(2));
      } else {
        setPricePerGallon("");
      }
    }
  };

  const handlePriceChange = (val: string) => {
    setPricePerGallon(val);
    if (calcMode === "gallons") {
      const amtVal = parseFloat(amount);
      const priceVal = parseFloat(val);
      if (!isNaN(amtVal) && !isNaN(priceVal) && priceVal > 0) {
        setGallons((amtVal / priceVal).toFixed(3));
      } else {
        setGallons("");
      }
    }
  };

  const handleGallonsChange = (val: string) => {
    setGallons(val);
    if (calcMode === "price") {
      const amtVal = parseFloat(amount);
      const galVal = parseFloat(val);
      if (!isNaN(amtVal) && !isNaN(galVal) && galVal > 0) {
        setPricePerGallon((amtVal / galVal).toFixed(2));
      } else {
        setPricePerGallon("");
      }
    }
  };

  const handleModeChange = (mode: "gallons" | "price") => {
    setCalcMode(mode);
    const amtVal = parseFloat(amount);
    if (mode === "gallons") {
      const priceVal = parseFloat(pricePerGallon);
      if (!isNaN(amtVal) && !isNaN(priceVal) && priceVal > 0) {
        setGallons((amtVal / priceVal).toFixed(3));
      } else {
        setGallons("");
      }
    } else {
      const galVal = parseFloat(gallons);
      if (!isNaN(amtVal) && !isNaN(galVal) && galVal > 0) {
        setPricePerGallon((amtVal / galVal).toFixed(2));
      } else {
        setPricePerGallon("");
      }
    }
  };

  // GPS Geolocation Handler
  const handleGetLocation = async () => {
    setGpsStatus("loading");
    setGpsMessage("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGpsStatus("denied");
        setGpsMessage("Permiso de ubicación denegado. Ingresa la estación manualmente.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;

      const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo && geo.length > 0) {
        const first = geo[0];
        const street = first.street || "";
        const nameNum = first.streetNumber || "";
        const city = first.city || first.subregion || "";
        const formattedAddress = `${street} ${nameNum}`.trim() || first.formattedAddress || "Ubicación GPS";
        
        setStationAddress(formattedAddress);
        setStationCity(city);
        setStationName(first.name || "Estación de Servicio");
        setGpsStatus("success");
      } else {
        setGpsStatus("error");
        setGpsMessage("No se pudo obtener la dirección. Intenta de nuevo o ingresa la estación manualmente.");
      }
    } catch (err) {
      // console.error("GPS Error:", err);
      setGpsStatus("error");
      setGpsMessage("No se pudo obtener la ubicación. Intenta de nuevo o ingresa la estación manualmente.");
    }
  };

  const validate = () => {
    let isValid = true;
    setDateError("");
    setOdometerError("");
    setGallonsError("");
    setAmountError("");
    setPriceError("");

    if (!dateStr.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      setDateError("Formato de fecha inválido (AAAA-MM-DD)");
      isValid = false;
    }

    const odoNum = parseFloat(odometer);
    if (!odometer) {
      setOdometerError("El odómetro es requerido");
      isValid = false;
    } else if (isNaN(odoNum) || odoNum < 0) {
      setOdometerError("El odómetro no puede ser negativo");
      isValid = false;
    }

    const amtNum = parseFloat(amount);
    if (!amount) {
      setAmountError("El monto es requerido");
      isValid = false;
    } else if (isNaN(amtNum) || amtNum <= 0) {
      setAmountError("El monto debe ser mayor a 0");
      isValid = false;
    }

    if (calcMode === "gallons") {
      const priceNum = parseFloat(pricePerGallon);
      if (!pricePerGallon) {
        setPriceError("El precio por galón es requerido");
        isValid = false;
      } else if (isNaN(priceNum) || priceNum <= 0) {
        setPriceError("El precio debe ser mayor a 0");
        isValid = false;
      }
    } else {
      const galNum = parseFloat(gallons);
      if (!gallons) {
        setGallonsError("La cantidad de galones es requerida");
        isValid = false;
      } else if (isNaN(galNum) || galNum <= 0) {
        setGallonsError("Los galones deben ser mayores a 0");
        isValid = false;
      }
    }

    return isValid;
  };

  const executeCreate = async () => {
    if (!user || !activeVehicle) return;
    
    const currentOdo = parseFloat(odometer);
    const currentGal = parseFloat(gallons);
    const currentAmount = parseFloat(amount);
    const currentPrice = parseFloat(pricePerGallon);

    setLoading(true);
    setShowChronologyModal(false);

    try {

      // 4. Estación de Servicio - Deduplicación y Guardado
      let stationId = null;
      if (stationName.trim() || stationAddress.trim()) {
        const nameVal = stationName.trim();
        const addrVal = stationAddress.trim();
        const cityVal = stationCity.trim() || "Bogotá";

        try {
          const { data: existing } = await supabase
            .from("gas_stations")
            .select("id")
            .ilike("name", nameVal)
            .ilike("city", cityVal)
            .limit(1);

          if (existing && existing.length > 0) {
            stationId = existing[0].id;
          } else {
            const { data: newStation, error: insertErr } = await supabase
              .from("gas_stations")
              .insert({
                name: nameVal,
                address: addrVal,
                city: cityVal,
              })
              .select("id")
              .single();

            if (!insertErr && newStation) {
              stationId = newStation.id;
            }
          }
        } catch (stError) {
          // console.error("Error processing station:", stError);
          // Fallback, el registro de combustible sigue adelante sin bloquear
        }
      }

      // 5. Insertar en base de datos
      const { error } = await supabase.from("fuel_logs").insert({
        vehicle_id: activeVehicle.id,
        user_id: user.id,
        date: dateStr,
        odometer: currentOdo,
        gallons: currentGal,
        amount_cop: currentAmount,
        full_tank: fullTank,
        consumption_km_gal: null, // Provisional, se recalculará asíncronamente
        price_per_gallon: currentPrice,
        station_id: stationId,
      });

      if (error) {
        showAlert("Error de Tanqueo", error.message, [], "error");
      } else {
        // Ejecutar recálculo en background sin bloquear
        recalculateConsumption(activeVehicle.id);

        showAlert(
          "Tanqueo Registrado",
          "¡Carga guardada exitosamente! El consumo se actualizará automáticamente.",
          [
            {
              text: "Entendido",
              onPress: () => {
                router.back();
              },
            },
          ],
          "success"
        );
      }
    } catch (err) {
      showAlert("Error", "Ocurrió un error inesperado al guardar el tanqueo", [], "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !activeVehicle) return;
    if (!validate()) return;
    
    setLoading(true);
    const currentOdo = parseFloat(odometer);
    const check = await checkChronologyBreak(activeVehicle.id, dateStr, currentOdo);
    
    if (check.breaksChronology) {
      setLoading(false);
      setShowChronologyModal(true);
      return;
    }
    
    await executeCreate();
  };

  if (fetchingVehicle) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <ActivityIndicator size="large" color={Colors.primary500} />
      </SafeAreaView>
    );
  }

  if (!activeVehicle) {
    return (
      <SafeAreaView style={styles.errorArea}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
        <Text variant="heading2" color="gray900" weight="700" align="center" style={styles.errorTitle}>
          No tienes vehículos activos
        </Text>
        <Text variant="body" color="gray600" align="center" style={styles.errorText}>
          Necesitas registrar un vehículo de combustión antes de poder ingresar registros de gasolina.
        </Text>
        <Button
          title="Registrar Vehículo"
          onPress={() => router.replace("/vehicle-new")}
          style={styles.errorButton}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text variant="heading2" color="gray900" weight="700">
              Registrar Tanqueo
            </Text>
            <Text variant="smallLabel" color="gray500">
              {activeVehicle.custom_brand} {activeVehicle.custom_model} ({activeVehicle.plate || "Sin Placa"})
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {vehicles.length > 1 && (
            <Select
              label="Vehículo"
              value={selectedVehicleId || ""}
              options={vehicles.map((v: any) => ({
                label: `${v.custom_brand} ${v.custom_model} (${v.plate || "Sin Placa"})`,
                value: v.id
              }))}
              onSelect={setSelectedVehicleId}
            />
          )}

          {/* Segment Selector: Full Tank */}
          <View style={styles.selectorGroup}>
            <Text variant="caption" color="gray600" style={styles.selectorLabel}>
              Tipo de Carga
            </Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity activeOpacity={0.7}
                onPress={() => setFullTank(true)}
                style={[
                  styles.segmentOption,
                  fullTank === true && styles.segmentOptionActive,
                ]}
              >
                <Text
                  variant="caption"
                  color={fullTank === true ? "white" : "gray600"}
                  weight="600"
                >
                  Tanque Lleno
                </Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7}
                onPress={() => setFullTank(false)}
                style={[
                  styles.segmentOption,
                  fullTank === false && styles.segmentOptionActive,
                ]}
              >
                <Text
                  variant="caption"
                  color={fullTank === false ? "white" : "gray600"}
                  weight="600"
                >
                  Carga Parcial
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Input
            label="Fecha (AAAA-MM-DD)"
            placeholder="Ej: 2026-06-15"
            value={dateStr}
            onChangeText={setDateStr}
            error={dateError}
          />

          <Input
            label="Odómetro Actual (Kilometraje) *"
            placeholder="Ej: 10550"
            value={odometer}
            onChangeText={setOdometer}
            keyboardType="numeric"
            error={odometerError}
          />

          {lastOdo !== null && (
            <View style={styles.odoBadge}>
              <Ionicons name="speedometer-outline" size={14} color={Colors.primary600} />
              <Text variant="caption" color="primary600" weight="600">
                Último registrado: {lastOdo.toLocaleString("es-CO")} km
              </Text>
            </View>
          )}

          {/* Segment Selector: Calculation Mode */}
          <View style={styles.selectorGroup}>
            <Text variant="caption" color="gray600" style={styles.selectorLabel}>
              Método de Registro
            </Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity activeOpacity={0.7}
                onPress={() => handleModeChange("gallons")}
                style={[
                  styles.segmentOption,
                  calcMode === "gallons" && styles.segmentOptionActive,
                ]}
              >
                <Text
                  variant="caption"
                  color={calcMode === "gallons" ? "white" : "gray600"}
                  weight="600"
                >
                  Por Precio del Galón
                </Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7}
                onPress={() => handleModeChange("price")}
                style={[
                  styles.segmentOption,
                  calcMode === "price" && styles.segmentOptionActive,
                ]}
              >
                <Text
                  variant="caption"
                  color={calcMode === "price" ? "white" : "gray600"}
                  weight="600"
                >
                  Por Galones
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Input
            label="Costo Total (COP) *"
            placeholder="Ej: 120000"
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
            error={amountError}
          />

          <Input
            label={calcMode === "price" ? "Precio por Galón (Autocalculado)" : "Precio por Galón (COP/gal) *"}
            placeholder="Ej: 15400"
            value={pricePerGallon}
            onChangeText={handlePriceChange}
            keyboardType="numeric"
            editable={calcMode === "gallons"}
            error={priceError}
          />

          <Input
            label={calcMode === "gallons" ? "Cantidad (Galones - Autocalculado)" : "Cantidad (Galones) *"}
            placeholder="Ej: 8.5"
            value={gallons}
            onChangeText={handleGallonsChange}
            keyboardType="numeric"
            editable={calcMode === "price"}
            error={gallonsError}
          />

          {fullTank && (
            <View style={styles.infoBanner}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={Colors.primary500}
                style={styles.infoIcon}
              />
              <Text variant="caption" color="gray600" style={styles.infoText}>
                {"Marcar como \"Tanque Lleno\" calculará automáticamente el consumo en km/galón desde el último tanque lleno."}
              </Text>
            </View>
          )}

          {/* Gas Station Section */}
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="location-outline" size={20} color={Colors.primary500} />
            <Text variant="sectionTitle" color="gray900" weight="600">
              Estación de Servicio (Opcional)
            </Text>
          </View>

          <View style={styles.stationCard}>
            <TouchableOpacity activeOpacity={0.7}
              style={[styles.gpsButton, gpsStatus === "loading" && styles.gpsButtonLoading]}
              onPress={handleGetLocation}
              disabled={gpsStatus === "loading"}
            >
              {gpsStatus === "loading" ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="navigate-outline" size={18} color={Colors.white} />
                  <Text variant="body" color="white" weight="600" style={styles.gpsButtonText}>
                    Usar Ubicación por GPS
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {gpsMessage ? (
              <Text
                variant="caption"
                color={gpsStatus === "denied" ? "warning" : "danger"}
                style={styles.gpsStatusText}
              >
                {gpsMessage}
              </Text>
            ) : null}

            <Input
              label="Nombre de la Estación"
              placeholder="Ej: Texaco Calle 100"
              value={stationName}
              onChangeText={setStationName}
            />

            <Input
              label="Dirección de la Estación"
              placeholder="Ej: Calle 100 #15-20"
              value={stationAddress}
              onChangeText={setStationAddress}
            />
          </View>

          <Button
            title="Guardar Registro"
            onPress={() => guardAction(handleCreate)}
            loading={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ChronologyWarningModal
        visible={showChronologyModal}
        onCancel={() => setShowChronologyModal(false)}
        onConfirm={executeCreate}
      />
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
  loadingArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.gray50,
  },
  errorArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Layout.screenPadding,
    backgroundColor: Colors.gray50,
  },
  errorTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  errorText: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  errorButton: {
    width: "60%",
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
  headerTitleContainer: {
    alignItems: "center",
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
    borderRadius: Radius.sm,
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
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "rgba(77, 77, 255, 0.05)",
    padding: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: "center",
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  infoIcon: {
    marginRight: Spacing.sm,
  },
  infoText: {
    flex: 1,
    lineHeight: 16,
  },
  submitButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  odoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary50,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  stationCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    gap: Spacing.xs,
  },
  gpsButton: {
    height: 48,
    backgroundColor: Colors.primary500,
    borderRadius: Radius.sm,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  gpsButtonLoading: {
    backgroundColor: Colors.primary600,
    opacity: 0.8,
  },
  gpsButtonText: {
    fontSize: 14,
  },
  gpsStatusText: {
    marginBottom: Spacing.sm,
    marginLeft: 4,
    lineHeight: 16,
  },
});
