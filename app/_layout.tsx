import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function RootNavigator() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (session && inAuthGroup) {
      // Redirección segura: de auth hacia app principal (ambos existirán pronto)
      router.replace("/(tabs)");
    }
  }, [session, isLoading, segments, router]);

  if (isLoading) {
    // Evita parpadeo mientras se recupera la sesión inicial
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
