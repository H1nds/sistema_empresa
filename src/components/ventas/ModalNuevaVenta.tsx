import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Pencil } from "lucide-react";
import type { Venta } from "../../types/types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (venta: Omit<Venta, 'id'>) => Promise<void>;
    initialData?: Venta | null;
}

const INITIAL_STATE = {
    moneda: "S/" as "S/" | "$",
    cliente: "", area: "", servicio: "", comprobante: "", mesServicio: "", fechaFactura: "",
    plazoDePago: 0, abonoCtaCte: 0, igvdeducible: 0, subtotal: 0, igv: 0, total: 0,
    fechaPagoCtaCte: "", fechaPagoDeducible: ""
};

// --- SOLUCIÓN PROBLEMA 1: Componente Input FUERA del componente principal ---
const InputField = ({ label, name, value, onChange, type = "text", required = false, className = "" }: any) => (
    <div className={className}>
        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{label}</label>
        <input
            type={type}
            name={name}
            value={value || ""}
            onChange={onChange}
            required={required}
            step={type === "number" ? "0.01" : undefined}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
        />
    </div>
);

export const ModalNuevaVenta = ({ isOpen, onClose, onSubmit, initialData }: Props) => {
    const [formData, setFormData] = useState<Partial<Venta>>(INITIAL_STATE);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({ ...initialData });
            } else {
                setFormData(INITIAL_STATE);
            }
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumber = ["plazoDePago", "abonoCtaCte", "igvdeducible", "subtotal", "igv", "total"].includes(name);
        setFormData(prev => ({
            ...prev,
            [name]: isNumber ? (value === "" ? "" : parseFloat(value)) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData as Omit<Venta, 'id'>);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10"
                    >
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-20">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${initialData ? 'bg-blue-100 text-blue-600' : 'bg-primary-100 text-primary-600'}`}>
                                    {initialData ? <Pencil size={20} /> : <Save size={20} />}
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {initialData ? "Editar Venta" : "Registrar Nueva Venta"}
                                </h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Sección 1: DATOS GENERALES */}
                            <div className="col-span-full md:col-span-1 space-y-4">
                                <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider border-b pb-2">Datos Generales</h3>
                                <InputField label="Cliente" name="cliente" value={formData.cliente} onChange={handleChange} required />
                                <InputField label="Área" name="area" value={formData.area} onChange={handleChange} required />
                                <InputField label="Servicio" name="servicio" value={formData.servicio} onChange={handleChange} required />
                            </div>

                            {/* Sección 2: FACTURACIÓN */}
                            <div className="col-span-full md:col-span-1 space-y-4">
                                <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider border-b pb-2">Facturación</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Moneda</label>
                                        <select name="moneda" value={formData.moneda} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-primary-500 outline-none text-sm">
                                            <option value="S/">S/</option>
                                            <option value="$">USD</option>
                                        </select>
                                    </div>
                                    <InputField label="N° Comprobante" name="comprobante" value={formData.comprobante} onChange={handleChange} required />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputField label="Fecha Factura" name="fechaFactura" type="date" value={formData.fechaFactura} onChange={handleChange} required />
                                    <InputField label="Mes Servicio" name="mesServicio" value={formData.mesServicio} onChange={handleChange} required />
                                </div>
                                <InputField label="Plazo Pago (Días)" name="plazoDePago" type="number" value={formData.plazoDePago} onChange={handleChange} />
                            </div>

                            {/* Sección 3: IMPORTES */}
                            <div className="col-span-full md:col-span-1 space-y-4">
                                <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider border-b pb-2">Importes</h3>

                                <div className="grid grid-cols-3 gap-2">
                                    <InputField label="Subtotal" name="subtotal" type="number" value={formData.subtotal} onChange={handleChange} />
                                    <InputField label="IGV" name="igv" type="number" value={formData.igv} onChange={handleChange} />
                                    <InputField label="Total" name="total" type="number" value={formData.total} onChange={handleChange} className="font-bold bg-blue-50 text-blue-800" />
                                </div>

                                <div className="pt-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Cuenta Corriente</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <InputField label="F. Abono" name="fechaPagoCtaCte" type="date" value={formData.fechaPagoCtaCte} onChange={handleChange} />
                                        <InputField label="Monto Abono" name="abonoCtaCte" type="number" value={formData.abonoCtaCte} onChange={handleChange} />
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Detracción</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <InputField label="F. Detrac." name="fechaPagoDeducible" type="date" value={formData.fechaPagoDeducible} onChange={handleChange} />
                                        {/* SOLUCIÓN PROBLEMA 2: Cambio de nombre aquí */}
                                        <InputField label="Abono Detrac." name="igvdeducible" type="number" value={formData.igvdeducible} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-full pt-4 border-t flex justify-end gap-3 bg-gray-50 -mx-6 -mb-6 p-6 mt-4 rounded-b-2xl">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm flex items-center gap-2 shadow-lg shadow-primary-500/30">
                                    <Save size={18} /> {initialData ? "Actualizar Cambios" : "Guardar Venta"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};