import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Package, ChevronDown, ChevronRight, PieChart, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Sidebar = () => {
    const [submenuVentas, setSubmenuVentas] = useState(true);

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${isActive
            ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30"
            : "text-gray-400 hover:bg-gray-800 hover:text-white"
        }`;

    return (
        <aside className="w-64 bg-gray-900 text-white h-screen flex flex-col border-r border-gray-800 shrink-0">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-white">FB</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight">Fb Group</h1>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {/* Menu Ventas */}
                <div>
                    <button
                        onClick={() => setSubmenuVentas(!submenuVentas)}
                        className="w-full flex items-center justify-between px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        <div className="flex items-center gap-3">
                            <ShoppingCart size={18} />
                            <span>Ventas</span>
                        </div>
                        {submenuVentas ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <AnimatePresence>
                        {submenuVentas && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="ml-4 pl-4 border-l border-gray-700 mt-1 space-y-1">
                                    <NavLink to="/" className={linkClass}>
                                        <LayoutDashboard size={18} />
                                        Gestión
                                    </NavLink>
                                    <NavLink to="/ventas/seguimiento" className={linkClass}>
                                        <PieChart size={18} />
                                        Seguimiento
                                    </NavLink>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <NavLink to="/clientes" className={linkClass}>
                    <Users size={18} />
                    <span>Clientes</span>
                </NavLink>

                <NavLink to="/inventario" className={linkClass}>
                    <Package size={18} />
                    <span>Inventario</span>
                </NavLink>
            </nav>

            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">UA</div>
                    <div>
                        <p className="text-sm font-medium text-white">Usuario Admin</p>
                        <p className="text-xs text-gray-500">admin@fbgroup.com</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};