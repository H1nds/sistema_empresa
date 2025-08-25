import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
    PieChart, Pie, Cell, Tooltip, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer
} from 'recharts';

export const SeguimientoVentas = () => {
    const [ventas, setVentas] = useState<any[]>([]);
    const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
    const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const obtenerVentas = async () => {
            const ventasRef = collection(db, "ventas");
            const snapshot = await getDocs(ventasRef);
            const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setVentas(datos);
            setCargando(false);
        };

        obtenerVentas();
    }, []);

    const obtenerDatosPie = () => {
        const ventasDelAnio = ventas.filter(venta => {
            const anioVenta = convertirFechaFactura(venta.fechaFactura).getFullYear();
            return anioVenta === anioSeleccionado;
        });

        const totalSoles = ventasDelAnio
            .filter(venta => venta.moneda === "S/")
            .reduce((acc, curr) => acc + (curr.total || 0), 0);

        const totalDolares = ventasDelAnio
            .filter(venta => venta.moneda === "$")
            .reduce((acc, curr) => acc + (curr.total || 0), 0);

        return [
            { moneda: "Soles", valor: totalSoles },
            { moneda: "Dólares", valor: totalDolares },
        ];
    };

    const obtenerDatosBarras = () => {
        const ventasDelMes = ventas.filter(venta => {
            const fecha = convertirFechaFactura(venta.fechaFactura);
            return (
                fecha.getFullYear() === anioSeleccionado &&
                fecha.getMonth() + 1 === mesSeleccionado
            );
        });

        const ventasPorCliente: { [cliente: string]: number } = {};
        ventasDelMes.forEach(venta => {
            const cliente = venta.cliente || "Sin nombre";
            ventasPorCliente[cliente] = (ventasPorCliente[cliente] || 0) + (venta.total || 0);
        });

        return Object.keys(ventasPorCliente).map(cliente => ({
            cliente,
            total: ventasPorCliente[cliente],
        }));
    };

    const obtenerDatosPorArea = () => {
        const ventasDelMes = ventas.filter(venta => {
            const fecha = convertirFechaFactura(venta.fechaFactura);
            return (
                fecha.getFullYear() === anioSeleccionado &&
                fecha.getMonth() + 1 === mesSeleccionado
            );
        });

        const ventasPorArea: { [area: string]: number } = {};
        ventasDelMes.forEach(venta => {
            const area = venta.area || "Sin área";
            ventasPorArea[area] = (ventasPorArea[area] || 0) + (venta.total || 0);
        });

        return Object.keys(ventasPorArea).map(area => ({
            area,
            total: ventasPorArea[area],
        }));
    };

    const convertirFechaFactura = (fecha: any) => {
        if (typeof fecha === 'number') {
            // Es un serial de Excel, conviértelo a Date
            const fechaBase = new Date(1899, 11, 30);
            fechaBase.setDate(fechaBase.getDate() + fecha);
            return fechaBase;
        } else if (typeof fecha === 'string') {
            return new Date(fecha);
        } else if (fecha?.toDate) {
            return fecha.toDate();
        } else {
            return new Date(); // fallback
        }
    };

    if (cargando) {
        return <div>Cargando datos...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Seguimiento de Ventas</h1>

            {/* Selectores de Año y Mes */}
            <div className="flex gap-4 items-center">
                <select
                    className="border p-2 rounded"
                    value={anioSeleccionado}
                    onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
                >
                    {[2022, 2023, 2024, 2025].map((anio) => (
                        <option key={anio} value={anio}>{anio}</option>
                    ))}
                </select>

                <select
                    className="border p-2 rounded"
                    value={mesSeleccionado ?? ""}
                    onChange={(e) => setMesSeleccionado(e.target.value === "" ? null : parseInt(e.target.value))}
                >
                    <option value="">Todos los meses</option>
                    {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((mes, index) => (
                        <option key={index} value={index + 1}>{mes}</option>
                    ))}
                </select>
            </div>

            <div className="w-full min-h-[300px] bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Ingresos Totales Anuales</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart key={JSON.stringify(obtenerDatosPie())}>
                        <Pie
                            data={obtenerDatosPie()}
                            dataKey="valor"
                            nameKey="moneda"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                        >
                            <Cell fill="#10B981" />
                            <Cell fill="#3B82F6" />
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {mesSeleccionado && (
                <>
                    {/* Gráfico por Cliente */}
                    <div className="w-full h-80 bg-white rounded-lg shadow p-4">
                        <h2 className="text-lg font-semibold mb-4">
                            Ventas por Cliente ({["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][mesSeleccionado - 1]})
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={obtenerDatosBarras()}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="cliente" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="total" fill="#6366F1" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Gráfico por Área */}
                    <div className="w-full h-80 bg-white rounded-lg shadow p-4 mt-6">
                        <h2 className="text-lg font-semibold mb-4">
                            Ventas por Área ({["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][mesSeleccionado - 1]})
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={obtenerDatosPorArea()}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="area" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="total" fill="#F59E0B" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
};