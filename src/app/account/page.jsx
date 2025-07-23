'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from '../../components/logo'
import { ArrowBackIos } from '@mui/icons-material'
import StepperComponent from '../../components/Stepper'
import FormStep from '../../components/FormStep'
import { Avatar } from '@mui/material'
import { useForm, FormProvider } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { getToken, getUserId, getAuthHeaders } from '../../utils/jwtUtils'

export default function MultiStepForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  const methods = useForm({
    defaultValues: {
      gender: '',
      dateOfBirth: '',
      fitnessLevel: '',
      weight: '',
      objectiveWeight: '',
      restrictions: [],
      goal: '', 
      equipment: [],
      healthConsiderations: [],
      daysPerWeek: '',
      minutesPerDay: '',
    },
    mode: 'onBlur',
  })

  const { clearErrors } = methods

  const [validationTrigger, setValidationTrigger] = useState(
    () => async () => true
  )

  const [clearErrorsTrigger, setClearErrorsTrigger] = useState(() => () => {})

  const { handleSubmit } = methods

  useEffect(() => {
    clearErrors()
  }, [step, clearErrors])

  const handleNext = async () => {
    if (typeof validationTrigger === 'function') {
      const isValid = await validationTrigger()
      if (isValid && step < 7) { 
        clearErrors()
        setStep((prev) => prev + 1)
      }
    }
  }

  const handlePrev = () => {
    setStep((prev) => prev - 1)
  }

  const computeAge = (dob) => {
    if (!dob) return null
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const formatSubmissionData = (formData) => {
    const goalValue = formData.selectedObjective || ''

    const formattedData = {
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      fitnessLevel: formData.fitnessLevel,
      weight: parseInt(formData.weight),
      objectiveWeight: parseInt(formData.objectiveWeight),
      age: computeAge(formData.dateOfBirth),
      height: parseInt(formData.height, 10),
      goal: goalValue, 
      dietaryPreferences: formData.restrictions || [],
      equipment: formData.equipment || [],
      availability: {
        daysPerWeek: parseInt(formData.daysPerWeek, 10),
        minutesPerDay: parseInt(formData.minutesPerDay, 10),
      },
      healthConsiderations: formData.healthConsiderations || [],
      contact: formData.phoneNumber,
    }

    return formattedData
  }

  const onSubmit = async (data) => {
    try {
      const formattedData = formatSubmissionData(data)
      const token = getToken()
      if (!token) {
        throw new Error('No token found')
      }
      const userId = getUserId(token)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    
      
      // Update user profile data
      const response = await axios.put(
        `${baseUrl}/user/${userId}`,
        formattedData,
        {
          headers: getAuthHeaders(token),
        }
      )
      
      if (response.status === 200) {
        
        // Update firstLogin to false
        await axios.patch(
          `${baseUrl}/user/${userId}/first-login`,
          {},
          {
            headers: getAuthHeaders(token),
          }
        )
        
        router.push('/subscription')
      } else {
        console.error('Failed to update user:', response.data.message)
      }
    } catch (error) {
      console.error('Error during submission:', error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-screen bg-white dark:bg-gray-900 dark:text-gray-100">
      <div className="w-1/3 flex-col md:flex hidden bg-slate-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 px-8">
        <div className="flex justify-start items-center py-2">
          <Link href="/login" passHref>
            <div className="flex items-center">
              <Logo color="#2563eb" />
              <h1 className="text-xl font-bold ms-2 font-mono dark:text-gray-100">
                GoalFit
              </h1>
            </div>
          </Link>
        </div>
        <div className="max-w-md text-center md:text-left my-auto">
          <StepperComponent activeStep={step - 1} />
        </div>
      </div>
      <div className="md:w-2/3 flex flex-col items-center justify-center dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 z-50 md:hidden flex justify-start items-center py-2 w-full md:px-8 px-4 border-b border-slate-200 dark:border-gray-700 sticky top-0">
          <Link href="/login" passHref>
            <div className="flex items-center">
              <Logo color="#2563eb" />
              <h1 className="text-xl font-bold ms-2 font-mono text-blue-600 dark:text-blue-400">
                GoalFit
              </h1>
            </div>
          </Link>
        </div>
        <div className="flex items-center justify-between w-full p-4 bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
          <button
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            onClick={handlePrev}
            disabled={step === 1}
          >
            <ArrowBackIos fontSize="small" />
            <span className="ml-1">Retour</span>
          </button>
          <div className="flex items-center">
            <span className="text-gray-500 dark:text-gray-300 text-xs mr-2">
              <a href="#" className="underline dark:text-blue-400">
                Besoin d'aide ?
              </a>
            </span>
            <Avatar
              alt="Cindy Baker"
              src="https://avatar.iran.liara.run/public/87"
              className="w-8 h-8"
            />
          </div>
        </div>
        <div className="w-full max-w-lg my-auto md:px-0 px-4 dark:bg-gray-900">
          <FormProvider {...methods}>
            <form onSubmit={e => {
              if (step !== 7) {
                e.preventDefault();
                return;
              }
              handleSubmit(onSubmit)(e);
            }}>
              <FormStep
                step={step}
                setValidationTrigger={setValidationTrigger}
                setClearErrorsTrigger={setClearErrorsTrigger}
              />
              {step === 7 ? (
                <button
                  type="submit"
                  className="mt-4 mx-6 md:mx-auto p-3 w-full bg-blue-600 text-white dark:bg-blue-500 dark:hover:bg-blue-400 rounded-md mb-6"
                >
                  Soumettre
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="mt-4 mx-6 md:mx-auto p-3 w-full bg-blue-600 text-white dark:bg-blue-500 dark:hover:bg-blue-400 rounded-md mb-6"
                >
                  Suivant
                </button>
              )}
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  )
}
