import { useState, useEffect } from 'react';
import { getOnlineCount } from '@/lib/api';

export function useOnlineCount() {
  const [count, setCount] = useState<number>(1);

  useEffect(() => {
    let clientId = sessionStorage.getItem('msk_client_id');
    if (!clientId) {
      clientId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem('msk_client_id', clientId);
    }

    const fetchCount = async () => {
      const c = await getOnlineCount(clientId);
      setCount(c);
    };

    fetchCount();
    const interval = setInterval(fetchCount, 20000);
    return () => clearInterval(interval);
  }, []);

  return count;
}
