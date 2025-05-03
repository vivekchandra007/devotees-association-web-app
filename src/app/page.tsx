"use client";
import api from '@/lib/axios';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { useEffect, useState } from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import FullPageSpinner from '@/components/FullPageSpinner';

export default function Home() {
  const router = useRouter();

  const [devotee, setDevotee] = useState({});
  const [loaderMessage, setLoaderMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function cleanTokensAndRedirectToLogin() {
    setLoading(true);
    setLoaderMessage('Hare Krishna. Logging you out...');
    // Clear the state
    setDevotee({});
    // Clear local storage
    localStorage.removeItem('access_token');
    // Clear refresh token cookie
    axios.post('/api/auth/logout'); // NOTE: use raw axios, not the wrapped one
    setTimeout(() => {
      setLoading(false);
      // Redirect to /login page
      if (typeof window !== 'undefined') {
        router.push('/login');
      }
    }, 2000);
  }

  function logout() {
    cleanTokensAndRedirectToLogin();
  }

  useEffect(() => {
    const getDevotee = async () => {
      try {
        setLoading(true);
        setLoaderMessage('Hare Krishna! Fetching your details...');
        const authResponse = await api.get('/auth/me');
        if (authResponse?.status === 200 && authResponse?.data) {
          setDevotee(authResponse.data.devotee);
          setLoading(false);
        } else {
          throw new Error();
        }
      } catch {
        // means the access token is expired or invalid and also could not be refreshed, so ask the user to login again
        setLoaderMessage('Hare Krishna. Redirecting you to login page');
        setTimeout(() => {
          setLoading(false);
          // Redirect to /login page
          if (typeof window !== 'undefined') {
            router.push('/login');
          }
        }, 4000);
      }
    };
    if (!loading) {
      getDevotee();
    }
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 text-blue-950">
      {!loading ? (
        <Button className="justify-self-end" id="btn-log-out" label="Logout" severity="danger" raised
          icon="pi pi-sign-out" loading={loading}
          onClick={logout} />
      ) : null
      }
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div>
          {devotee && typeof devotee === 'object' && Object.keys(devotee).length > 0 ? (
            <span>
              <h1>Devoteed Currently Logged In:</h1>
              <ul>
                {Object.entries(devotee).map(([key, value]) => (
                  <li key={key}>
                    {key}: {String(value)}
                  </li>
                ))}
              </ul>
            </span>
          ) : null
          }
        </div>
        <span className="text-center">
          {loading ? (
            <FullPageSpinner message={loaderMessage} />
          ) : null}
        </span>
      </main>
      {/* <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        --- footer ----
      </footer> */}
    </div>
  );
}