'use client';

import { ProgressSpinner } from 'primereact/progressspinner';
import Image from 'next/image';
import { ProgressBar } from 'primereact/progressbar';

export default function FullPageSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed p-2 inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm text-white">
      <div className="relative inline-block">
        {/* Spinner ring */}
        <div className="absolute inset-0 rounded-full border-2 border-t-yellow-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        {/* Circular Image */}
        <Image
          className="animate-pulse animation-duration-1000 rounded-full"
          src="/app-image.jpg"
          alt="Devotees' Association"
          width={240}
          height={240}
          priority
        />
      </div>
      <p className="mt-4 text-lg sm:max-w-[300px] text-center">{message}</p>
    </div>
  );
}