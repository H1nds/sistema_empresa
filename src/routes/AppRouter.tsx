import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { Ventas } from "../pages/Ventas";
import { Clientes } from "../pages/Clientes";
import { Inventario } from "../pages/Inventario";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Ventas />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="inventario" element={<Inventario />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
