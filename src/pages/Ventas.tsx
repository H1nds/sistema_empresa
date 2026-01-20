import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Download, Filter, Calendar, RefreshCcw } from "lucide-react";
import { useVentas } from "../hooks/useVentas";
import { VentasTable } from "../components/ventas/VentasTable";
import { VentasStats } from "../components/ventas/VentasStats";
import { ModalNuevaVenta } from "../components/ventas/ModalNuevaVenta";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { Venta } from "../types/types";

export const Ventas = () => {
    const { ventas, order, loading, agregarVenta, eliminarVenta, editarVenta, reordenarVentas } = useVentas();

    // Estados de UI
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false); // Nuevo: Controla el menú de filtros

    // Estados de Filtrado
    const [searchTerm, setSearchTerm] = useState("");
    const [filterYear, setFilterYear] = useState<string>("");
    const [filterMonth, setFilterMonth] = useState<string>("");

    // Estado para edición
    const [ventaEditar, setVentaEditar] = useState<Venta | null>(null);

    // 1. LÓGICA: Extraer años únicos disponibles en las ventas
    const availableYears = useMemo(() => {
        const years = new Set<number>();
        ventas.forEach(v => {
            if (v.fechaFactura) {
                // Aseguramos compatibilidad con fechas string "2025-01-01"
                const date = new Date(v.fechaFactura + 'T00:00:00');
                if (!isNaN(date.getTime())) {
                    years.add(date.getFullYear());
                }
            }
        });
        // Retornamos ordenado descendente (2026, 2025, 2024...)
        return Array.from(years).sort((a, b) => b - a);
    }, [ventas]);

    // 2. LÓGICA: Filtrado Maestro (Buscador + Año + Mes)
    const filteredVentas = useMemo(() => {
        return ventas.filter(v => {
            // A. Filtro de Texto (Cliente o Comprobante)
            const matchSearch =
                v.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.comprobante.toLowerCase().includes(searchTerm.toLowerCase());

            // Si no pasa el texto, descartar inmediatamente
            if (!matchSearch) return false;

            // Procesar fecha para filtros de tiempo
            if (!v.fechaFactura) return false;
            const date = new Date(v.fechaFactura + 'T00:00:00');

            // B. Filtro Año
            const matchYear = filterYear ? date.getFullYear().toString() === filterYear : true;

            // C. Filtro Mes
            // getMonth() devuelve 0 para Enero, por eso sumamos 1
            const matchMonth = filterMonth ? (date.getMonth() + 1).toString() === filterMonth : true;

            return matchYear && matchMonth;
        });
    }, [ventas, searchTerm, filterYear, filterMonth]);

    // Sincronizar el orden (Drag & Drop) con los filtros
    const filteredOrder = order.filter(id => filteredVentas.find(v => v.id === id));

    // Exportar Excel
    const handleExportExcel = () => {
        const datosExportar = filteredVentas.map(venta => { // Exportamos solo lo filtrado
            const calcularEstadoTexto = (fecha: string, plazo: number) => {
                if (!fecha) return "Sin fecha";
                if (Number(plazo) === 0) return "Pagado";
                const fechaObj = new Date(fecha);
                fechaObj.setDate(fechaObj.getDate() + plazo);
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                fechaObj.setHours(0, 0, 0, 0);
                const diffTime = fechaObj.getTime() - hoy.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 0) return "Vencido";
                if (diffDays <= 5) return "Por vencer";
                return "En plazo";
            };

            return {
                "Cliente": venta.cliente,
                "Área": venta.area,
                "Servicio": venta.servicio,
                "Moneda": venta.moneda,
                "N° Comprobante": venta.comprobante,
                "Mes Servicio": venta.mesServicio,
                "Fecha Factura": venta.fechaFactura,
                "Estado": calcularEstadoTexto(venta.fechaFactura, Number(venta.plazoDePago) || 0),
                "Plazo Pago (días)": Number(venta.plazoDePago) || 0,
                "F. Abono CTA. CTE": venta.fechaPagoCtaCte || "-",
                "Abono CTA. CTE": Number(venta.abonoCtaCte) || 0,
                "F. Abono CTA. DETRAC": venta.fechaPagoDeducible || "-",
                "IGV CTA. DETRAC": Number(venta.igvdeducible) || 0,
                "Subtotal": Number(venta.subtotal) || 0,
                "IGV": Number(venta.igv) || 0,
                "Total": Number(venta.total) || 0
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(datosExportar);
        const columnWidths = [
            { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 8 },
            { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
            { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
            { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }
        ];
        worksheet['!cols'] = columnWidths;
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/octet-stream" });
        const fechaHoy = new Date().toISOString().split('T')[0];
        saveAs(data, `Reporte_Ventas_${fechaHoy}.xlsx`);
    };

    const handleNuevaVenta = () => {
        setVentaEditar(null);
        setIsModalOpen(true);
    };

    const handleEditarClick = (venta: Venta) => {
        setVentaEditar(venta);
        setIsModalOpen(true);
    };

    const handleGuardar = async (data: Omit<Venta, 'id'>) => {
        if (ventaEditar) {
            await editarVenta(ventaEditar.id, data);
        } else {
            await agregarVenta(data);
        }
        setIsModalOpen(false);
        setVentaEditar(null);
    };

    // Helper para saber si hay filtros activos (para pintar el icono)
    const hasActiveFilters = filterYear !== "" || filterMonth !== "";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-20"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Ventas</h1>
                    <p className="text-gray-500 text-sm">Administra y organiza tus facturas y cobros</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={handleExportExcel} className="btn-secondary flex-1 md:flex-none">
                        <Download size={18} /> Exportar
                    </button>
                    <button onClick={handleNuevaVenta} className="btn-primary flex-1 md:flex-none">
                        <Plus size={18} /> Nueva Venta
                    </button>
                </div>
            </div>

            {/* Pasamos ventas filtradas a los stats para que los números cambien dinámicamente */}
            <VentasStats ventas={filteredVentas} />

            {/* Barra de Herramientas y Filtros */}
            <div className="flex gap-4 items-start">
                {/* Buscador */}
                <div className="card p-2 flex gap-4 items-center flex-1 h-[46px]">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Buscar por cliente, comprobante..."
                            className="w-full pl-4 pr-4 py-2 bg-transparent outline-none text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Botón de Filtros (Con Popover) */}
                <div className="relative">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`h-[46px] w-[46px] flex items-center justify-center rounded-xl border transition-all ${hasActiveFilters || isFilterOpen
                                ? "bg-primary-50 border-primary-200 text-primary-600 shadow-sm"
                                : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50 shadow-card"
                            }`}
                    >
                        <div className="relative">
                            <Filter size={20} />
                            {/* Puntito rojo si hay filtros activos */}
                            {hasActiveFilters && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </div>
                    </button>

                    {/* Menú Desplegable de Filtros */}
                    <AnimatePresence>
                        {isFilterOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                            >
                                <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                        <Calendar size={14} /> Filtros de Fecha
                                    </span>
                                    {hasActiveFilters && (
                                        <button
                                            onClick={() => { setFilterYear(""); setFilterMonth(""); }}
                                            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                                        >
                                            <RefreshCcw size={10} /> Limpiar
                                        </button>
                                    )}
                                </div>

                                <div className="p-4 space-y-4">
                                    {/* Selector de Año */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-600 ml-1">Año</label>
                                        <div className="relative">
                                            <select
                                                value={filterYear}
                                                onChange={(e) => setFilterYear(e.target.value)}
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="">Todos los años</option>
                                                {availableYears.map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Selector de Mes */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-600 ml-1">Mes</label>
                                        <div className="relative">
                                            <select
                                                value={filterMonth}
                                                onChange={(e) => setFilterMonth(e.target.value)}
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="">Todos los meses</option>
                                                {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((mes, index) => (
                                                    <option key={index} value={index + 1}>{mes}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Tabla con Overlay Click para cerrar filtros si haces click fuera */}
            <div
                className="card overflow-hidden relative"
                onClick={() => isFilterOpen && setIsFilterOpen(false)} // Cerrar filtro al hacer click en la tabla
            >
                {loading ? (
                    <div className="p-10 text-center animate-pulse text-gray-400">Cargando datos...</div>
                ) : (
                    <VentasTable
                        ventas={filteredVentas}
                        order={filteredOrder}
                        onDragEnd={({ active, over }) => {
                            if (over && active.id !== over.id) {
                                reordenarVentas(active.id as string, over.id as string);
                            }
                        }}
                        onDelete={eliminarVenta}
                        onEdit={handleEditarClick}
                    />
                )}
            </div>

            <ModalNuevaVenta
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleGuardar}
                initialData={ventaEditar}
            />
        </motion.div>
    );
};