import { useEffect } from 'react';
import { useTheme } from 'next-themes';

interface PublicPageWrapperProps {
  children: React.ReactNode;
}

export const PublicPageWrapper: React.FC<PublicPageWrapperProps> = ({ children }) => {
  const { setTheme, systemTheme } = useTheme();

  useEffect(() => {
    // Store the current theme preference
    const previousTheme = localStorage.getItem('theme') || systemTheme || 'light';
    
    // Force light mode
    setTheme('light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    
    // Cleanup function to restore previous theme when component unmounts
    return () => {
      // Only restore if user navigates away from public page
      const currentPath = window.location.pathname;
      const isPublicPage = currentPath.includes('candidate-update') || 
                          currentPath.includes('candidate-form') ||
                          currentPath.includes('candidate/');
      
      if (!isPublicPage) {
        setTheme(previousTheme);
      }
    };
  }, [setTheme, systemTheme]);

  return <>{children}</>;
};