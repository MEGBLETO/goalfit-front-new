'use client'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Chip, 
  Box,
  Divider,
  Grid
} from '@mui/material'
import { Edit as EditIcon } from '@mui/icons-material'
import { useEffect } from 'react'

export default function ReviewStep({ setValidationTrigger, setClearErrorsTrigger }) {
  const { watch, setValue } = useFormContext()
  const [editingSection, setEditingSection] = useState(null)
  
  const formData = watch()
  
  useEffect(() => {
    setValidationTrigger(() => async () => true) 
    setClearErrorsTrigger(() => () => {})
  }, [setValidationTrigger, setClearErrorsTrigger])

  const handleEdit = (section) => {
    setEditingSection(section)
  }

  const handleSave = (section) => {
    setEditingSection(null)
  }

  const renderEditableField = (label, value, fieldName, type = 'text') => {
    const isEditing = editingSection === fieldName
    
    return (
      <Box className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-2">
        <div className="flex-1">
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mb-1">
            {label}
          </Typography>
          {isEditing ? (
            <input
              type={type}
              value={value || ''}
              onChange={(e) => setValue(fieldName, e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              autoFocus
            />
          ) : (
            <Typography variant="body1" className="font-medium text-gray-900 dark:text-gray-100">
              {value || 'Non spécifié'}
            </Typography>
          )}
        </div>
        <IconButton
          onClick={() => isEditing ? handleSave(fieldName) : handleEdit(fieldName)}
          className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          <EditIcon />
        </IconButton>
      </Box>
    )
  }

  const renderChipList = (label, items, fieldName) => {
    const isEditing = editingSection === fieldName
    
    return (
      <Box className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-2">
        <div className="flex items-center justify-between mb-2">
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
            {label}
          </Typography>
          <IconButton
            onClick={() => isEditing ? handleSave(fieldName) : handleEdit(fieldName)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <EditIcon />
          </IconButton>
        </div>
        {isEditing ? (
          <div className="space-y-2">
            {['Vegan', 'Végétarien', 'Pescétarien', 'Sans gluten', 'Sans produits laitiers'].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={items?.includes(option) || false}
                  onChange={(e) => {
                    const newItems = e.target.checked 
                      ? [...(items || []), option]
                      : (items || []).filter(item => item !== option)
                    setValue(fieldName, newItems)
                  }}
                  className="mr-2"
                />
                <span className="text-gray-900 dark:text-gray-100">{option}</span>
              </label>
            ))}
          </div>
        ) : (
          <Box className="flex flex-wrap gap-1">
            {items && items.length > 0 ? (
              items.map((item, index) => (
                <Chip
                  key={index}
                  label={item}
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  size="small"
                />
              ))
            ) : (
              <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                Aucune restriction sélectionnée
              </Typography>
            )}
          </Box>
        )}
      </Box>
    )
  }

  const renderEquipmentList = (label, items, fieldName) => {
    const isEditing = editingSection === fieldName
    const equipmentOptions = ['barre', 'haltères', 'corde à sauter', 'tapis de course']
    
    return (
      <Box className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-2">
        <div className="flex items-center justify-between mb-2">
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
            {label}
          </Typography>
          <IconButton
            onClick={() => isEditing ? handleSave(fieldName) : handleEdit(fieldName)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <EditIcon />
          </IconButton>
        </div>
        {isEditing ? (
          <div className="space-y-2">
            {equipmentOptions.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={items?.includes(option) || false}
                  onChange={(e) => {
                    const newItems = e.target.checked 
                      ? [...(items || []), option]
                      : (items || []).filter(item => item !== option)
                    setValue(fieldName, newItems)
                  }}
                  className="mr-2"
                />
                <span className="text-gray-900 dark:text-gray-100">{option}</span>
              </label>
            ))}
          </div>
        ) : (
          <Box className="flex flex-wrap gap-1">
            {items && items.length > 0 ? (
              items.map((item, index) => (
                <Chip
                  key={index}
                  label={item}
                  className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                  size="small"
                />
              ))
            ) : (
              <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                Aucun équipement sélectionné
              </Typography>
            )}
          </Box>
        )}
      </Box>
    )
  }

  const renderHealthConsiderations = (label, items, fieldName) => {
    const isEditing = editingSection === fieldName
    const healthOptions = [
      'Inconfort au genou',
      'Douleurs lombaires',
      'Problèmes d\'épaule',
      'Hypertension',
      'Problèmes de dos'
    ]
    
    return (
      <Box className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-2">
        <div className="flex items-center justify-between mb-2">
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
            {label}
          </Typography>
          <IconButton
            onClick={() => isEditing ? handleSave(fieldName) : handleEdit(fieldName)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <EditIcon />
          </IconButton>
        </div>
        {isEditing ? (
          <div className="space-y-2">
            {healthOptions.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={items?.includes(option) || false}
                  onChange={(e) => {
                    const newItems = e.target.checked 
                      ? [...(items || []), option]
                      : (items || []).filter(item => item !== option)
                    setValue(fieldName, newItems)
                  }}
                  className="mr-2"
                />
                <span className="text-gray-900 dark:text-gray-100">{option}</span>
              </label>
            ))}
          </div>
        ) : (
          <Box className="flex flex-wrap gap-1">
            {items && items.length > 0 ? (
              items.map((item, index) => (
                <Chip
                  key={index}
                  label={item}
                  className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200"
                  size="small"
                />
              ))
            ) : (
              <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                Aucune considération de santé
              </Typography>
            )}
          </Box>
        )}
      </Box>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Récapitulatif de vos informations
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Vérifiez et modifiez vos informations avant de continuer
        </p>
      </div>

      <Grid container spacing={4}>
        {/* Personal Information */}
        <Grid item xs={12} md={6}>
          <Card className="h-full bg-white dark:bg-gray-800 shadow-lg">
            <CardContent>
              <Typography variant="h6" className="mb-4 text-blue-600 dark:text-blue-400 font-semibold">
                📋 Informations personnelles
              </Typography>
              <Divider className="mb-4" />
              
              {renderEditableField('Genre', formData.gender, 'gender')}
              {renderEditableField('Date de naissance', formData.dateOfBirth, 'dateOfBirth', 'date')}
              {renderEditableField('Niveau de fitness', formData.fitnessLevel, 'fitnessLevel')}
              {renderEditableField('Objectif', formData.selectedObjective, 'selectedObjective')}
            </CardContent>
          </Card>
        </Grid>

        {/* Physical Measurements */}
        <Grid item xs={12} md={6}>
          <Card className="h-full bg-white dark:bg-gray-800 shadow-lg">
            <CardContent>
              <Typography variant="h6" className="mb-4 text-green-600 dark:text-green-400 font-semibold">
                📏 Mesures physiques
              </Typography>
              <Divider className="mb-4" />
              
              {renderEditableField('Poids actuel', formData.weight ? `${formData.weight} kg` : null, 'weight', 'number')}
              {renderEditableField('Poids souhaité', formData.objectiveWeight ? `${formData.objectiveWeight} kg` : null, 'objectiveWeight', 'number')}
              {renderEditableField('Taille', formData.height ? `${formData.height} cm` : null, 'height', 'number')}
            </CardContent>
          </Card>
        </Grid>

        {/* Dietary Preferences */}
        <Grid item xs={12} md={6}>
          <Card className="h-full bg-white dark:bg-gray-800 shadow-lg">
            <CardContent>
              <Typography variant="h6" className="mb-4 text-purple-600 dark:text-purple-400 font-semibold">
                🍽️ Préférences alimentaires
              </Typography>
              <Divider className="mb-4" />
              
              {renderChipList('Restrictions alimentaires', formData.restrictions, 'restrictions')}
            </CardContent>
          </Card>
        </Grid>

        {/* Equipment */}
        <Grid item xs={12} md={6}>
          <Card className="h-full bg-white dark:bg-gray-800 shadow-lg">
            <CardContent>
              <Typography variant="h6" className="mb-4 text-indigo-600 dark:text-indigo-400 font-semibold">
                🏋️ Équipement disponible
              </Typography>
              <Divider className="mb-4" />
              
              {renderEquipmentList('Équipement', formData.equipment, 'equipment')}
            </CardContent>
          </Card>
        </Grid>

        {/* Health Considerations */}
        <Grid item xs={12} md={6}>
          <Card className="h-full bg-white dark:bg-gray-800 shadow-lg">
            <CardContent>
              <Typography variant="h6" className="mb-4 text-orange-600 dark:text-orange-400 font-semibold">
                🏥 Considérations de santé
              </Typography>
              <Divider className="mb-4" />
              
              {renderHealthConsiderations('Considérations de santé', formData.healthConsiderations, 'healthConsiderations')}
            </CardContent>
          </Card>
        </Grid>

        {/* Availability */}
        <Grid item xs={12} md={6}>
          <Card className="h-full bg-white dark:bg-gray-800 shadow-lg">
            <CardContent>
              <Typography variant="h6" className="mb-4 text-teal-600 dark:text-teal-400 font-semibold">
                ⏰ Disponibilité
              </Typography>
              <Divider className="mb-4" />
              
              {renderEditableField('Jours par semaine', formData.daysPerWeek ? `${formData.daysPerWeek} jours` : null, 'daysPerWeek', 'number')}
              {renderEditableField('Minutes par jour', formData.minutesPerDay ? `${formData.minutesPerDay} minutes` : null, 'minutesPerDay', 'number')}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <div className="mt-8 text-center">
        <Typography variant="body2" className="text-gray-500 dark:text-gray-400 mb-4">
          Cliquez sur l'icône ✏️ pour modifier chaque section
        </Typography>
        <button
          onClick={() => {
          }}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
        >
          Voir les données collectées (Console)
        </button>
      </div>
    </div>
  )
}
