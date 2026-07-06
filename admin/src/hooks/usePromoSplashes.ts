import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { PromoSplash } from '../types/database';

export function usePromoSplashes() {
  const [splashes, setSplashes] = useState<PromoSplash[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSplashes();
  }, []);

  const fetchSplashes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promo_splashes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSplashes(data as PromoSplash[]);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching splashes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSplash = async (splash: Omit<PromoSplash, 'id' | 'created_at'>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('promo_splashes')
        .insert([{ ...splash, created_by: user.user?.id }])
        .select()
        .single();

      if (error) throw error;
      setSplashes([data as PromoSplash, ...splashes]);
      return data;
    } catch (err: any) {
      console.error('Error creating splash:', err);
      throw err;
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('promo-splashes')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('promo-splashes').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const deleteSplash = async (id: string) => {
    try {
      const { error } = await supabase.from('promo_splashes').delete().eq('id', id);
      if (error) throw error;
      setSplashes(splashes.filter((s) => s.id !== id));
    } catch (err: any) {
      console.error('Error deleting splash:', err);
      throw err;
    }
  };

  return {
    splashes,
    loading,
    error,
    createSplash,
    uploadImage,
    deleteSplash,
    refetch: fetchSplashes
  };
}
