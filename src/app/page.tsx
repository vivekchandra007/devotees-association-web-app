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
      <div className="grid md:items-center text-center min-h-screen">
        <h1 className='text-3xl text-amber-650'>Hare Krishna{`,${devotee?.name}`}&nbsp;Dev</h1>
      </div>
    </>
  );
}