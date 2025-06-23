'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import './style.scss';

export default function MultiStepForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error('Failed to parse token:', err);
      return null;
    }
  };

  const computeAge = (dateOfBirth) => {
    if (!dateOfBirth) return 30;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const insertWorkoutPlans = async (workoutPlans, token) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/bdd/workout/bulk`,
        { workoutPlans },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Workout plans inserted:', response.data);
    } catch (error) {
      console.error('Error inserting workout plans:', error);
    }
  };

  const insertMealPlans = async (mealPlans, token) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/bdd/meal/mealplans`,
        { mealplans: mealPlans },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Meal plans inserted:', response.data);
    } catch (error) {
      console.error('Error inserting meal plans:', error);
    }
  };

  const generateWorkoutPlans = async (userData, token) => {
    try {
      const workoutPlanRequest = {
        userData: {
          age: computeAge(userData.profile?.dateOfBirth),
          gender: userData.profile?.gender,
          weight: userData.profile?.weight,
          height: userData.profile?.height,
          fitnessLevel: userData.profile?.fitnessLevel,
          goals: userData.profile?.goals?.map(g => g.name) || ['muscle gain'],
          equipment: userData.profile?.equipment || [],
          availability: userData.profile?.availability || { daysPerWeek: 5, minutesPerDay: 45 },
          healthConsiderations: userData.profile?.healthConsiderations || [],
        },
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
      };

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/ai/workout-plan`,
        workoutPlanRequest,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await insertWorkoutPlans(res.data, token);
    } catch (err) {
      console.error('Workout generation error:', err);
    }
  };

  const generateMealPlans = async (userData, token) => {
    try {
      const mealPlanRequest = {
        userData: {
          age: computeAge(userData.profile?.dateOfBirth),
          gender: userData.profile?.gender,
          weight: userData.profile?.weight,
          height: userData.profile?.height,
          fitnessLevel: userData.profile?.fitnessLevel,
          mealsPerDay: 3,
          goal: userData.profile?.goals?.map(g => g.name) || [],
          dietaryPreferences: userData.profile?.dietaryPreferences || {},
          healthConsiderations: userData.profile?.healthConsiderations || [],
        },
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
      };

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/ai/meal-plan`,
        mealPlanRequest,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await insertMealPlans(res.data, token);
    } catch (err) {
      console.error('Meal generation error:', err);
    }
  };

  const generatePlans = async (userData, token) => {
    try {
      await Promise.all([
        generateWorkoutPlans(userData, token),
        generateMealPlans(userData, token)
      ]);
    } catch (err) {
      console.error('Plan generation failed:', err);
    } finally {
      setIsLoading(false);
      router.push('/home');
    }
  };

  const fetchUserFromBackend = async (email, token) => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}/user/profile?email=${email}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 200) {
        setUser(res.data);
        await generatePlans(res.data, token);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('User fetch failed:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const getTokenFromCookies = () => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; token=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };

    const tokenFromCookies = getTokenFromCookies();
    if (tokenFromCookies) {
      const decoded = parseJwt(tokenFromCookies);
      if (decoded?.email) {
        setToken(tokenFromCookies);
        fetchUserFromBackend(decoded.email, tokenFromCookies);
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen relative flex flex-row justify-center bg-white dark:bg-gray-900 dark:text-gray-100">
      {isLoading ? (
        <div className="absolute top-1/3">
          <div className="loader-container">
            <div className="loader-boxes">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="box"><div></div><div></div><div></div><div></div></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="content text-xl">
          <div className="content__container">
            <p className="content__container__text mt-2.5">Génération</p>
            <ul className="content__container__list">
              <li className="content__container__list__item">Meal Plans</li>
              <li className="content__container__list__item">Workout Plans</li>
              <li className="content__container__list__item">Your Program</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
