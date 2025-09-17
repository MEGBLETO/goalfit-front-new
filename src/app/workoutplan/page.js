'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import utc from 'dayjs/plugin/utc'
import { 
  MdAccessTimeFilled, 
  MdLocalFireDepartment,
  MdFitnessCenter,
  MdInfo
} from 'react-icons/md'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import confetti from 'canvas-confetti'
import Image from 'next/image'
import axios from 'axios'

var isToday = require('dayjs/plugin/isToday')

dayjs.extend(isToday)
dayjs.extend(utc)

// API Endpoints
const WORKOUT_API_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/bdd/workout`
const WORKOUT_DEFAULT_API_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/bdd/workout/default`
const DEEPL_API_KEY = '673ad5f4-44ff-4423-a851-8e959de17dc1:fx'
// Replace the ExerciseDB constants with Unsplash
const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_API_KEY
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos'

// Add image caching
const imageCache = new Map()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Local fallback images (no API calls needed)
const getLocalFallbackImage = (bodyPart) => {
  const fallbackImages = {
    'cardio': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format',
    'jambes': 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&h=300&fit=crop&auto=format',
    'haut du corps': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format',
    'core': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format',
    'plein corps': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format',
    'default': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format'
  }
  
  return fallbackImages[bodyPart] || fallbackImages.default
}

