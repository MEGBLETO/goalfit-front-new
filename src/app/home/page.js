"use client";
import { useState, useEffect } from 'react'
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

dayjs.extend(isToday)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title)

const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState({})
  const [currentMealData, setCurrentMealData] = useState(null)
  const [currentWorkoutData, setCurrentWorkoutData] = useState(null)
  const [currentMealImage, setCurrentMealImage] = useState(null)
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

    try {
      const response = await fetch('http://localhost:5001/bdd/meal/' + id, {
        method: 'GET',
        headers: getAuthHeaders(token),
      })

      console.log(response, "hello")
      if (!response.ok) {
        throw new Error('Failed to fetch meal plans')
      }
      const data = await response.json()
      setCurrentMealData(data)
      if (data) {
        fetchMealImage(data.afternoonMeal.name.split(' ').slice(0, 3).join(' '))
      }

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

  const fetchMealImage = async (foodname) => {
    try {
      const response = await fetch(
        `${UNSPLASH_API_URL}?query=${encodeURIComponent(foodname)}&client_id=${process.env.UNSPLASH_API_KEY}&lang=fr`
      )
      const data = await response.json()
      if (data.results && data.results.length > 0) {
        const imageUrl = data.results[0].urls.regular
        setCurrentMealImage(imageUrl)
      }
    } catch (error) {
      console.error('Error fetching image:', error)
    }
  }

  const fetchWorkoutPlans = async (id) => {
    const token = getToken()
    if (!token) {
      console.error('No token found, please login.')
      return
    }
    try {
      const response = await fetch('http://localhost:5001/bdd/workout/' + id, {
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
      <div className="w-full">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl shadow-md bg-white flex flex-col lg:flex-row items-center justify-between px-10 py-4 my-8 md:py-6 xl:py-8 dark:bg-gray-800">
            <div className="w-full">
              <h2 className="font-manrope text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 text-center lg:text-left dark:text-gray-400">
                Consommation du jour
              </h2>
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
