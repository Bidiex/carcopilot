import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Shadows } from "@/constants/theme";
import { Platform, View, TouchableOpacity, StyleSheet } from "react-native";
import { useStartupRecalculation } from "@/hooks/useStartupRecalculation";
import { useStartupInsights } from "@/hooks/useStartupInsights";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { TrialModal } from "@/components/TrialModal";
import { supabase } from "@/lib/supabase";

const AITabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={styles.aiButtonContainer}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientEnd]}
      style={styles.aiButton}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  </TouchableOpacity>
);

export default function TabLayout() {
  useStartupRecalculation();
  useStartupInsights();

  const { accessStatus, trialDaysRemaining, user, profile, refreshProfile } = useAuth();
  const [trialModalVisible, setTrialModalVisible] = useState(true);

  // Activar trial_started_at para usuarios que llegaron por verificación de email
  // (tienen perfil pero sin trial_started_at)
  useEffect(() => {
    if (user && profile && !profile.trial_started_at) {
      supabase
        .from('profiles')
        .update({
          trial_started_at: new Date().toISOString(),
          access_status: 'trial',
        })
        .eq('id', user.id)
        .then(() => refreshProfile());
    }
  }, [user?.id, profile?.trial_started_at]);

  return (
    <>
      <TrialModal
        visible={accessStatus === 'trial' && trialModalVisible}
        daysRemaining={trialDaysRemaining}
        onClose={() => setTrialModalVisible(false)}
      />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary500,
          tabBarInactiveTintColor: Colors.gray400,
          tabBarStyle: {
            height: 72,
            backgroundColor: Colors.white,
            borderTopWidth: 1,
            borderTopColor: Colors.gray200,
            paddingTop: 8,
            paddingBottom: Platform.OS === "ios" ? 20 : 10,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontFamily: "Montserrat_500Medium",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={24}
                name={focused ? "home" : "home-outline"}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "Historial",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={24}
                name={focused ? "time" : "time-outline"}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            title: "Copilot",
            tabBarStyle: { display: 'none' },
            tabBarLabel: () => null,
            tabBarIcon: () => (
              <Ionicons name="sparkles" size={28} color={Colors.white} />
            ),
            tabBarButton: (props) => <AITabBarButton {...props} />,
          }}
        />
        <Tabs.Screen
          name="vehicles"
          options={{
            title: "Vehículos",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={24}
                name={focused ? "car" : "car-outline"}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: "Cuenta",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={24}
                name={focused ? "person" : "person-outline"}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  aiButtonContainer: {
    top: -20,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.floating,
  },
  aiButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
