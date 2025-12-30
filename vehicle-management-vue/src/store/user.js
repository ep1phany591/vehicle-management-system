import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const token = ref('');
  
  const setUser = (userData) => {
    user.value = userData;
    localStorage.setItem('user', JSON.stringify(userData));
  };
  
  const setToken = (newToken) => {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  };
  
  const logout = () => {
    user.value = null;
    token.value = '';
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };
  
  const loadFromStorage = () => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser) {
      user.value = JSON.parse(savedUser);
    }
    
    if (savedToken) {
      token.value = savedToken;
    }
  };
  
  return {
    user,
    token,
    setUser,
    setToken,
    logout,
    loadFromStorage,
  };
});