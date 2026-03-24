import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Recover from stale chunk references after a new deployment.
// Vite dispatches `vite:preloadError` when a dynamic import chunk is missing.
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    const key = 'mediroutex_preload_reload_done';
    const alreadyReloaded = sessionStorage.getItem(key) === '1';

    if (!alreadyReloaded) {
      sessionStorage.setItem(key, '1');
      window.location.reload();
    }
  });

  // Clear flag after successful boot path
  sessionStorage.removeItem('mediroutex_preload_reload_done');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
