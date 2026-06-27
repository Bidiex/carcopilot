import { GoogleGenAI, Type, Schema } from '@google/genai';

// Asegurarse de que la API Key está definida en .env
const apiKey = process.env.EXPO_PUBLIC_AI_API_KEY;

if (!apiKey) {
  console.warn('La API key de IA no está definida. Revisa tu .env');
}

// Inicializar el cliente (usando el modelo gemini-2.5-flash como equivalente al multimodal más rápido)
// Nota: La librería de genai soporta modelos gemini. Si se especifica gemma, 
// debe pasarse el modelo exacto que Google AI Studio expone.
export const aiClient = new GoogleGenAI({ apiKey: apiKey || '' });

export const MODEL_NAME = 'gemini-2.5-flash'; // Modelo más rápido con soporte multimodal nativo

// --- SYSTEM PROMPT ---
export const SYSTEM_PROMPT = `
Eres CarCopilot, un asistente financiero experto en vehículos. Tu objetivo es ayudar al usuario a registrar gastos, entender su consumo y anticipar mantenimientos o pagos legales en Colombia.

CONTEXTO DEL USUARIO:
- Tienes acceso a sus vehículos registrados.
- Eres proactivo, directo y breve. No des saludos largos.
- Siempre respondes en pesos colombianos (COP) y usas jerga colombiana comprensible (SOAT, tecnomecánica, tanqueo).

REGLAS DE OPERACIÓN:
1. Si el usuario te dicta un gasto, usa la herramienta correspondiente (ej. registrar_gasolina) para guardarlo. No asumas datos; si falta algún dato crítico, pregúntale antes de guardar.
2. Si el usuario hace una consulta, responde brevemente. Si no tienes los datos exactos, diles que no puedes acceder a ellos en este momento.
3. Mantén tus respuestas habladas por debajo de las 30 palabras. Eres un copiloto rápido.
`;

// --- TOOL SCHEMAS (FUNCTION CALLING) ---

const registrarGasolinaSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    vehiculo_id: {
      type: Type.STRING,
      description: "El ID del vehículo al que se le cargó la gasolina",
    },
    galones: {
      type: Type.NUMBER,
      description: "La cantidad de galones cargados",
    },
    precio_total: {
      type: Type.NUMBER,
      description: "El costo total del tanqueo en COP",
    },
    odometro: {
      type: Type.NUMBER,
      description: "El kilometraje actual del vehículo al momento del tanqueo",
    },
    tanque_lleno: {
      type: Type.BOOLEAN,
      description: "Indica si se llenó el tanque a su máxima capacidad o si fue una carga parcial",
    }
  },
  required: ["vehiculo_id", "precio_total", "odometro", "tanque_lleno"],
};

export const tools = [
  {
    functionDeclarations: [
      {
        name: "registrar_gasolina",
        description: "Registra un gasto de tanqueo de gasolina para un vehículo de combustión.",
        parameters: registrarGasolinaSchema,
      }
    ]
  }
];

export async function processUserMessage(textOrAudioBase64: string, isAudio: boolean, context: any) {
  try {
    const contents: any[] = [];
    
    if (isAudio) {
      contents.push({
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "audio/mp4", // expo-av graba en mp4/m4a por defecto
              data: textOrAudioBase64
            }
          }
        ]
      });
    } else {
      contents.push({
        role: "user",
        parts: [{ text: textOrAudioBase64 }]
      });
    }

    const response = await aiClient.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction: {
            role: "system",
            parts: [{ text: SYSTEM_PROMPT + "\nContexto: " + JSON.stringify(context) }]
        },
        tools: tools,
        temperature: 0.2, // Baja temperatura para precisión en las llamadas a funciones
      }
    });

    return response;
  } catch (error) {
    console.error("Error al procesar mensaje con la IA:", error);
    throw error;
  }
}
