import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent third-party browser extension errors (e.g. MetaMask inpage.js) from
// triggering unhandled error overlays in this medical simulation app.
function isExternalExtensionError(source?: string, message?: string): boolean {
  const src = String(source || '');
  const msg = String(message || '');
  return (
    src.startsWith('chrome-extension://') ||
    src.startsWith('moz-extension://') ||
    /Failed to connect to MetaMask/i.test(msg)
  );
}

window.addEventListener('error', (event) => {
  if (isExternalExtensionError(event.filename, event.message)) {
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason as { message?: string; stack?: string } | string | undefined;
  const msg = typeof reason === 'string' ? reason : reason?.message;
  const stack = typeof reason === 'object' && reason ? reason.stack : undefined;
  if (isExternalExtensionError(stack, msg) || (stack && /chrome-extension:\/\//i.test(stack))) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(<App />);

