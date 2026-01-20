import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Download, Filter } from "lucide-react";
import { useVentas } from "../hooks/useVentas";
import { VentasTable } from "../components/ventas/VentasTable";
import { VentasStats } from "../components/ventas/VentasStats";
import { ModalNuevaVenta } from "../components/ventas/ModalNuevaVenta";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { Venta } from "../types/types"; // Importamos el tipo para no tener errores

export const Ventas = () => {
    // Traemos editarVenta del hook (asegúrate que tu hook lo exporte)
    const { ventas, order, loading, agregarVenta, eliminarVenta, editarVenta, reordenarVentas } = useVentas();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // ESTADO PARA LA EDICIÓN
    const [ventaEditar, setVentaEditar] = useState<Venta | null>(null);

    // Filtrado
    const filteredVentas = ventas.filter(v =>
        v.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.comprobante.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredOrder = order.filter(id => filteredVentas.find(v => v.id === id));

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(ventas);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(data, "Reporte_Ventas.xlsx");
    };

    // --- LÓGICA DE EDICIÓN ---

    // 1. Abrir modal para crear (limpio)
    const handleNuevaVenta = () => {
        setVentaEditar(null); // Limpiamos edición anterior
        setIsModalOpen(true);
    };

    // 2. Abrir modal para editar (con datos)
    const handleEditarClick = (venta: Venta) => {
        setVentaEditar(venta);
        setIsModalOpen(true);
    };

    // 3. Guardar (Decide si crea o edita)
    const handleGuardar = async (data: Omit<Venta, 'id'>) => {
        if (ventaEditar) {
            // Si hay ventaEditar, actualizamos
            await editarVenta(ventaEditar.id, data);
        } else {
            // Si no, creamos nueva
            await agregarVenta(data);
        }
        setIsModalOpen(false);
        setVentaEditar(null);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
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
                    {/* Usamos handleNuevaVenta aquí */}
                    <button onClick={handleNuevaVenta} className="btn-primary flex-1 md:flex-none">
                        <Plus size={18} /> Nueva Venta
                    </button>
                </div>
            </div>

            <VentasStats ventas={ventas} />

            <div className="card p-2 flex gap-4 items-center">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Buscar por cliente, comprobante..."
                        className="w-full pl-4 pr-4 py-2 bg-transparent outline-none text-sm"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="h-6 w-px bg-gray-200"></div>
                <button className="btn-icon">
                    <Filter size={18} />
                </button>
            </div>

            <div className="card overflow-hidden">
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
                        onEdit={handleEditarClick} // <--- Pasamos la función de editar
                    />
                )}
            </div>

            <ModalNuevaVenta
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleGuardar} // <--- Pasamos la función inteligente
                initialData={ventaEditar} // <--- Pasamos los datos a editar
            />
        </motion.div>
    );
};