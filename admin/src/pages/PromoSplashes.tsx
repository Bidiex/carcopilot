import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import type { Column } from '../components/ui/Table';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { usePromoSplashes } from '../hooks/usePromoSplashes';
import type { PromoSplash } from '../types/database';
import { Plus, Trash2 } from 'lucide-react';

export function PromoSplashes() {
  const navigate = useNavigate();
  const { splashes, loading, deleteSplash } = usePromoSplashes();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [splashToDelete, setSplashToDelete] = useState<string | null>(null);

  const confirmDelete = (id: string) => {
    setSplashToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (splashToDelete) {
      setDeletingId(splashToDelete);
      setDeleteModalOpen(false);
      await deleteSplash(splashToDelete);
      setDeletingId(null);
      setSplashToDelete(null);
    }
  };

  const getStatusBadge = (splash: PromoSplash) => {
    const now = new Date();
    const start = new Date(splash.start_date);
    const end = new Date(splash.end_date);

    if (splash.status === 'draft') return <Badge variant="default">Borrador</Badge>;
    if (splash.status === 'paused') return <Badge variant="warning">Pausado</Badge>;
    
    if (now < start) return <Badge variant="primary">Programado</Badge>;
    if (now > end) return <Badge variant="danger">Expirado</Badge>;
    return <Badge variant="success">Activo</Badge>;
  };

  const columns: Column<PromoSplash>[] = [
    {
      header: 'Imagen',
      accessor: (splash) => (
        <img src={splash.image_url} alt={splash.internal_title} className="w-12 h-12 object-cover rounded-md" />
      )
    },
    { header: 'Título Interno', accessor: 'internal_title' },
    { 
      header: 'Vigencia', 
      accessor: (splash) => (
        <span className="text-sm">
          {new Date(splash.start_date).toLocaleDateString()} - {new Date(splash.end_date).toLocaleDateString()}
        </span>
      )
    },
    { 
      header: 'Frecuencia', 
      accessor: (splash) => splash.frequency === 'always' ? 'Siempre' : '1 vez por usuario'
    },
    { header: 'Estado', accessor: (splash) => getStatusBadge(splash) },
    {
      header: 'Acciones',
      accessor: (splash) => (
        <div className="flex gap-2">
          <Button 
            variant="danger" 
            size="sm" 
            onClick={() => confirmDelete(splash.id)}
            disabled={deletingId === splash.id}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <AdminLayout title="Splash Promocional">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg text-gray-600">Gestiona las pantallas promocionales de la app</h2>
        <Button onClick={() => navigate('/promo-splashes/new')} className="flex items-center gap-2">
          <Plus size={18} />
          Nuevo Splash
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="py-10 text-center">Cargando...</div>
        ) : splashes.length > 0 ? (
          <Table columns={columns} data={splashes} />
        ) : (
          <div className="py-10 text-center text-gray-500">
            No hay pantallas promocionales configuradas.
          </div>
        )}
      </Card>

      <ConfirmModal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={executeDelete}
        title="Eliminar Splash Promocional"
        message="¿Estás seguro de que deseas eliminar este Splash Promocional? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        isDestructive={true}
      />
    </AdminLayout>
  );
}
