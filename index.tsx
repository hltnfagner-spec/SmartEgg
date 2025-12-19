
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { FarmProvider } from './context/FarmContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// StrictMode removido para evitar dupla montagem que causa race condition no Chrome/Edge
// Em desenvolvimento, você pode reativar para detectar problemas
root.render(
  <FarmProvider>
    <App />
  </FarmProvider>
);
