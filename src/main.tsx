import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { useToast } from './hooks/use-toast';
import './index.css';

function Root() {
  const { ToastContainer } = useToast();
  
  return (
    <React.StrictMode>
      <BrowserRouter>
        <App />
        <ToastContainer />
      </BrowserRouter>
    </React.StrictMode>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');

ReactDOM.createRoot(rootElement).render(<Root />);
