import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { AiInsight } from "@/types/app";
import { useAuth } from "@/context/AuthContext";

export function useInsights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [savedInsights, setSavedInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch active (not saved, not expired) insights for today
      const { data: activeData, error: activeError } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_saved', false)
        .gt('expires_at', new Date().toISOString())
        .order('priority', { ascending: true })
        .order('generated_at', { ascending: false })
        .limit(3);

      if (activeError) throw activeError;
      
      // Fetch saved insights
      const { data: savedData, error: savedError } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_saved', true)
        .order('generated_at', { ascending: false });

      if (savedError) throw savedError;

      setInsights((activeData as AiInsight[]) || []);
      setSavedInsights((savedData as AiInsight[]) || []);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const saveInsight = async (id: string) => {
    try {
      // Optimistic update
      const insightToSave = insights.find(i => i.id === id);
      if (insightToSave) {
        setInsights(prev => prev.filter(i => i.id !== id));
        setSavedInsights(prev => [{ ...insightToSave, is_saved: true }, ...prev].sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()));
      }

      const { error } = await supabase
        .from('ai_insights')
        .update({ is_saved: true })
        .eq('id', id);

      if (error) {
        // Revert on error
        fetchInsights();
        throw error;
      }
    } catch (error) {
      console.error('Error saving insight:', error);
    }
  };

  const unsaveInsight = async (id: string) => {
    try {
      // Optimistic update
      const insightToUnsave = savedInsights.find(i => i.id === id);
      if (insightToUnsave) {
        setSavedInsights(prev => prev.filter(i => i.id !== id));
        // We generally don't add it back to active insights to avoid clutter,
        // but if we wanted to, we could add it back if not expired.
      }

      const { error } = await supabase
        .from('ai_insights')
        .update({ is_saved: false })
        .eq('id', id);

      if (error) {
        // Revert on error
        fetchInsights();
        throw error;
      }
    } catch (error) {
      console.error('Error unsaving insight:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .is('read_at', null);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking insight as read:', error);
    }
  };

  return {
    insights,
    savedInsights,
    loading,
    saveInsight,
    unsaveInsight,
    markAsRead,
    refreshInsights: fetchInsights,
  };
}
