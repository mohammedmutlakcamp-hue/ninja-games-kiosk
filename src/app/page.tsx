'use client';

// Root page redirects to kiosk login
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/kiosk');
  }, [router]);
  
  return null;
}
