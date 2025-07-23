'use client'
import React, { useState, useEffect } from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import jwt from 'jsonwebtoken'
import { useForm, FormProvider } from 'react-hook-form'
import { FiEdit } from 'react-icons/fi'
import dayjs from 'dayjs'
import { Badge, Avatar, SmallAvatar } from '@mui/material'
import { getToken, getUserId, getAuthHeaders } from '../../utils/jwtUtils'

const ProfilPage = () => {
  const [user, setUser] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const { register, handleSubmit, setValue, watch } = useForm()
  const [badgeColor, setBadgeColor] = useState('bg-gray-100 text-gray-800')

  useEffect(() => {
    const fetchUserData = async () => {
      const token = getToken()
      if (!token) {
        setError('User is not authenticated')
        setLoading(false)
        return
      }
      try {
        const userId = getUserId(token)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/user/${userId}`,
          {
            method: 'GET',
            headers: getAuthHeaders(token),
          }
        )
        if (!response.ok) {
          throw new Error('Failed to fetch user data')
        }
        const data = await response.json()

        // Check if subscription exists before trying to access it
        if (data.subscription) {
          data.subscription.status === 'ACTIVE'
            ? setBadgeColor('bg-green-100 text-green-800')
            : setBadgeColor('bg-red-100 text-red-800')
        } else {
          setBadgeColor('bg-gray-100 text-gray-800') // Default color for no subscription
        }

        // Set form values
        setValue('name', data.name || '')
        setValue('surname', data.surname || '')
        const formattedDate = formatDateForInput(data.profile?.dateOfBirth);
        console.log('Setting dateOfBirth:', data.profile?.dateOfBirth, 'Formatted:', formattedDate);
        setValue('dateOfBirth', formattedDate || '')
        setValue('weight', data.profile?.weight || '')
        setValue('height', data.profile?.height || '')
        console.log('Setting contact:', data.contact);
        setValue('contact', data.contact || '')
        setValue('email', data.email || '')

        // For the Repas & Fitness section
        setValue('healthConsiderations', data.profile?.healthConsiderations?.join(', ') || '')
        setValue('fitnessLevel', data.profile?.fitnessLevel || '')
        setValue('dietaryPreferences', data.profile?.dietaryPreferences?.restrictions?.join(', ') || '')
        setValue('equipment', data.profile?.equipment?.join(', ') || '')
        setValue('goal', data.profile?.goals?.[0]?.name || '')
        setValue('daysPerWeek', data.profile?.availability?.daysPerWeek || '')
        setValue('minutesPerDay', data.profile?.availability?.minutesPerDay || '')
        setValue('objectiveWeight', data.profile?.objectiveWeight || '')

        setUser(data)
        console.log('Complete user data:', data);
        console.log('User contact:', data.contact);
        console.log('User profile:', data.profile);
        console.log('Availability data:', data.profile?.availability);
        console.log('Days per week:', data.profile?.availability?.daysPerWeek);
        console.log('Minutes per day:', data.profile?.availability?.minutesPerDay);
      } catch (error) {
        console.error('Error fetching user data:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [setValue])

  const handleUnsubscription = async () => {
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir vous désabonner ?'
    )
    if (confirmed) {
      try {
        const token = getToken()
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/payment/payment/cancel-subscription/${user.subscription.stripeSubscriptionId}`,
          {
            method: 'POST',
            headers: getAuthHeaders(token),
          }
        )
        if (!response.ok) {
          throw new Error('Failed to update user data')
        }
      } catch (error) {
        console.error('Error updating user data:', error)
        setError('Failed to update user data')
      }
    }
  }

  const computeAge = (dateOfBirth) => {
    if (!dateOfBirth) return null
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  const onSubmit = async (formData) => {
    setSubmitting(true)
    setError(null)
    
    // Parse arrays from comma-separated strings
    const healthConsiderations = formData.healthConsiderations 
      ? formData.healthConsiderations.split(',').map(item => item.trim()).filter(item => item)
      : []
    
    const dietaryPreferences = formData.dietaryPreferences 
      ? formData.dietaryPreferences.split(',').map(item => item.trim()).filter(item => item)
      : []
    
    const equipment = formData.equipment 
      ? formData.equipment.split(',').map(item => item.trim()).filter(item => item)
      : []
    
    const formattedData = {
      ...formData,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
      weight: Number(formData.weight),
      height: Number(formData.height),
      objectiveWeight: Number(formData.objectiveWeight),
      healthConsiderations,
      dietaryPreferences,
      equipment,
      goal: formData.goal,
      availability: {
        daysPerWeek: Number(formData.daysPerWeek),
        minutesPerDay: Number(formData.minutesPerDay),
      }
    }

    // Remove age from the data since we're using dateOfBirth
    delete formattedData.age
    // Remove the individual fields that are now in objects
    delete formattedData.daysPerWeek
    delete formattedData.minutesPerDay

    try {
      const token = getToken()
      const userId = getUserId(token)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/user/${userId}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(token),
          body: JSON.stringify(formattedData),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update user data')
      }

      const updatedData = await response.json()
      setUser(updatedData)
      setSuccess(true)
      setShowButton(false)

      setTimeout(() => {
        window.location.reload()
      }, 3000)
    } catch (error) {
      console.error('Error updating user data:', error)
      setError('Failed to update user data')
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = () => {
    setShowButton(true)
  }

  // Success message component
  const SuccessMessage = () => (
    <div className="fixed top-4 right-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center">
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span>Profil mis à jour avec succès !</span>
    </div>
  )

  if (loading) {
    return (
      <div className="container mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded-lg mb-6 w-1/4"></div>
          
          {/* Tabs Skeleton */}
          <div className="flex border-b border-gray-300 dark:border-gray-700 mb-6">
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-t-lg w-24 mr-4"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-t-lg w-24 mr-4"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-t-lg w-32"></div>
          </div>
          
          {/* Section Title Skeleton */}
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-lg mb-6 w-1/3"></div>
          
          {/* Form Fields Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
              </div>
            ))}
          </div>
          
          {/* Loading Spinner */}
          <div className="flex justify-center items-center mt-8">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-200 dark:border-gray-600 rounded-full animate-spin"></div>
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <div className="ml-4">
              <p className="text-gray-600 dark:text-gray-400 font-medium">Chargement du profil...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Veuillez patienter</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-300"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md relative">
      {/* Loading Overlay */}
      {submitting && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="w-12 h-12 border-4 border-blue-200 dark:border-gray-600 rounded-full animate-spin"></div>
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Sauvegarde en cours...</p>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6 text-blue-600 dark:text-blue-400">
        Profil
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Tabs className="w-full">
          <TabList className="flex border-b border-gray-300 dark:border-gray-700 mb-6">
            <Tab className="px-6 py-2 cursor-pointer focus:outline-none transition-all duration-300 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 active:bg-gray-100 dark:active:bg-gray-700">
              Infos Perso
            </Tab>
            <Tab className="px-6 py-2 cursor-pointer focus:outline-none transition-all duration-300 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 active:bg-gray-100 dark:active:bg-gray-700">
              Souscription
            </Tab>
            <Tab className="px-6 py-2 cursor-pointer focus:outline-none transition-all duration-300 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 active:bg-gray-100 dark:active:bg-gray-700">
              Repas & Fitness
            </Tab>
          </TabList>

          {/* Personal Information Section */}
          <TabPanel>
            <h2 className="text-2xl font-semibold mb-3 text-blue-600 dark:text-blue-400">
              Infos Perso
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nom :
                </label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={watch('name') || user?.name || ''}
                    onChange={(e) => {
                      setValue('name', e.target.value);
                      handleInputChange();
                    }}
                  />
                  <FiEdit className="absolute top-2 right-2 text-blue-500 cursor-pointer" />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Prénom :
                </label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={watch('surname') || user?.surname || ''}
                    onChange={(e) => {
                      setValue('surname', e.target.value);
                      handleInputChange();
                    }}
                  />
                  <FiEdit className="absolute top-2 right-2 text-blue-500 cursor-pointer" />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date de naissance :
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={watch('dateOfBirth') || formatDateForInput(user?.profile?.dateOfBirth) || ''}
                  onChange={(e) => {
                    setValue('dateOfBirth', e.target.value);
                    handleInputChange();
                  }}
                />
                {user?.profile?.dateOfBirth && (
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>Âge calculé: {computeAge(user.profile.dateOfBirth)} ans</span>
                    <span className="ml-2 text-xs">(basé sur la date de naissance)</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Poids (kg) :
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={watch('weight') || user?.profile?.weight || ''}
                  onChange={(e) => {
                    setValue('weight', e.target.value);
                    handleInputChange();
                  }}
                />
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Taille (cm) :
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={watch('height') || user?.profile?.height || ''}
                  onChange={(e) => {
                    setValue('height', e.target.value);
                    handleInputChange();
                  }}
                />
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Téléphone :
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={watch('contact') || user?.contact || ''}
                  onChange={(e) => {
                    setValue('contact', e.target.value);
                    handleInputChange();
                  }}
                />
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  E-mail :
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  {...register('email')}
                  readOnly
                />
              </div>
            </div>

            {showButton && (
              <button
                type="submit"
                disabled={submitting}
                className={`mt-6 w-full px-4 py-2 font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center ${
                  submitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </button>
            )}
          </TabPanel>

          {/* Subscription Section */}
          <TabPanel>
            <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
              <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
                Détails de la Souscription
              </h2>

              <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-300">
                    <strong>Statut :</strong>
                  </p>
                  <div className="inline-flex items-center space-x-2">
                    <span
                      className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${badgeColor}`}
                    >
                      {user?.subscription ? (
                        user.subscription.status === 'ACTIVE' ? (
                          <>
                            <svg
                              className="w-4 h-4 inline-block mr-1 text-green-500"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Actif
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4 inline-block mr-1 text-red-500"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Inactif
                          </>
                        )
                      ) : (
                        'Aucun abonnement'
                      )}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-300">
                    <strong>Date de début :</strong>{' '}
                    {user?.subscription?.startDate
                      ? dayjs(user.subscription.startDate).format('YYYY/MM/DD')
                      : 'N/A'}
                  </p>
                </div>

                <div className="mb-4">
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-300">
                    <strong>Date de fin :</strong>{' '}
                    {user?.subscription?.endDate
                      ? dayjs(user.subscription.endDate).format('YYYY/MM/DD')
                      : 'N/A'}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-center">
                  {user?.subscription && user.subscription.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg transition-colors duration-300"
                      onClick={handleUnsubscription}
                    >
                      Se désabonner
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-lg transition-colors duration-300"
                      onClick={() => window.location.href = '/subscription'}
                    >
                      S'abonner
                    </button>
                  )}
                </div>
              </div>
            </div>
          </TabPanel>
          {/* Meals & Fitness Section */}
          <TabPanel>
            <h2 className="text-2xl font-semibold mb-3 text-blue-600 dark:text-blue-400">
              Repas & Fitness
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Modifiez vos informations pour personnaliser vos plans de repas et d'entraînement générés par l'IA.
            </p>
            
            {/* Summary Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                Résumé actuel
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">Date de naissance:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {user?.profile?.dateOfBirth 
                      ? `${new Date(user.profile.dateOfBirth).toLocaleDateString('fr-FR')} (${formatDateForInput(user.profile.dateOfBirth)})`
                      : 'Non définie'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">Âge:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {user?.profile?.dateOfBirth 
                      ? `${computeAge(user.profile.dateOfBirth)} ans`
                      : 'Non défini'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">Téléphone:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {user?.contact || 'Non défini'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">Niveau:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {user?.profile?.fitnessLevel || 'Non défini'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">Objectif:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {user?.profile?.goals?.[0]?.name || 'Non défini'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">Poids actuel:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {user?.profile?.weight ? `${user.profile.weight} kg` : 'Non défini'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">Objectif poids:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {user?.profile?.objectiveWeight ? `${user.profile.objectiveWeight} kg` : 'Non défini'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">Entraînement:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {user?.profile?.availability?.daysPerWeek && user?.profile?.availability?.minutesPerDay 
                      ? `${user.profile.availability.daysPerWeek} jours, ${user.profile.availability.minutesPerDay} min`
                      : 'Non défini'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">Préférences:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {user?.profile?.dietaryPreferences?.restrictions?.length 
                      ? user.profile.dietaryPreferences.restrictions.join(', ')
                      : 'Aucune'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Niveau de fitness :
                </label>
                <select
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  {...register('fitnessLevel')}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">{loading ? 'Chargement...' : 'Sélectionner un niveau'}</option>
                  <option value="débutant">Débutant</option>
                  <option value="intermédiaire">Intermédiaire</option>
                  <option value="avancé">Avancé</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Objectif principal :
                </label>
                <select
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  {...register('goal')}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">{loading ? 'Chargement...' : 'Sélectionner un objectif'}</option>
                  <option value="weight_loss">Perte de poids</option>
                  <option value="muscle_gain">Prise de muscle</option>
                  <option value="endurance">Amélioration de l'endurance</option>
                  <option value="strength">Force</option>
                  <option value="maintenance">Maintien</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Préférences alimentaires :
                </label>
                <input
                  type="text"
                  placeholder={loading ? "Chargement..." : "Ex: Végétarien, Sans gluten, Pescétarien"}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  {...register('dietaryPreferences')}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Séparez par des virgules
                </p>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Équipement disponible :
                </label>
                <input
                  type="text"
                  placeholder={loading ? "Chargement..." : "Ex: haltères, tapis, corde à sauter"}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  {...register('equipment')}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Séparez par des virgules
                </p>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Problèmes de santé :
                </label>
                <input
                  type="text"
                  placeholder={loading ? "Chargement..." : "Ex: Douleurs lombaires, Hypertension"}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  {...register('healthConsiderations')}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Séparez par des virgules
                </p>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Objectif de poids (kg) :
                </label>
                <input
                  type="number"
                  min="30"
                  max="200"
                  placeholder={loading ? "Chargement..." : "Ex: 75"}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  {...register('objectiveWeight')}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jours d'entraînement par semaine :
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  placeholder={loading ? "Chargement..." : "Ex: 4"}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={watch('daysPerWeek') || user?.profile?.availability?.daysPerWeek || ''}
                  onChange={(e) => {
                    setValue('daysPerWeek', e.target.value);
                    handleInputChange();
                  }}
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Minutes par session :
                </label>
                <input
                  type="number"
                  min="15"
                  max="300"
                  placeholder={loading ? "Chargement..." : "Ex: 45"}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={watch('minutesPerDay') || user?.profile?.availability?.minutesPerDay || ''}
                  onChange={(e) => {
                    setValue('minutesPerDay', e.target.value);
                    handleInputChange();
                  }}
                  disabled={loading}
                />
              </div>
            </div>

            {showButton && (
              <button
                type="submit"
                disabled={submitting}
                className={`mt-6 w-full px-4 py-2 font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center ${
                  submitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer les modifications'
                )}
              </button>
            )}
          </TabPanel>
        </Tabs>

        {success && <SuccessMessage />}
      </form>
    </div>
  )
}

export default ProfilPage
