import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useNotifications } from '../hooks/useNotifications';
import type { AppNotification } from '../hooks/useNotifications';
import { Table } from '../components/ui/Table';
import type { Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Input } from '../components/ui/Input';
import { Plus, Send, Edit2 } from 'lucide-react';

export function Notifications() {
  const { notifications, loading, sendNotificationNow, updateNotification } = useNotifications();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'promotional' | 'system'>('promotional');
  const [sendingId, setSendingId] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});
  const [resultModal, setResultModal] = useState<{isOpen: boolean, title: string, message: string}>({isOpen: false, title: '', message: ''});
  const [editModal, setEditModal] = useState<{isOpen: boolean, notification: AppNotification | null}>({isOpen: false, notification: null});

  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => n.type === activeTab);
  }, [notifications, activeTab]);

  const handleSendNowClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmModal({ isOpen: true, id });
  };

  const handleEditClick = (n: AppNotification) => {
    setEditTitle(n.title);
    setEditBody(n.body);
    setEditStatus(n.status);
    setEditModal({ isOpen: true, notification: n });
  };

  const handleSaveEdit = async () => {
    if (!editModal.notification) return;
    setIsUpdating(true);
    await updateNotification(editModal.notification.id, {
      title: editTitle,
      body: editBody,
      status: editStatus as any,
    });
    setIsUpdating(false);
    setEditModal({ isOpen: false, notification: null });
  };

  const executeSendNow = async () => {
    const id = confirmModal.id;
    if (!id) return;
    
    setConfirmModal({ isOpen: false, id: null });
    setSendingId(id);
    const res = await sendNotificationNow(id);
    setSendingId(null);
    
    if (res.success) {
      setResultModal({ isOpen: true, title: '¡Éxito!', message: `¡Notificación enviada! Destinatarios: ${res.sent}` });
    } else {
      setResultModal({ isOpen: true, title: 'Error', message: `Error al enviar: ${res.error}` });
    }
  };

  const columns: Column<AppNotification>[] = [
    { header: 'Título', accessor: (n) => <span className="font-medium">{n.title}</span> },
    { 
      header: 'Segmento/Trigger', 
      accessor: (n) => {
        if (n.type === 'system') {
          return <span className="text-gray-500 font-mono text-xs">{n.trigger_event || 'N/A'}</span>;
        }
        return (n.segment || 'all').toUpperCase();
      }
    },
    { 
      header: 'Estado', 
      accessor: (n) => {
        const variants: Record<string, any> = { draft: 'default', scheduled: 'warning', sent: 'success', failed: 'danger', active: 'success' };
        return <Badge variant={variants[n.status] || 'default'}>{n.status.toUpperCase()}</Badge>;
      }
    },
    { header: 'Fecha', accessor: (n) => new Date(n.created_at).toLocaleDateString() },
    {
      header: 'Acciones',
      accessor: (n) => (
        <div className="flex gap-2">
          {n.type === 'promotional' && (n.status === 'draft' || n.status === 'scheduled') && (
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={(e) => handleSendNowClick(e, n.id)}
              isLoading={sendingId === n.id}
            >
              <Send size={14} className="mr-1" /> Enviar ahora
            </Button>
          )}
          {n.type === 'system' && (
            <Button size="sm" variant="secondary" onClick={() => handleEditClick(n)}>
              <Edit2 size={14} className="mr-1" /> Editar
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <AdminLayout title="Notificaciones">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">Historial y gestión de notificaciones push.</p>
        <Button onClick={() => navigate('/notifications/new')} className="flex items-center">
          <Plus size={18} className="mr-2" />
          Nueva Notificación
        </Button>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'promotional' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('promotional')}
        >
          Campañas Manuales
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'system' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('system')}
        >
          Notificaciones de Sistema
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando notificaciones...</div>
      ) : (
        <Table columns={columns} data={filteredNotifications} />
      )}

      {/* Confirm Modal */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal({isOpen: false, id: null})} 
        onConfirm={executeSendNow}
        title="Confirmar Envío"
        message="¿Estás seguro de que quieres enviar esta notificación a todos los usuarios que apliquen AHORA MISMO?"
        confirmText="Enviar Notificación"
      />

      {/* Result Modal */}
      <Modal 
        isOpen={resultModal.isOpen} 
        onClose={() => setResultModal({...resultModal, isOpen: false})} 
        title={resultModal.title}
      >
        <div className="flex flex-col items-center text-center">
          <p className="text-gray-600 mb-6">{resultModal.message}</p>
          <Button className="w-full sm:w-auto" onClick={() => setResultModal({...resultModal, isOpen: false})}>
            Entendido
          </Button>
        </div>
      </Modal>

      {/* Edit System Notification Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, notification: null })}
        title="Editar Plantilla de Sistema"
      >
        <div className="space-y-4 pt-2">
          <Input 
            label="Título"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cuerpo de la notificación
            </label>
            <textarea 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder-gray-400"
              rows={4}
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
            <select 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              <option value="active">Activo</option>
              <option value="draft">Inactivo (Borrador)</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditModal({ isOpen: false, notification: null })}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} isLoading={isUpdating}>
              Guardar Cambios
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
