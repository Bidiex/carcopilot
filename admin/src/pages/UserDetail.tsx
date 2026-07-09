import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import type { Column } from '../components/ui/Table';
import { ArrowLeft } from 'lucide-react';
import type { Profile, Vehicle } from '../types/database';

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const [profileRes, vehiclesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('vehicles').select('*').eq('user_id', id)
      ]);
      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (vehiclesRes.data) setVehicles(vehiclesRes.data as Vehicle[]);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAccess = async (newAccess: string) => {
    if (!id) return;
    setUpdating(true);
    try {
      await supabase.from('profiles').update({ access_status: newAccess }).eq('id', id);
      await fetchUserDetails();
    } catch (error) {
      console.error('Error updating access_status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const vehicleColumns: Column<Vehicle>[] = [
    { header: 'Vehículo', accessor: (v) => `${v.custom_brand || 'N/A'} ${v.custom_model || ''}` },
    { header: 'Placa', accessor: 'plate' },
    { header: 'Tipo', accessor: 'type' },
    { header: 'Año', accessor: 'year' },
    { 
      header: 'Estado', 
      accessor: (v) => <Badge variant={v.is_active ? 'success' : 'default'}>{v.is_active ? 'Activo' : 'Inactivo'}</Badge> 
    }
  ];

  if (loading) return <AdminLayout title="Detalle de Usuario"><div className="py-10 text-center">Cargando...</div></AdminLayout>;
  if (!profile) return <AdminLayout title="Detalle de Usuario"><div className="py-10 text-center text-red-500">Usuario no encontrado</div></AdminLayout>;

  return (
    <AdminLayout title={`Usuario: ${profile.name || 'Sin nombre'}`}>
      <button 
        onClick={() => navigate('/users')}
        className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" />
        Volver a la lista
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Info Card */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                {profile.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{profile.name || 'Usuario'}</h2>
              <p className="text-sm text-gray-500 mt-1">Registrado el {new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
            
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Gestión de Acceso</h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">Estado Actual:</span>
                <Badge variant={
                  profile.access_status === 'pro' ? 'success' : 
                  profile.access_status === 'trial' ? 'warning' : 'default'
                }>{profile.access_status?.toUpperCase() || 'N/A'}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" onClick={() => updateAccess('free')} disabled={updating}>Free</Button>
                <Button variant="secondary" size="sm" onClick={() => updateAccess('trial')} disabled={updating}>Trial</Button>
                <Button variant="primary" size="sm" onClick={() => updateAccess('pro')} disabled={updating}>Pro</Button>
                <Button variant="danger" size="sm" onClick={() => updateAccess('expired')} disabled={updating}>Expired</Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Vehicles Table */}
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Vehículos Registrados ({vehicles.length})</h3>
          {vehicles.length > 0 ? (
            <Table columns={vehicleColumns} data={vehicles} />
          ) : (
            <Card className="text-center py-10">
              <p className="text-gray-500">Este usuario no tiene vehículos registrados.</p>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
