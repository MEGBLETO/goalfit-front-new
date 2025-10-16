"use client";
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'
import { HiChartPie, HiViewBoards, HiFire, HiUser } from 'react-icons/hi'
import { HiCurrencyDollar } from 'react-icons/hi'
import Link from 'next/link'
import dayjs from 'dayjs'
import { getToken, getUserId, getAuthHeaders } from '../../utils/jwtUtils'
import { Button } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import {
  MdAccessTimeFilled,
  MdLocalFireDepartment,
  MdLock,
  MdDownload, MdDateRange
} from 'react-icons/md'
import { FaPlay } from 'react-icons/fa6'
import Skeleton from '@mui/material/Skeleton'
import Modal from '@mui/material/Modal'
import TextField from '@mui/material/TextField'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
var isToday = require('dayjs/plugin/isToday')
import { GiMuscleUp, GiWheat, GiButter, GiFire } from 'react-icons/gi'
import { Tabs } from 'flowbite-react'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/fr'

dayjs.extend(isToday)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title)

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState({})
  const [currentMealData, setCurrentMealData] = useState(null)
  const [currentWorkoutData, setCurrentWorkoutData] = useState(null)
  const [totalCalories, setTotalCalories] = useState(0)
  const [totalFat, setTotalFat] = useState(0)
  const [totalProtein, setTotalProtein] = useState(0)
  const [totalCarbo, setTotalCarbo] = useState(0)
  const [weightEntries, setWeightEntries] = useState([])
  const [showWeightPrompt, setShowWeightPrompt] = useState(false)
  const [newWeight, setNewWeight] = useState('')
  const [submittingWeight, setSubmittingWeight] = useState(false)
  const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [monthlyData, setMonthlyData] = useState({ labels: [], calories: [], protein: [], carbs: [], fat: [] })
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [downloadStartDate, setDownloadStartDate] = useState(dayjs().subtract(30, 'day'))
  const [downloadEndDate, setDownloadEndDate] = useState(dayjs())
  const [isDownloading, setIsDownloading] = useState(false)

  const fetchUserData = async () => {
    const token = getToken()
    if (!token) {
      console.error('No token found, please login.')
      return
    }

    try {
      const userId = getUserId(token)
      if (!userId) {
        throw new Error('Invalid token or no userId found')
      }

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
      setUser(data)

      if (data && data.mealPlans) {
        const mealForDate = data.mealPlans.find((meal) =>
          dayjs(meal.day).isToday(dayjs())
        )
        setCurrentMealData(mealForDate || null)
        if (mealForDate) {
          fetchMealPlans(mealForDate.afternoonMealId)
        }
      }

      if (data && data.workoutPlans) {
        const workoutForDate = data.workoutPlans.find((workout) =>
          dayjs(workout.day).isToday(dayjs())
        )
        if (workoutForDate) {
          fetchWorkoutPlans(workoutForDate.id)
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchMealPlans = async (id) => {
    const token = getToken()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    try {
      const response = await fetch(`${baseUrl}/bdd/meal/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      })
      if (!response.ok) {
        throw new Error('Failed to fetch meal plans')
      }
      const data = await response.json()
      setCurrentMealData(data)
      const calories =
        data.morningMeal.nutrition.calories +
        data.afternoonMeal.nutrition.calories +
        data.eveningMeal.nutrition.calories
      setTotalCalories(calories)
      const fat =
        parseInt(data.morningMeal.nutrition.fat) +
        parseInt(data.afternoonMeal.nutrition.fat) +
        parseInt(data.eveningMeal.nutrition.fat)
      setTotalFat(fat)
      const protein =
        parseInt(data.morningMeal.nutrition.protein) +
        parseInt(data.afternoonMeal.nutrition.protein) +
        parseInt(data.eveningMeal.nutrition.protein)
      setTotalProtein(protein)
      const carbohydrates =
        parseInt(data.morningMeal.nutrition.carbohydrates) +
        parseInt(data.afternoonMeal.nutrition.carbohydrates) +
        parseInt(data.eveningMeal.nutrition.carbohydrates)
      setTotalCarbo(carbohydrates)
    } catch (error) {
      console.error('Error fetching meal plans:', error)
    }
  }

  const fetchWorkoutPlans = async (id) => {
    const token = getToken()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    if (!token) {
      console.error('No token found, please login.')
      return
    }
    try {
      const response = await fetch(`${baseUrl}/bdd/workout/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      })
      if (!response.ok) {
        throw new Error('Failed to fetch workout plans')
      }
      const data = await response.json()
      setCurrentWorkoutData(data.workouts[0])
    } catch (error) {
      console.error('Error fetching workout plans:', error)
    }
  }

  const fetchWeightEntries = async () => {
    const token = getToken()
    if (!token) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/user/weight`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      })
      if (!response.ok) throw new Error('Failed to fetch weight entries')
      const data = await response.json()
      setWeightEntries(data)
    } catch (err) {
      console.error('Error fetching weight entries:', err)
    }
  }

  const fetchDailyConsumption = async () => {
    const token = getToken()
    const today = new Date().toISOString().split('T')[0]
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/bdd/meal/log?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch daily meal logs')
      const logs = await res.json()
      const totals = logs.reduce((acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (log.protein || 0),
        carbs: acc.carbs + (log.carbs || 0),
        fat: acc.fat + (log.fat || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
      setDailyTotals(totals)
    } catch (err) {
      setDailyTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 })
    }
  }

  const fetchMonthlyConsumption = async () => {
    const token = getToken();
    const start = new Date();
    start.setDate(1);
    const startStr = start.toISOString().split('T')[0];
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const endStr = end.toISOString().split('T')[0];
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/bdd/meal/log/range?start=${startStr}&end=${endStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch monthly meal logs');
      const logs = await res.json();
      // Aggregate by day
      const daily = {};
      logs.forEach(log => {
        const day = new Date(log.date).toLocaleDateString('fr-FR');
        if (!daily[day]) daily[day] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        daily[day].calories += log.calories;
        daily[day].protein += log.protein;
        daily[day].carbs += log.carbs;
        daily[day].fat += log.fat;
      });
      const labels = Object.keys(daily);
      setMonthlyData({
        labels,
        calories: labels.map(day => daily[day].calories),
        protein: labels.map(day => daily[day].protein),
        carbs: labels.map(day => daily[day].carbs),
        fat: labels.map(day => daily[day].fat),
      });
    } catch (err) {
      setMonthlyData({ labels: [], calories: [], protein: [], carbs: [], fat: [] });
    }
  };

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchWeightEntries()
    }
  }, [user?.id])

  useEffect(() => {
    if (weightEntries.length > 0) {
      const now = dayjs()
      const startOfWeek = now.startOf('week') // Sunday as start
      const hasEntryThisWeek = weightEntries.some(entry => {
        const entryDate = dayjs(entry.date)
        return entryDate.isSameOrAfter(startOfWeek, 'day') && entryDate.isSameOrBefore(now, 'day')
      })
      setShowWeightPrompt(!hasEntryThisWeek)
    } else if (user?.id) {
      setShowWeightPrompt(true)
    }
  }, [weightEntries, user?.id])

  useEffect(() => {
    fetchDailyConsumption()
  }, [])

  useEffect(() => {
    fetchMonthlyConsumption()
  }, [])

  const handleWeightSubmit = async (e) => {
    e.preventDefault()
    setSubmittingWeight(true)
    const token = getToken()
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/user/weight`, {
        method: 'POST',
        headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: parseFloat(newWeight) }),
      })
      if (!response.ok) throw new Error('Failed to submit weight entry')
      setNewWeight('')
      setShowWeightPrompt(false)
      fetchWeightEntries()
    } catch (err) {
      alert('Erreur lors de la soumission du poids')
    } finally {
      setSubmittingWeight(false)
    }
  }

  const gradient = (ctx) => {
    if (!ctx?.chart?.ctx) return

    const gradientStroke = ctx.chart.ctx.createLinearGradient(0, 230, 0, 50)
    gradientStroke.addColorStop(1, 'rgba(255, 255, 255, 0.8)')
    gradientStroke.addColorStop(0.2, 'rgba(255, 255, 255, 0.5)')
    gradientStroke.addColorStop(0, 'rgba(255, 255, 255, 0)')

    return gradientStroke
  }

  function logisticGrowth(
    currentWeight,
    targetWeight,
    months,
    k = 1,
    midpoint = 3
  ) {
    const weightData = []
    for (let t = 0; t < months; t++) {
      const progress =
        currentWeight +
        (targetWeight - currentWeight) / (1 + Math.exp(-k * (t - midpoint)))
      weightData.push(progress)
    }
    return weightData
  }

  // Find the latest weight entry (if any)
  let latestWeight = null;
  if (weightEntries.length > 0) {
    latestWeight = [...weightEntries].sort((a, b) => new Date(b.date) - new Date(a.date))[0].weight;
  }
  const currentWeight = latestWeight !== null ? latestWeight : (user?.profile?.weight || 0);
  const targetWeight = user?.profile?.objectiveWeight || 0;
  const progressMonths = 6;

  const predictedWeights = logisticGrowth(
    currentWeight,
    targetWeight,
    progressMonths,
    1.2,
    progressMonths / 2
  );

  // Prepare weight data for the graph
  const latestPerDay = {};
  weightEntries.forEach(entry => {
    const day = new Date(entry.date).toLocaleDateString('fr-FR');
    if (!latestPerDay[day] || new Date(entry.date) > new Date(latestPerDay[day].date)) {
      latestPerDay[day] = entry;
    }
  });
  const sortedLatest = Object.values(latestPerDay).sort((a, b) => new Date(a.date) - new Date(b.date));
  const weightLabels = sortedLatest.map(entry => new Date(entry.date).toLocaleDateString('fr-FR'));
  const weightData = sortedLatest.map(entry => entry.weight);

  const data = {
    labels: weightLabels.length > 0 ? weightLabels : ['Poids'],
    datasets: [
      {
        label: 'Poids (kg)',
        data: weightData.length > 0 ? weightData : [currentWeight],
        borderColor: '#1c64f2',
        backgroundColor: 'rgba(28, 100, 242, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#1c64f2',
        pointBorderColor: '#fff',
      },
      {
        label: 'Actuel',
        data: [currentWeight],
        borderColor: 'green',
        backgroundColor: 'green',
        pointRadius: 8,
        type: 'line',
        showLine: false,
        order: 2,
      },
      {
        label: 'Objectif',
        data: [targetWeight],
        borderColor: 'orange',
        backgroundColor: 'orange',
        pointRadius: 8,
        type: 'line',
        showLine: false,
        order: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        grid: {
          drawBorder: false,
          display: true,
          borderDash: [5, 5],
        },
        ticks: {
          display: true,
          color: '#fbfbfb',
          padding: 10,
          font: {
            size: 10,
          },
        },
      },
      x: {
        grid: {
          drawBorder: false,
          display: false,
          borderDash: [5, 5],
        },
        ticks: {
          display: true,
          color: '#fbfbfb',
          padding: 20,
          font: {
            size: 10,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
  }

  const exportToCSV = (data, filename) => {
    const csvContent = "data:text/csv;charset=utf-8," + data
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDataForCSV = (weightData, nutritionData) => {
    let csvContent = "Date,Poids (kg),Calories,Protéines (g),Glucides (g),Lipides (g)\n"
    
    // Create a map of dates to combine weight and nutrition data
    const dateMap = new Map()
    
    // Add weight data
    weightData.forEach(entry => {
      const date = dayjs(entry.date).format('YYYY-MM-DD')
      dateMap.set(date, {
        date: date,
        weight: entry.weight,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      })
    })
    
    // Add nutrition data
    nutritionData.forEach(entry => {
      const date = dayjs(entry.date).format('YYYY-MM-DD')
      if (dateMap.has(date)) {
        const existing = dateMap.get(date)
        existing.calories += entry.calories || 0
        existing.protein += entry.protein || 0
        existing.carbs += entry.carbs || 0
        existing.fat += entry.fat || 0
      } else {
        dateMap.set(date, {
          date: date,
          weight: '',
          calories: entry.calories || 0,
          protein: entry.protein || 0,
          carbs: entry.carbs || 0,
          fat: entry.fat || 0
        })
      }
    })
    
    // Convert to CSV format
    const sortedDates = Array.from(dateMap.values()).sort((a, b) => 
      dayjs(a.date).diff(dayjs(b.date))
    )
    
    sortedDates.forEach(entry => {
      csvContent += `${entry.date},${entry.weight},${entry.calories},${entry.protein},${entry.carbs},${entry.fat}\n`
    })
    
    return csvContent
  }

  const handleDownloadData = async () => {
    setIsDownloading(true)
    try {
      const token = getToken()
      if (!token) {
        alert('Veuillez vous connecter pour télécharger vos données')
        return
      }

      // Fetch weight data for the selected period
      const weightResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/user/weight?start=${downloadStartDate.format('YYYY-MM-DD')}&end=${downloadEndDate.format('YYYY-MM-DD')}`,
        {
          headers: getAuthHeaders(token)
        }
      )
      
      const weightData = weightResponse.ok ? await weightResponse.json() : []

      // Fetch nutrition data for the selected period
      const nutritionResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/bdd/meal/log/range?start=${downloadStartDate.format('YYYY-MM-DD')}&end=${downloadEndDate.format('YYYY-MM-DD')}`,
        {
          headers: getAuthHeaders(token)
        }
      )
      
      const nutritionData = nutritionResponse.ok ? await nutritionResponse.json() : []

      // Format and download the data
      const csvContent = formatDataForCSV(weightData, nutritionData)
      const filename = `goalFit-data-${downloadStartDate.format('YYYY-MM-DD')}-to-${downloadEndDate.format('YYYY-MM-DD')}.csv`
      
      exportToCSV(csvContent, filename)
      
      setShowDownloadModal(false)
      alert('Données téléchargées avec succès!')
      
    } catch (error) {
      console.error('Error downloading data:', error)
      alert('Erreur lors du téléchargement des données')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-fit">
      <Modal open={showWeightPrompt} onClose={() => setShowWeightPrompt(false)}>
        <form onSubmit={handleWeightSubmit} className="flex flex-col items-center justify-center h-full">
          <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Entrez votre poids de la semaine</h2>
            <TextField
              type="number"
              label="Poids (kg)"
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              required
              inputProps={{ min: 30, max: 200, step: 0.1 }}
              className="mb-4"
            />
            <Button type="submit" disabled={submittingWeight || !newWeight} color="primary">
              {submittingWeight ? 'Envoi...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal open={showDownloadModal} onClose={() => setShowDownloadModal(false)}>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-lg w-full mx-4 border border-gray-200 dark:border-gray-700">
            {/* Header with gradient background */}
            <div className="w-full mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full">
                  <MdDownload className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                Télécharger mes données
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                Exportez vos données de poids et nutrition au format CSV
              </p>
            </div>
            
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
              <div className="w-full space-y-6 mb-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Date de début
                  </label>
                  <div className="relative">
                    <DatePicker
                      value={downloadStartDate}
                      onChange={(newValue) => setDownloadStartDate(newValue)}
                      className="w-full"
                      slotProps={{
                        textField: {
                          size: 'medium',
                          fullWidth: true,
                          variant: 'outlined',
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              backgroundColor: 'transparent',
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#3b82f6',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#3b82f6',
                                borderWidth: '2px',
                              },
                            },
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Date de fin
                  </label>
                  <div className="relative">
                    <DatePicker
                      value={downloadEndDate}
                      onChange={(newValue) => setDownloadEndDate(newValue)}
                      className="w-full"
                      slotProps={{
                        textField: {
                          size: 'medium',
                          fullWidth: true,
                          variant: 'outlined',
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              backgroundColor: 'transparent',
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#3b82f6',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#3b82f6',
                                borderWidth: '2px',
                              },
                            },
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </LocalizationProvider>
            
            {/* Action buttons with better styling */}
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                Annuler
              </button>
              <button
                onClick={handleDownloadData}
                disabled={isDownloading || !downloadStartDate || !downloadEndDate}
                className="group relative flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out disabled:transform-none disabled:shadow-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-200"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isDownloading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Téléchargement...
                    </>
                  ) : (
                    <>
                      <MdDownload className="h-4 w-4" />
                      Télécharger
                    </>
                  )}
                </span>
              </button>
            </div>
            
            {/* Info text with better styling */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-500 rounded-full">
                  <MdDateRange className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                    Informations sur l'export
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    Les données incluront vos poids journaliers et votre consommation nutritionnelle (calories, protéines, glucides, lipides) pour la période sélectionnée.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      <div className="w-full">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl shadow-md bg-white flex flex-col lg:flex-row items-center justify-between px-10 py-4 my-8 md:py-6 xl:py-8 dark:bg-gray-800">
            <div className="w-full">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                <h2 className="font-manrope text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-400 mb-4 lg:mb-0">
                  Consommation du jour
                </h2>
                
                <button
                  onClick={() => setShowDownloadModal(true)}
                  className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-200"></div>
                  <MdDownload className="h-5 w-5 relative z-10" />
                  <span className="relative z-10">Exporter mes données</span>
                  <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 shadow">
                  <GiMuscleUp className="text-blue-600 dark:text-blue-300 text-3xl mb-2" />
                  <div className="text-blue-700 dark:text-blue-200 font-bold text-2xl">{dailyTotals.protein}g</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">Protéines</div>
                </div>
                <div className="flex flex-col items-center bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 shadow">
                  <GiWheat className="text-yellow-600 dark:text-yellow-300 text-3xl mb-2" />
                  <div className="text-yellow-700 dark:text-yellow-200 font-bold text-2xl">{dailyTotals.carbs}g</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">Glucides</div>
                </div>
                <div className="flex flex-col items-center bg-pink-50 dark:bg-pink-900/20 rounded-xl p-4 shadow">
                  <GiButter className="text-pink-600 dark:text-pink-300 text-3xl mb-2" />
                  <div className="text-pink-700 dark:text-pink-200 font-bold text-2xl">{dailyTotals.fat}g</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">Lipides</div>
                </div>
                <div className="flex flex-col items-center bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 shadow border-2 border-orange-400 dark:border-orange-300">
                  <GiFire className="text-orange-600 dark:text-orange-300 text-3xl mb-2" />
                  <div className="text-orange-700 dark:text-orange-200 font-extrabold text-3xl">{dailyTotals.calories}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">Total de Calories</div>
                </div>
              </div>
            </div>
          </div>
          <Tabs aria-label="Suivi santé" variant="underline">
            <Tabs.Item title="Poids">
              <div className="w-full mt-0 relative">
                <div className="relative flex flex-col min-w-0 break-words bg-blue-600 text-white dark:bg-slate-850 border-0 bg-clip-border z-20 rounded-2xl">
                  <div className="p-6 pt-4 pb-0 border-b-0 rounded-t-2xl mb-0 border-black/12.5">
                    <h5 className="font-semibold text-lg">Objectif de poids</h5>
                    <div className="p-4 flex justify-between items-center max-w-md">
                      <div className="text-center">
                        {user ? (
                          <>
                            <div className="text-lg font-bold">
                              {currentWeight} <span className="text-sm">kg</span>
                            </div>
                            <div className="text-sm">Actuel</div>
                          </>
                        ) : (
                          <Skeleton variant="rectangular" width={80} height={40} />
                        )}
                      </div>
                      <div className="text-center">
                        {user ? (
                          <>
                            <div className="text-lg font-bold">
                              {targetWeight} <span className="text-sm">kg</span>
                            </div>
                            <div className="text-sm">Objectif</div>
                          </>
                        ) : (
                          <Skeleton variant="rectangular" width={80} height={40} />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-auto p-4">
                    {user ? (
                      <div>
                        <Line options={options} data={data} height="300" />
                      </div>
                    ) : (
                      <Skeleton variant="rectangular" width="100%" height={300} />
                    )}
                  </div>
                </div>
                {user?.subscription?.status !== 'ACTIVE' && (
                  <div className="absolute top-0 left-0 w-full h-full bg-white bg-opacity-20 backdrop-blur-md flex justify-center items-center rounded-2xl z-30">
                    <Button href="/subscription">
                      <MdLock className="mr-2 h-5 w-5" />
                      VIP
                    </Button>
                  </div>
                )}
              </div>
            </Tabs.Item>
            <Tabs.Item title="Nutrition">
              <div className="w-full mt-0 relative">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-md h-full flex flex-col">
                  <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Suivi mensuel de la consommation</h2>
                  <div className="flex-1">
                    <Line
                      data={{
                        labels: monthlyData.labels,
                        datasets: [
                          {
                            label: 'Calories',
                            data: monthlyData.calories,
                            borderColor: '#fb923c',
                            backgroundColor: 'rgba(251, 146, 60, 0.2)',
                            yAxisID: 'y',
                          },
                          {
                            label: 'Protéines (g)',
                            data: monthlyData.protein,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            yAxisID: 'y1',
                          },
                          {
                            label: 'Glucides (g)',
                            data: monthlyData.carbs,
                            borderColor: '#facc15',
                            backgroundColor: 'rgba(250, 204, 21, 0.2)',
                            yAxisID: 'y1',
                          },
                          {
                            label: 'Lipides (g)',
                            data: monthlyData.fat,
                            borderColor: '#f472b6',
                            backgroundColor: 'rgba(244, 114, 182, 0.2)',
                            yAxisID: 'y1',
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'top' },
                          title: { display: false },
                        },
                        scales: {
                          y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: { display: true, text: 'Calories' },
                          },
                          y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: { drawOnChartArea: false },
                            title: { display: true, text: 'g (macros)' },
                          },
                        },
                      }}
                      height={350}
                    />
                  </div>
                </div>
                {user?.subscription?.status !== 'ACTIVE' && (
                  <div className="absolute top-0 left-0 w-full h-full bg-white bg-opacity-20 backdrop-blur-md flex justify-center items-center rounded-2xl z-30">
                    <Button href="/subscription">
                      <MdLock className="mr-2 h-5 w-5" />
                      VIP
                    </Button>
                  </div>
                )}
              </div>
            </Tabs.Item>
          </Tabs>
        </div>
      </div>

    </div>
  )
}