const WorkoutPlan = () => {
  const [currentDate, setCurrentDate] = useState(dayjs().locale('fr'))
  const [dates, setDates] = useState(generateDates(dayjs().locale('fr')))
  const [currentWorkoutData, setCurrentWorkoutData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [triggered, setTriggered] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [localWorkout, setWorkout] = useState({})
  const [totalSteps, setTotalSteps] = useState(0)
  const [isTodayPlan, setIsTodayPlan] = useState(false)
  const [error, setError] = useState(null)

  // Helper function to get token from cookies
  const getCookie = (name) => {
    try {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop().split(';').shift()
      return null
    } catch (error) {
      console.error('Error reading cookie:', error)
      return null
    }
  }

  // Fetch workout plans conditionally based on user subscription status
  const fetchWorkoutPlans = async () => {
    try {
      const token = getCookie('token')
      if (!token) {
        throw new Error('No authentication token found. Please login.')
      }

      setLoading(true)
      setError(null)

      // Fetch user data to check subscription status
      let userData
      try {
        const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        })
        userData = userResponse.data
      } catch (error) {
        console.error('Error fetching user data:', error)
        if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please login again.')
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please check your connection.')
        }
        throw new Error('Failed to fetch user profile')
      }

      const hasActiveSubscription = !!userData?.subscription && userData.subscription.status === 'ACTIVE'
      const workoutApiUrl = hasActiveSubscription ? WORKOUT_API_URL : WORKOUT_DEFAULT_API_URL

      try {
        const workoutResponse = await axios.get(workoutApiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000, 
        })
        
        setCurrentWorkoutData(workoutResponse.data)
      } catch (error) {
        console.error('Error fetching workout plans:', error)
        if (error.response?.status === 404) {
          throw new Error('No workout plans found')
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please try again.')
        }
        throw new Error('Failed to fetch workout plans')
      }
    } catch (error) {
      console.error('Error in fetchWorkoutPlans:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Call fetchWorkoutPlans when component mounts
  useEffect(() => {
    fetchWorkoutPlans()
  }, [])

  // Restore generateDates for a 7-day window
  function generateDates(targetDate) {
    const datesArray = [];
    for (let i = -3; i <= 3; i++) {
      datesArray.push(targetDate.add(i, 'day'));
    }
    return datesArray;
  }

  // Update dates window when currentDate changes
  useEffect(() => {
    setDates(generateDates(currentDate));
  }, [currentDate]);

  // Fetch translated text using DeepL API
  const getTranslation = async (text, lang = 'fr') => {
    try {
      if (!text || typeof text !== 'string') {
        return text
      }

      const response = await axios.post(
        'https://api-free.deepl.com/v2/translate',
        new URLSearchParams({
          auth_key: DEEPL_API_KEY,
          text: text,
          target_lang: lang.toUpperCase(),
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      )

      return response.data.translations[0].text
    } catch (error) {
      console.error('Error fetching translation:', error)
      return text // Fallback to the original text if translation fails
    }
  }

  // Enhanced fetchExercise with Unsplash API
  const fetchExercise = async (exerciseName, bodyPart, defaultDescription) => {
    try {
      if (!exerciseName || !bodyPart) {
        return {
          imageUrl: getLocalFallbackImage(bodyPart),
          instructions: [defaultDescription || 'No description available'],
        }
      }

      // Check cache first
      const cacheKey = `${exerciseName}-${bodyPart}`
      const cached = imageCache.get(cacheKey)
      
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        return cached.data
      }

      // Create search queries for better image results
      const searchQueries = [
        `${exerciseName} exercise`,
        `${exerciseName} workout`,
        `${bodyPart} exercise`,
        `${exerciseName} fitness`,
        'fitness exercise' // fallback
      ]

      // Try each search query until we find an image
      for (const query of searchQueries) {
        try {
          const response = await axios.get(UNSPLASH_API_URL, {
            params: {
              query: query,
              per_page: 1,
              orientation: 'portrait',
              content_filter: 'high'
            },
            headers: {
              'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
              'Accept-Version': 'v1'
            },
            timeout: 10000,
          })

          const imageData = response.data.results[0]
          
          if (imageData && imageData.urls) {
            const result = {
              imageUrl: imageData.urls.regular,
              instructions: [defaultDescription || 'Exercise instructions not available'],
              imageAlt: imageData.alt_description || `${exerciseName} exercise`,
              photographer: imageData.user?.name || 'Unsplash',
              photographerUrl: imageData.user?.links?.html || ''
            }
            
            // Cache the result
            imageCache.set(cacheKey, {
              data: result,
              timestamp: Date.now()
            })
            
            return result
          }
        } catch (apiError) {
          console.log(`No image found for query: ${query}`)
          continue // Try next query
        }
      }

      // If no image found, return fallback
      const fallbackResult = {
        imageUrl: getLocalFallbackImage(bodyPart),
        instructions: [defaultDescription || 'Exercise instructions not available'],
        imageAlt: `${exerciseName} exercise`,
        photographer: 'GoalFit',
        photographerUrl: ''
      }
      
      // Cache the fallback too
      imageCache.set(cacheKey, {
        data: fallbackResult,
        timestamp: Date.now()
      })
      
      return fallbackResult

    } catch (error) {
      console.error('Error in fetchExercise:', error)
      return {
        imageUrl: getLocalFallbackImage(bodyPart),
        instructions: [defaultDescription || 'Exercise description unavailable'],
        imageAlt: `${exerciseName} exercise`,
        photographer: 'GoalFit',
        photographerUrl: ''
      }
    }
  }

  // Update the fetchExerciseData function
  const fetchExerciseData = async () => {
    try {
      if (!currentWorkoutData || !currentWorkoutData.workouts) {
        return
      }

      // Check if the current date has a workout plan
      const todaysWorkout = getWorkoutForDate(currentDate)
      if (!todaysWorkout || !todaysWorkout.exercises || todaysWorkout.exercises.length === 0) {
        setWorkout({}) // No workout for today
        setTotalSteps(0)
        return
      }
      
      const exercises = todaysWorkout.exercises

      const exerciseDataPromises = exercises.map(async (exercise) => {
        try {
          const { imageUrl, instructions, imageAlt, photographer, photographerUrl } = await fetchExercise(
            exercise.name,
            exercise.bodyPart,
            exercise.description
          )
          return { 
            ...exercise, 
            imageUrl, 
            instructions,
            imageAlt,
            photographer,
            photographerUrl
          }
        } catch (err) {
          console.error(`Error fetching data for exercise: ${exercise.name}`, err)
          return {
            ...exercise,
            imageUrl: getLocalFallbackImage(exercise.bodyPart),
            instructions: [exercise.description || 'Instructions not available.'],
            imageAlt: `${exercise.name} exercise`,
            photographer: 'GoalFit',
            photographerUrl: ''
          }
        }
      })

      const resolvedExercises = await Promise.all(exerciseDataPromises)
      setWorkout({ ...todaysWorkout, exercises: resolvedExercises })
      setTotalSteps(resolvedExercises.length)
      
    } catch (err) {
      console.error('Error in fetchExerciseData:', err)
      setError('Failed to load exercise details. Please try again.')
    }
  }

  // Fetch exercise data when current date or workout data changes
  useEffect(() => {
    if (currentWorkoutData) {
      fetchExerciseData()
      setIsTodayPlan(currentDate.isToday())
    }
  }, [currentDate, currentWorkoutData])

  // Get the workout for a specific date
  const getWorkoutForDate = (date) => {
    try {
      if (!currentWorkoutData || !Array.isArray(currentWorkoutData)) {
        return null;
      }
      // Compare by date string to avoid timezone issues
      const workoutForDate = currentWorkoutData.find((workout) =>
        dayjs(workout.date).format('YYYY-MM-DD') === dayjs(date).format('YYYY-MM-DD')
      );
      return workoutForDate || null;
    } catch (error) {
      console.error('Error getting workout for date:', error);
      return null;
    }
  };

  const handleClick = (date) => {
    try {
      const workoutForDate = getWorkoutForDate(date)
      if (workoutForDate) {
        setCurrentDate(date)
        setCurrentStep(1)
        const steps = workoutForDate?.exercises?.length || 0
        setTotalSteps(steps)
        setIsTodayPlan(false)
        const workoutDate = workoutForDate?.date || workoutForDate?.day;
        if (workoutDate && dayjs(workoutDate).isToday()) {
          setIsTodayPlan(true)
        }
      } else {
        setCurrentDate(date)
        setCurrentStep(1)
        setTotalSteps(0)
        setIsTodayPlan(false)
      }
    } catch (error) {
      console.error('Error handling date click:', error)
    }
  }

  const nextStep = () => {
    try {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
      }
    } catch (error) {
      console.error('Error in nextStep:', error)
    }
  }

  const prevStep = () => {
    try {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1)
      }
    } catch (error) {
      console.error('Error in prevStep:', error)
    }
  }

  const lastWorkout = () => {
    try {
      setIsDone(true)
      handleConfetti()
    } catch (error) {
      console.error('Error in lastWorkout:', error)
    }
  }

  // Function to launch confetti
  const handleConfetti = () => {
    try {
      confetti({
        particleCount: 500,
        spread: 120,
        origin: { y: 0.6 },
      })
      setTriggered(true)
    } catch (error) {
      console.error('Error launching confetti:', error)
    }
  }

  const selectedWorkout = getWorkoutForDate(currentDate)

  return (
    <div className="dark:bg-gray-900 min-h-screen">
      {loading ? (
        <div className="p-4">
          <Skeleton variant="rectangular" width="100%" height={400} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="40%" />
        </div>
      ) : error ? (
        <div className="p-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">
              Erreur de chargement
            </h3>
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={fetchWorkoutPlans}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-center mx-auto pt-4 pb-2 px-2 md:mx-12 mb-6 overflow-x-auto">
            {dates.map((date, index) => {
              const workoutAvailable = getWorkoutForDate(date)
              return (
                <motion.div
                  key={index}
                  className={`flex group relative mx-1 transition-all duration-300 justify-center w-14 sm:w-12 ${
                    date.isSame(currentDate, 'day')
                      ? 'bg-blue-600 shadow-md'
                      : workoutAvailable
                        ? 'hover:bg-blue-500 hover:shadow-md cursor-pointer'
                        : 'bg-gray-300 cursor-not-allowed dark:bg-gray-800'
                  } rounded-full`}
                  onClick={() => handleClick(date)}
                  aria-label={`Sélectionner ${date.format('dddd, MMM D')}`}
                  initial={{ opacity: 0.7, scale: 0.9 }}
                  animate={{
                    opacity: date.isSame(currentDate, 'day') ? 1 : 0.7,
                    scale: date.isSame(currentDate, 'day') ? 1 : 0.9,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center px-3 py-3">
                    <div className="text-center">
                      <p
                        className={`text-sm ${
                          date.isSame(currentDate, 'day')
                            ? 'text-gray-100 font-semibold'
                            : workoutAvailable
                              ? 'text-gray-900 group-hover:text-gray-100 group-hover:font-semibold dark:text-gray-300'
                              : 'text-gray-500 dark:text-gray-500'
                        } transition-all duration-300`}
                      >
                        {date.format('ddd')}
                      </p>
                      <p
                        className={`mt-2 ${
                          date.isSame(currentDate, 'day')
                            ? 'text-blue-600 font-bold rounded-full bg-white p-1 w-8'
                            : workoutAvailable
                              ? 'text-gray-900 group-hover:text-gray-100 group-hover:font-bold dark:text-gray-300'
                              : 'text-gray-500 dark:text-gray-500'
                        } transition-all duration-300`}
                      >
                        {date.format('D')}
                      </p>
                    </div>
                  </div>
                  {date.isSame(currentDate, 'day') && (
                    <span className="flex h-1 w-1 absolute bottom-1.5">
                      <span className="animate-ping absolute group-hover:opacity-75 opacity-0 inline-flex h-full w-full rounded-full bg-blue-400"></span>
                      <span className="relative inline-flex rounded-full h-1 w-1 bg-blue-100"></span>
                    </span>
                  )}
                </motion.div>
              )
            })}
          </div>

          <div className="mx-6 sm:mx-6 lg:mx-8">
            {selectedWorkout ? (
              <div className="px-6 pt-6 rounded-2xl bg-white dark:bg-gray-800 pb-6 w-full h-full">
                <div className="text-center md:text-start mt-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedWorkout.name}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    {selectedWorkout.description}
                  </p>
                  <Chip
                    className="mr-1"
                    icon={
                      <MdAccessTimeFilled className="text-xl dark:text-gray-200" />
                    }
                    label={selectedWorkout.duration}
                  />
                  <Chip
                    icon={
                      <MdLocalFireDepartment className="text-xl dark:text-gray-200" />
                    }
                    label={selectedWorkout.intensity}
                  />
                </div>
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Exercises
                  </h3>
                  <ol className="overflow-hidden space-y-8 px-1 pt-10 pb-20">
                    {selectedWorkout.exercises.map((exercise, index) => (
                      <li
                        key={exercise.localId}
                        className={`relative flex-1 ${
                          exercise.localId === currentStep
                            ? 'after:bg-blue-600'
                            : 'after:bg-gray-200 dark:after:bg-gray-700'
                        } after:content-[''] after:w-0.5 after:h-full after:inline-block after:absolute after:-bottom-12 after:left-4 lg:after:left-5`}
                      >
                        <div
                          className={`flex items-start font-medium w-full transition-transform duration-500 ease-in-out ${
                            exercise.localId === currentStep
                              ? ''
                              : 'cursor-pointer'
                          }`}
                        >
                          <span
                            className={`min-w-8 min-h-8 aspect-square transition-all duration-500 ease-in-out transform ${
                              exercise.localId === currentStep
                                ? 'bg-blue-600 text-white scale-110'
                                : 'bg-blue-50 text-blue-600 dark:bg-gray-800 dark:text-blue-400'
                            } border-2 ${
                              exercise.localId === currentStep
                                ? 'border-transparent'
                                : 'border-blue-600 dark:border-blue-400'
                            } rounded-full flex justify-center items-center mr-3 text-sm lg:min-w-10 lg:min-h-10`}
                          >
                            {exercise.localId}
                          </span>
                          <div
                            className={`block transition-all duration-500 ${
                              exercise.localId === currentStep
                                ? ''
                                : 'md:h-36 h-64 opacity-50'
                            }`}
                          >
                            <div className="relative flex flex-col items-center border border-solid border-gray-200 dark:border-gray-700 rounded-2xl transition-all duration-500 md:flex-row md:max-w-lg">
                              <div className="relative w-full md:w-40 h-32">
                                {localWorkout[exercise.name]?.imageUrl ? (
                                  <div className="relative w-full h-full">
                                    <Image
                                      src={localWorkout[exercise.name].imageUrl}
                                      alt={localWorkout[exercise.name].imageAlt || exercise.name}
                                      fill={true}
                                      sizes="100%"
                                      priority={true}
                                      unoptimized
                                      className="rounded-t-2xl md:rounded-2xl object-cover border-b md:border-r"
                                      onError={(e) => {
                                        console.error('Image failed to load:', e)
                                        e.target.src = getLocalFallbackImage(exercise.bodyPart)
                                      }}
                                    />
                                    {/* Photographer credit overlay */}
                                    {localWorkout[exercise.name]?.photographer && localWorkout[exercise.name].photographer !== 'GoalFit' && (
                                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                                        <a 
                                          href={localWorkout[exercise.name].photographerUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="hover:underline"
                                        >
                                          {localWorkout[exercise.name].photographer}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-t-2xl md:rounded-2xl flex items-center justify-center">
                                    <div className="text-center">
                                      <MdFitnessCenter className="mx-auto h-8 w-8 text-blue-500 dark:text-blue-400 mb-2" />
                                      <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">
                                        {exercise.name}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="p-4 flex-1">
                                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 capitalize transition-all duration-500">
                                  {exercise.name}
                                </h4>
                                
                                {/* Exercise Description */}
                                {exercise.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-5">
                                    {exercise.description}
                                  </p>
                                )}
                                
                                {/* Exercise Details Grid */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  {/* Reps */}
                                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <MdFitnessCenter className="mr-1 h-4 w-4" />
                                    <span className="font-medium">{exercise.reps}</span>
                                  </div>
                                  
                                  {/* Duration */}
                                  {exercise.durationMinutes && (
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                      <MdAccessTimeFilled className="mr-1 h-4 w-4" />
                                      <span className="font-medium">{exercise.durationMinutes} min</span>
                                    </div>
                                  )}
                                  
                                  {/* Focus Area */}
                                  {exercise.focus && (
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                      <MdInfo className="mr-1 h-4 w-4" />
                                      <span className="font-medium capitalize">{exercise.focus}</span>
                                    </div>
                                  )}
                                  
                                  {/* Estimated Calories */}
                                  {exercise.estimatedCalories && (
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                      <MdLocalFireDepartment className="mr-1 h-4 w-4" />
                                      <span className="font-medium">{exercise.estimatedCalories} cal</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {exercise.localId === currentStep && (
                              <>
                                {/* Enhanced Exercise Details Panel */}
                                <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                  <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                                    <MdInfo className="mr-2 h-4 w-4" />
                                    Détails de l'exercice
                                  </h5>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* Exercise Info Cards */}
                                    <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">RÉPÉTITIONS</span>
                                        <MdFitnessCenter className="h-4 w-4 text-blue-500" />
                                      </div>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{exercise.reps}</p>
                                    </div>
                                    
                                    {exercise.durationMinutes && (
                                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">DURÉE</span>
                                          <MdAccessTimeFilled className="h-4 w-4 text-green-500" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{exercise.durationMinutes} minutes</p>
                                      </div>
                                    )}
                                    
                                    {exercise.focus && (
                                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ZONE CIBLÉE</span>
                                          <MdInfo className="h-4 w-4 text-purple-500" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">{exercise.focus}</p>
                                      </div>
                                    )}
                                    
                                    {exercise.estimatedCalories && (
                                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">CALORIES</span>
                                          <MdLocalFireDepartment className="h-4 w-4 text-orange-500" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{exercise.estimatedCalories} kcal</p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Description */}
                                  {exercise.description && (
                                    <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">DESCRIPTION</span>
                                        <MdInfo className="h-4 w-4 text-blue-500" />
                                      </div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{exercise.description}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Instructions Section */}
                                <div className="mt-4">
                                  <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                                    <MdFitnessCenter className="mr-2 h-4 w-4" />
                                    Instructions
                                  </h5>
                                  
                                  {localWorkout[exercise.name]?.instructions ? (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                      <ul className="list-disc list-inside space-y-2 dark:text-gray-300">
                                        {localWorkout[exercise.name].instructions?.map(
                                          (instruction, i) => (
                                            <li key={i} className="text-sm leading-relaxed">{instruction}</li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  ) : (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                      <Skeleton variant="text" width="80%" />
                                      <Skeleton variant="text" width="60%" />
                                      <Skeleton variant="text" width="40%" />
                                    </div>
                                  )}
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex items-center gap-4 my-6">
                                  {exercise.localId > 1 && (
                                    <button
                                      type="button"
                                      className="py-2.5 px-6 text-sm bg-blue-50 dark:bg-gray-700 text-blue-500 dark:text-gray-200 rounded-lg cursor-pointer font-semibold text-center shadow-xs transition-all duration-500 transform hover:scale-105"
                                      onClick={prevStep}
                                    >
                                      Retour
                                    </button>
                                  )}
                                  {exercise.localId < totalSteps && (
                                    <button
                                      disabled={!isTodayPlan}
                                      type="button"
                                      className={`py-2.5 px-6 text-sm ${
                                        !isTodayPlan
                                          ? 'bg-gray-200 cursor-not-allowed'
                                          : 'bg-blue-500 dark:bg-gray-700 cursor-pointer hover:bg-blue-700 hover:scale-105'
                                      } text-white rounded-lg font-semibold text-center transition-all duration-500 transform`}
                                      onClick={nextStep}
                                    >
                                      Continue
                                    </button>
                                  )}
                                  {exercise.localId === totalSteps && (
                                    <button
                                      disabled={isDone}
                                      type="button"
                                      className={`py-2.5 px-6 text-sm ${
                                        isDone
                                          ? 'bg-gray-200 cursor-not-allowed'
                                          : 'bg-blue-500 dark:bg-gray-700 cursor-pointer hover:bg-blue-700 hover:scale-105'
                                      } text-white rounded-lg font-semibold text-center transition-all duration-500 transform`}
                                      onClick={lastWorkout}
                                    >
                                      Terminer
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                Aucun entraînement pour ce jour.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutPlan;