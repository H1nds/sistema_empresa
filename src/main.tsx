import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <--- 1. IMPORTAR ESTO
import App from './App.tsx'
import './index.css'

// Configuración de Firebase Auth Anónimo (lo mantenemos)
import { getAuth, signInAnonymously } from "firebase/auth";
import "./services/firebase"; // Aseguramos que se inicie firebase

const auth = getAuth();
signInAnonymously(auth).catch((error) => console.error("Error de auth:", error));

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        {/* 2. ENVOLVER APP CON BROWSER ROUTER */}
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>,
)