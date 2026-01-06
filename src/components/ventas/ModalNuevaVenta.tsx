import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save } from "lucide-react";
import type { Venta } from "../../types/types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (venta: Omit<Venta, 'id'>) => Promise<void>;
}

export const ModalNuevaVenta = ({ isOpen, onClose, onSubmit }: Props) => {
    const [formData, setFormData] = useState<Partial<Venta>>({
        moneda: "S/",
        cliente: "", area: "", servicio: "", comprobante: "", mesServicio: "", fechaFactura: "",
        plazoDePago: 0, abonoCtaCte: 0, igvdeducible: 0, subtotal: 0, igv: 0, total: 0,
        fechaPagoCtaCte: "", fechaPagoDeducible: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // Campos que deben ser numéricos
        const isNumber = ["plazoDePago", "abonoCtaCte", "igvdeducible", "subtotal", "igv", "total"].includes(name);

        setFormData(prev => ({
            ...prev,
            [name]: isNumber ? (value === "" ? "" : parseFloat(value)) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Enviamos los datos
        await onSubmit(formData as Omit<Venta, 'id'>);

        // Limpiamos el formulario (reset parcial para mantener la moneda por ejemplo)
        setFormData({
            moneda: "S/",
            cliente: "", area: "", servicio: "", comprobante: "", mesServicio: "", fechaFactura: "",
            plazoDePago: 0, abonoCtaCte: 0, igvdeducible: 0, subtotal: 0, igv: 0, total: 0,
            fechaPagoCtaCte: "", fechaPagoDeducible: ""
        });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop oscuro */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Contenido del Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10"
                    >
                        {/* Header del Modal */}
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-20">
                            <h2 className="text-xl font-bold text-gray-800">Registrar Nueva Venta</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Sección 1: Información General */}
                            <div className="col-span-full md:col-span-1 space-y-4">
                                <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider border-b pb-2">Datos Generales</h3>
                                <div>
                                    <label className="label-text">Cliente</label>
                                    <input required name="cliente" value={formData.cliente} onChange={handleChange} className="input-field" placeholder="Nombre del cliente" />
                                </div>
                                <div>
                                    <label className="label-text">Área</label>
                                    <input required name="area" value={formData.area} onChange={handleChange} className="input-field" placeholder="Ej. Logística" />
                                </div>
                                <div>
                                    <label className="label-text">Servicio</label>
                                    <input required name="servicio" value={formData.servicio} onChange={handleChange} className="input-field" placeholder="Descripción del servicio" />
                                </div>
                            </div>

                            {/* Sección 2: Facturación */}
                            <div className="col-span-full md:col-span-1 space-y-4">
                                <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider border-b pb-2">Facturación</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="label-text">Moneda</label>
                                        <select name="moneda" value={formData.moneda} onChange={handleChange} className="input-field">
                                            <option value="S/">S/</option>
                                            <option value="$">USD</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label-text">N° Comprobante</label>
                                        <input required name="comprobante" value={formData.comprobante} onChange={handleChange} className="input-field" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="label-text">Fecha Factura</label>
                                        <input type="date" required name="fechaFactura" value={formData.fechaFactura} onChange={handleChange} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="label-text">Mes Servicio</label>
                                        <input required name="mesServicio" value={formData.mesServicio} onChange={handleChange} className="input-field" />
                                    </div>
                                </div>
                                <div>
                                    <label className="label-text">Plazo Pago (Días)</label>
                                    <input type="number" name="plazoDePago" value={formData.plazoDePago} onChange={handleChange} className="input-field" />
                                </div>
                            </div>

                            {/* Sección 3: Importes y Fechas */}
                            <div className="col-span-full md:col-span-1 space-y-4">
                                <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider border-b pb-2">Importes</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="label-text">Subtotal</label>
                                        <input type="number" name="subtotal" value={formData.subtotal} onChange={handleChange} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="label-text">IGV</label>
                                        <input type="number" name="igv" value={formData.igv} onChange={handleChange} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="label-text">Total</label>
                                        <input type="number" name="total" value={formData.total} onChange={handleChange} className="input-field font-bold bg-gray-50" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div>
                                        <label className="label-text">Pago Cta. Cte</label>
                                        <input type="date" name="fechaPagoCtaCte" value={formData.fechaPagoCtaCte} onChange={handleChange} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="label-text">Pago Detrac.</label>
                                        <input type="date" name="fechaPagoDeducible" value={formData.fechaPagoDeducible} onChange={handleChange} className="input-field" />
                                    </div>
                                </div>
                            </div>

                            {/* Footer del Modal */}
                            <div className="col-span-full pt-4 border-t flex justify-end gap-3 bg-gray-50 -mx-6 -mb-6 p-6 mt-4 rounded-b-2xl">
                                <button type="button" onClick={onClose} className="btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    <Save size={18} /> Guardar Venta
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};