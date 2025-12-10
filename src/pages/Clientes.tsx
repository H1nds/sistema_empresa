import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc,
    updateDoc
} from "firebase/firestore";
import { toast } from 'sonner';
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Save, Users, Building2, Phone, Briefcase } from "lucide-react";

interface Cliente {
    id: string;
    razonSocial: string;
    ruc: string;
    telefono: string;
    rubro: string;
}

export const Clientes = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [clienteEditando, setClienteEditando] = useState<string | null>(null);
    const [clienteAEliminar, setClienteAEliminar] = useState<string | null>(null);

    // Estado del formulario
    const [formData, setFormData] = useState({
        razonSocial: "",
        ruc: "",
        telefono: "",
        rubro: ""
    });

    const clientesRef = collection(db, "clientes");

    // 1. Leer clientes en tiempo real
    useEffect(() => {
        const unsubscribe = onSnapshot(clientesRef, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Cliente[];
            setClientes(data);
        });
        return () => unsubscribe();
    }, []);

    // Manejar cambios en los inputs
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 2. Guardar (Crear o Editar)
    const handleGuardar = async (e: React.FormEvent) => {
        e.preventDefault();
        const { razonSocial, ruc, telefono, rubro } = formData;

        if (!razonSocial || !ruc || !telefono || !rubro) {
            toast.error("Por favor completa todos los campos");
            return;
        }

        try {
            if (clienteEditando) {
                // Editar existente
                const docRef = doc(db, "clientes", clienteEditando);
                await updateDoc(docRef, { razonSocial, ruc, telefono, rubro });
                toast.success("Cliente actualizado correctamente");
            } else {
                // Crear nuevo
                await addDoc(clientesRef, { razonSocial, ruc, telefono, rubro });
                toast.success("Cliente registrado correctamente");
            }
            cerrarModal();
        } catch (error) {
            console.error("Error al guardar:", error);
            toast.error("Error al guardar el cliente");
        }
    };

    // Abrir modal para editar
    const abrirEditar = (cliente: Cliente) => {
        setFormData({
            razonSocial: cliente.razonSocial,
            ruc: cliente.ruc,
            telefono: cliente.telefono,
            rubro: cliente.rubro
        });
        setClienteEditando(cliente.id);
        setModalAbierto(true);
    };

    // 3. Eliminar cliente
    const confirmarEliminacion = async () => {
        if (!clienteAEliminar) return;
        try {
            await deleteDoc(doc(db, "clientes", clienteAEliminar));
            toast.success("Cliente eliminado correctamente");
            setClienteAEliminar(null);
        } catch (error) {
            console.error("Error al eliminar:", error);
            toast.error("No se pudo eliminar el cliente");
        }
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setClienteEditando(null);
        setFormData({ razonSocial: "", ruc: "", telefono: "", rubro: "" });
    };

    return (
        <div className="space-y-8 p-2">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="text-blue-500" /> {/* Azul corregido */}
                        Gestión de Clientes
                    </h1>
                    <p className="text-gray-500">Administra tu cartera de clientes</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setModalAbierto(true)}
                    // CORREGIDO: bg-blue-500 para asegurar visibilidad
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 hover:bg-blue-600 transition"
                >
                    <Plus size={20} />
                    Nuevo Cliente
                </motion.button>
            </div>

            {/* Tabla de Clientes */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
                            <tr>
                                <th className="p-4">Razón Social</th>
                                <th className="p-4">RUC</th>
                                <th className="p-4">Rubro</th>
                                <th className="p-4">Contacto</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {clientes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No hay clientes registrados aún.
                                    </td>
                                </tr>
                            ) : (
                                clientes.map((cliente) => (
                                    <motion.tr
                                        key={cliente.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        layout
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                                            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                                                <Building2 size={16} />
                                            </div>
                                            {cliente.razonSocial}
                                        </td>
                                        <td className="p-4 text-gray-600">{cliente.ruc}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                {cliente.rubro}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-600 flex items-center gap-2">
                                            <Phone size={14} className="text-gray-400" />
                                            {cliente.telefono}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => abrirEditar(cliente)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setClienteAEliminar(cliente.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Pop-up (Registro/Edición) */}
            <AnimatePresence>
                {modalAbierto && (
                    // CORREGIDO: pl-64 agregado para centrar visualmente respecto al contenido (compensando el sidebar)
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm sm:pl-64">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="bg-gray-800 p-4 flex justify-between items-center text-white">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    {clienteEditando ? <Pencil size={18} /> : <Plus size={18} />}
                                    {clienteEditando ? "Editar Cliente" : "Nuevo Cliente"}
                                </h2>
                                <button onClick={cerrarModal} className="hover:bg-white/20 p-1 rounded transition">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleGuardar} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            name="razonSocial"
                                            value={formData.razonSocial}
                                            onChange={handleInputChange}
                                            className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                            placeholder="Ej. Empresa SAC"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-bold">#</span>
                                        <input
                                            type="text"
                                            name="ruc"
                                            value={formData.ruc}
                                            onChange={handleInputChange}
                                            className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                            placeholder="10123456789"
                                            maxLength={11}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rubro</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                name="rubro"
                                                value={formData.rubro}
                                                onChange={handleInputChange}
                                                className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                                placeholder="Ej. Minería"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                            <input
                                                type="tel"
                                                name="telefono"
                                                value={formData.telefono}
                                                onChange={handleInputChange}
                                                className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                                placeholder="999 000 000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={cerrarModal}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        // CORREGIDO: bg-blue-500 para asegurar visibilidad
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md flex items-center gap-2 transition"
                                    >
                                        <Save size={18} />
                                        {clienteEditando ? "Actualizar" : "Guardar"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Confirmación Eliminar */}
            <AnimatePresence>
                {clienteAEliminar && (
                    // CORREGIDO: pl-64 también aquí para centrado consistente
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:pl-64">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full text-center"
                        >
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar cliente?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Esta acción no se puede deshacer. Se borrará el cliente permanentemente.
                            </p>
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={() => setClienteAEliminar(null)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmarEliminacion}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-lg"
                                >
                                    Sí, eliminar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};