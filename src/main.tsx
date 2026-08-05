import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Global fetch interceptor for user custom Gemini API key (Bring Your Own Key)
try {
  const originalFetch = window.fetch;
  const customFetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const userKey = localStorage.getItem('user_gemini_api_key');
    if (userKey && userKey.trim().length > 0) {
      init = init || {};
      const headers = new Headers(init.headers || {});
      if (!headers.has('x-user-gemini-key')) {
        headers.set('x-user-gemini-key', userKey.trim());
      }
      init.headers = headers;
    }
    return originalFetch.call(this, input, init);
  };

  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    writable: true,
    configurable: true,
  });
} catch (err) {
  console.warn('Could not wrap window.fetch:', err);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

