import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    Users, Package, ChevronDown, ChevronRight,
    PieChart, Wallet, DollarSign, Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Sidebar = () => {

    // Estado para submenús
    const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
        financiera: true, // Por defecto abierto
    });

    const toggleMenu = (key: string) => {
        setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ml-4 ${isActive
            ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30"
            : "text-gray-400 hover:bg-gray-800 hover:text-white"
        }`;

    return (
        <aside className="w-64 bg-gray-900 text-white h-screen flex flex-col border-r border-gray-800 shrink-0 overflow-hidden">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-white">FB</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight">Fb Group</h1>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">

                {/* SECCIÓN GESTIÓN FINANCIERA (Desplegable) */}
                <div>
                    <button
                        onClick={() => toggleMenu('financiera')}
                        className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors text-sm font-bold uppercase tracking-wider"
                    >
                        <div className="flex items-center gap-3">
                            <Briefcase size={18} />
                            <span>Gestión</span>
                        </div>
                        {openMenus.financiera ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <AnimatePresence>
                        {openMenus.financiera && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-1"
                            >
                                <NavLink to="/ventas/gestion" className={linkClass}>
                                    <DollarSign size={18} /> Ingresos (Ventas)
                                </NavLink>
                                <NavLink to="/ventas/gastos" className={linkClass}>
                                    <Wallet size={18} /> Egresos (Gastos)
                                </NavLink>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* OTROS LINKS */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Analítica</p>
                    <NavLink to="/ventas/seguimiento" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"}`}>
                        <PieChart size={18} />
                        Seguimiento
                    </NavLink>
                </div>

                <div className="mt-2">
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Operativo</p>
                    <NavLink to="/clientes" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"}`}>
                        <Users size={18} />
                        Clientes
                    </NavLink>
                    <NavLink to="/inventario" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"}`}>
                        <Package size={18} />
                        Inventario
                    </NavLink>
                </div>
            </nav>

            <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center">
                &copy; 2026 FB Group System
            </div>
        </aside>
    );
};