import React, { createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface NavigationContextType {
  navigate: ReturnType<typeof useNavigate>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useAppNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useAppNavigation must be used within NavigationProvider');
  }
  return context.navigate;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  
  return (
    <NavigationContext.Provider value={{ navigate }}>
      {children}
    </NavigationContext.Provider>
  );
};
