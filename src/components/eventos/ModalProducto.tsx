import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, Image as ImageIcon, Save, Tag, FileText, Store, Edit3 } from "lucide-react";
import type { Producto } from "../../hooks/useProductos";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (datos: any, archivo?: File) => Promise<void>;
    initialData?: Producto | null; // Nnuevo: Recibe datos si vamos a editar
}

export const ModalProducto = ({ isOpen, onClose, onSubmit, initialData }: Props) => {
    const [nombre, setNombre] = useState("");
    const [proveedor, setProveedor] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [precio, setPrecio] = useState<number | "">("");

    const [archivo, setArchivo] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // EFECTO: Si initialData cambia, llenamos los campos
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Modo Edición
                setNombre(initialData.nombre);
                setProveedor(initialData.proveedor);
                setDescripcion(initialData.descripcion);
                setPrecio(initialData.precio);
                setPreviewUrl(initialData.imagenUrl); // Mostramos la foto actual
                setArchivo(null); // No exigimos archivo nuevo a menos que lo cambie
            } else {
                // Modo Creación (Limpiar todo)
                setNombre(""); setProveedor(""); setDescripcion(""); setPrecio("");
                setArchivo(null); setPreviewUrl(null);
            }
        }
    }, [isOpen, initialData]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setArchivo(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Si es nuevo, exige foto. Si es editar, la foto es opcional.
        if (!initialData && !archivo) return;
        if (!precio) return;

        setIsSubmitting(true);
        try {
            await onSubmit({ nombre, proveedor, descripcion, precio: Number(precio) }, archivo || undefined);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const tituloModal = initialData ? "Editar Producto" : "Nuevo Producto";
    const IconoModal = initialData ? Edit3 : Tag;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
                    >
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <IconoModal className="text-primary-500" size={20} /> {tituloModal}
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"><X size={20} /></button>
                        </div>

                        <form id="form-producto" onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* COLUMNA IZQUIERDA: Imagen */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Foto del Producto {initialData && "(Opcional)"}</label>
                                <div className="relative group w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-primary-500 bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden">
                                    <input type="file" accept="image/*" onChange={handleImageChange} required={!initialData} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />

                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 text-primary-500 group-hover:scale-110 transition-transform">
                                                <UploadCloud size={24} />
                                            </div>
                                            <p className="text-sm font-medium text-gray-700">Haz clic o arrastra</p>
                                        </div>
                                    )}
                                    {previewUrl && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                            <p className="text-white font-medium text-sm flex items-center gap-2"><ImageIcon size={16} /> Cambiar Foto</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* COLUMNA DERECHA: Datos */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nombre del Producto</label>
                                    <input required type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 outline-none transition-all text-sm font-medium" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Precio (S/)</label>
                                        <input required type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value ? Number(e.target.value) : "")} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 outline-none transition-all text-sm font-bold text-gray-900" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1"><Store size={12} /> Proveedor</label>
                                        <input required type="text" value={proveedor} onChange={e => setProveedor(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 outline-none transition-all text-sm font-medium" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1"><FileText size={12} /> Descripción</label>
                                    <textarea required value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={4} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 outline-none transition-all text-sm font-medium resize-none custom-scrollbar" />
                                </div>
                            </div>
                        </form>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium text-sm transition-colors">Cancelar</button>
                            <button type="submit" form="form-producto" disabled={isSubmitting} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg flex items-center gap-2">
                                {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Save size={18} /> {initialData ? "Actualizar" : "Publicar"}</>}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};