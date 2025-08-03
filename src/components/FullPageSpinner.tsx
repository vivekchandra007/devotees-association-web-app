'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function FullPageSpinner({ message = 'Loading...' }: { message?: string }) {
  const mantra = [
    "Krishna", "Hare", "Krishna, ", "Krishna", "Krishna", "Hare", "Hare ||",
    "|| Hare", "Ram", "Hare", "Ram, ", "Ram", "Ram", "Hare", "Hare ||",
  ]
  const [mantraCounter, setMantraCounter] = useState<number>(1);
  const [messageMantra, setMessageMantra] = useState<string>("|| Hare");
  setTimeout(() => {
    if (mantraCounter % 16 !== 0) {
      setMessageMantra(`${messageMantra}  ${mantra[mantraCounter % 16 - 1]}`);
      setMantraCounter(mantraCounter + 1);
    } else {
      setMessageMantra("|| Hare");
      setMantraCounter(mantraCounter + 1);
    }
  }, 1000);
  return (
    <div className="p-2 h-screen max-w-screen fixed inset-0 z-5 flex flex-col items-center pt-[20vh] bg-black/85 backdrop-blur-sm text-white">
      <div className="relative inline-block">
        {/* Spinner ring */}
        <div className="absolute inset-0 rounded-full border-2 border-t-yellow-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        {/* Circular Image */}
        <Image
          className="animate-pulse animation-duration-1000 rounded-full"
          src="/app-image2.jpg"
          alt="Devotees' Association"
          width={180}
          height={180}
          priority
        />
      </div>
      <p className="block text-sm sm:text:lg m-4 max-w-screen text-center text-wrap">
        {message}
        <br />
        Let&apos;s Chant till then...
        <br />
        <span className="font-bilbo text-base sm:text:xl">{messageMantra}</span>
      </p>
    </div>
  );
}