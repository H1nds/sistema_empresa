import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import {
    collection,
    addDoc,
    getDocs,
    onSnapshot,
    Timestamp
} from "firebase/firestore";
import { deleteDoc, doc } from "firebase/firestore";
import { updateDoc } from "firebase/firestore";
import { toast } from 'sonner';
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Save, X, Maximize2 } from "lucide-react";

interface Venta {
    id: string;
    cliente: string;
    servicio: string;
    moneda: "S/" | "$";
    comprobante: string;
    mesServicio: string;
    fechaFactura: string;
    fechaPagoCtaCte: string;
    abonoCtaCte: number;
    fechaPagoDeducible: number;
    igvdeducible: number;
    subtotal: number;
    igv: number;
    total: number;
}

export const Ventas = () => {
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [nuevaVenta, setNuevaVenta] = useState<Venta>({
        id: "",
        cliente: "",
        servicio: "",
        moneda: "S/",
        comprobante: "",
        mesServicio: "",
        fechaFactura: "",
        fechaPagoCtaCte: "",
        abonoCtaCte: 0,
        fechaPagoDeducible: 0,
        igvdeducible: 0,
        subtotal: 0,
        igv: 0,
        total: 0,
    });

    const ventasRef = collection(db, "ventas");

    const agregarVenta = async () => {
        const {
            cliente,
            servicio,
            moneda,
            comprobante,
            mesServicio,
            fechaFactura,
            fechaPagoCtaCte,
            abonoCtaCte,
            fechaPagoDeducible,
            igvdeducible,
            subtotal,
            igv,
            total,
        } = nuevaVenta;

        // Validaciones básicas
        if (
            !cliente ||
            !servicio ||
            !comprobante ||
            !mesServicio ||
            !fechaFactura ||
            !fechaPagoCtaCte ||
            abonoCtaCte < 0 ||
            fechaPagoDeducible < 0 ||
            igvdeducible < 0 ||
            subtotal < 0 ||
            igv < 0 ||
            total < 0
        ) {
            toast.error("Por favor, completa todos los campos correctamente.");
            return;
        }

        try {
            await addDoc(ventasRef, {
                cliente,
                servicio,
                moneda,
                comprobante,
                mesServicio,
                fechaFactura,
                fechaPagoCtaCte,
                abonoCtaCte,
                fechaPagoDeducible,
                igvdeducible,
                subtotal,
                igv,
                total,
            });

            // Limpiar formulario
            setNuevaVenta({
                id: "",
                cliente: "",
                servicio: "",
                moneda: "S/",
                comprobante: "",
                mesServicio: "",
                fechaFactura: "",
                fechaPagoCtaCte: "",
                abonoCtaCte: 0,
                fechaPagoDeducible: 0,
                igvdeducible: 0,
                subtotal: 0,
                igv: 0,
                total: 0,
            });

            toast.success("Venta registrada correctamente.");
        } catch (error) {
            console.error("Error al agregar venta:", error);
            toast.error("Ocurrió un error al registrar la venta.");
        }
    };
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [mostrarTablaExpandida, setMostrarTablaExpandida] = useState(false);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setNuevaVenta((prev) => ({
            ...prev,
            [name]: name == "abonoCtaCte" || name == "fechaPagoDeducible" || name == "igvdeducible" || name === "subtotal" || name === "igv" || name === "total"
                ? parseFloat(value)
                : value,
        }));
    };

    const eliminarVenta = async (id: string) => {
        try {
            const docRef = doc(db, "ventas", id);
            await deleteDoc(docRef);
            toast.success("Venta eliminada correctamente.");
        } catch (error) {
            console.error("Error al eliminar venta:", error);
            toast.error("No se pudo eliminar la venta.");
        }
    };

    const guardarEdicion = async (id: string) => {
        const {
            cliente,
            servicio,
            moneda,
            comprobante,
            mesServicio,
            fechaFactura,
            fechaPagoCtaCte,
            abonoCtaCte,
            fechaPagoDeducible,
            igvdeducible,
            subtotal,
            igv,
            total
        } = ventaEditada;

        // Validaciones
        if (
            !cliente ||
            !servicio ||
            !moneda ||
            !comprobante ||
            !mesServicio ||
            !fechaFactura ||
            !fechaPagoCtaCte ||
            abonoCtaCte == null ||
            fechaPagoDeducible == null ||
            igvdeducible == null ||
            subtotal == null ||
            igv == null ||
            total == null
        ) {
            toast.error("Por favor completa todos los campos.");
            return;
        }

        try {
            const docRef = doc(db, "ventas", id);
            await updateDoc(docRef, {
                cliente,
                servicio,
                moneda,
                comprobante,
                mesServicio,
                fechaFactura,
                fechaPagoCtaCte,
                abonoCtaCte,
                fechaPagoDeducible,
                igvdeducible,
                subtotal,
                igv,
                total,
            });

            setVentaEditando(null);
            setVentaEditada({});
            toast.success("Venta actualizada correctamente.");
        } catch (error) {
            console.error("Error al guardar la edición:", error);
            toast.error("Ocurrió un error al guardar los cambios.");
        }
    };

    const [ventaEditando, setVentaEditando] = useState<string | null>(null);
    const [ventaEditada, setVentaEditada] = useState<Partial<Venta>>({});
    const [ventaAEliminar, setVentaAEliminar] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(ventasRef, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Venta[];

            setVentas(data);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="space-y-8">
            <div className="mb-6">
                <button
                    onClick={() => setMostrarFormulario(!mostrarFormulario)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition font-semibold"
                >
                    <span>{mostrarFormulario ? "Ocultar formulario" : "Registrar nueva venta"}</span>
                    <motion.span
                        animate={{ rotate: mostrarFormulario ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </motion.span>
                </button>

                <AnimatePresence>
                    {mostrarFormulario && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden mt-4"
                        >
                            <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input
                                    type="text"
                                    name="cliente"
                                    placeholder="Cliente"
                                    className="border p-2 rounded"
                                    value={nuevaVenta.cliente}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="text"
                                    name="servicio"
                                    placeholder="Servicio del proyecto"
                                    className="border p-2 rounded"
                                    value={nuevaVenta.servicio}
                                    onChange={handleInputChange}
                                />
                                <select
                                    name="moneda"
                                    className="border p-2 rounded"
                                    value={nuevaVenta.moneda}
                                    onChange={handleInputChange}
                                >
                                    <option value="S/">S/ (Soles)</option>
                                    <option value="$">$ (Dólares)</option>
                                </select>
                                <input
                                    type="text"
                                    name="comprobante"
                                    placeholder="N° comprobante"
                                    className="border p-2 rounded"
                                    value={nuevaVenta.comprobante}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="text"
                                    name="mesServicio"
                                    placeholder="Mes de servicio"
                                    className="border p-2 rounded"
                                    value={nuevaVenta.mesServicio}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="date"
                                    name="fechaFactura"
                                    className="border p-2 rounded"
                                    value={nuevaVenta.fechaFactura}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="date"
                                    name="fechaPagoCtaCte"
                                    className="border p-2 rounded"
                                    value={nuevaVenta.fechaPagoCtaCte}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="number"
                                    name="abonoCtaCte"
                                    placeholder="Abono CTA. CTE"
                                    className="border p-2 rounded"
                                    value={nuevaVenta.abonoCtaCte}
                                    onChange={handleInputChange}
                                    min={0}
                                />
                                <input
                                    type="number"
                                    name="fechaPagoDeducible"
                                    placeholder="Pago CTA. DETRAC"
                                    className="border p-2 rounded"
                                    value={nuevaVenta.fechaPagoDeducible}
                                    onChange={handleInputChange}
                                    min={0}
                                />
                                <input
                                    type="number"
                                    name="igvdeducible"
                                    placeholder="IGV CTA. DETRAC"
                                    className="border p-2 rounded"
                                    value={nuevaVenta.igvdeducible}
                                    onChange={handleInputChange}
                                    min={0}
                                />
                                <input
                                    type="number"
                                    name="subtotal"
                                    placeholder="Subtotal"
                                    className="border p-2 rounded"
                                    value={nuevaVenta.subtotal}
                                    onChange={handleInputChange}
                                    min={0}
                                />
                                <input
                                    type="number"
                                    name="igv"
                                    placeholder="IGV"
                                    className="border p-2 rounded"
                                    value={nuevaVenta.igv}
                                    onChange={handleInputChange}
                                    min={0}
                                />
                                <input
                                    type="number"
                                    name="total"
                                    placeholder="Total"
                                    className="border p-2 rounded"
                                    value={nuevaVenta.total}
                                    onChange={handleInputChange}
                                    min={0}
                                />
                                <button
                                    onClick={agregarVenta}
                                    className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 col-span-full"
                                >
                                    Agregar
                                </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-2">Ventas registradas</h3>
                <div className="mt-4 text-right">
                    <motion.button
                        onClick={() => setMostrarTablaExpandida(true)}
                        title="Expandir tabla"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-gray-600 hover:text-black p-2"
                    >
                        <Maximize2 className="w-6 h-6" />
                    </motion.button>
                </div>
                <table className="w-full border border-gray-300 rounded text-left">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="p-2">Cliente</th>
                            <th className="p-2">Servicio</th>
                            <th className="p-2">Moneda</th>
                            <th className="p-2">N° Comprobante</th>
                            <th className="p-2">Mes de Servicio</th>
                            <th className="p-2">Fecha Factura</th>
                            <th className="p-2">Pago CTA. CTE</th>
                            <th className="p-2">Abono CTA. CTE</th>
                            <th className="p-2">Pago CTA. DETRAC</th>
                            <th className="p-2">IGV CTA. DETRAC</th>
                            <th className="p-2">Subtotal</th>
                            <th className="p-2">IGV</th>
                            <th className="p-2">Total</th>
                            <th className="p-2">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ventas.map((venta) => (
                            <tr key={venta.id} className="border-t">
                                {ventaEditando === venta.id ? (
                                    <>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={ventaEditada.cliente ?? venta.cliente}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({ ...prev, cliente: e.target.value }))
                                                }
                                                className="border p-1 rounded w-full"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={ventaEditada.servicio ?? venta.servicio}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({ ...prev, servicio: e.target.value }))
                                                }
                                                className="border p-1 rounded w-full"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <select
                                                value={ventaEditada.moneda ?? venta.moneda}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({ ...prev, moneda: e.target.value as "S/" | "$" }))
                                                }
                                                className="border p-1 rounded w-full"
                                            >
                                                <option value="S/">S/</option>
                                                <option value="$">$</option>
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={ventaEditada.comprobante ?? venta.comprobante}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({ ...prev, comprobante: e.target.value }))
                                                }
                                                className="border p-1 rounded w-full"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={ventaEditada.mesServicio ?? venta.mesServicio}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({ ...prev, mesServicio: e.target.value }))
                                                }
                                                className="border p-1 rounded w-full"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="date"
                                                value={ventaEditada.fechaFactura ?? venta.fechaFactura}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({ ...prev, fechaFactura: e.target.value }))
                                                }
                                                className="border p-1 rounded w-full"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="date"
                                                value={ventaEditada.fechaPagoCtaCte ?? venta.fechaPagoCtaCte}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({ ...prev, fechaPagoCtaCte: e.target.value }))
                                                }
                                                className="border p-1 rounded w-full"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={ventaEditada.abonoCtaCte ?? venta.abonoCtaCte}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({
                                                        ...prev,
                                                        abonoCtaCte: parseFloat(e.target.value),
                                                    }))
                                                }
                                                className="border p-1 rounded w-full"
                                                min={0}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={ventaEditada.fechaPagoDeducible ?? venta.fechaPagoDeducible}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({
                                                        ...prev,
                                                        fechaPagoDeducible: parseFloat(e.target.value),
                                                    }))
                                                }
                                                className="border p-1 rounded w-full"
                                                min={0}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={ventaEditada.igvdeducible ?? venta.igvdeducible}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({
                                                        ...prev,
                                                        igvdeducible: parseFloat(e.target.value),
                                                    }))
                                                }
                                                className="border p-1 rounded w-full"
                                                min={0}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={ventaEditada.subtotal ?? venta.subtotal}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({
                                                        ...prev,
                                                        subtotal: parseFloat(e.target.value),
                                                    }))
                                                }
                                                className="border p-1 rounded w-full"
                                                min={0}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={ventaEditada.igv ?? venta.igv}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({
                                                        ...prev,
                                                        igv: parseFloat(e.target.value),
                                                    }))
                                                }
                                                className="border p-1 rounded w-full"
                                                min={0}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={ventaEditada.total ?? venta.total}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({
                                                        ...prev,
                                                        total: parseFloat(e.target.value),
                                                    }))
                                                }
                                                className="border p-1 rounded w-full"
                                                min={0}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <div className="flex flex-col items-center gap-1">
                                                <button
                                                    onClick={() => guardarEdicion(venta.id)}
                                                    title="Guardar"
                                                    className="text-green-600 hover:text-green-700"
                                                >
                                                    <Save size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setVentaEditando(null);
                                                        setVentaEditada({});
                                                    }}
                                                    title="Cancelar"
                                                    className="text-gray-600 hover:text-gray-700"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-2">{venta.cliente}</td>
                                        <td className="p-2">{venta.servicio}</td>
                                        <td className="p-2">{venta.moneda}</td>
                                        <td className="p-2">{venta.comprobante}</td>
                                        <td className="p-2">{venta.mesServicio}</td>
                                        <td className="p-2">{venta.fechaFactura}</td>
                                        <td className="p-2">{venta.fechaPagoCtaCte}</td>
                                        <td className="p-2">{venta.abonoCtaCte.toFixed(2)}</td>
                                        <td className="p-2">{venta.fechaPagoDeducible.toFixed(2)}</td>
                                        <td className="p-2">{venta.igvdeducible.toFixed(2)}</td>
                                        <td className="p-2">{venta.subtotal.toFixed(2)}</td>
                                        <td className="p-2">{venta.igv.toFixed(2)}</td>
                                        <td className="p-2 font-semibold">{venta.total.toFixed(2)}</td>
                                            <td className="p-2">
                                                <div className="flex flex-col items-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setVentaEditando(venta.id);
                                                            setVentaEditada({ ...venta });
                                                        }}
                                                        title="Editar"
                                                        className="text-yellow-600 hover:text-yellow-700"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setVentaAEliminar(venta.id)}
                                                        title="Eliminar"
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                    </>
                                )}
                            </tr>
                        ))}

                        {ventas.length === 0 && (
                            <tr>
                                <td colSpan={12} className="p-4 text-center text-gray-500">
                                    Aún no hay ventas registradas
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <AnimatePresence>
                    {ventaAEliminar && (
                        <motion.div
                            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-white p-6 rounded-lg shadow-xl w-[90%] max-w-md text-center"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h2 className="text-xl font-bold mb-4">¿Estás seguro?</h2>
                                <p className="mb-6">Esta acción eliminará la venta permanentemente.</p>
                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={async () => {
                                            await eliminarVenta(ventaAEliminar);
                                            setVentaAEliminar(null); // esto hace que desaparezca el modal
                                        }}
                                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                    >
                                        Sí, eliminar
                                    </button>
                                    <button
                                        onClick={() => setVentaAEliminar(null)}
                                        className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <AnimatePresence>
                {mostrarTablaExpandida && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white w-[95vw] h-[90vh] overflow-auto rounded-lg shadow-xl p-6 relative"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">Vista expandida de la tabla</h2>
                                <button
                                    onClick={() => setMostrarTablaExpandida(false)}
                                    className="text-red-500 font-medium hover:underline"
                                >
                                    Cerrar
                                </button>
                            </div>

                            <div className="overflow-auto">
                                <table className="w-full border border-gray-300 rounded text-left">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="p-2">Cliente</th>
                            <th className="p-2">Servicio</th>
                            <th className="p-2">Moneda</th>
                            <th className="p-2">N° Comprobante</th>
                            <th className="p-2">Mes de Servicio</th>
                            <th className="p-2">Fecha Factura</th>
                            <th className="p-2">Pago CTA. CTE</th>
                            <th className="p-2">Abono CTA. CTE</th>
                            <th className="p-2">Pago CTA. DETRAC</th>
                            <th className="p-2">IGV CTA. DETRAC</th>
                            <th className="p-2">Subtotal</th>
                            <th className="p-2">IGV</th>
                            <th className="p-2">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ventas.map((venta) => (
                            <tr key={venta.id} className="border-t">
                                {ventaEditando === venta.id ? (
                                    <>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={ventaEditada.cliente ?? venta.cliente}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({ ...prev, cliente: e.target.value }))
                                                }
                                                className="border p-1 rounded w-full"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={ventaEditada.servicio ?? venta.servicio}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({ ...prev, servicio: e.target.value }))
                                                }
                                                className="border p-1 rounded w-full"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <select
                                                value={ventaEditada.moneda ?? venta.moneda}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({ ...prev, moneda: e.target.value as "S/" | "$" }))
                                                }
                                                className="border p-1 rounded w-full"
                                            >
                                                <option value="S/">S/</option>
                                                <option value="$">$</option>
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={ventaEditada.comprobante ?? venta.comprobante}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({ ...prev, comprobante: e.target.value }))
                                                }
                                                className="border p-1 rounded w-full"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={ventaEditada.mesServicio ?? venta.mesServicio}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({ ...prev, mesServicio: e.target.value }))
                                                }
                                                className="border p-1 rounded w-full"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="date"
                                                value={ventaEditada.fechaFactura ?? venta.fechaFactura}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({ ...prev, fechaFactura: e.target.value }))
                                                }
                                                className="border p-1 rounded w-full"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="date"
                                                value={ventaEditada.fechaPagoCtaCte ?? venta.fechaPagoCtaCte}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({ ...prev, fechaPagoCtaCte: e.target.value }))
                                                }
                                                className="border p-1 rounded w-full"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={ventaEditada.abonoCtaCte ?? venta.abonoCtaCte}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({
                                                        ...prev,
                                                        abonoCtaCte: parseFloat(e.target.value),
                                                    }))
                                                }
                                                className="border p-1 rounded w-full"
                                                min={0}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={ventaEditada.fechaPagoDeducible ?? venta.fechaPagoDeducible}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({
                                                        ...prev,
                                                        fechaPagoDeducible: parseFloat(e.target.value),
                                                    }))
                                                }
                                                className="border p-1 rounded w-full"
                                                min={0}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={ventaEditada.igvdeducible ?? venta.igvdeducible}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({
                                                        ...prev,
                                                        igvdeducible: parseFloat(e.target.value),
                                                    }))
                                                }
                                                className="border p-1 rounded w-full"
                                                min={0}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={ventaEditada.subtotal ?? venta.subtotal}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({
                                                        ...prev,
                                                        subtotal: parseFloat(e.target.value),
                                                    }))
                                                }
                                                className="border p-1 rounded w-full"
                                                min={0}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={ventaEditada.igv ?? venta.igv}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({
                                                        ...prev,
                                                        igv: parseFloat(e.target.value),
                                                    }))
                                                }
                                                className="border p-1 rounded w-full"
                                                min={0}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                value={ventaEditada.total ?? venta.total}
                                                onChange={(e) =>
                                                    setVentaEditada((prev) => ({
                                                        ...prev,
                                                        total: parseFloat(e.target.value),
                                                    }))
                                                }
                                                className="border p-1 rounded w-full"
                                                min={0}
                                            />
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-2">{venta.cliente}</td>
                                        <td className="p-2">{venta.servicio}</td>
                                        <td className="p-2">{venta.moneda}</td>
                                        <td className="p-2">{venta.comprobante}</td>
                                        <td className="p-2">{venta.mesServicio}</td>
                                        <td className="p-2">{venta.fechaFactura}</td>
                                        <td className="p-2">{venta.fechaPagoCtaCte}</td>
                                        <td className="p-2">{venta.abonoCtaCte.toFixed(2)}</td>
                                        <td className="p-2">{venta.fechaPagoDeducible.toFixed(2)}</td>
                                        <td className="p-2">{venta.igvdeducible.toFixed(2)}</td>
                                        <td className="p-2">{venta.subtotal.toFixed(2)}</td>
                                        <td className="p-2">{venta.igv.toFixed(2)}</td>
                                        <td className="p-2 font-semibold">{venta.total.toFixed(2)}</td>                                       
                                    </>
                                )}
                            </tr>
                        ))}

                        {ventas.length === 0 && (
                            <tr>
                                <td colSpan={13} className="p-4 text-center text-gray-500">
                                    Aún no hay ventas registradas
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};