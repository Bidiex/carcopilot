import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useNotifications } from '../hooks/useNotifications';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft } from 'lucide-react';

export function NotificationNew() {
  const navigate = useNavigate();
  const { createNotification } = useNotifications();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<'system' | 'promotional'>('system');
  const [segment, setSegment] = useState<'all' | 'free' | 'trial' | 'pro' | 'city'>('all');
  const [destinationType, setDestinationType] = useState<'app_screen' | 'external_url' | 'none'>('none');
  const [destinationValue, setDestinationValue] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const success = await createNotification({
      title,
      body,
      type,
      segment,
      destination_type: destinationType,
      destination_value: destinationType !== 'none' ? destinationValue : null,
      scheduled_at: isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      status: isScheduled ? 'scheduled' : 'draft', // By default draft if not scheduled, since send is separate
    });

    setLoading(false);
    if (success) {
      navigate('/notifications');
    }
  };

  return (
    <AdminLayout title="Nueva Notificación">
      <button 
        onClick={() => navigate('/notifications')}
        className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" />
        Volver a la lista
      </button>

      <div className="max-w-2xl">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              label="Título" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
              placeholder="Ej: Oferta de mantenimiento"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Cuerpo de la notificación ({body.length} caracteres)
              </label>
              <textarea 
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder-gray-400"
                rows={4}
                value={body}
                onChange={e => setBody(e.target.value)}
                required
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                <select 
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                >
                  <option value="system">Sistema</option>
                  <option value="promotional">Promocional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Segmento</label>
                <select 
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  value={segment}
                  onChange={(e: any) => setSegment(e.target.value)}
                >
                  <option value="all">Todos los usuarios</option>
                  <option value="free">Usuarios Free</option>
                  <option value="trial">Usuarios Trial</option>
                  <option value="pro">Usuarios Pro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Acción al tocar (Destino)</label>
                <select 
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  value={destinationType}
                  onChange={(e: any) => setDestinationType(e.target.value)}
                >
                  <option value="none">Ninguna</option>
                  <option value="app_screen">Pantalla de la App</option>
                  <option value="external_url">URL Externa</option>
                </select>
              </div>

              {destinationType !== 'none' && (
                <div>
                  <Input 
                    label="Valor del destino" 
                    value={destinationValue} 
                    onChange={e => setDestinationValue(e.target.value)} 
                    placeholder={destinationType === 'app_screen' ? 'Ej: Dashboard' : 'https://...'}
                    required
                  />
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-6">
              <label className="flex items-center mb-4">
                <input 
                  type="checkbox" 
                  checked={isScheduled} 
                  onChange={e => setIsScheduled(e.target.checked)}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-700">Programar envío para después</span>
              </label>

              {isScheduled && (
                <Input 
                  type="datetime-local" 
                  label="Fecha y hora de envío" 
                  value={scheduledAt} 
                  onChange={e => setScheduledAt(e.target.value)} 
                  required
                />
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button type="button" variant="ghost" onClick={() => navigate('/notifications')} className="mr-3">
                Cancelar
              </Button>
              <Button type="submit" isLoading={loading}>
                Guardar Notificación
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
}
