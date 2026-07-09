import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useUsers } from '../hooks/useUsers';
import { Table } from '../components/ui/Table';
import type { Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import type { ProfileWithVehicleCount } from '../types/database';

export function Users() {
  const { users, loading, search, setSearch, accessFilter, setAccessFilter } = useUsers();
  const navigate = useNavigate();

  const columns: Column<ProfileWithVehicleCount>[] = [
    { header: 'Nombre', accessor: (p) => <span className="font-medium">{p.name || 'Sin nombre'}</span> },
    { 
      header: 'Estado Acceso', 
      accessor: (p) => {
        const variants: Record<string, any> = { free: 'default', trial: 'warning', pro: 'success', expired: 'danger' };
        return <Badge variant={variants[p.access_status] || 'default'}>{p.access_status?.toUpperCase()}</Badge>;
      }
    },
    { header: 'Vehículos', accessor: (p) => p.vehicles?.[0]?.count || 0 },
    { header: 'Registro', accessor: (p) => new Date(p.created_at).toLocaleDateString() },
  ];

  return (
    <AdminLayout title="Usuarios">
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Input 
          placeholder="Buscar por nombre..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="max-w-xs"
        />
        <select 
          className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
          value={accessFilter}
          onChange={e => setAccessFilter(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="free">Free</option>
          <option value="trial">Trial</option>
          <option value="pro">Pro</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando usuarios...</div>
      ) : (
        <Table 
          columns={columns} 
          data={users} 
          onRowClick={(user) => navigate(`/users/${user.id}`)} 
        />
      )}
    </AdminLayout>
  );
}
