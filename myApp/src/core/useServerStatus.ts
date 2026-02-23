import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from './apiConfig';

const navigatorOnLine = () => (typeof navigator !== 'undefined' ? navigator.onLine : true);

const pingServer = async () => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      cache: 'no-store',
    });
    return response.ok || response.status >= 400;
  } catch (error) {
    return false;
  }
};

export const useServerStatus = (pollInterval = 5000) => {
  const [browserOnline, setBrowserOnline] = useState<boolean>(navigatorOnLine);
  const [serverReachable, setServerReachable] = useState<boolean>(navigatorOnLine);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const setOnline = () => setBrowserOnline(true);
    const setOffline = () => setBrowserOnline(false);

    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);

    return () => {
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    if (!browserOnline) {
      setServerReachable(false);
      return;
    }

    const checkServer = async () => {
      const reachable = await pingServer();
      if (!canceled) {
        setServerReachable(reachable);
      }
    };

    checkServer();
    const id = setInterval(checkServer, pollInterval);

    return () => {
      canceled = true;
      clearInterval(id);
    };
  }, [browserOnline, pollInterval]);

  return useMemo(
    () => ({
      browserOnline,
      serverReachable,
      isOnline: browserOnline && serverReachable,
    }),
    [browserOnline, serverReachable],
  );
};

