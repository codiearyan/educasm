'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { UserContext } from '@/types';

interface UserContextType {
  userContext: UserContext | null;
  setUserContext: (context: UserContext | null) => void;
}

const UserContextProvider = createContext<UserContextType>({
  userContext: null,
  setUserContext: () => {},
});

export const useUserContext = () => {
  return useContext(UserContextProvider);
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage only on client side
  useEffect(() => {
    const saved = localStorage.getItem('userContext');
    if (saved) {
      setUserContext(JSON.parse(saved));
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever userContext changes
  useEffect(() => {
    if (userContext) {
      localStorage.setItem('userContext', JSON.stringify(userContext));
    }
  }, [userContext]);

  // Show nothing until client-side initialization is complete
  if (!isInitialized) {
    return null;
  }

  return (
    <UserContextProvider.Provider value={{ userContext, setUserContext }}>
      {children}
    </UserContextProvider.Provider>
  );
}; 