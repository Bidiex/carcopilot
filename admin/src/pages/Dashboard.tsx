import { AdminLayout } from '../components/layout/AdminLayout';

export function Dashboard() {
  return (
    <AdminLayout title="Dashboard">
      <div className="bg-white rounded-card shadow-card p-10 text-center mt-4 border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">¡Bienvenido al Panel de Administración!</h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Selecciona una opción del menú lateral para gestionar los usuarios, notificaciones y contenido de la app móvil.
        </p>
      </div>
    </AdminLayout>
  );
}
