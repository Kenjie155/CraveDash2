import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Apply the saved (or system) theme before first paint.
let saved: string | null = null;
try { saved = localStorage.getItem('cravedash-admin-theme'); } catch { /* storage unavailable */ }
document.documentElement.dataset.theme =
  saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
