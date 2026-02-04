import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
    PieChart, Pie, Cell, Tooltip, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LabelList
} from 'recharts';
import { FileDown, Pencil, Check, X, TrendingUp, TrendingDown, DollarSign, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTipoCambio } from "../hooks/useTipoCambio";

export const SeguimientoVentas = () => {
    const [ventas, setVentas] = useState<any[]>([]);
    const [gastos, setGastos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [anioSeleccionado, setAnioSeleccionado] = useState<number | null>(new Date().getFullYear());
    const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null);

    // --- LÓGICA DE MONTO VARIABLE ---
    const { getRate, updateRate } = useTipoCambio();
    const [showRates, setShowRates] = useState(false); // Oculto por defecto
    const [editandoTC, setEditandoTC] = useState(false);
    const [tempTC, setTempTC] = useState("");

    // Tasa activa según filtro
    const activeRate = getRate(anioSeleccionado);
    const rateLabel = anioSeleccionado ? `(${anioSeleccionado})` : "(General)";
    const dbKey = anioSeleccionado ? anioSeleccionado.toString() : "general";

    // Modales
    const [modalVisible, setModalVisible] = useState(false);
    const [datosDetalle, setDatosDetalle] = useState<any[]>([]);
    const [tituloDetalle, setTituloDetalle] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                const vSnap = await getDocs(collection(db, "ventas"));
                setVentas(vSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                const gSnap = await getDocs(collection(db, "gastos"));
                setGastos(gSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getFecha = (f: any) => {
        if (!f) return new Date();
        if (f.toDate) return f.toDate();
        if (typeof f === 'string') return new Date(f.includes('T') ? f : f + 'T00:00:00');
        return new Date();
    };

    const filtrarPorFecha = (items: any[], campoFecha: string) => {
        return items.filter(item => {
            const fecha = getFecha(item[campoFecha]);
            const matchAnio = anioSeleccionado ? fecha.getFullYear() === anioSeleccionado : true;
            const matchMes = mesSeleccionado ? (fecha.getMonth() + 1) === mesSeleccionado : true;
            return matchAnio && matchMes;
        });
    };

    // --- CÁLCULOS FINANCIEROS ---
    const getFinancialDataByArea = () => {
        const ventasFiltradas = filtrarPorFecha(ventas, 'fechaFactura');
        const gastosFiltrados = filtrarPorFecha(gastos, 'fecha');
        const areasMap: Record<string, { ventas: number, gastos: number }> = {};

        ventasFiltradas.forEach(v => {
            const area = v.area || "Sin Área";
            const monto = v.moneda === "$" ? (Number(v.total) * activeRate) : Number(v.total);
            if (!areasMap[area]) areasMap[area] = { ventas: 0, gastos: 0 };
            areasMap[area].ventas += monto;
        });

        gastosFiltrados.forEach(g => {
            const area = g.area || "Sin Área";
            const monto = g.moneda === "$" ? (Number(g.monto) * activeRate) : Number(g.monto);
            if (!areasMap[area]) areasMap[area] = { ventas: 0, gastos: 0 };
            areasMap[area].gastos += monto;
        });

        return Object.entries(areasMap).map(([area, val]) => ({
            area,
            ventas: val.ventas,
            gastos: val.gastos,
            saldo: val.ventas - val.gastos
        }));
    };

    const financialData = getFinancialDataByArea();

    // --- TOP CLIENTES (Restaurado y Dinámico) ---
    const getTopClientes = () => {
        const ventasFiltradas = filtrarPorFecha(ventas, 'fechaFactura');
        const mapaCliente: Record<string, { display: string; total: number }> = {};

        ventasFiltradas.forEach(venta => {
            const raw = (venta.cliente ?? "Sin cliente").toString();
            const key = raw.trim().toLowerCase();
            // AQUI APLICAMOS LA CONVERSIÓN DINÁMICA
            const monto = venta.moneda === "$"
                ? ((Number(venta.total) || 0) * activeRate)
                : (Number(venta.total) || 0);

            if (!mapaCliente[key]) {
                mapaCliente[key] = { display: raw.trim() || "Sin cliente", total: 0 };
            }
            mapaCliente[key].total += monto;
        });

        return Object.values(mapaCliente)
            .map(item => ({ cliente: item.display, total: item.total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 15); // Top 15
    };

    const getPieData = () => {
        const vFiltradas = filtrarPorFecha(ventas, 'fechaFactura');
        let soles = 0, dolares = 0;
        vFiltradas.forEach(v => {
            if (v.moneda === "$") dolares += Number(v.total);
            else soles += Number(v.total);
        });
        return [
            { name: "Soles", value: soles, moneda: "S/" },
            { name: "Dólares", value: dolares, moneda: "$" }
        ];
    };

    const pieData = getPieData();
    const totalSoles = pieData[0].value;
    const totalDolares = pieData[1].value;
    const totalGeneral = totalSoles + (totalDolares * activeRate);

    // --- MANEJO DEL MONTO VARIABLE ---
    const iniciarEdicionTC = () => {
        setTempTC(activeRate.toString());
        setEditandoTC(true);
    };

    const guardarTipoCambio = () => {
        const val = parseFloat(tempTC);
        if (val > 0) {
            updateRate(dbKey, val);
            setEditandoTC(false);
        }
    };

    // --- INTERACCIONES ---
    const handleBarClick = (data: any, tipo: 'ventas' | 'gastos') => {
        const area = data.area;
        const itemsRaw = tipo === 'ventas' ? ventas : gastos;
        const campoFecha = tipo === 'ventas' ? 'fechaFactura' : 'fecha';
        let filtrados = filtrarPorFecha(itemsRaw, campoFecha);
        filtrados = filtrados.filter(i => (i.area || "Sin Área") === area);

        setDatosDetalle(filtrados.map(i => ({
            ...i,
            concepto: i.cliente || i.descripcion,
            montoFinal: tipo === 'ventas'
                ? (i.moneda === "$" ? i.total * activeRate : i.total)
                : (i.moneda === "$" ? i.monto * activeRate : i.monto),
            fechaShow: getFecha(i[campoFecha])
        })));
        setTituloDetalle(`${tipo === 'ventas' ? 'Ingresos' : 'Gastos'} - ${area}`);
        setModalVisible(true);
    };

    const handleBarClickCliente = (data: any) => {
        const cliente = data.cliente;
        const ventasFiltradas = filtrarPorFecha(ventas, 'fechaFactura');
        const ventasDeCliente = ventasFiltradas.filter(v => (v.cliente || "Sin cliente") === cliente);

        setDatosDetalle(ventasDeCliente.map(v => ({
            concepto: v.servicio,
            montoFinal: v.moneda === "$" ? v.total * activeRate : v.total,
            fechaShow: getFecha(v.fechaFactura),
            ...v
        })));
        setTituloDetalle(`Detalle Cliente: ${cliente}`);
        setModalVisible(true);
    };

    const descargarPDF = () => {
        const el = document.getElementById("dashboard-content");
        if (el) {
            import("html2pdf.js").then(html2pdf => {
                html2pdf.default().set({
                    margin: 0.2, filename: "Reporte_Financiero.pdf",
                    image: { type: "jpeg", quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: "px", format: [el.offsetWidth, el.offsetHeight], orientation: "landscape" }
                }).from(el).save();
            });
        }
    };

    const CustomBarTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-lg text-sm z-50">
                    <p className="font-bold text-gray-800 border-b pb-1 mb-2">{label}</p>
                    <p className="text-indigo-600 flex justify-between gap-4"><span>Ingresos:</span> <span className="font-mono">S/ {data.ventas.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</span></p>
                    <p className="text-red-500 flex justify-between gap-4"><span>Gastos:</span> <span className="font-mono">S/ {data.gastos.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</span></p>
                    <div className="border-t mt-2 pt-2 flex justify-between gap-4 font-bold"><span>Saldo:</span> <span className={data.saldo >= 0 ? "text-green-600" : "text-red-600"}>S/ {data.saldo.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</span></div>
                </div>
            );
        }
        return null;
    };

    if (loading) return <div className="p-10 text-center">Cargando...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Financiero</h1>
                <div className="flex gap-3 items-center">
                    <button
                        onClick={() => setShowRates(!showRates)}
                        className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title={showRates ? "Ocultar Monto Variable" : "Ver Monto Variable"}
                    >
                        {showRates ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>

                    <div className="h-8 w-px bg-gray-300 mx-1"></div>

                    <select className="input-field" value={anioSeleccionado || ""} onChange={e => setAnioSeleccionado(e.target.value ? parseInt(e.target.value) : null)}>
                        <option value="">Todos los años</option>
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select className="input-field" value={mesSeleccionado || ""} onChange={e => setMesSeleccionado(e.target.value ? parseInt(e.target.value) : null)}>
                        <option value="">Todo el año</option>
                        {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <button onClick={descargarPDF} className="btn-secondary"><FileDown size={18} /></button>
                </div>
            </div>

            <div id="dashboard-content" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="card p-4 border-l-4 border-indigo-500 bg-indigo-50/50">
                        <div className="flex items-center gap-2 mb-1"><TrendingUp size={16} className="text-indigo-600" /><p className="text-xs font-bold text-gray-500 uppercase">Ingresos Totales</p></div>
                        <p className="text-2xl font-bold text-gray-900">S/ {totalGeneral.toLocaleString('es-PE', { maximumFractionDigits: 0 })}</p>
                    </div>

                    <div className="card p-4 border-l-4 border-red-500 bg-red-50/50">
                        <div className="flex items-center gap-2 mb-1"><TrendingDown size={16} className="text-red-600" /><p className="text-xs font-bold text-gray-500 uppercase">Gastos Totales</p></div>
                        <p className="text-2xl font-bold text-gray-900">S/ {financialData.reduce((acc, curr) => acc + curr.gastos, 0).toLocaleString('es-PE', { maximumFractionDigits: 0 })}</p>
                    </div>

                    <div className="card p-4 border-l-4 border-green-500 bg-green-50/50">
                        <div className="flex items-center gap-2 mb-1"><DollarSign size={16} className="text-green-600" /><p className="text-xs font-bold text-gray-500 uppercase">Utilidad Neta</p></div>
                        <p className="text-2xl font-bold text-gray-900">S/ {(totalGeneral - financialData.reduce((acc, curr) => acc + curr.gastos, 0)).toLocaleString('es-PE', { maximumFractionDigits: 0 })}</p>
                    </div>

                    {/* CARD MONTO VARIABLE */}
                    <AnimatePresence mode="wait">
                        {showRates ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                className="card p-4 flex flex-col justify-center border border-blue-100 shadow-md"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Monto Variable {rateLabel}</p>
                                    {!editandoTC && <Pencil size={12} className="text-gray-400 cursor-pointer hover:text-blue-600" onClick={iniciarEdicionTC} />}
                                </div>
                                {editandoTC ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold">S/</span>
                                        <input autoFocus type="number" className="w-full border rounded px-1 py-0.5 text-lg font-bold" value={tempTC} onChange={e => setTempTC(e.target.value)} onKeyDown={e => e.key === 'Enter' && guardarTipoCambio()} />
                                        <Check size={16} className="text-green-600 cursor-pointer" onClick={guardarTipoCambio} />
                                    </div>
                                ) : (
                                    <p className="text-2xl font-bold text-gray-800">S/ {activeRate.toFixed(2)}</p>
                                )}
                            </motion.div>
                        ) : (
                            // ESPACIO VACÍO CUANDO ESTÁ OCULTO: 
                            // Renderizamos un div vacío pero visible en el DOM para mantener la grilla alineada (4 columnas)
                            <div className="hidden md:block"></div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="card p-6 lg:col-span-2 min-h-[400px]">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Balance por Área Operativa</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={financialData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="area" tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={(val) => `S/ ${(val / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomBarTooltip />} />
                                <Legend />
                                <Bar name="Ingresos" dataKey="ventas" fill="#6366f1" radius={[4, 4, 0, 0]} onClick={(d) => handleBarClick(d, 'ventas')}>
                                    <LabelList dataKey="ventas" position="top" formatter={(val: any) => Number(val) > 0 ? `S/ ${Number(val).toLocaleString('es-PE', { maximumFractionDigits: 0 })}` : ''} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                                </Bar>
                                <Bar name="Gastos" dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} onClick={(d) => handleBarClick(d, 'gastos')}>
                                    <LabelList dataKey="gastos" position="top" formatter={(val: any) => Number(val) > 0 ? `S/ ${Number(val).toLocaleString('es-PE', { maximumFractionDigits: 0 })}` : ''} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="card p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Moneda de Ingreso</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}>
                                    <Cell fill="#10b981" /><Cell fill="#3b82f6" />
                                </Pie>
                                <Tooltip formatter={(value: number, _name: string, props: any) => `${props.payload.moneda} ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2 text-sm border-t pt-4">
                            <div className="flex justify-between"><span>Total Dólares:</span> <span className="font-bold">$ {totalDolares.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>Total Soles:</span> <span className="font-bold">S/ {totalSoles.toLocaleString()}</span></div>
                            <div className="flex justify-between text-xs text-gray-500 mt-2 pt-2 border-t"><span>Conversión usada:</span> <span>{activeRate.toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>

                {/* TOP CLIENTES RESTAURADO */}
                <div className="card p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">Top Clientes (en Soles)</h2>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={getTopClientes()} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="cliente" width={150} tick={{ fontSize: 11 }} />
                            <Tooltip cursor={{ fill: '#f3f4f6' }} formatter={(val: any) => `S/ ${Number(val).toLocaleString('es-PE')}`} />
                            <Bar dataKey="total" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} onClick={handleBarClickCliente}>
                                <LabelList
                                    dataKey="total"
                                    position="right"
                                    formatter={(val: any) => `S/ ${Number(val).toLocaleString('es-PE')}`}
                                    style={{ fontSize: '11px', fill: '#6b7280' }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

            </div>

            <AnimatePresence>
                {modalVisible && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[80vh] flex flex-col">
                            <div className="p-4 bg-gray-50 border-b flex justify-between"><h3 className="font-bold">{tituloDetalle}</h3><button onClick={() => setModalVisible(false)}><X size={20} /></button></div>
                            <div className="overflow-y-auto flex-1 p-0">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 text-xs uppercase"><tr><th className="px-4 py-2 text-left">Concepto</th><th className="px-4 py-2 text-right">Fecha</th><th className="px-4 py-2 text-right">Monto</th></tr></thead>
                                    <tbody className="divide-y">
                                        {datosDetalle.map((d, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-2 truncate max-w-[150px]">{d.concepto}</td>
                                                <td className="px-4 py-2 text-right text-gray-500">{d.fechaShow.toLocaleDateString()}</td>
                                                <td className="px-4 py-2 text-right font-bold">S/ {d.montoFinal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-3 border-t bg-gray-50 text-right"><span className="font-bold mr-4">Total: S/ {datosDetalle.reduce((a, b) => a + b.montoFinal, 0).toLocaleString('es-PE')}</span><button onClick={() => setModalVisible(false)} className="btn-primary py-1">Cerrar</button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};