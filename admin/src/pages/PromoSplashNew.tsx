import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { usePromoSplashes } from '../hooks/usePromoSplashes';
import { ArrowLeft, Upload, ExternalLink } from 'lucide-react';

export function PromoSplashNew() {
  const navigate = useNavigate();
  const { createSplash, uploadImage } = usePromoSplashes();
  
  const [internalTitle, setInternalTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [frequency, setFrequency] = useState<'always' | 'once_per_user'>('once_per_user');
  const [ctaText, setCtaText] = useState('');
  const [ctaDestination, setCtaDestination] = useState('');
  const [learnMoreText, setLearnMoreText] = useState('');
  const [learnMoreUrl, setLearnMoreUrl] = useState('');
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !internalTitle || !startDate || !endDate) {
      alert('Por favor completa los campos obligatorios y sube una imagen.');
      return;
    }

    setSaving(true);
    try {
      const imageUrl = await uploadImage(imageFile);
      
      await createSplash({
        internal_title: internalTitle,
        image_url: imageUrl,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        frequency,
        cta_text: ctaText || null,
        cta_destination: ctaDestination || null,
        learn_more_text: learnMoreText || null,
        learn_more_url: learnMoreUrl || null,
        status: 'draft',
      });
      
      navigate('/promo-splashes');
    } catch (error) {
      console.error(error);
      alert('Error al guardar el splash promocional.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Nuevo Splash Promocional">
      <button 
        onClick={() => navigate('/promo-splashes')}
        className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" />
        Volver a la lista
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
                <Input 
                  label="Título Interno (Solo para admin)" 
                  value={internalTitle}
                  onChange={(e) => setInternalTitle(e.target.value)}
                  placeholder="Ej: Promo Verano 2024"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Fecha de Inicio" 
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <Input 
                  label="Fecha de Fin" 
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia de visualización</label>
                <select 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as 'always' | 'once_per_user')}
                >
                  <option value="once_per_user">1 vez por usuario</option>
                  <option value="always">Siempre (cada vez que abra la app en el periodo)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Imagen</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                  <input 
                    type="file" 
                    id="image-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="text-gray-400 mb-2" size={32} />
                    <span className="text-sm font-medium text-primary">Haz clic para subir una imagen</span>
                    <span className="text-xs text-gray-500 mt-1">PNG, JPG o WEBP (Recomendado: 1080x1920)</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Acciones (Opcional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input 
                    label="Texto del Botón (CTA)" 
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Ej: Ver planes Pro"
                  />
                  <Input 
                    label="Destino del Botón (Pantalla/URL)" 
                    value={ctaDestination}
                    onChange={(e) => setCtaDestination(e.target.value)}
                    placeholder="Ej: PaywallScreen"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Texto del enlace 'Más información'" 
                    value={learnMoreText}
                    onChange={(e) => setLearnMoreText(e.target.value)}
                    placeholder="Ej: Términos y condiciones"
                  />
                  <Input 
                    label="URL del enlace" 
                    value={learnMoreUrl}
                    onChange={(e) => setLearnMoreUrl(e.target.value)}
                    placeholder="Ej: https://..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <Button type="submit" disabled={saving || !imageFile}>
                  {saving ? 'Guardando...' : 'Crear Splash'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Vista Previa */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Vista Previa</h3>
            <div className="w-[300px] h-[600px] bg-black rounded-[40px] shadow-2xl overflow-hidden relative mx-auto border-[8px] border-gray-900">
              {/* Contenido de la pantalla */}
              <div className="absolute inset-0 bg-gray-100 flex flex-col">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400 p-6 text-center">
                    Sube una imagen para ver la vista previa
                  </div>
                )}

                {/* Overlay gradiente inferior si hay acciones */}
                {(ctaText || learnMoreText) && (
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center">
                    {ctaText && (
                      <button className="w-full bg-primary text-white font-semibold py-3 px-4 rounded-button mb-3 shadow-lg">
                        {ctaText}
                      </button>
                    )}
                    {learnMoreText && (
                      <button className="text-white/80 text-sm font-medium flex items-center hover:text-white">
                        {learnMoreText}
                        <ExternalLink size={14} className="ml-1" />
                      </button>
                    )}
                  </div>
                )}
                
                {/* Botón cerrar */}
                <button className="absolute top-6 right-6 w-8 h-8 bg-black/20 backdrop-blur-md text-white rounded-full flex items-center justify-center">
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
