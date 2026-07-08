import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useNotifications } from '../hooks/useNotifications';
import type { AppNotification } from '../hooks/useNotifications';
import { Table } from '../components/ui/Table';
import type { Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Send } from 'lucide-react';

export function Notifications() {
  const { notifications, loading, sendNotificationNow } = useNotifications();
  const navigate = useNavigate();
  const [sendingId, setSendingId] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});
  const [resultModal, setResultModal] = useState<{isOpen: boolean, title: string, message: string}>({isOpen: false, title: '', message: ''});

  const handleSendNowClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmModal({ isOpen: true, id });
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
      header: 'Tipo', 
      accessor: (n) => (
        <Badge variant={n.type === 'promotional' ? 'primary' : 'default'}>
          {n.type === 'promotional' ? 'Promocional' : 'Sistema'}
        </Badge>
      ) 
    },
    { header: 'Segmento', accessor: (n) => n.segment.toUpperCase() },
    { 
      header: 'Estado', 
      accessor: (n) => {
        const variants: Record<string, any> = { draft: 'default', scheduled: 'warning', sent: 'success', failed: 'danger' };
        return <Badge variant={variants[n.status] || 'default'}>{n.status.toUpperCase()}</Badge>;
      }
    },
    { header: 'Fecha', accessor: (n) => new Date(n.created_at).toLocaleDateString() },
    {
      header: 'Acciones',
      accessor: (n) => (
        <Button 
          size="sm" 
          variant="secondary" 
          onClick={(e) => handleSendNowClick(e, n.id)}
          isLoading={sendingId === n.id}
        >
          <Send size={14} className="mr-1" /> Enviar ahora
        </Button>
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

      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando notificaciones...</div>
      ) : (
        <Table columns={columns} data={notifications} />
      )}

      {/* Confirm Modal */}
      <Modal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal({isOpen: false, id: null})} 
        title="Confirmar Envío"
      >
        <p className="text-gray-600 mb-6">
          ¿Estás seguro de que quieres enviar esta notificación a todos los usuarios que apliquen AHORA MISMO?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmModal({isOpen: false, id: null})}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={executeSendNow}>
            Enviar Notificación
          </Button>
        </div>
      </Modal>

      {/* Result Modal */}
      <Modal 
        isOpen={resultModal.isOpen} 
        onClose={() => setResultModal({...resultModal, isOpen: false})} 
        title={resultModal.title}
      >
        <p className="text-gray-600 mb-6">{resultModal.message}</p>
        <div className="flex justify-end">
          <Button onClick={() => setResultModal({...resultModal, isOpen: false})}>
            Entendido
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
