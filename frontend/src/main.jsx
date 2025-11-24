// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

import { registerSW } from "virtual:pwa-register";

registerSW({
  onOfflineReady() {
    console.log("✅ App lista para usar offline");
  },
  onNeedRefresh() {
    console.log("♻️ Hay update disponible, recarga la app");
    // luego si quieres lo conectamos a un toast shadcn/sonner
  }
});


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
