import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { User, AuthContextType } from '../types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('app_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData: User) => {
    const fullUser = {
        ...userData,
        jobStatus: userData.jobStatus || 'Searching',
        resumeStrength: userData.resumeStrength || 0
    };
    setUser(fullUser);
    localStorage.setItem('app_user', JSON.stringify(fullUser));
  };

  // Fix: Added optional userUpdate parameter to match AuthContextType interface definition
  const logout = (userUpdate?: Partial<User>) => {
    setUser(null);
    localStorage.removeItem('app_user');
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
        const updated = { ...user, ...data };
        setUser(updated);
        localStorage.setItem('app_user', JSON.stringify(updated));
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};