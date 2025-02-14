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

  useEffect(() => {
    // In a real app, you might want to load this from localStorage or a backend
    // For now, we'll just set a default value
    if (!userContext) {
      setUserContext({ age: 25 });
    }
  }, [userContext]);

  return (
    <UserContextProvider.Provider value={{ userContext, setUserContext }}>
      {children}
    </UserContextProvider.Provider>
  );
}; 