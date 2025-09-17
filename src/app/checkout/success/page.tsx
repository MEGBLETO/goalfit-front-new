'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { FaCheckCircle } from 'react-icons/fa';
import Logo from '../../../components/logo';
import Cookies from 'js-cookie';

// Disable server-side rendering for this page
const SuccessPage = () => {
  const [sessionId, setSessionId] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Génération de votre plan personnalisé, veuillez patienter…');

  // Fetch search params only on the client side within useEffect
  useEffect(() => {
    const sessionIdFromParams = searchParams.get('session_id');
    if (sessionIdFromParams) {
      setSessionId(sessionIdFromParams);
    }
  }, [searchParams]);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) return;

    // Trigger meal plan and workout plan generation
    const generatePlans = async () => {
      try {
        // Trigger meal plan generation
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/bdd/meal/generate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });

        // Trigger workout plan generation (in parallel, don't await)
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/bdd/workout/generate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });

        // Poll for meal plan readiness
        let ready = false;
        let attempts = 0;
        while (!ready && attempts < 10) {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/bdd/meal/mealplans`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            ready = true;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 2000)); // wait 2s
            attempts++;
          }
        }

        setLoading(false);
        setMessage('Votre plan est prêt ! Redirection…');
        setTimeout(() => {
          router.push('/mealplan');
        }, 1500);
      } catch (error) {
        setMessage("Erreur lors de la génération du plan. Veuillez réessayer.");
        setLoading(false);
      }
    };

    generatePlans();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <div className="flex flex-col items-center">
        <div className="p-4 bg-gray-100 rounded-full">
          <Logo width={100} height={100} color="#000" />
        </div>
        <FaCheckCircle className="text-green-500 text-7xl mb-4" />
        <h2 className="text-3xl font-bold mb-2">Paiement Réussi !</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">{message}</p>
        {loading && (
          <div className="mt-4">
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {!loading && (
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Vous serez redirigé vers votre tableau de bord sous peu.
          </p>
        )}
      </div>
    </div>
  );
};

// Disable SSR for this page
export default dynamic(() => Promise.resolve(SuccessPage), { ssr: false });
