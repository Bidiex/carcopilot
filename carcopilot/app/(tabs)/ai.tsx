import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Typography';
import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { processUserMessage, ConversationMessage, UserContext } from '@/lib/ai';
import { AnimatedOrb, OrbState } from '@/components/AnimatedOrb';
import { IdleOrbRing } from '@/components/IdleOrbRing';
import { useActionGuard } from '@/hooks/useActionGuard';
import { UpgradeModal } from '@/components/UpgradeModal';

const REQUIRED_PARAMS: Record<string, string[]> = {
  registrar_gasolina: ['vehiculo_id', 'precio_total', 'odometro'],
  registrar_carga_electrica: ['vehiculo_id', 'costo_total', 'kwh_cargados', 'odometro'],
  registrar_mantenimiento: ['vehiculo_id', 'trabajos'],
  registrar_soat: ['vehiculo_id', 'valor_pagado', 'fecha_pago'],
  registrar_tecnomecanica: ['vehiculo_id', 'valor_pagado', 'fecha_revision'],
  registrar_impuesto: ['vehiculo_id', 'valor_pagado', 'anio_gravable', 'fecha_pago'],
  registrar_otro_gasto: ['vehiculo_id', 'descripcion', 'monto'],
  seleccionar_vehiculo: ['vehiculo_id']
};

function validateFunctionArgs(toolName: string, args: Record<string, any>): string[] {
  const required = REQUIRED_PARAMS[toolName] ?? [];
  return required.filter(param => 
    args[param] === undefined || args[param] === null || args[param] === ''
  );
}

const { width } = Dimensions.get('window');

