import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook reutilizable para proteger acciones CUD.
 * Muestra el UpgradeModal si el usuario no puede realizar la acción.
 *
 * Uso:
 *   const { guardAction, showUpgradeModal, closeUpgradeModal } = useActionGuard()
 *
 *   // En un botón:
 *   <Button onPress={() => guardAction(() => router.push('/fuel-log-new'))} />
 *
 *   // En el JSX:
 *   <UpgradeModal
 *     visible={showUpgradeModal}
 *     onClose={closeUpgradeModal}
 *     onUpgrade={() => { closeUpgradeModal(); router.push('/upgrade') }}
 *   />
 */
export function useActionGuard() {
  const { canPerformActions } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  function guardAction(action: () => void): void {
    if (canPerformActions) {
      action();
    } else {
      setShowUpgradeModal(true);
    }
  }

  return {
    guardAction,
    showUpgradeModal,
    closeUpgradeModal: () => setShowUpgradeModal(false),
  };
}
