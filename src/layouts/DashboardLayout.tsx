import { Outlet, NavLink } from "react-router-dom";
import { useState } from "react";
import React from "react";

export const DashboardLayout = () => {
    const [submenuVentas, setSubmenuVentas] = useState(false);
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4 space-y-4">
        <h1 className="text-2xl font-bold mb-6">Fb Group</h1>
              <nav className="flex flex-col gap-2">
                  {/* Ventas con submenú */}
                  <div>
                      <div
                          className="flex justify-between items-center cursor-pointer text-white hover:text-blue-400"
                          onClick={() => setSubmenuVentas(!submenuVentas)}
                      >
                          <span>Ventas</span>
                          <span>{submenuVentas ? "▲" : "▼"}</span>
                      </div>

                      {submenuVentas && (
                          <div className="ml-4 mt-2 flex flex-col gap-1">
                              <NavLink
                                  to="/"
                                  className={({ isActive }) =>
                                      isActive ? "font-semibold text-blue-400" : "text-white"
                                  }
                              >
                                  Gestión de Ventas
                              </NavLink>
                              <NavLink
                                  to="/ventas/seguimiento"
                                  className={({ isActive }) =>
                                      isActive ? "font-semibold text-blue-400" : "text-white"
                                  }
                              >
                                  Seguimiento
                              </NavLink>
                          </div>
                      )}
                  </div>

                  {/* Clientes */}
                  <NavLink
                      to="/clientes"
                      className={({ isActive }) =>
                          isActive ? "font-semibold text-blue-400" : "text-white"
                      }
                  >
                      Clientes
                  </NavLink>

                  {/* Inventario */}
                  <NavLink
                      to="/inventario"
                      className={({ isActive }) =>
                          isActive ? "font-semibold text-blue-400" : "text-white"
                      }
                  >
                      Inventario
                  </NavLink>
              </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 bg-gray-100 overflow-y-auto">
        <header className="mb-4">
          <h2 className="text-xl font-bold text-gray-700">Panel Principal</h2>
        </header>
        <Outlet />
      </main>
    </div>
  );
};
