import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Typography';
import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function AIScreen() {
  const [state, setState] = useState<'idle' | 'listening' | 'speaking'>('idle');

  const scale1 = useSharedValue(1);
  const opacity1 = useSharedValue(0);
  
  const scale2 = useSharedValue(1);
  const opacity2 = useSharedValue(0);

  const scale3 = useSharedValue(1);
  const opacity3 = useSharedValue(0);

  const startWaves = () => {
    // Wave 1
    scale1.value = 1;
    opacity1.value = 0.6;
    scale1.value = withRepeat(withTiming(2.5, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false);
    opacity1.value = withRepeat(withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false);

    // Wave 2
    scale2.value = 1;
    opacity2.value = 0;
    setTimeout(() => {
      opacity2.value = 0.6;
      scale2.value = withRepeat(withTiming(2.5, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false);
      opacity2.value = withRepeat(withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false);
    }, 500);

    // Wave 3
    scale3.value = 1;
    opacity3.value = 0;
    setTimeout(() => {
      opacity3.value = 0.6;
      scale3.value = withRepeat(withTiming(2.5, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false);
      opacity3.value = withRepeat(withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false);
    }, 1000);
  };

  const stopWaves = () => {
    scale1.value = 1;
    opacity1.value = 0;
    scale2.value = 1;
    opacity2.value = 0;
    scale3.value = 1;
    opacity3.value = 0;
  };

  useEffect(() => {
    if (state === 'listening' || state === 'speaking') {
      startWaves();
    } else {
      stopWaves();
    }
    
    // Limpieza al desmontar o cambiar de estado para no dejar timeouts huérfanos
    return () => {
      // Los animadores cancelan sus tareas automáticamente si cambian los shared values
    };
  }, [state]);

  const toggleState = () => {
    if (state === 'idle') {
      setState('listening');
      // Simulamos la respuesta de la IA luego de un rato
      setTimeout(() => setState('speaking'), 3000);
      // Volvemos a idle
      setTimeout(() => setState('idle'), 6000);
    } else {
      setState('idle');
    }
  };

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
    opacity: opacity3.value,
  }));

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={{ flex: 0, backgroundColor: Colors.primary500 }} />
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
      <View style={styles.content}>
        <Text variant="display" color="gray900" align="center" style={styles.title}>
          {state === 'idle' ? 'Asistente IA' : state === 'listening' ? 'Escuchando...' : 'Respondiendo...'}
        </Text>
        <Text variant="body" color="gray500" align="center" style={styles.subtitle}>
          {state === 'idle' ? 'Toca el micrófono y di "Registrar un tanqueo de 50 mil pesos"' : state === 'listening' ? 'Habla ahora, te estoy escuchando.' : 'Espera un momento...'}
        </Text>

        <View style={styles.micContainer}>
          <Animated.View style={[styles.wave, animatedStyle3]} />
          <Animated.View style={[styles.wave, animatedStyle2]} />
          <Animated.View style={[styles.wave, animatedStyle1]} />

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={toggleState}
            style={styles.micButtonWrapper}
          >
            <LinearGradient
              colors={state === 'speaking' ? ["#2ECC71", "#27AE60"] : [Colors.gradientStart, Colors.gradientEnd]}
              style={styles.micButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons 
                name={state === 'speaking' ? "pulse" : "mic"} 
                size={56} 
                color={Colors.white} 
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary500,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    marginBottom: 12,
  },
  subtitle: {
    marginBottom: 80,
  },
  micContainer: {
    width: width * 0.8,
    height: width * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wave: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primary500,
  },
  micButtonWrapper: {
    shadowColor: Colors.primary500,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10,
  },
  micButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
