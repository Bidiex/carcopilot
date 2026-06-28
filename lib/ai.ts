import { supabase } from '@/lib/supabase';

export type ConversationMessage = {
  role: 'user' | 'model';
  content: string;
};

export type UserContext = {
  vehicles: any[];
  activeVehicleId: string;
  planStatus: string;
  currentDate: string;
};

export async function processUserMessage(
  audioBase64: string,
  mimeType: string,
  conversationHistory: ConversationMessage[],
  userContext: UserContext
) {
  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: { audioBase64, mimeType, conversationHistory, userContext },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    // console.error("Error al procesar mensaje con la IA:", error);
    throw error;
  }
}
