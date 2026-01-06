import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
    PieChart, Pie, Cell, Tooltip, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LabelList
} from 'recharts';
import { FileDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const SeguimientoVentas = () => {
    const [ventas, setVentas] = useState<any[]>([]);
    const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
    const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null);
    const [cargando, setCargando] = useState(true);
    const [modoComparacion, setModoComparacion] = useState(false);
    const [anioComparar1, setAnioComparar1] = useState<number | null>(null);
    const [anioComparar2, setAnioComparar2] = useState<number | null>(null);
    const [tipoCambio, setTipoCambio] = useState<number | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [areaSeleccionada, setAreaSeleccionada] = useState("");
    const [ventasAreaSeleccionada, setVentasAreaSeleccionada] = useState<any[]>([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState("");
    const [ventasClienteSeleccionada, setVentasClienteSeleccionada] = useState<any[]>([]);
    const [dataComparacionArea, setDataComparacionArea] = useState<
        { area: string;[year: number]: number }[]
    >([]);

    const convertirFechaFactura = (fecha: any) => {
        if (typeof fecha === 'number') {
            const fechaBase = new Date(1899, 11, 30);
            fechaBase.setDate(fechaBase.getDate() + fecha);
            return fechaBase;
        } else if (typeof fecha === 'string') {
            return new Date(fecha);
        } else if (fecha?.toDate) {
            return fecha.toDate();
        } else {
            return new Date();
        }
    };

    const handleBarClick = (data: any) => {
        const area = data.area;
        const ventasFiltradasArea = ventas.filter(venta => {
            const fecha = convertirFechaFactura(venta.fechaFactura);
            const matchDate = mesSeleccionado
                ? fecha.getMonth() + 1 === mesSeleccionado && fecha.getFullYear() === anioSeleccionado
                : fecha.getFullYear() === anioSeleccionado;
            return matchDate && (venta.area || "Sin área") === area;
        });

        setVentasAreaSeleccionada(ventasFiltradasArea);
        setAreaSeleccionada(area);
        setModalVisible(true);
    };

    const handleBarClickCliente = (data: any) => {
        const cliente = data.cliente;
        const ventasFiltradasCliente = ventas.filter(venta => {
            const fecha = convertirFechaFactura(venta.fechaFactura);
            const matchDate = mesSeleccionado
                ? fecha.getMonth() + 1 === mesSeleccionado && fecha.getFullYear() === anioSeleccionado
                : fecha.getFullYear() === anioSeleccionado;
            return matchDate && (venta.cliente || "Sin cliente") === cliente;
        });

        setVentasClienteSeleccionada(ventasFiltradasCliente);
        setClienteSeleccionado(cliente);
        setModalVisible(true);
    };

    // --- CORRECCIÓN AQUÍ: Manejo seguro del fetch ---
    // Efecto INTELIGENTE con Caché para evitar bloqueo 429
    useEffect(() => {
        const fetchTipoCambio = async () => {
            const HOY = new Date().toISOString().split('T')[0]; // Ejemplo: "2026-01-06"
            const cacheKey = 'tipoCambioSunat';

            // 1. Intentar leer de la memoria local (Caché)
            const cacheGuardado = localStorage.getItem(cacheKey);

            if (cacheGuardado) {
                const { fecha, valor } = JSON.parse(cacheGuardado);
                // Si el dato guardado es de HOY, lo usamos y no llamamos a la API
                if (fecha === HOY) {
                    console.log("Usando tipo de cambio desde caché (sin gastar API):", valor);
                    setTipoCambio(valor);
                    return;
                }
            }

            // 2. Si no hay caché de hoy, llamamos a la API
            try {
                console.log("Obteniendo tipo de cambio fresco desde API...");
                const res = await fetch('/api/tipo-cambio-sunat');

                if (!res.ok) {
                    if (res.status === 429) console.warn("API saturada (429). Usando valor respaldo.");
                    // Si falla, usamos el último valor conocido o uno por defecto
                    setTipoCambio(prev => prev || 3.85);
                    return;
                }

                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    if (json.venta) {
                        const nuevoValor = parseFloat(json.venta);
                        setTipoCambio(nuevoValor);

                        // 3. GUARDAMOS en caché para no volver a llamar hoy
                        localStorage.setItem(cacheKey, JSON.stringify({
                            fecha: HOY,
                            valor: nuevoValor
                        }));
                    }
                } catch (e) {
                    console.error("Respuesta API no válida");
                }
            } catch (err) {
                console.error('Error de red API:', err);
                setTipoCambio(3.85); // Valor por defecto si no hay internet
            }
        };

        fetchTipoCambio();
    }, []);
    // ------------------------------------------------

    useEffect(() => {
        const obtenerVentas = async () => {
            try {
                const ventasRef = collection(db, "ventas");
                const snapshot = await getDocs(ventasRef);
                const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setVentas(datos);
            } catch (error) {
                console.error("Error al obtener ventas:", error);
            } finally {
                setCargando(false);
            }
        };

        obtenerVentas();
    }, []);

    const obtenerDatosPie = () => {
        const ventasFiltradas = ventas.filter(venta => {
            const fecha = convertirFechaFactura(venta.fechaFactura);
            return mesSeleccionado
                ? fecha.getMonth() + 1 === mesSeleccionado && fecha.getFullYear() === anioSeleccionado
                : fecha.getFullYear() === anioSeleccionado;
        });

        let totalSoles = 0;
        let totalDolares = 0;

        ventasFiltradas.forEach(venta => {
            if (venta.moneda === "S/") {
                totalSoles += venta.total || 0;
            } else if (venta.moneda === "$") {
                totalDolares += venta.total || 0;
            }
        });

        return [
            { moneda: "Soles", valor: Math.round(totalSoles) },
            { moneda: "Dólares", valor: Math.round(totalDolares) },
        ];
    };

    const obtenerDatosPorAreaFiltrada = () => {
        const ventasFiltradas = ventas.filter(venta => {
            const fecha = convertirFechaFactura(venta.fechaFactura);
            return mesSeleccionado
                ? fecha.getMonth() + 1 === mesSeleccionado && fecha.getFullYear() === anioSeleccionado
                : fecha.getFullYear() === anioSeleccionado;
        });

        const ventasPorArea: { [area: string]: number } = {};
        ventasFiltradas.forEach(venta => {
            const area = venta.area || "Sin área";
            const monto = venta.moneda === "$"
                ? ((venta.total || 0) * (tipoCambio ?? 0))
                : (venta.total || 0);

            ventasPorArea[area] = (ventasPorArea[area] || 0) + monto;
        });

        return Object.entries(ventasPorArea).map(([area, total]) => ({
            area,
            total,
        }));
    };

    const obtenerDatosPorClienteFiltrada = () => {
        const ventasFiltradas = ventas.filter(venta => {
            const fecha = convertirFechaFactura(venta.fechaFactura);
            return mesSeleccionado
                ? fecha.getMonth() + 1 === mesSeleccionado && fecha.getFullYear() === anioSeleccionado
                : fecha.getFullYear() === anioSeleccionado;
        });

        const mapaCliente: Record<string, { display: string; total: number }> = {};

        ventasFiltradas.forEach(venta => {
            const raw = (venta.cliente ?? "Sin cliente").toString();
            const key = raw.trim().toLowerCase();
            const monto = venta.moneda === "$"
                ? ((venta.total || 0) * (tipoCambio ?? 0))
                : (venta.total || 0);

            if (!mapaCliente[key]) {
                mapaCliente[key] = { display: raw.trim() || "Sin cliente", total: 0 };
            }

            mapaCliente[key].total += monto;
        });

        return Object.values(mapaCliente)
            .map(item => ({ cliente: item.display, total: item.total }))
            .sort((a, b) => b.total - a.total);
    };

    const descargarPDF = () => {
        const elemento = document.getElementById("contenedorGraficas");
        if (!elemento) return;

        const ancho = elemento.offsetWidth;
        const alto = elemento.offsetHeight;

        import("html2pdf.js").then(html2pdf => {
            const opt = {
                margin: 0.2,
                filename: "seguimiento.pdf",
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: {
                    unit: "px",
                    format: [ancho, alto],
                    orientation: "landscape"
                }
            };
            // @ts-ignore
            html2pdf.default().set(opt).from(elemento).save();
        });
    };

    const handleComparar = () => {
        if (!anioComparar1 || !anioComparar2) {
            alert("Selecciona ambos años antes de comparar");
            return;
        }
        if (anioComparar1 === anioComparar2) {
            alert("No se puede comparar dos años iguales");
            return;
        }

        const mapa: Record<string, { [y: number]: number }> = {};

        ventas.forEach(venta => {
            const fecha = convertirFechaFactura(venta.fechaFactura);
            const año = fecha.getFullYear();
            if (año !== anioComparar1 && año !== anioComparar2) return;

            const area = venta.area || "Sin área";
            const montoPen = venta.moneda === "$"
                ? (venta.total || 0) * (tipoCambio ?? 0)
                : (venta.total || 0);

            if (!mapa[area]) mapa[area] = {};
            mapa[area][año] = (mapa[area][año] || 0) + montoPen;
        });

        const resultado = Object.entries(mapa).map(([area, vals]) => ({
            area,
            [anioComparar1!]: vals[anioComparar1!] || 0,
            [anioComparar2!]: vals[anioComparar2!] || 0
        }));

        setDataComparacionArea(resultado);
    };

    const datosPie = obtenerDatosPie();
    const resumenTotalSoles = datosPie.find(d => d.moneda === "Soles")?.valor || 0;
    const resumenTotalDolares = datosPie.find(d => d.moneda === "Dólares")?.valor || 0;
    const resumenVentasConvertidas = tipoCambio != null
        ? resumenTotalDolares * tipoCambio
        : 0;
    const resumenTotalAnualPen = resumenTotalSoles + resumenVentasConvertidas;

    if (cargando) {
        return <div className="p-10 text-center text-gray-500">Cargando estadísticas...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            {!modoComparacion ? (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">Seguimiento de Ventas</h1>

                        <div className="flex flex-wrap gap-3 items-center">
                            <select
                                className="input-field max-w-[100px]"
                                value={anioSeleccionado}
                                onChange={e => setAnioSeleccionado(parseInt(e.target.value))}
                            >
                                {[2022, 2023, 2024, 2025].map(anio => (
                                    <option key={anio} value={anio}>{anio}</option>
                                ))}
                            </select>

                            <select
                                className="input-field max-w-[150px]"
                                value={mesSeleccionado ?? ""}
                                onChange={e => setMesSeleccionado(e.target.value === "" ? null : parseInt(e.target.value))}
                            >
                                <option value="">Todos los meses</option>
                                {[
                                    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                                ].map((mes, i) => (
                                    <option key={i} value={i + 1}>{mes}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => setModoComparacion(true)}
                                className="btn-secondary"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 4h10M5 11h14M5 15h14M5 19h14" />
                                </svg>
                                Comparar
                            </button>

                            <button
                                onClick={descargarPDF}
                                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-red-600 transition-colors shadow-sm"
                                title="Descargar PDF"
                            >
                                <FileDown size={20} />
                            </button>
                        </div>
                    </div>

                    <div
                        id="contenedorGraficas"
                        className="mx-auto space-y-6"
                        style={{ maxWidth: "100%" }}
                    >
                        {/* Row superior: Pie + Área */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Gráfica Pastel */}
                            <div className="card p-6 flex flex-col md:flex-row gap-6">
                                <div className="flex-1 min-h-[300px]">
                                    <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
                                        Ingresos Totales {mesSeleccionado ? "del Mes" : "Anuales"}
                                    </h2>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={datosPie}
                                                dataKey="valor"
                                                nameKey="moneda"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                            >
                                                <Cell fill="#10B981" />
                                                <Cell fill="#3B82F6" />
                                            </Pie>
                                            <Tooltip formatter={(value: number) =>
                                                `S/. ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
                                            } />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="w-full md:w-48 bg-gray-50 p-4 rounded-xl flex flex-col justify-center space-y-4">
                                    <div>
                                        <p className="label-text">Dólar Actual</p>
                                        <p className="text-lg font-bold text-gray-800">
                                            {tipoCambio != null ? `S/ ${tipoCambio.toFixed(3)}` : "..."}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="label-text">Total Dólares (S/)</p>
                                        <p className="text-lg font-bold text-blue-600">
                                            {tipoCambio ? `S/ ${resumenVentasConvertidas.toLocaleString("es-PE", { maximumFractionDigits: 0 })}` : "-"}
                                        </p>
                                    </div>
                                    <div className="pt-2 border-t border-gray-200">
                                        <p className="label-text">Total General</p>
                                        <p className="text-xl font-black text-green-600">
                                            S/ {(tipoCambio ? resumenTotalAnualPen : resumenTotalSoles).toLocaleString("es-PE", { maximumFractionDigits: 0 })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Gráfica Barras Área */}
                            <div className="card p-6 min-h-[300px]">
                                <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
                                    Ventas por Área
                                </h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={obtenerDatosPorAreaFiltrada()}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="area" tick={{ fontSize: 12 }} />
                                        <YAxis tickFormatter={(val) => `S/ ${(val / 1000).toFixed(0)}k`} />
                                        <Tooltip formatter={(val: number) => `S/ ${val.toLocaleString('es-PE')}`} />
                                        <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} onClick={handleBarClick}>
                                            <LabelList dataKey="total" position="top" formatter={(val: any) => Number(val) > 0 ? `S/ ${(Number(val) / 1000).toFixed(1)}k` : ''} style={{ fontSize: '10px' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Fila inferior: Clientes */}
                        <div className="card p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">Top Clientes</h2>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={obtenerDatosPorClienteFiltrada().slice(0, 15)} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="cliente" width={150} tick={{ fontSize: 11 }} />
                                    <Tooltip cursor={{ fill: '#f3f4f6' }} formatter={(val: number) => `S/ ${val.toLocaleString('es-PE')}`} />
                                    <Bar dataKey="total" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} onClick={handleBarClickCliente}>
                                        <LabelList dataKey="total" position="right" formatter={(val: any) => `S/ ${Number(val).toLocaleString('es-PE')}`} style={{ fontSize: '11px', fill: '#6b7280' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            ) : (
                <div className="card p-8 max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Comparación de Años</h2>

                    <div className="flex flex-wrap gap-4 mb-8 bg-gray-50 p-4 rounded-xl">
                        <select className="input-field w-32" onChange={e => setAnioComparar1(parseInt(e.target.value))}>
                            <option value="">Año 1</option>
                            {[2022, 2023, 2024, 2025].map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <select className="input-field w-32" onChange={e => setAnioComparar2(parseInt(e.target.value))}>
                            <option value="">Año 2</option>
                            {[2022, 2023, 2024, 2025].map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <button onClick={handleComparar} className="btn-primary">Comparar</button>
                        <button onClick={() => setModoComparacion(false)} className="btn-secondary">Cancelar</button>
                    </div>

                    {dataComparacionArea.length > 0 && (
                        <div className="overflow-hidden rounded-xl border border-gray-200">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 text-gray-700 font-semibold">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Área</th>
                                        <th className="px-6 py-3 text-right">{anioComparar1}</th>
                                        <th className="px-6 py-3 text-right">{anioComparar2}</th>
                                        <th className="px-6 py-3 text-right">Diferencia</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {dataComparacionArea.map((fila, i) => {
                                        const diff = fila[anioComparar2!] - fila[anioComparar1!];
                                        return (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-6 py-3 font-medium">{fila.area}</td>
                                                <td className="px-6 py-3 text-right text-gray-600">S/ {fila[anioComparar1!].toLocaleString("es-PE", { maximumFractionDigits: 0 })}</td>
                                                <td className="px-6 py-3 text-right text-gray-900 font-bold">S/ {fila[anioComparar2!].toLocaleString("es-PE", { maximumFractionDigits: 0 })}</td>
                                                <td className={`px-6 py-3 text-right font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {diff >= 0 ? '+' : ''} S/ {diff.toLocaleString("es-PE", { maximumFractionDigits: 0 })}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Detalles */}
            <AnimatePresence>
                {modalVisible && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setModalVisible(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col relative z-10 overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h2 className="text-lg font-bold text-gray-800">
                                    {clienteSeleccionado ? `Cliente: ${clienteSeleccionado}` : `Área: ${areaSeleccionada}`}
                                </h2>
                                <button onClick={() => setModalVisible(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>

                            <div className="overflow-y-auto p-0">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Detalle</th>
                                            <th className="px-6 py-3 text-right">Fecha</th>
                                            <th className="px-6 py-3 text-right">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {(clienteSeleccionado ? ventasClienteSeleccionada : ventasAreaSeleccionada).map(venta => (
                                            <tr key={venta.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-3">
                                                    <p className="font-medium text-gray-900">{venta.cliente || venta.area}</p>
                                                    <p className="text-xs text-gray-500 truncate max-w-[150px]">{venta.servicio}</p>
                                                </td>
                                                <td className="px-6 py-3 text-right text-gray-500 whitespace-nowrap">
                                                    {convertirFechaFactura(venta.fechaFactura).toLocaleDateString("es-PE")}
                                                </td>
                                                <td className="px-6 py-3 text-right font-medium text-gray-900">
                                                    {venta.moneda} {venta.total?.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
                                <button onClick={() => setModalVisible(false)} className="btn-primary">Cerrar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};