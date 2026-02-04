import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Pencil, Search, TrendingDown, Inbox } from "lucide-react";
import Swal from 'sweetalert2';
import { useGastos } from "../hooks/useGastos";
import type { Gasto } from "../types/types";

// --- COMPONENTE INTERNO: MODAL ---
const ModalGasto = ({ isOpen, onClose, onSubmit, initialData }: any) => {
    // Inicializamos moneda en Soles por defecto
    const [form, setForm] = useState<Partial<Gasto>>({
        descripcion: "", area: "", monto: 0, moneda: "S/", fecha: "", tipo: "Variable"
    });

    // Efecto para cargar datos al editar o limpiar al abrir nuevo
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setForm({ ...initialData });
            } else {
                // Reset para nuevo gasto
                setForm({ descripcion: "", area: "", monto: 0, moneda: "S/", fecha: "", tipo: "Variable" });
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(form);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">{initialData ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                                <input required className="input-field" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej. Compra de cables" />
                            </div>

                            {/* Fila: Área y Mes/Año */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Área</label>
                                    <select className="input-field" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}>
                                        <option value="">Seleccionar</option>
                                        <option value="P. Audiovisual">P. Audiovisual</option>
                                        <option value="Talleres">Talleres</option>
                                        <option value="Eventos">Eventos</option>
                                        <option value="Monitoreo de Medios">Monitoreo</option>
                                        <option value="Oficina">Oficina General</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mes y Año</label>
                                    {/* CAMBIO 3: Input type="month" para seleccionar solo mes y año */}
                                    <input
                                        type="month"
                                        required
                                        className="input-field"
                                        value={form.fecha}
                                        onChange={e => setForm({ ...form, fecha: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Fila: Moneda y Monto (CAMBIO 1) */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Moneda</label>
                                    <select
                                        className="input-field font-bold text-center"
                                        value={form.moneda}
                                        onChange={e => setForm({ ...form, moneda: e.target.value })}
                                    >
                                        <option value="S/">S/</option>
                                        <option value="$">USD</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto</label>
                                    <input type="number" step="0.01" required className="input-field" value={form.monto} onChange={e => setForm({ ...form, monto: parseFloat(e.target.value) })} />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Guardar</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- PÁGINA PRINCIPAL ---
export const Gastos = () => {
    const { gastos, loading, agregarGasto, eliminarGasto, editarGasto } = useGastos();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [gastoEditar, setGastoEditar] = useState<Gasto | null>(null);
    const [search, setSearch] = useState("");
    const [tipoCambio, setTipoCambio] = useState<number>(3.85);

    // Cargar el tipo de cambio del sistema al iniciar
    useEffect(() => {
        const savedTC = localStorage.getItem("tipoCambioSistema");
        if (savedTC) setTipoCambio(parseFloat(savedTC));
    }, []);

    const filteredGastos = gastos.filter(g =>
        g.descripcion.toLowerCase().includes(search.toLowerCase()) ||
        g.area.toLowerCase().includes(search.toLowerCase())
    );

    // CAMBIO 1: Cálculo del total convirtiendo dólares a soles
    const totalGastosSoles = filteredGastos.reduce((acc, curr) => {
        const montoEnSoles = curr.moneda === "$" ? (curr.monto * tipoCambio) : curr.monto;
        return acc + (montoEnSoles || 0);
    }, 0);

    const handleGuardar = async (data: any) => {
        if (gastoEditar) {
            await editarGasto(gastoEditar.id, data);
        } else {
            await agregarGasto(data);
        }
        setIsModalOpen(false);
        setGastoEditar(null);
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Eliminar gasto?', text: "Esta acción es irreversible", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                await eliminarGasto(id);
                Swal.fire({ title: '¡Eliminado!', icon: 'success', timer: 1500, showConfirmButton: false });
            } catch (error) {
                console.error(error);
            }
        }
    };

    // Helper para formatear fecha visualmente (Ej: "Enero 2026")
    const formatMesAnio = (fechaInput: string) => {
        if (!fechaInput) return "-";
        const [year, month] = fechaInput.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        // Capitalizamos la primera letra
        const texto = date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Gastos</h1>
                    <p className="text-gray-500 text-sm">Control de egresos por área operativa</p>
                </div>
                <button onClick={() => { setGastoEditar(null); setIsModalOpen(true); }} className="btn-primary">
                    <Plus size={18} /> Nuevo Gasto
                </button>
            </div>

            {/* Stats Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 flex items-center gap-4 border-l-4 border-red-500">
                    <div className="p-3 bg-red-50 text-red-600 rounded-full"><TrendingDown size={24} /></div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Total Gastos (Convertido a Soles)</p>
                        <p className="text-2xl font-bold text-gray-900">S/ {totalGastosSoles.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Ref. Dólar: S/ {tipoCambio.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="card overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text" placeholder="Buscar gasto..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-500"
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-3">Descripción</th>
                                <th className="px-6 py-3">Área</th>
                                <th className="px-6 py-3">Mes/Año</th>
                                {/* NUEVA COLUMNA */}
                                <th className="px-6 py-3 text-center">Moneda</th> 
                                <th className="px-6 py-3 text-right">Monto</th>
                                <th className="px-6 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Cargando...</td></tr>
                            ) : filteredGastos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Inbox size={40} className="text-gray-300" />
                                            <p>No hay gastos registrados</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredGastos.map(gasto => (
                                    <tr key={gasto.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-gray-900">{gasto.descripcion}</td>
                                        <td className="px-6 py-3"><span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-medium">{gasto.area}</span></td>
                                        <td className="px-6 py-3 text-gray-500 capitalize">{formatMesAnio(gasto.fecha)}</td>
                                        
                                        {/* NUEVA CELDA: MONEDA VISUAL */}
                                        <td className="px-6 py-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${gasto.moneda === '$' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {gasto.moneda === '$' ? 'USD' : 'PEN'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-3 text-right font-bold text-gray-800">
                                            {gasto.moneda} {gasto.monto.toLocaleString('es-PE', {minimumFractionDigits: 2})}
                                        </td>
                                        <td className="px-6 py-3 flex justify-center gap-2">
                                            <button onClick={() => { setGastoEditar(gasto); setIsModalOpen(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Pencil size={16}/></button>
                                            <button onClick={() => handleDelete(gasto.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ModalGasto
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleGuardar}
                initialData={gastoEditar}
            />
        </div>
    );
};