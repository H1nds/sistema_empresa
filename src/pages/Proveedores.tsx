import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Plus, Search, Trash2, ShoppingBag, ShoppingCart, X, FileText, ArrowLeft, CheckCircle, Calculator, Pencil } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useProductos, type Producto } from "../hooks/useProductos";
import { ModalProducto } from "../components/eventos/ModalProducto";
import { usePedidos } from "../hooks/usePedidos";
import { useTipoCambio } from "../hooks/useTipoCambio"; // Importamos el cerebro financiero
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

export interface CartItem extends Producto {
    cartItemId: string;
    precioEditable: number | string;
}

export const Proveedores = () => {
    const { role } = useAuth();
    const isAdmin = role === 'ADMIN';
    const { productos, loading, agregarProducto, eliminarProducto } = useProductos();
    const { agregarPedido } = usePedidos();
    const { getRate } = useTipoCambio(); // Obtenemos la tasa de cambio
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
    const { editarProducto } = useProductos(); // Asegúrate de extraer esto de tu hook

    // --- ESTADO DEL CARRITO Y PROPUESTA ---
    const [carrito, setCarrito] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

    // Nuevos estados para contabilidad
    const [step, setStep] = useState<"CART" | "PREVIEW">("CART"); // Controla si vemos el carrito o la boleta
    const [aplicarIGV, setAplicarIGV] = useState(false);
    const [moneda, setMoneda] = useState<"PEN" | "USD">("PEN");
    const [clientePropuesta, setClientePropuesta] = useState("");

    const Toast = Swal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true, customClass: { popup: 'rounded-xl' }
    });

    const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.proveedor.toLowerCase().includes(search.toLowerCase())
    );

    const handleGuardarProducto = async (datos: any, archivo?: File) => {
        try {
            if (productoAEditar) {
                // Modo Edición
                await editarProducto(productoAEditar.id, datos, archivo);
                Swal.fire({ title: '¡Actualizado!', text: 'El producto se modificó.', icon: 'success', timer: 1500, showConfirmButton: false });
            } else {
                // Modo Nuevo
                if (!archivo) throw new Error("Se requiere imagen para un producto nuevo");
                await agregarProducto(datos, archivo);
                Swal.fire({ title: '¡Publicado!', text: 'El producto está en el catálogo.', icon: 'success', timer: 1500, showConfirmButton: false });
            }
        } catch (error) {
            Swal.fire('Error', 'No se pudo procesar el producto.', 'error');
            throw error;
        }
    };

    const handleDelete = (id: string) => {
        Swal.fire({ title: '¿Retirar producto?', text: "Esta acción no se puede deshacer", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Sí, retirar' })
            .then(async (result) => { if (result.isConfirmed) await eliminarProducto(id); });
    };

    const agregarAlCarrito = (producto: Producto) => {
        const nuevoItem: CartItem = { ...producto, cartItemId: Math.random().toString(36).substring(2, 9), precioEditable: producto.precio };
        setCarrito([...carrito, nuevoItem]);
        Toast.fire({ icon: 'success', title: 'Agregado a la propuesta' });
    };

    const quitarDelCarrito = (cartItemId: string) => {
        const nuevoCarrito = carrito.filter(item => item.cartItemId !== cartItemId);
        setCarrito(nuevoCarrito);
        if (nuevoCarrito.length === 0) {
            setIsCartOpen(false);
            setStep("CART");
        }
    };

    const actualizarPrecioCarrito = (cartItemId: string, nuevoPrecio: string) => {
        setCarrito(carrito.map(item => item.cartItemId === cartItemId ? { ...item, precioEditable: nuevoPrecio } : item));
    };

    // --- CÁLCULOS CONTABLES ---
    const tasaCambio = getRate(); // Ej: 3.85
    const subtotalBase = carrito.reduce((acc, item) => acc + (Number(item.precioEditable) || 0), 0);
    const montoIGV = aplicarIGV ? subtotalBase * 0.18 : 0;
    const totalSoles = subtotalBase + montoIGV;

    // Valores a mostrar según la moneda seleccionada
    const factorConversion = moneda === "USD" ? (1 / tasaCambio) : 1;
    const simbolo = moneda === "USD" ? "$" : "S/";

    const subtotalMostrar = subtotalBase * factorConversion;
    const igvMostrar = montoIGV * factorConversion;
    const totalMostrar = totalSoles * factorConversion;

    const abrirCarrito = () => {
        setStep("CART");
        setIsCartOpen(true);
    };

    const handleGenerarPropuesta = async () => {
        if (carrito.length === 0 || isSubmittingOrder) return;
        setIsSubmittingOrder(true);
        try {
            // AHORA ENVIAMOS TODA LA DATA CONTABLE
            await agregarPedido(
                carrito,
                totalSoles,
                totalMostrar,
                moneda,
                aplicarIGV,
                tasaCambio,
                clientePropuesta // Pasamos el nombre del cliente
            );

            setCarrito([]);
            setClientePropuesta(""); // Limpiamos
            setIsCartOpen(false);
            setStep("CART");
            Swal.fire({ title: '¡Propuesta Generada!', text: 'Se ha guardado en el registro histórico.', icon: 'success', timer: 2000, showConfirmButton: false });
            navigate('/eventos/registro');
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar la propuesta.', 'error');
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Catálogo E-Commerce</h1>
                    <p className="text-gray-500 text-sm">Explora productos y genera propuestas comerciales.</p>
                </div>
                {isAdmin && (
                    <button onClick={() => { setProductoAEditar(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/30">
                        <Plus size={18} /> Nuevo Producto
                    </button>
                )}
            </div>

            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex gap-4 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-transparent rounded-xl text-sm outline-none focus:ring-0" />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin"></div></div>
            ) : filtrados.length === 0 ? (
                <div className="card p-16 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4"><ShoppingBag size={32} /></div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Catálogo Vacío</h3>
                    <p className="text-gray-500 max-w-sm">No hay productos disponibles.</p>
                </div>
            ) : (
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {filtrados.map((producto) => (
                            <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }} key={producto.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-gray-200/50 border border-gray-100 transition-all duration-300 flex flex-col">
                                <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
                                    <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1.5 text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                                        <Store size={12} className="text-primary-500" /> {producto.proveedor}
                                    </div>
                                    {isAdmin && (
                                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                            <button
                                                onClick={() => { setProductoAEditar(producto); setIsModalOpen(true); }}
                                                className="p-2 bg-blue-500/90 hover:bg-blue-600 text-white rounded-xl shadow-lg"
                                                title="Editar Producto"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(producto.id)}
                                                className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-xl shadow-lg"
                                                title="Eliminar Producto"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{producto.nombre}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2 flex-1 mb-4">{producto.descripcion}</p>
                                    <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-50">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Precio Sugerido</p>
                                            <p className="text-xl font-black text-primary-600">S/ {producto.precio.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <button onClick={() => agregarAlCarrito(producto)} className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-primary-600 hover:scale-105 transition-all shadow-md group/btn"><ShoppingBag size={18} className="group-hover/btn:-translate-y-0.5 transition-transform" /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* BOLA FLOTANTE */}
            <AnimatePresence>
                {carrito.length > 0 && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0, rotate: -90 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0, opacity: 0, rotate: 90 }}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={abrirCarrito}
                        className="fixed bottom-8 right-8 z-40 bg-primary-600 hover:bg-primary-700 text-white w-16 h-16 rounded-full shadow-[0_10px_40px_rgba(99,102,241,0.5)] flex items-center justify-center transition-colors border-4 border-white"
                    >
                        <ShoppingCart size={24} />
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key={carrito.length} className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            {carrito.length}
                        </motion.div>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* MODAL PRINCIPAL (CARRITO / PROPUESTA) */}
            <AnimatePresence>
                {isCartOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
                        >
                            {/* --- PASO 1: CARRITO DE COMPRAS --- */}
                            {step === "CART" && (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full max-h-[90vh]">
                                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-primary-100 text-primary-600 rounded-xl"><Calculator size={24} /></div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Resumen de Compra</h2>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{carrito.length} productos agregados</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-400"><X size={24} /></button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/30">
                                        <AnimatePresence>
                                            {carrito.map((item) => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} layout key={item.cartItemId} className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                                    <img src={item.imagenUrl} alt={item.nombre} className="w-16 h-16 rounded-xl object-cover border border-gray-50" />
                                                    <div className="flex-1 text-center sm:text-left">
                                                        <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{item.nombre}</h4>
                                                        <p className="text-xs text-gray-500 flex items-center justify-center sm:justify-start gap-1 mt-1"><Store size={12} /> {item.proveedor}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 focus-within:border-primary-500 transition-all flex-1 sm:flex-initial">
                                                            <span className="text-sm font-bold text-gray-400">S/</span>
                                                            <input type="number" value={item.precioEditable} onChange={(e) => actualizarPrecioCarrito(item.cartItemId, e.target.value)} className="w-full sm:w-24 bg-transparent text-sm font-bold text-gray-900 text-right outline-none" placeholder="0.00" />
                                                        </div>
                                                        <button onClick={() => quitarDelCarrito(item.cartItemId)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>

                                    {/* PANEL CONTABLE INTERACTIVO */}
                                    <div className="p-6 border-t border-gray-100 bg-white">
                                        <div className="flex flex-col sm:flex-row justify-between gap-6 mb-6">
                                            {/* Controles Contables */}
                                            <div className="space-y-4 flex-1">
                                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                                                    <span className="text-sm font-bold text-gray-700">Incluir IGV (18%)</span>
                                                    <button onClick={() => setAplicarIGV(!aplicarIGV)} className={`w-12 h-6 rounded-full transition-colors relative ${aplicarIGV ? 'bg-primary-500' : 'bg-gray-300'}`}>
                                                        <motion.div layout className={`w-4 h-4 bg-white rounded-full absolute top-1 ${aplicarIGV ? 'right-1' : 'left-1'}`} />
                                                    </button>
                                                </div>
                                                <div className="flex p-1 bg-gray-100 rounded-lg">
                                                    <button onClick={() => setMoneda("PEN")} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${moneda === "PEN" ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Soles (PEN)</button>
                                                    <button onClick={() => setMoneda("USD")} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${moneda === "USD" ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Dólares (USD)</button>
                                                </div>
                                                {moneda === "USD" && <p className="text-[10px] text-gray-400 italic">Tasa ref: S/ {tasaCambio}</p>}
                                            </div>

                                            {/* Totales */}
                                            <div className="flex-1 text-right space-y-2">
                                                <div className="flex justify-between text-sm text-gray-500"><span>Subtotal:</span> <span>{simbolo} {subtotalMostrar.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span></div>
                                                {aplicarIGV && <div className="flex justify-between text-sm text-red-400"><span>IGV (18%):</span> <span>{simbolo} {igvMostrar.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span></div>}
                                                <div className="flex justify-between items-end pt-2 border-t border-gray-100">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Final</span>
                                                    <span className="text-3xl font-black text-gray-900 tracking-tight">{simbolo} {totalMostrar.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button onClick={() => setStep("PREVIEW")} className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-base transition-all shadow-lg flex items-center justify-center gap-2 hover:-translate-y-0.5">
                                            <FileText size={20} /> Proceder a la Propuesta
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* --- PASO 2: VISTA PREVIA BOLETA / PROPUESTA --- */}
                            {step === "PREVIEW" && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col h-full max-h-[90vh] bg-gray-100">
                                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm z-10">
                                        <button onClick={() => setStep("CART")} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"><ArrowLeft size={16} /> Volver a editar</button>
                                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Vista Previa</h2>
                                    </div>

                                    {/* Documento Estilo A4 */}
                                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex justify-center">
                                        <div className="bg-white w-full max-w-2xl rounded-sm shadow-md border border-gray-200 p-8 md:p-12 font-sans relative">
                                            {/* Sello de agua sutil */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none"><Store size={300} /></div>

                                            <div className="border-b-2 border-gray-800 pb-6 mb-6 flex justify-between items-end">
                                                <div>
                                                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">PROPUESTA COMERCIAL</h1>
                                                    {/* NUEVO INPUT PARA EL CLIENTE */}
                                                    <div className="mt-3">
                                                        <input
                                                            type="text"
                                                            placeholder="Empresa / Cliente destino..."
                                                            value={clientePropuesta}
                                                            onChange={(e) => setClientePropuesta(e.target.value)}
                                                            className="text-sm font-bold text-gray-600 bg-transparent border-b border-dashed border-gray-300 focus:border-primary-500 outline-none w-64 pb-1 transition-colors"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center ml-auto mb-2"><span className="text-white font-bold">FB</span></div>
                                                    <p className="text-xs font-bold text-gray-800">FB Group SAC</p>
                                                </div>
                                            </div>

                                            <table className="w-full text-sm text-left mb-8 relative z-10">
                                                <thead className="bg-gray-50 text-gray-600 font-bold border-y border-gray-200">
                                                    <tr>
                                                        <th className="py-3 px-2 w-12 text-center">Cant.</th>
                                                        <th className="py-3 px-2">Descripción</th>
                                                        <th className="py-3 px-2 text-right">V. Unitario</th>
                                                        <th className="py-3 px-2 text-right">Importe</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {carrito.map((item, idx) => {
                                                        const valorBaseSoles = Number(item.precioEditable) || 0;
                                                        const valorUnitario = valorBaseSoles * factorConversion;
                                                        return (
                                                            <tr key={idx}>
                                                                <td className="py-4 px-2 text-center text-gray-500 font-medium">1</td>
                                                                <td className="py-4 px-2">
                                                                    <p className="font-bold text-gray-800">{item.nombre}</p>
                                                                    <p className="text-xs text-gray-400 mt-0.5">Prov: {item.proveedor}</p>
                                                                </td>
                                                                <td className="py-4 px-2 text-right font-mono text-gray-600">{simbolo} {valorUnitario.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                                                                <td className="py-4 px-2 text-right font-mono font-bold text-gray-900">{simbolo} {valorUnitario.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>

                                            <div className="w-full md:w-1/2 ml-auto space-y-2 text-sm relative z-10">
                                                <div className="flex justify-between text-gray-600 px-2"><span>Subtotal Base:</span> <span className="font-mono">{simbolo} {subtotalMostrar.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span></div>
                                                <div className="flex justify-between text-gray-600 px-2"><span>IGV (18%):</span> <span className="font-mono">{simbolo} {igvMostrar.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span></div>
                                                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 mt-2">
                                                    <span className="font-bold text-gray-800">TOTAL A PAGAR:</span>
                                                    <span className="text-xl font-black text-primary-600 font-mono">{simbolo} {totalMostrar.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>

                                            <div className="mt-12 text-center border-t border-gray-200 pt-6">
                                                <p className="text-xs text-gray-400">Documento interno sin valor tributario. Moneda expresada en {moneda === "PEN" ? "Soles Peruanos" : "Dólares Americanos"}.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white border-t border-gray-200 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                                        <button onClick={handleGenerarPropuesta} disabled={isSubmittingOrder} className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-base transition-all shadow-lg flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-70">
                                            {isSubmittingOrder ? <div className="spinner-white" /> : <><CheckCircle size={20} /> Emitir y Generar Registro</>}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {isAdmin && (
                <ModalProducto
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setProductoAEditar(null); }}
                    onSubmit={handleGuardarProducto}
                    initialData={productoAEditar}
                />
            )}
        </div>
    );
};