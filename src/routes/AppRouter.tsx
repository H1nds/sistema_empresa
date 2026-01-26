import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { Ventas } from "../pages/Ventas";
import { SeguimientoVentas } from "../pages/SeguimientoVentas";
import { Inventario } from "../pages/Inventario";
import { Clientes } from "../pages/Clientes";
import { Gastos } from "../pages/Gastos";

export const AppRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<DashboardLayout />}>
                {/* Redirección inicial */}
                <Route index element={<Navigate to="/ventas/gestion" replace />} />

                {/* Rutas Hijas */}
                <Route path="ventas/gestion" element={<Ventas />} />
                <Route path="ventas/gastos" element={<Gastos />} />
                <Route path="ventas/seguimiento" element={<SeguimientoVentas />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="inventario" element={<Inventario />} />
            </Route>
        </Routes>
    );
};