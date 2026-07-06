import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Shadows } from "../constants/theme";

interface CardProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "secondary",
  style,
}) => {
  if (variant === "primary") {
    return (
      <LinearGradient
        colors={Colors.primaryGradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.primaryCard, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.secondaryCard, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  primaryCard: {
    borderRadius: 24, // Matches borderRadius: 24 for Primary Card in DESIGN.md
    padding: 20, // Matches padding: 20
    minHeight: 180, // Matches 180-220 height range
    justifyContent: "space-between",
    overflow: "hidden",
  },
  secondaryCard: {
    backgroundColor: Colors.white, // Matches "#FFF"
    borderRadius: 20, // Matches borderRadius: 20
    padding: 16, // Matches padding: 16
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
});
