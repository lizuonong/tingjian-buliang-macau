import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { A11yProvider } from './context/A11yContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <A11yProvider>
      <App />
    </A11yProvider>
  </React.StrictMode>,
);
