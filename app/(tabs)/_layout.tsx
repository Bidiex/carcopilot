import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { Platform } from "react-native";
import { useStartupRecalculation } from "@/hooks/useStartupRecalculation";

export default function TabLayout() {
  useStartupRecalculation();

  return (
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
  );
}
