import { jwtDecode } from 'jwt-decode';

export const getUserDataFromToken = (token) => {
    if (!token) {
        console.error('No token provided');
        return null;
    }

    try {
        const userData = jwtDecode(token);

        if (!userData.sub) {
            console.error('No subject (sub) in token payload');
            return null;
        }

        return {
            id: userData.sub,
            email: userData.email,
            username: userData.username,
        };
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

export const getToken = () => {
    const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

    if (cookieToken) return cookieToken;

    return localStorage.getItem('token');
};

export const setToken = (token) => {
    if (typeof document !== 'undefined') {
        //cookie that expires in 1 day
        const d = new Date();
        d.setTime(d.getTime() + (1 * 24 * 60 * 60 * 1000));
        let expires = "expires="+d.toUTCString();
        document.cookie = "token=" + token + ";" + expires + ";path=/";
    }
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('token', token);
    }
};

export const getUserId = (token) => {
    const userData = getUserDataFromToken(token);
    return userData ? userData.id : null;
};

export const getAuthHeaders = (token) => {
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

export const getCurrentUser = () => {
    const token = getToken();
    return token ? getUserDataFromToken(token) : null;
};

export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
};