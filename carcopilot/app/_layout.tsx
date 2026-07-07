import { useEffect, useRef, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AlertProvider } from "@/context/AlertContext";
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { requestNotificationPermissions } from "@/lib/notifications";
import { StatusBar } from "expo-status-bar";
import { Colors } from "@/constants/theme";
import { PromoSplashOverlay } from "@/components/PromoSplashOverlay";
import { getActiveSplash, markSplashAsViewed } from "@/utils/getActiveSplash";
import type { PromoSplash } from "@/types/app";

function RootNavigator() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [activeSplash, setActiveSplash] = useState<PromoSplash | null>(null);
  const splashCheckedRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    // Verificar splash UNA SOLA VEZ por apertura de la app
    if (!splashCheckedRef.current) {
      splashCheckedRef.current = true;
      getActiveSplash(session?.user?.id ?? null).then(setActiveSplash);
    }

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    if (!session && !inAuthGroup && !inOnboarding) {
      // Si no hay sesión y no estamos en auth ni en onboarding, redirigir a Onboarding
      router.replace("/onboarding");
    } else if (session) {
      // Si hay sesión, migrar vehículo temporal si existe
      const checkAndMigrateVehicle = async () => {
        try {
          const tempVal = await AsyncStorage.getItem("temp_onboarding_vehicle");
          if (tempVal) {
            const vData = JSON.parse(tempVal);

            // Verificar si el usuario ya tiene algún vehículo para evitar duplicar
            const { data: existingVhs } = await supabase
              .from("vehicles")
              .select("id")
              .eq("user_id", session.user.id);

            if (!existingVhs || existingVhs.length === 0) {
              await supabase.from("vehicles").insert({
                user_id: session.user.id,
                custom_brand: vData.brand,
                custom_model: vData.model,
                type: vData.vehicleType,
                propulsion: vData.propulsion,
                plate: vData.plate,
                year: vData.year,
                initial_odometer: vData.odometer,
                battery_capacity_kwh: vData.batteryCapacity,
                fuel_type: vData.fuelType,
                gasoline_subtype: vData.gasolineSubtype,
                model_image: vData.model_image,
                is_active: true,
              });
            }
            await AsyncStorage.removeItem("temp_onboarding_vehicle");
          }
        } catch (e) {
          // console.error("Error migrating onboarding vehicle:", e);
        }
      };

      checkAndMigrateVehicle().then(() => {
        if (inAuthGroup || inOnboarding) {
          router.replace("/(tabs)");
        }
      });
    }
  }, [session, isLoading, segments, router]);

  function handleCloseSplash() {
    if (activeSplash && activeSplash.frequency === 'once_per_user' && session?.user?.id) {
      markSplashAsViewed(activeSplash.id, session.user.id);
    }
    setActiveSplash(null);
  }

  if (isLoading) {
    // Evita parpadeo mientras se recupera la sesión inicial
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <PromoSplashOverlay splash={activeSplash} onClose={handleCloseSplash} />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });



  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <AlertProvider>
        <StatusBar style="light" backgroundColor={Colors.primary500} />
        <RootNavigator />
      </AlertProvider>
    </AuthProvider>
  );
}
