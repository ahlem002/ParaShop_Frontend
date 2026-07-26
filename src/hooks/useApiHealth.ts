import { useEffect, useState } from 'react';
import { apiFetch } from '../config/api';
import type { HealthResponse } from '../types/api';

export function useApiHealth() {
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    apiFetch<HealthResponse>('/health')
      .then((data) => {
        if (!cancelled) {
          setIsConnected(data.status === 'ok');
          setMessage(data.message);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsConnected(false);
          setMessage('Backend unavailable');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { isConnected, message };
}
