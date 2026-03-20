import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useNavigationWithDelay = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const navigateWithDelay = useCallback((path: string, delay: number = 2500) => {
    setIsLoading(true);
    
    setTimeout(() => {
      navigate(path);
      setIsLoading(false);
    }, delay);
  }, [navigate]);

  const redirectWithDelay = useCallback((url: string, delay: number = 2500) => {
    setIsLoading(true);
    
    setTimeout(() => {
      window.location.href = url;
      setIsLoading(false);
    }, delay);
  }, []);

  const reloadWithDelay = useCallback((delay: number = 2500) => {
    setIsLoading(true);
    
    setTimeout(() => {
      window.location.reload();
    }, delay);
  }, []);

  return {
    isLoading,
    navigateWithDelay,
    redirectWithDelay,
    reloadWithDelay,
    setIsLoading
  };
};
