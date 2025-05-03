"use client";

import { Button } from 'primereact/button';
import { useAuth } from '@/hooks/useAuth';
import FullPageSpinner from '@/components/FullPageSpinner';

export default function Home() {
  const { devotee, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return <FullPageSpinner message="Hare Krishna! Fetching your details..." />;

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 text-blue-950">
      <Button className="justify-self-end" id="btn-log-out" label="Logout" severity="danger" raised
          icon="pi pi-sign-out"
          onClick={logout} />
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div>
          <span>
              <h1>Devotees Currently Logged In:</h1>
              <ul>
                {Object.entries(devotee!).map(([key, value]) => (
                  <li key={key}>
                    {key}: {String(value)}
                  </li>
                ))}
              </ul>
            </span>
        </div>
      </main>
      {/* <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        --- footer ----
      </footer> */}
    </div>
  );
}