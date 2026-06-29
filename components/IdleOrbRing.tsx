import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/constants/theme';
import { Text } from '@/components/Typography';

const RING_SIZE = 360;
const RADIUS = RING_SIZE / 2;

// Nuevas categorías según solicitud
const CATEGORIES = [
  { id: 'seguridad', image: require('@/assets/3D_icons/seguridad.webp'), label: 'SEGURIDAD', thoughts: ["Revisando sistema de frenos...", "Verificando sensores de proximidad...", "Analizando presión de neumáticos..."] },
  { id: 'liquidos', image: require('@/assets/3D_icons/liquidos.webp'), label: 'LÍQUIDOS', thoughts: ["Revisando nivel de refrigerante...", "Verificando aceite de motor...", "Monitoreando líquido de frenos..."] },
  { id: 'electrico', image: require('@/assets/3D_icons/eléctrico.webp'), label: 'ELÉCTRICO', thoughts: ["Optimizando consumo eléctrico...", "Monitoreando flujo de energía...", "Evaluando eficiencia del sistema..."] },
  { id: 'mecanica', image: require('@/assets/3D_icons/mecanica.webp'), label: 'MECÁNICA', thoughts: ["Diagnosticando motor...", "Analizando transmisión...", "Verificando componentes mecánicos..."] },
  { id: 'confort', image: require('@/assets/3D_icons/comfort.webp'), label: 'COMFORT', thoughts: ["Adaptando perfil de usuario...", "Ajustando entorno de cabina...", "Mejorando experiencia de viaje..."] },
  { id: 'rendimiento', image: require('@/assets/3D_icons/rendimiento.webp'), label: 'RENDIMIENTO', thoughts: ["Evaluando aceleración...", "Analizando desgaste...", "Calculando vida útil..."] },
  { id: 'clima', image: require('@/assets/3D_icons/clima.webp'), label: 'CLIMA', thoughts: ["Monitoreando temperatura...", "Verificando filtros de aire...", "Ajustando climatización..."] },
  { id: 'bateria', image: require('@/assets/3D_icons/batería.webp'), label: 'BATERÍA', thoughts: ["Verificando estado de celdas...", "Estimando autonomía...", "Protegiendo ciclo de vida..."] }
];

interface IdleOrbRingProps {
  active: boolean;
}

export const IdleOrbRing = ({ active }: IdleOrbRingProps) => {
  const rotationProgress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentThought, setCurrentThought] = useState(CATEGORIES[0].thoughts[0]);

  useEffect(() => {
    if (active) {
      // Fade in the ring UI
      opacity.value = withTiming(1, { duration: 800 });
      textOpacity.value = withTiming(1, { duration: 800 });
      
      // Start continuous progression (40 seconds for a full 360 loop)
      rotationProgress.value = withRepeat(
        withTiming(1, { duration: 40000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      // Fade out
      opacity.value = withTiming(0, { duration: 500 });
      textOpacity.value = withTiming(0, { duration: 300 });
      // Detenemos la animación
      cancelAnimation(rotationProgress);
    }
  }, [active, opacity, textOpacity, rotationProgress]);

  // Derived state to track which icon is active
  useAnimatedReaction(
    () => {
      const adjustedProgress = (rotationProgress.value + (1 / 16)) % 1;
      return Math.floor(adjustedProgress * 8) % 8;
    },
    (current, previous) => {
      if (current !== previous && current !== null) {
        runOnJS(setActiveIndex)(current);
      }
    }
  );

  useEffect(() => {
    const categoryThoughts = CATEGORIES[activeIndex].thoughts;
    const randomIndex = Math.floor(Math.random() * categoryThoughts.length);
    
    textOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(setCurrentThought)(categoryThoughts[randomIndex]);
        if (active) {
           textOpacity.value = withTiming(1, { duration: 500 });
        }
      }
    });
  }, [activeIndex, active]);

  const wrapperAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  // Animación rápida para el spinner individual
  const spinnerAnimatedStyle = useAnimatedStyle(() => {
    // Multiplicamos el progreso para que gire varias veces (ej. 20 vueltas en 40s = 1 vuelta cada 2s)
    const degrees = rotationProgress.value * 360 * 20;
    return {
      transform: [{ rotate: `${degrees}deg` }]
    };
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.absoluteCenter, wrapperAnimatedStyle]}>
        
        {/* The dashed track (Sin spinner global) */}
        <View style={styles.svgWrapper}>
          <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
            <Circle
              cx={RADIUS}
              cy={RADIUS}
              r={RADIUS - 20}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1}
              strokeDasharray="4 8"
              fill="none"
            />
          </Svg>
        </View>

        {/* The 8 Icons */}
        {CATEGORIES.map((cat, index) => {
          const angle = (index * 45 - 90) * (Math.PI / 180);
          const distance = RADIUS - 20; 
          const x = Math.cos(angle) * distance;
          const y = Math.sin(angle) * distance;
          
          const isActive = index === activeIndex;

          return (
            <View 
              key={cat.id}
              style={[
                styles.iconContainer,
                { transform: [{ translateX: x }, { translateY: y }] },
                isActive && styles.iconContainerActive
              ]}
            >
              {isActive && (
                <Animated.View style={[StyleSheet.absoluteFill, styles.absoluteCenter, spinnerAnimatedStyle]}>
                  <Svg width={48} height={48}>
                    <Circle
                      cx={24}
                      cy={24}
                      r={23}
                      stroke={Colors.primary200 || '#fff'}
                      strokeWidth={2}
                      strokeDasharray="40 100"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </Svg>
                </Animated.View>
              )}

              <Image 
                source={cat.image} 
                style={[
                  { width: 28, height: 28 },
                  // expo-image aplica tintColor como una capa de color, ideal para simular un icono inactivo (gris)
                  !isActive && { tintColor: '#888888', opacity: 0.6 }
                ]}
                contentFit="contain"
              />
              <Text 
                style={[
                  styles.iconLabel, 
                  isActive ? styles.iconLabelActive : null
                ]}
              >
                {cat.label}
              </Text>
            </View>
          );
        })}

      </Animated.View>

      <View style={styles.textWrapper}>
        <Animated.View style={[styles.thoughtBubble, textAnimatedStyle]}>
          <Text style={styles.thoughtText}>
            {currentThought}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  absoluteCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgWrapper: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
  },
  iconContainer: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    borderColor: 'transparent', // El borde ahora lo hace el spinner SVG
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  iconLabel: {
    position: 'absolute',
    bottom: -18,
    fontSize: 8,
    fontFamily: "Montserrat_600SemiBold",
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    width: 80,
  },
  iconLabelActive: {
    color: Colors.primary200 || '#fff',
  },
  textWrapper: {
    position: 'absolute',
    top: '50%',
    marginTop: 240, // Aumentado el margen para no cruzarse con el ícono Confort
    alignItems: 'center',
    width: '100%',
  },
  thoughtBubble: {
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    maxWidth: '80%',
  },
  thoughtText: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: "Montserrat_400Regular",
    fontSize: 12,
    textAlign: 'center',
  },
});
