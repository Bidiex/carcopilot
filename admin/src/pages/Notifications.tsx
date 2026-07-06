import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useNotifications } from '../hooks/useNotifications';
import type { AppNotification } from '../hooks/useNotifications';
import { Table } from '../components/ui/Table';
import type { Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Plus } from 'lucide-react';

export function Notifications() {
  const { notifications, loading } = useNotifications();
  const navigate = useNavigate();

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
    </AdminLayout>
  );
}
