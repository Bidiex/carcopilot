import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useNotifications } from '../hooks/useNotifications';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft } from 'lucide-react';

const TRIGGER_EVENTS = [
  { value: 'user_welcome', label: 'Bienvenida de Usuario' },
  { value: 'soat_expiring_60', label: 'Vencimiento SOAT (60 días)' },
  { value: 'soat_expiring_30', label: 'Vencimiento SOAT (30 días)' },
  { value: 'soat_expiring_15', label: 'Vencimiento SOAT (15 días)' },
  { value: 'tecnomecanica_expiring_60', label: 'Vencimiento Tecnomecánica (60 días)' },
  { value: 'tecnomecanica_expiring_30', label: 'Vencimiento Tecnomecánica (30 días)' },
  { value: 'tecnomecanica_expiring_15', label: 'Vencimiento Tecnomecánica (15 días)' },
  { value: 'tax_expiring_60', label: 'Vencimiento Impuesto (60 días)' },
  { value: 'tax_expiring_30', label: 'Vencimiento Impuesto (30 días)' },
  { value: 'tax_expiring_15', label: 'Vencimiento Impuesto (15 días)' },
];

export function NotificationNew() {
  const navigate = useNavigate();
  const { createNotification } = useNotifications();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<'system' | 'promotional'>('promotional');
  const [triggerEvent, setTriggerEvent] = useState('user_welcome');
  const [segment, setSegment] = useState<'all' | 'free' | 'trial' | 'pro' | 'city'>('all');
  const [destinationType, setDestinationType] = useState<'app_screen' | 'external_url' | 'none'>('none');
  const [destinationValue, setDestinationValue] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'once' | 'daily' | 'weekly'>('once');
  const [sendTime, setSendTime] = useState('');
  const [sendDayOfWeek, setSendDayOfWeek] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let success = false;

    if (type === 'system') {
      success = await createNotification({
        title,
        body,
        type: 'system',
        trigger_event: triggerEvent,
        destination_type: 'none',
        status: 'active',
      });
    } else {
      success = await createNotification({
        title,
        body,
        type: 'promotional',
        segment,
        destination_type: destinationType,
        destination_value: destinationType !== 'none' ? destinationValue : null,
        recurrence_type: isScheduled ? recurrenceType : 'once',
        send_time: isScheduled && sendTime ? sendTime : null,
        send_day_of_week: isScheduled && recurrenceType === 'weekly' ? sendDayOfWeek : null,
        start_date: isScheduled && startDate ? startDate : null,
        end_date: isScheduled && endDate ? endDate : null,
        status: isScheduled ? 'scheduled' : 'draft', // By default draft if not scheduled, since send is separate
      });
    }

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
                  <option value="promotional">Promocional</option>
                  <option value="system">Sistema</option>
                </select>
              </div>

              {type === 'system' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Evento de Sistema</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    value={triggerEvent}
                    onChange={(e: any) => setTriggerEvent(e.target.value)}
                  >
                    {TRIGGER_EVENTS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              ) : (
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
              )}
            </div>

            {type === 'promotional' && (
              <>
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
                    <span className="ml-2 text-sm text-gray-700">Programar envío de campaña</span>
                  </label>

                  {isScheduled && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de recurrencia</label>
                          <select 
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                            value={recurrenceType}
                            onChange={(e: any) => setRecurrenceType(e.target.value)}
                          >
                            <option value="once">Una vez</option>
                            <option value="daily">Diaria</option>
                            <option value="weekly">Semanal</option>
                          </select>
                        </div>

                        {recurrenceType === 'weekly' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Día de la semana</label>
                            <select 
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                              value={sendDayOfWeek}
                              onChange={(e: any) => setSendDayOfWeek(Number(e.target.value))}
                            >
                              <option value={0}>Domingo</option>
                              <option value={1}>Lunes</option>
                              <option value={2}>Martes</option>
                              <option value={3}>Miércoles</option>
                              <option value={4}>Jueves</option>
                              <option value={5}>Viernes</option>
                              <option value={6}>Sábado</option>
                            </select>
                          </div>
                        )}

                        <div>
                          <Input 
                            type="time" 
                            label="Hora de envío" 
                            value={sendTime} 
                            onChange={e => setSendTime(e.target.value)} 
                            required={isScheduled}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Input 
                          type="date" 
                          label="Vigencia Desde" 
                          value={startDate} 
                          onChange={e => setStartDate(e.target.value)} 
                          required={isScheduled}
                        />
                        <Input 
                          type="date" 
                          label="Vigencia Hasta" 
                          value={endDate} 
                          onChange={e => setEndDate(e.target.value)} 
                          required={isScheduled}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

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
