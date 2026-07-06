import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ShieldAlert } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, isAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      // Wait for auth context to update isAdmin status
      setTimeout(() => navigate('/', { replace: true }), 100);
    } catch (error: any) {
      setErrorMsg(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-white p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-card shadow-floating overflow-hidden">
        <div className="p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Copiloto <span className="text-primary">Admin</span>
            </h1>
            <p className="text-gray-500 mt-2 text-sm">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Correo electrónico"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
            />

            <Input
              label="Contraseña"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {errorMsg && (
              <div className="flex items-start p-3 bg-red-50 rounded-xl text-sm text-red-700">
                <ShieldAlert size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            {!isAdmin && errorMsg === '' && (
               <div className="text-xs text-center text-gray-500 flex items-center justify-center space-x-1">
                  <ShieldAlert size={14} />
                  <span>Acceso restringido a administradores.</span>
               </div>
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              Iniciar Sesión
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
