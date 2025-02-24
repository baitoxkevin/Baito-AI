import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { Toaster } from 'sonner';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
