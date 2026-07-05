import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Text } from "./Typography";
import { Colors, Spacing, Shadows, Radius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

interface YearStepperProps {
  minYear: number;
  maxYear: number;
  value: number;
  onChange: (year: number) => void;
}

export const YearStepper: React.FC<YearStepperProps> = ({ minYear, maxYear, value, onChange }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (value !== displayValue) {
      const direction = value > displayValue ? 1 : -1;
      
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -10 * direction, duration: 150, useNativeDriver: true })
      ]).start(() => {
        setDisplayValue(value);
        slideAnim.setValue(10 * direction);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 150, useNativeDriver: true })
        ]).start();
      });
    }
  }, [value]);

  const handleDecrement = () => {
    if (value > minYear) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < maxYear) {
      onChange(value + 1);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, value <= minYear && styles.buttonDisabled]} 
        onPress={handleDecrement}
        activeOpacity={0.7}
        disabled={value <= minYear}
      >
        <Ionicons name="remove" size={24} color={value <= minYear ? Colors.gray400 : Colors.primary500} />
      </TouchableOpacity>

      <View style={styles.valueContainer}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text variant="display" color="gray900" weight="600" align="center">
            {displayValue}
          </Text>
        </Animated.View>
      </View>

      <TouchableOpacity 
        style={[styles.button, value >= maxYear && styles.buttonDisabled]} 
        onPress={handleIncrement}
        activeOpacity={0.7}
        disabled={value >= maxYear}
      >
        <Ionicons name="add" size={24} color={value >= maxYear ? Colors.gray400 : Colors.primary500} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  valueContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    overflow: "hidden",
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  buttonDisabled: {
    backgroundColor: Colors.gray100,
    elevation: 0,
    shadowOpacity: 0,
  }
});
