'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to register page - enterprise-grade forced entry point
    router.replace('/register');
  }, [router]);

  // Show nothing while redirecting to register
  return null;
}