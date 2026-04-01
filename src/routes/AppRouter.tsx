import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { Ventas } from "../pages/Ventas";
import { SeguimientoVentas } from "../pages/SeguimientoVentas";
import { Inventario } from "../pages/Inventario";
import { Clientes } from "../pages/Clientes";
import { Gastos } from "../pages/Gastos";
import { Login } from "../pages/Login";
import { Proveedores } from "../pages/Proveedores";
import { Registro } from "../pages/Registro"; // <--- 1. IMPORTAMOS LA NUEVA PÁGINA
import { useAuth, type UserRole } from "../context/AuthContext";
import type { ReactNode } from "react";

const PrivateRoute = ({ children, allowedRoles }: { children: ReactNode, allowedRoles?: UserRole[] }) => {
    const { user, role, loading } = useAuth();

    if (loading) return null;

    if (!user) return <Navigate to="/login" replace />;

    if (allowedRoles && role && !allowedRoles.includes(role)) {
        return role === 'EVENTOS'
            ? <Navigate to="/eventos/proveedores" replace />
            : <Navigate to="/ventas/gestion" replace />;
    }

    return children;
};

export const AppRouter = () => {
    const { user, role } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to={role === 'EVENTOS' ? "/eventos/proveedores" : "/ventas/gestion"} replace /> : <Login />} />

            <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
                <Route index element={<Navigate to={role === 'EVENTOS' ? "/eventos/proveedores" : "/ventas/gestion"} replace />} />

                {/* RUTAS EXCLUSIVAS PARA ADMIN */}
                <Route path="ventas/gestion" element={<PrivateRoute allowedRoles={['ADMIN']}><Ventas /></PrivateRoute>} />
                <Route path="ventas/gastos" element={<PrivateRoute allowedRoles={['ADMIN']}><Gastos /></PrivateRoute>} />
                <Route path="ventas/seguimiento" element={<PrivateRoute allowedRoles={['ADMIN']}><SeguimientoVentas /></PrivateRoute>} />
                <Route path="clientes" element={<PrivateRoute allowedRoles={['ADMIN']}><Clientes /></PrivateRoute>} />
                <Route path="inventario" element={<PrivateRoute allowedRoles={['ADMIN']}><Inventario /></PrivateRoute>} />

                {/* RUTAS DEL E-COMMERCE (Disponibles para ADMIN y EVENTOS) */}
                <Route path="eventos/proveedores" element={<PrivateRoute allowedRoles={['ADMIN', 'EVENTOS']}><Proveedores /></PrivateRoute>} />
                {/* 2. AGREGAMOS LA RUTA DEL REGISTRO AQUÍ */}
                <Route path="eventos/registro" element={<PrivateRoute allowedRoles={['ADMIN', 'EVENTOS']}><Registro /></PrivateRoute>} />
            </Route>
        </Routes>
    );
};