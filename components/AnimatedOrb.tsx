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

export type OrbState = 'idle' | 'listening' | 'speaking' | 'processing';

interface AnimatedOrbProps {
  state: OrbState;
  size?: number;
}

export const AnimatedOrb = ({ state, size = 200 }: AnimatedOrbProps) => {
  const scale = useSharedValue(1);
  const rotation1 = useSharedValue(0);
  const rotation2 = useSharedValue(0);
  const opacity1 = useSharedValue(0.6);
  const opacity2 = useSharedValue(0.8);

  useEffect(() => {
    // Cancel previous animations
    cancelAnimation(scale);
    cancelAnimation(rotation1);
    cancelAnimation(rotation2);
    cancelAnimation(opacity1);
    cancelAnimation(opacity2);

    // Reset rotations to keep continuous flow if possible
    const currentRot1 = rotation1.value % 360;
    const currentRot2 = rotation2.value % 360;
    rotation1.value = currentRot1;
    rotation2.value = currentRot2;

    if (state === 'idle') {
      scale.value = withRepeat(withTiming(1.05, { duration: 2500, easing: Easing.inOut(Easing.ease) }), -1, true);
      rotation1.value = withRepeat(withTiming(currentRot1 + 360, { duration: 15000, easing: Easing.linear }), -1, false);
      rotation2.value = withRepeat(withTiming(currentRot2 - 360, { duration: 18000, easing: Easing.linear }), -1, false);
      opacity1.value = withTiming(0.4, { duration: 1000 });
      opacity2.value = withTiming(0.5, { duration: 1000 });
    } else if (state === 'listening') {
      scale.value = withRepeat(withTiming(1.2, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, true);
      rotation1.value = withRepeat(withTiming(currentRot1 + 360, { duration: 4000, easing: Easing.linear }), -1, false);
      rotation2.value = withRepeat(withTiming(currentRot2 - 360, { duration: 5000, easing: Easing.linear }), -1, false);
      opacity1.value = withTiming(0.8, { duration: 400 });
      opacity2.value = withTiming(0.9, { duration: 400 });
    } else if (state === 'processing') {
      scale.value = withRepeat(withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
      rotation1.value = withRepeat(withTiming(currentRot1 + 360, { duration: 2000, easing: Easing.linear }), -1, false);
      rotation2.value = withRepeat(withTiming(currentRot2 - 360, { duration: 2500, easing: Easing.linear }), -1, false);
      opacity1.value = withRepeat(withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
      opacity2.value = withRepeat(withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else if (state === 'speaking') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 150, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 150, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      rotation1.value = withRepeat(withTiming(currentRot1 + 360, { duration: 6000, easing: Easing.linear }), -1, false);
      rotation2.value = withRepeat(withTiming(currentRot2 - 360, { duration: 7000, easing: Easing.linear }), -1, false);
      opacity1.value = withTiming(0.7, { duration: 200 });
      opacity2.value = withTiming(0.8, { duration: 200 });
    }
  }, [state]);

  const animatedStyleMain = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedStyleLayer1 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation1.value}deg` }],
    opacity: opacity1.value,
  }));

  const animatedStyleLayer2 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation2.value}deg` }],
    opacity: opacity2.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.baseLayer, animatedStyleMain]}>
        
        {/* Layer 1 */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.layer, animatedStyleLayer1]}>
          <LinearGradient
            colors={[Colors.primary, Colors.primary600, Colors.primary700]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          />
        </Animated.View>

        {/* Layer 2 (Cross blend) */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.layer, animatedStyleLayer2]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)', Colors.primary700]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradient}
          />
        </Animated.View>

        {/* Outer Glow / Blur Illusion */}
        <View style={styles.glow} />
        
        {/* Core */}
        <View style={styles.core} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary500,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 15,
  },
  baseLayer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  layer: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  core: {
    width: '60%',
    height: '60%',
    borderRadius: 999,
    backgroundColor: Colors.white,
    opacity: 0.15,
    position: 'absolute',
  }
});
