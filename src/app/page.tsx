"use client";
import api from '@/lib/axios';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { useEffect, useState } from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';

export default function Home() {
  const router = useRouter();

  const [devotee, setDevotee] = useState({});
  const [loaderMessage, setLoaderMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function cleanTokensAndRedirectToLogin() {
    // Clear local storage
    localStorage.removeItem('access_token');
    // Clear refresh token cookie
    await axios.post('/api/auth/logout'); // NOTE: use raw axios, not the wrapped one
    // Redirect to /login page
    router.push('/login');
    setLoading(false);
  }

  function logout() {
    cleanTokensAndRedirectToLogin()
  }

  useEffect(() => {
    const getDevotee = async () => {
      try {
        setLoading(true);
        setLoaderMessage('Hare Krishna! Please wait while we are fetching your details...');
        const authResponse = await api.get('/auth/me');
        setDevotee(authResponse.data.devotee);
        setLoading(false);
      } catch {
        setLoaderMessage('Hare Krishna. Redirecting you to login page');
        setTimeout(() => {
          // If the access token is expired or invalid, redirect to login page
          cleanTokensAndRedirectToLogin();
        }, 4000);
      }
    };
    getDevotee();
  }, [cleanTokensAndRedirectToLogin]);

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
            <span>
              <Image
                className="animate-pulse animation-duration-1000 rounded-full"
                src="/app-image.jpg"
                alt="Devotees' Association"
                width={480}
                height={480}
                priority
              />
              <br />
              {loaderMessage}
              <ProgressBar mode="indeterminate" style={{ height: '2px' }} color="midnightblue"></ProgressBar>
            </span>
          ) : null}
        </span>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        --- footer ----
      </footer>
    </div>
  );
}