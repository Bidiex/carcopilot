import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Typography';
import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { processUserMessage } from '@/lib/ai';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function AIScreen() {
  const [state, setState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const recordingRef = React.useRef<Audio.Recording | null>(null);
  const silenceTimerRef = React.useRef<any>(null);
  const isSpeakingRef = React.useRef<boolean>(false);
  
  const [feedback, setFeedback] = useState<string>('');
  
  const { session, planStatus, trialDaysRemaining } = useAuth();
  const trialExpired = planStatus !== 'trial' && planStatus !== 'pro';

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

  const startRecording = async () => {
    try {
      Speech.stop();
      setFeedback('');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });
      
      recordingRef.current = newRecording;
      setRecording(newRecording);
      setState('listening');
      isSpeakingRef.current = false;
      
      newRecording.setProgressUpdateInterval(200);
      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering !== undefined) {
          const SILENCE_THRESHOLD = -40; // Decibeles
          
          if (status.metering > SILENCE_THRESHOLD) {
            isSpeakingRef.current = true;
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          } else if (isSpeakingRef.current) {
            if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                stopRecording();
              }, 2000); // 2 segundos de silencio continuo
            }
          }
        }
      });
    } catch (err) {
      console.error('Error al iniciar grabación', err);
      setFeedback('Error al acceder al micrófono');
      setState('idle');
    }
  };

  const stopRecording = async () => {
    const currentRecording = recordingRef.current;
    if (!currentRecording) return;
    
    if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
    }
    
    setState('processing');
    await currentRecording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
    });
    
    const uri = currentRecording.getURI();
    recordingRef.current = null;
    setRecording(null);
    
    if (!uri) {
        setState('idle');
        return;
    }

    try {
        const fetchResponse = await fetch(uri);
        const blob = await fetchResponse.blob();
        const base64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    // El resultado es data:audio/mp4;base64,...
                    const b64 = reader.result.split(',')[1];
                    resolve(b64);
                } else {
                    reject(new Error("Error al convertir a Base64"));
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        
        // Obtener contexto de vehículos
        const { data: vehicles } = await supabase
            .from('vehicles')
            .select('id, type, plate, custom_brand, custom_model, is_active')
            .eq('user_id', session?.user.id);
        
        const activeVehicle = vehicles?.find(v => v.is_active) || vehicles?.[0];
        
        const context = {
            vehicles,
            active_vehicle_id: activeVehicle?.id,
            trial_expired: trialExpired
        };

        const response = await processUserMessage(base64Audio, true, context);
        
        let aiTextResponse = "";
        let functionCalled = false;
        
        if (response.candidates && response.candidates.length > 0) {
            const parts = response.candidates[0].content?.parts || [];
            for (const part of parts) {
                if (part.functionCall) {
                    functionCalled = true;
                    if (trialExpired) {
                        aiTextResponse = "Lo siento, tu periodo de prueba ha terminado. No puedo registrar nuevos gastos, solo puedes consultar información.";
                        break;
                    }
                    
                    const fnName = part.functionCall.name;
                    const args = part.functionCall.args || {};
                    
                    if (fnName === 'registrar_gasolina') {
                        await supabase.from('fuel_logs').insert({
                            user_id: session?.user.id,
                            vehicle_id: args.vehiculo_id || activeVehicle?.id,
                            date: new Date().toISOString(),
                            odometer: args.odometro,
                            gallons: args.galones,
                            amount_cop: args.precio_total,
                            full_tank: args.tanque_lleno
                        });
                        aiTextResponse = `Listo, he registrado el tanqueo por ${args.precio_total} pesos.`;
                    }
                } else if (part.text) {
                    aiTextResponse += part.text;
                }
            }
        }

        if (!aiTextResponse && !functionCalled) {
            aiTextResponse = "No entendí muy bien lo que dijiste.";
        }

        setFeedback(aiTextResponse);
        setState('speaking');
        Speech.speak(aiTextResponse, { 
            language: 'es-CO',
            onDone: () => setState('idle'),
            onStopped: () => setState('idle')
        });

    } catch (error: any) {
        console.error(error);
        setFeedback('Ocurrió un error al procesar tu solicitud.');
        setState('idle');
    }
  };

  const toggleState = () => {
    if (state === 'idle') {
      startRecording();
    } else if (state === 'listening') {
      stopRecording();
    } else if (state === 'speaking') {
      Speech.stop();
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
          {state === 'idle' ? 'Asistente IA' : state === 'listening' ? 'Escuchando...' : state === 'processing' ? 'Pensando...' : 'Respondiendo...'}
        </Text>
        <Text variant="body" color="gray500" align="center" style={styles.subtitle}>
          {feedback ? feedback : (state === 'idle' ? 'Toca el micrófono y di "Registrar un tanqueo de 50 mil pesos"' : state === 'listening' ? 'Te escucho... Pararé cuando termines de hablar.' : 'Espera un momento...')}
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
                name={state === 'speaking' ? "volume-high" : state === 'processing' ? "pulse" : "mic"} 
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
