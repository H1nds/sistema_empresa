import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
    PieChart, Pie, Cell, Tooltip, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer
} from 'recharts';
import { FileDown } from "lucide-react";

export const SeguimientoVentas = () => {
    const [ventas, setVentas] = useState<any[]>([]);
    const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
    const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null);
    const [cargando, setCargando] = useState(true);
    const [modoComparacion, setModoComparacion] = useState(false);
    const [anioComparar1, setAnioComparar1] = useState<number | null>(null);
    const [anioComparar2, setAnioComparar2] = useState<number | null>(null);

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
            ventasPorArea[area] = (ventasPorArea[area] || 0) + (venta.total || 0);
        });

        return Object.keys(ventasPorArea).map(area => ({
            area,
            total: ventasPorArea[area],
        }));
    };

    const descargarPDF = () => {
        const elemento = document.getElementById("contenedorGraficas");
        if (!elemento) return;

        // Mide ancho y alto del contenedor en píxeles
        const ancho = elemento.offsetWidth;
        const alto = elemento.offsetHeight;

        import("html2pdf.js").then(html2pdf => {
            const opt = {
                margin: 0.2,                           // pequeña margen interna
                filename: "seguimiento.pdf",
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2 },                  // buena resolución
                jsPDF: {
                    unit: "px",                          // trabajamos con píxeles
                    format: [ancho, alto],                 // misma dimensión que el div
                    orientation: "landscape"
                }
            };

            html2pdf.default()
                .set(opt as any)
                .from(elemento)
                .save();
        });
    };

    const compararVentasPorAño = () => {
      const resumen: { [mes: string]: { [anio: number]: number } } = {};

      ventas.forEach(venta => {
        const fecha = convertirFechaFactura(venta.fechaFactura);
        const mes = fecha.toLocaleString("default", { month: "long" });
        const anio = fecha.getFullYear();

        if (anio === anioComparar1 || anio === anioComparar2) {
          resumen[mes] = resumen[mes] || {};
          resumen[mes][anio] = (resumen[mes][anio] || 0) + (venta.total || 0);
        }
      });

      return Object.entries(resumen).map(([mes, valores]) => ({
        mes,
        [anioComparar1!]: valores[anioComparar1!] || 0,
        [anioComparar2!]: valores[anioComparar2!] || 0,
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
        {!modoComparacion ? (
          <>
            <h1 className="text-2xl font-bold">Seguimiento de Ventas</h1>

            {/* Selectores de Año, Mes, Compare y PDF */}
            <div className="flex gap-4 items-center">
              <select
                className="border p-2 rounded"
                value={anioSeleccionado}
                onChange={e => setAnioSeleccionado(parseInt(e.target.value))}
              >
                {[2022, 2023, 2024, 2025].map(anio => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
              <select
                className="border p-2 rounded"
                value={mesSeleccionado ?? ""}
                onChange={e => setMesSeleccionado(e.target.value === "" ? null : parseInt(e.target.value))}
              >
                <option value="">Todos los meses</option>
                {[
                  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
                  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
                ].map((mes, i) => (
                  <option key={i} value={i+1}>{mes}</option>
                ))}
              </select>
              <button
                onClick={() => setModoComparacion(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow hover:shadow-md transition text-sm text-gray-700"
              >
                {/* Ícono SVG idéntico al de tu código */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 4h10M5 11h14M5 15h14M5 19h14" />
                </svg>
                Comparar años
              </button>
              <div className="relative inline-block group">
                  <button
                    onClick={descargarPDF}
                    className="p-2 bg-white border border-gray-300 rounded-full shadow transition-transform hover:scale-110"
                  >
                    <FileDown className="w-6 h-6 text-red-500" />
                  </button>
                    
                </div>
            </div>

            {/* Gráficas */}
            <div id="contenedorGraficas" className="mx-auto p-6 bg-white rounded-lg shadow" style={{ maxWidth: "100%" }}> 
                <div className="w-full flex flex-col md:flex-row gap-4 min-h-[300px] rounded-lg shadow p-4 bg-white">
                {/* Pastel */}
                <div className="w-full md:w-1/2">
                  <h2 className="text-lg font-semibold mb-4">Ingresos Totales {mesSeleccionado ? "del Mes" : "Anuales"}</h2>
                  <ResponsiveContainer width="100%" height={300}>
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
                        <Cell fill="#10B981"/>
                        <Cell fill="#3B82F6"/>
                      </Pie>
                      <Tooltip/>
                      <Legend/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Barras por Área */}
                <div className="w-full md:w-1/2">
                  <h2 className="text-lg font-semibold mb-4">Servicios por Área {mesSeleccionado ? "del Mes" : "(Anual)"}</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={obtenerDatosPorAreaFiltrada()}>
                      <CartesianGrid strokeDasharray="3 3"/>
                      <XAxis dataKey="area"/>
                      <YAxis/>
                      <Tooltip/>
                      <Legend/>
                      <Bar dataKey="total" fill="#EF4444"/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full bg-white rounded-lg shadow p-6 mt-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Comparación de años</h2>
            <div className="flex gap-4 mb-4">
              {/* Año 1 */}
              <select
                className="border p-2 rounded"
                onChange={e => setAnioComparar1(parseInt(e.target.value))}
              >
                <option value="">Año 1</option>
                {[2022, 2023, 2024, 2025].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {/* Año 2 */}
              <select
                className="border p-2 rounded"
                onChange={e => setAnioComparar2(parseInt(e.target.value))}
              >
                <option value="">Año 2</option>
                {[2022, 2023, 2024, 2025].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <button
                onClick={() => {
                  if (anioComparar1 === anioComparar2) {
                    alert("No se puede comparar dos años iguales");
                    return;
                  }
                }}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              >
                Comparar
              </button>
              <button
                onClick={() => setModoComparacion(false)}
                className="bg-gray-100 border px-4 py-2 rounded hover:bg-gray-200 transition"
              >
                Volver
              </button>
            </div>
            <table className="w-full border text-sm">
              <thead><tr>
                <th className="border px-2 py-1">Mes</th>
                <th className="border px-2 py-1">{anioComparar1}</th>
                <th className="border px-2 py-1">{anioComparar2}</th>
              </tr></thead>
              <tbody>
                {compararVentasPorAño().map((fila, i) => (
                  <tr key={i}>
                    <td className="border px-2 py-1">{fila.mes}</td>
                    <td className="border px-2 py-1">{fila[anioComparar1!]}</td>
                    <td className="border px-2 py-1">{fila[anioComparar2!]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
};