"use client";

import { useAuth } from '@/hooks/useAuth';
import FullPageSpinner from '@/components/FullPageSpinner';
import TopNavBar from '@/components/TopNavBar';

export default function Home() {
  const { devotee, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <FullPageSpinner message="Hare Krishna! Fetching your details..." />;

  return (
    <>
    <TopNavBar />
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 text-blue-950">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div>
          <span>
              <h1 className='text-9xl text-amber-650'>Hare Krishna{`,${devotee?.name}`}&nbsp;Dev</h1>
            </span>
        </div>
      </main>
      {/* <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        --- footer ----
      </footer> */}
    </div>
    </>
  );
}