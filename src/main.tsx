import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DemoProvider } from './contexts/DemoContext';
import { GlobalAssistantProvider } from './contexts/GlobalAssistantContext';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <DemoProvider>
        <AuthProvider>
          <GlobalAssistantProvider>
            <App />
          </GlobalAssistantProvider>
        </AuthProvider>
      </DemoProvider>
    </BrowserRouter>
  </React.StrictMode>
);

