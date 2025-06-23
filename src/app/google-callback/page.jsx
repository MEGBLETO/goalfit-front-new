'use client'; 

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setToken } from '../../utils/jwtUtils';
import { getUserProfile } from '../../utils/apiUtils';

export default function GoogleCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const token = new URLSearchParams(window.location.search).get('token');

      if (token) {
        setToken(token);

        try {
          const userData = await getUserProfile(token);

          if (userData.firstLogin) {
            router.push('/account');
          } else {
            router.push('/home');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          router.push('/home');
        }
      }
    };

    handleGoogleCallback();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-800">
      <div className="relative mb-4">
        <div className="w-16 h-16 border-4 border-blue-200 dark:border-gray-600 rounded-full animate-spin"></div>
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">Connexion à Google...</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">Veuillez patienter</p>
      </div>
    </div>
  );
}