export default function AIScreen() {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const recordingRef = React.useRef<Audio.Recording | null>(null);
  const silenceTimerRef = React.useRef<any>(null);
  const isSpeakingRef = React.useRef<boolean>(false);
  
  const [feedback, setFeedback] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  
  // Nuevo estado para controlar la visibilidad permanente y los vehículos
  const [hasActivated, setHasActivated] = useState<boolean>(false);
  const [vehiclesData, setVehiclesData] = useState<any[]>([]);
  const [activeVehicleIndex, setActiveVehicleIndex] = useState<number>(0);
  
  const { session, accessStatus, trialDaysRemaining } = useAuth();
  const trialExpired = accessStatus !== 'trial' && accessStatus !== 'pro';
  const { guardAction, showUpgradeModal, closeUpgradeModal } = useActionGuard();

  useEffect(() => {
    if (session?.user.id) {
      supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', session.user.id)
        .then(({ data, error }) => {
          if (!error && data) {
            setVehiclesData(data);
          }
        });
    }
  }, [session?.user.id]);

  useEffect(() => {
    if (vehiclesData.length > 1) {
      const interval = setInterval(() => {
        setActiveVehicleIndex((prev) => (prev + 1) % vehiclesData.length);
      }, 64000); // 64 segundos de delay entre vehículos
      return () => clearInterval(interval);
    }
  }, [vehiclesData.length]);

  // Current vehicle to display
  const currentVehicle = vehiclesData[activeVehicleIndex] || null;

  useEffect(() => {
    if (state !== 'idle') {
      setHasActivated(true);
    }
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
      // console.error('Error al iniciar grabación', err);
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

        // Eliminar el archivo temporal por seguridad (principio de mínimo dato)
        try {
            await FileSystem.deleteAsync(uri, { idempotent: true });
        } catch (e) {
            // Ignorar error al borrar
        }
        
        // Usamos los vehículos ya cargados o los re-consultamos si no hay
        const vehicles = vehiclesData.length > 0 ? vehiclesData : (await supabase
            .from('vehicles')
            .select('*')
            .eq('user_id', session?.user.id)).data;
        
        const activeVehicle = vehicles?.find(v => v.id === selectedVehicleId) || vehicles?.find(v => v.is_active) || vehicles?.[0];
        
        const userContext: UserContext = {
            vehicles: vehicles || [],
            activeVehicleId: activeVehicle?.id,
            planStatus: planStatus || 'trial',
            currentDate: new Date().toISOString().split('T')[0]
        };

        const response = await processUserMessage(base64Audio, 'audio/mp4', conversationHistory, userContext);
        
        let aiTextResponse = "";
        let functionCalled = false;
        
        if (response.error) {
            console.error("[AI API Error]:", response.error);
            if (response.error.code === 429 || response.error.status === 'RESOURCE_EXHAUSTED') {
                aiTextResponse = "El servicio está saturado por límite de uso. Por favor, intenta de nuevo más tarde.";
            } else {
                aiTextResponse = "Hubo un problema de conexión con la inteligencia artificial.";
            }
        } else if (response.candidates && response.candidates.length > 0) {
            const parts = response.candidates[0].content?.parts || [];
            for (const part of parts) {
                if (part.functionCall) {
                    functionCalled = true;
                    const fnName = part.functionCall.name;
                    if (trialExpired && !fnName.startsWith('consultar_') && fnName !== 'seleccionar_vehiculo') {
                        aiTextResponse = "Lo siento, tu periodo de prueba ha terminado. No puedo registrar nuevos gastos, solo puedes consultar información.";
                        break;
                    }
                    
                    const args = part.functionCall.args || {};
                    const missingParams = validateFunctionArgs(fnName, args);
                    
                    if (missingParams.length > 0) {
                      aiTextResponse = `Para completar esta acción necesito más información. Por favor dime: ${missingParams.join(', ')}.`;
                      break;
                    }
                    
                    const vehiculo_id = args.vehiculo_id || activeVehicle?.id;

                    try {
                      if (fnName === 'registrar_gasolina') {
                          const galones = args.galones ?? (
                            args.precio_total && args.precio_por_galon 
                              ? args.precio_total / args.precio_por_galon 
                              : null
                          );

                          if (!galones) {
                            aiTextResponse = 'Para registrar el tanqueo necesito saber cuántos galones cargaste o el precio por galón. ¿Cuánto costó el galón?';
                            break;
                          }

                          const precioPorGalon = args.precio_por_galon ?? (
                            galones && args.precio_total 
                              ? args.precio_total / galones 
                              : null
                          );

                          let finalOdometer = args.odometro;
                          if (finalOdometer === undefined || finalOdometer === null) {
                            const { data: lastLog } = await supabase
                              .from('fuel_logs')
                              .select('odometer')
                              .eq('vehicle_id', vehiculo_id)
                              .order('date', { ascending: false })
                              .limit(1);
                            
                            if (lastLog && lastLog.length > 0 && lastLog[0].odometer != null) {
                              finalOdometer = lastLog[0].odometer;
                            } else {
                              const { data: vehicleData } = await supabase
                                .from('vehicles')
                                .select('current_mileage')
                                .eq('id', vehiculo_id)
                                .single();
                              finalOdometer = vehicleData?.current_mileage ?? 0;
                            }
                          }

                          const insertData = {
                              user_id: session?.user.id,
                              vehicle_id: vehiculo_id,
                              date: new Date().toISOString().split('T')[0],
                              odometer: finalOdometer,
                              gallons: galones,
                              amount_cop: args.precio_total,
                              full_tank: args.tanque_lleno,
                              price_per_gallon: precioPorGalon
                          };

                          const missing = [];
                          if (!insertData.vehicle_id) missing.push('vehículo');
                          if (!insertData.user_id) missing.push('usuario');
                          if (!insertData.date) missing.push('fecha');
                          if (insertData.odometer === null || insertData.odometer === undefined) missing.push('odómetro');
                          if (!insertData.gallons) missing.push('galones');
                          if (!insertData.amount_cop) missing.push('precio total');

                          if (missing.length > 0) {
                              aiTextResponse = `No puedo registrar el tanqueo porque me falta esta información: ${missing.join(', ')}.`;
                              break;
                          }

                          const { error } = await supabase.from('fuel_logs').insert(insertData);
                          if (error) throw error;
                          aiTextResponse = `Listo, he registrado el tanqueo por ${args.precio_total} pesos.`;
                      } else if (fnName === 'registrar_carga_electrica') {
                          const { error } = await supabase.from('electric_charge_logs').insert({
                              user_id: session?.user.id,
                              vehicle_id: vehiculo_id,
                              date: new Date().toISOString().split('T')[0],
                              odometer: args.odometro,
                              kwh_charged: args.kwh_cargados,
                              amount_cop: args.costo_total,
                              battery_pct_start: args.porcentaje_inicial,
                              battery_pct_end: args.porcentaje_final
                          });
                          if (error) throw error;
                          aiTextResponse = `Listo, he registrado la carga eléctrica por ${args.costo_total} pesos.`;
                      } else if (fnName === 'registrar_mantenimiento') {
                          const totalCost = (args.trabajos || []).reduce((acc: number, item: any) => acc + (Number(item.costo) || 0), 0);
                          const { error } = await supabase.from('maintenance_logs').insert({
                              user_id: session?.user.id,
                              vehicle_id: vehiculo_id,
                              date: new Date().toISOString().split('T')[0],
                              odometer: args.odometro || 0,
                              description: args.notas_generales || null,
                              total_amount_cop: totalCost,
                              taller: args.taller || null,
                              items: args.trabajos || [],
                              type: args.trabajos?.[0]?.componente || null
                          });
                          if (error) throw error;
                          const jobsCount = args.trabajos?.length || 1;
                          aiTextResponse = `Mantenimiento registrado. Se guardaron ${jobsCount} trabajo${jobsCount !== 1 ? 's' : ''} por un total de ${totalCost} pesos.`;
                      } else if (fnName === 'registrar_soat' || fnName === 'registrar_tecnomecanica' || fnName === 'registrar_impuesto') {
                          let type = 'soat';
                          if (fnName === 'registrar_tecnomecanica') type = 'tech_inspection';
                          if (fnName === 'registrar_impuesto') type = 'tax';
                          
                          let provider = args.aseguradora || args.cda || null;
                          let tax_department = args.departamento || null;
                          
                          const issueStr = args.fecha_pago || args.fecha_revision;
                          let expiryStr = issueStr;
                          try {
                              const issue = new Date(issueStr);
                              if (!isNaN(issue.getTime())) {
                                  issue.setFullYear(issue.getFullYear() + 1);
                                  expiryStr = issue.toISOString().split('T')[0];
                              }
                          } catch(e) {}

                          const { error } = await supabase.from('annual_records').insert({
                              user_id: session?.user.id,
                              vehicle_id: vehiculo_id,
                              type: type,
                              issue_date: issueStr,
                              expiry_date: expiryStr,
                              amount_cop: args.valor_pagado,
                              tax_year: args.anio_gravable || (type === 'tax' ? new Date().getFullYear() : null),
                              provider: provider,
                              tax_department: tax_department
                          });
                          if (error) throw error;
                          aiTextResponse = `Registro de ${type === 'tech_inspection' ? 'tecnomecánica' : type} guardado por ${args.valor_pagado} pesos.`;
                      } else if (fnName === 'registrar_otro_gasto') {
                          const { error } = await supabase.from('other_expenses').insert({
                              user_id: session?.user.id,
                              vehicle_id: vehiculo_id,
                              date: args.fecha || new Date().toISOString().split('T')[0],
                              description: args.descripcion,
                              amount_cop: args.monto
                          });
                          if (error) throw error;
                          aiTextResponse = `Gasto de ${args.monto} pesos registrado exitosamente.`;
                      } else if (fnName === 'seleccionar_vehiculo') {
                          setSelectedVehicleId(args.vehiculo_id);
                          aiTextResponse = `Vehículo seleccionado correctamente.`;
                      } else if (fnName.startsWith('consultar_')) {
                          let queryResult = null;
                          if (fnName === 'consultar_gastos_mes') {
                            const { data } = await supabase.from('fuel_logs').select('amount_cop').eq('vehicle_id', vehiculo_id);
                            queryResult = data;
                          } else if (fnName === 'consultar_consumo') {
                            const { data } = await supabase.from('fuel_logs').select('odometer, gallons').eq('vehicle_id', vehiculo_id).order('date', { ascending: false }).limit(args.ultimos_n_registros || 5);
                            queryResult = data;
                          } else if (fnName === 'consultar_vencimientos') {
                            const { data } = await supabase.from('annual_records').select('*').eq('vehicle_id', vehiculo_id);
                            queryResult = data;
                          } else if (fnName === 'consultar_historial') {
                            const table = args.categoria === 'gasolina' ? 'fuel_logs' : args.categoria === 'mantenimiento' ? 'maintenance_logs' : 'other_expenses';
                            const { data } = await supabase.from(table).select('*').eq('vehicle_id', vehiculo_id).order('date', { ascending: false }).limit(args.limite || 5);
                            queryResult = data;
                          }
                          
                          // Send query result back to Gemini to get verbal response
                          const toolResponseText = `Resultado de la consulta (${fnName}): ${JSON.stringify(queryResult)}. Responde brevemente con los datos obtenidos.`;
                          const response2 = await processUserMessage('', 'text/plain', [...conversationHistory, { role: 'user' as const, content: '[Dictó comando por voz]' }], userContext);
                          
                          // Due to stateless edge function, we just simulate the history and pass the query result as if the user said it
                          const response3 = await processUserMessage(toolResponseText, 'text/plain', [], userContext);
                          if (response3.candidates && response3.candidates.length > 0) {
                             const p = response3.candidates[0].content?.parts || [];
                             for(const p2 of p) {
                               if (p2.text) aiTextResponse += p2.text;
                             }
                          }
                      }
                    } catch (e: any) {
                      console.error('[AI Tool] Error en INSERT:', e?.code, e?.message);
                      aiTextResponse = "Hubo un error al guardar o consultar en la base de datos.";
                    }
                } else if (part.text) {
                    aiTextResponse += part.text;
                }
            }
        }

        if (!aiTextResponse && !functionCalled) {
            aiTextResponse = "No entendí muy bien lo que dijiste.";
        }
        
        const newHistory = [
            ...conversationHistory, 
            { role: 'user' as const, content: '[Comando de voz dictado]' }, 
            { role: 'model' as const, content: aiTextResponse }
        ];
        
        if (newHistory.length > 10) {
            setConversationHistory(newHistory.slice(newHistory.length - 10));
        } else {
            setConversationHistory(newHistory);
        }

        setFeedback(aiTextResponse);
        setState('speaking');
        Speech.speak(aiTextResponse, { 
            language: 'es-CO',
            onDone: () => setState('idle'),
            onStopped: () => setState('idle')
        });

    } catch (error: any) {
        // console.error(error);
        setFeedback('Ocurrió un error al procesar tu solicitud.');
        setState('idle');
    }
  };

  const toggleState = () => {
    if (state === 'idle') {
      guardAction(() => {
        startRecording();
      });
    } else if (state === 'listening') {
      stopRecording();
    } else if (state === 'speaking') {
      Speech.stop();
      setState('idle');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={{ flex: 0, backgroundColor: Colors.primary900 }} />
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
      <LinearGradient
        colors={[Colors.primary, Colors.primary900]} // bottom to top
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>

        
        {/* TOP: Menu Header */}
        <View style={styles.headerSection}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerPill}>
            <Text variant="body" color="white" style={styles.headerPillText}>CarCopilot IA</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* CENTER: Orb and Ring */}
        <View style={[styles.centerSection, { zIndex: 100, elevation: 100 }]}>
          {/* El anillo solo se muestra si nunca se ha activado la IA */}
          <IdleOrbRing active={state === 'idle' && !hasActivated} />
          <AnimatedOrb state={state as OrbState} size={240} vehicle={currentVehicle} />
        </View>

        {/* BOTTOM MESSAGES */}
        <View style={styles.messageSection}>
          <Text variant="heading2" color="white" align="center" style={styles.mainResponse}>
            {feedback ? feedback : (state === 'idle' ? '¿En qué puedo ayudarte?' : state === 'listening' ? '' : 'Procesando...')}
          </Text>
          <Text variant="body" align="center" style={styles.statusText}>
            {state === 'listening' ? 'Escuchando...' : ' '}
          </Text>
        </View>

        {/* BOTTOM: Mic Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={toggleState}
            style={styles.micButtonWrapper}
          >
            <View style={styles.micButton}>
              <Ionicons 
                name={state === 'speaking' ? "volume-high" : state === 'processing' ? "pulse" : state === 'listening' ? "stop" : "mic"} 
                size={42} 
                color={state === 'speaking' ? Colors.success : state === 'listening' ? Colors.white : Colors.white} 
              />
            </View>
          </TouchableOpacity>
        </View>

        <UpgradeModal
          visible={showUpgradeModal}
          onClose={closeUpgradeModal}
          onUpgrade={() => {
            closeUpgradeModal();
            router.push('/upgrade' as any);
          }}
        />
      </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary900,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary900,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerPillText: {
    fontFamily: "Montserrat_600SemiBold",
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 60,
    shadowColor: 'white',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 100,
  },
  messageSection: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  mainResponse: {
    marginBottom: 16,
    fontFamily: "Montserrat_400Regular",
  },
  statusText: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: "Montserrat_400Regular",
  },
  bottomSection: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  micButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});
