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
        <h1 className="text-xl text-amber-650 bg-amber-50 h-14">Hare Krishna
          <br/>
          {devotee?.name}&nbsp;Dev
        </h1>
      </div>
    </>
  );
}