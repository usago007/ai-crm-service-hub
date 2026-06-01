import { useState } from 'react';
import type { Toast } from '../../types';

export function useToastQueue() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function pushToast(message: string, type: Toast['type'] = 'info') {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(item => item.id !== id)), 2800);
  }

  return { toasts, pushToast };
}
