import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Typography';
import { Image } from 'react-native';
import { VEHICLE_IMAGES, BIKE_IMAGES } from '@/constants/vehicles';

export type OrbState = 'idle' | 'listening' | 'speaking' | 'processing';

interface AnimatedOrbProps {
  state: OrbState;
  size?: number;
  vehicle?: any;
}

export const AnimatedOrb = ({ state, size = 200, vehicle }: AnimatedOrbProps) => {
  const scale = useSharedValue(1);
  const rotation1 = useSharedValue(0);
  const opacity1 = useSharedValue(0.5);
  const coreScale = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(scale);
    cancelAnimation(rotation1);
    cancelAnimation(opacity1);
    cancelAnimation(coreScale);

    const currentRot1 = rotation1.value % 360;
    rotation1.value = currentRot1;

    if (state === 'idle') {
      scale.value = withRepeat(withTiming(1.0, { duration: 3000, easing: Easing.inOut(Easing.ease) }), -1, true);
      coreScale.value = withRepeat(withTiming(1.05, { duration: 2500, easing: Easing.inOut(Easing.ease) }), -1, true);
      rotation1.value = withRepeat(withTiming(currentRot1 + 360, { duration: 20000, easing: Easing.linear }), -1, false);
      opacity1.value = withTiming(0.4, { duration: 1000 });
    } else if (state === 'listening') {
      scale.value = withRepeat(withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
      coreScale.value = withRepeat(withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }), -1, true);
      rotation1.value = withRepeat(withTiming(currentRot1 + 360, { duration: 5000, easing: Easing.linear }), -1, false);
      opacity1.value = withTiming(0.8, { duration: 500 });
    } else if (state === 'processing') {
      scale.value = withRepeat(withTiming(1.05, { duration: 600, easing: Easing.inOut(Easing.ease) }), -1, true);
      coreScale.value = withRepeat(withSequence(
        withTiming(1.1, { duration: 300 }),
        withTiming(0.95, { duration: 300 })
      ), -1, true);
      rotation1.value = withRepeat(withTiming(currentRot1 + 360, { duration: 1500, easing: Easing.linear }), -1, false);
      opacity1.value = withRepeat(withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else if (state === 'speaking') {
      scale.value = withRepeat(withSequence(
        withTiming(1.1, { duration: 250, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 250, easing: Easing.inOut(Easing.ease) })
      ), -1, true);
      coreScale.value = withRepeat(withSequence(
        withTiming(1.15, { duration: 200 }),
        withTiming(0.95, { duration: 200 })
      ), -1, true);
      rotation1.value = withRepeat(withTiming(currentRot1 + 360, { duration: 8000, easing: Easing.linear }), -1, false);
      opacity1.value = withTiming(0.7, { duration: 200 });
    }
  }, [state]);

  const animatedStyleMain = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedStyleCore = useAnimatedStyle(() => ({
    transform: [{ scale: coreScale.value }],
  }));

  const animatedStyleAura = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation1.value}deg` }, { scale: 1.15 }],
    opacity: opacity1.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.baseLayer, animatedStyleMain]}>
        
        {/* Soft Outer Aura */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.layer, animatedStyleAura]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          />
        </Animated.View>

        {/* Core Glowing Orb */}
        <Animated.View style={[styles.coreWrapper, animatedStyleCore]}>
          <LinearGradient
            colors={[Colors.primary500, Colors.primary700, Colors.primary900]}
            start={{ x: 0.2, y: 0.2 }}
            end={{ x: 0.8, y: 0.8 }}
            style={styles.coreGradient}
          />
          {/* Vehículo en el centro */}
          {vehicle ? (
            <View style={styles.vehicleContainer}>
              {vehicle.model_image && (vehicle.type === "moto" ? BIKE_IMAGES[vehicle.model_image] : VEHICLE_IMAGES[vehicle.model_image]) ? (
                <Image 
                  source={vehicle.type === "moto" ? BIKE_IMAGES[vehicle.model_image] : VEHICLE_IMAGES[vehicle.model_image]} 
                  style={{ width: 120, height: 120, resizeMode: 'contain', opacity: 0.85 }} 
                />
              ) : (
                <Ionicons name="car-sport-outline" size={32} color="rgba(255,255,255,0.8)" />
              )}
            </View>
          ) : null}
        </Animated.View>
        
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  baseLayer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  layer: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  arc: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 2,
    position: 'absolute',
  },
  coreWrapper: {
    width: '75%',
    height: '75%',
    borderRadius: 999,
    shadowColor: Colors.primary200 || '#A0CFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  coreGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    opacity: 0.9,
    position: 'absolute',
  },
  vehicleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    padding: 16,
  },
  vehicleText: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
    textAlign: 'center',
  }
});
