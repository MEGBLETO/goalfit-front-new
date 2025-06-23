import { getToken, getAuthHeaders } from './jwtUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export const apiGet = async (endpoint, token = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API GET Error (${endpoint}):`, error);
    throw error;
  }
};

export const apiPost = async (endpoint, data, token = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API POST Error (${endpoint}):`, error);
    throw error;
  }
};

export const apiPatch = async (endpoint, data, token = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API PATCH Error (${endpoint}):`, error);
    throw error;
  }
};

export const apiDelete = async (endpoint, token = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API DELETE Error (${endpoint}):`, error);
    throw error;
  }
};

// User-specific API functions
export const getUserProfile = async (token = null) => {
  return apiGet('/user/profile', token);
};

export const getUserById = async (userId, token = null) => {
  return apiGet(`/user/${userId}`, token);
};

export const updateUser = async (userId, data, token = null) => {
  return apiPatch(`/user/${userId}`, data, token);
};

export const updateFirstLogin = async (userId, token = null) => {
  return apiPatch(`/user/${userId}/first-login`, {}, token);
};

// Auth-specific API functions
export const loginUser = async (credentials) => {
  return apiPost('/auth/login', credentials);
};

export const registerUser = async (userData) => {
  return apiPost('/auth/register', userData);
}; 