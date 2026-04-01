import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    Users, Package, ChevronDown, ChevronRight,
    PieChart, Wallet, DollarSign, Briefcase, LogOut, Store, History // <--- Añadimos History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export const Sidebar = () => {
    const { logout, role } = useAuth();
    const isAdmin = role === 'ADMIN';

    const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
        financiera: true,
    });

    const toggleMenu = (key: string) => {
        setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${isAdmin ? 'ml-4' : ''} ${isActive
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

                {isAdmin && (
                    <>
                        <div>
                            <button onClick={() => toggleMenu('financiera')} className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors text-sm font-bold uppercase tracking-wider">
                                <div className="flex items-center gap-3"><Briefcase size={18} /><span>Gestión</span></div>
                                {openMenus.financiera ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                            <AnimatePresence>
                                {openMenus.financiera && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-1">
                                        <NavLink to="/ventas/gestion" className={linkClass}><DollarSign size={18} /> Ingresos (Ventas)</NavLink>
                                        <NavLink to="/ventas/gastos" className={linkClass}><Wallet size={18} /> Egresos (Gastos)</NavLink>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-800">
                            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Analítica</p>
                            <NavLink to="/ventas/seguimiento" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"}`}><PieChart size={18} /> Seguimiento</NavLink>
                        </div>

                        <div className="mt-2">
                            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Operativo</p>
                            <NavLink to="/clientes" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"}`}><Users size={18} /> Clientes</NavLink>
                            <NavLink to="/inventario" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"}`}><Package size={18} /> Inventario</NavLink>
                        </div>
                    </>
                )}

                {/* SECCIÓN DE EVENTOS / E-COMMERCE */}
                <div className={`${isAdmin ? 'mt-4 pt-4 border-t border-gray-800' : ''}`}>
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Eventos y E-commerce</p>
                    <NavLink to="/eventos/proveedores" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
                        <Store size={18} />
                        Proveedores
                    </NavLink>
                    {/* NUEVO BOTÓN PARA EL REGISTRO HISTÓRICO */}
                    <NavLink to="/eventos/registro" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 mt-1 rounded-lg transition-all ${isActive ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
                        <History size={18} />
                        Registro
                    </NavLink>
                </div>

            </nav>

            <div className="p-4 border-t border-gray-800 flex justify-between items-center relative">
                <span className="text-xs text-gray-500 font-medium tracking-wide">
                    &copy; 2026 FB Group
                </span>

                <div className="group relative flex items-center">
                    <button onClick={logout} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200" aria-label="Cerrar sesión">
                        <LogOut size={18} strokeWidth={2.5} />
                    </button>

                    <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-800 text-white text-xs font-bold rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none z-50 flex items-center">
                        Cerrar Sesión
                        <div className="absolute left-full top-1/2 -translate-y-1/2 border-[4px] border-transparent border-l-gray-800"></div>
                    </div>
                </div>
            </div>
        </aside>
    );
};