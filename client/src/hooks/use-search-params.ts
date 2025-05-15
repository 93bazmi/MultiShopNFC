import { useLocation } from "wouter";

export function useSearchParams() {
  const [location] = useLocation();
  
  const getParam = (key: string): string | null => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(key);
  };
  
  const getAllParams = (): Record<string, string> => {
    const searchParams = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};
    
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  };
  
  return { getParam, getAllParams };
}