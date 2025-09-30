import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
    PieChart, Pie, Cell, Tooltip, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer
} from 'recharts';
import { FileDown } from "lucide-react";
import { LabelList } from 'recharts';
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
    const [dataComparacionArea, setDataComparacionArea] = useState <
        { area: string;[year: number]: number }[]
    >([]);

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


    // Efecto para traer el tipo de cambio desde un servicio SUNAT (apis.net.pe)
   useEffect(() => {
      const fetchTipoCambio = async () => {
        try {
          const res = await fetch('/api/tipo-cambio-sunat');
          const json = await res.json();
          if (json.venta) setTipoCambio(parseFloat(json.venta));
          else console.error('API devolvió:', json);
        } catch (err) {
          console.error('Error al traer tipo de cambio SUNAT:', err);
        }
      };

      fetchTipoCambio();
      const intervalo = setInterval(fetchTipoCambio, 1000 * 60 * 60);
      return () => clearInterval(intervalo);
    }, []);

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
        // ➊ Calcula total en soles según moneda
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

    const handleComparar = () => {
      if (!anioComparar1 || !anioComparar2) {
        alert("Selecciona ambos años antes de comparar");
        return;
      }
      if (anioComparar1 === anioComparar2) {
        alert("No se puede comparar dos años iguales");
        return;
      }

      // Construye un mapa area → { totalA1, totalA2 }
      const mapa: Record<string, { [y: number]: number }> = {};

      ventas.forEach(venta => {
        const fecha = convertirFechaFactura(venta.fechaFactura);
        const año = fecha.getFullYear();
        if (año !== anioComparar1 && año !== anioComparar2) return;

        const area = venta.area || "Sin área";

        // Convierte total a soles
        const montoPen = venta.moneda === "$"
          ? (venta.total || 0) * (tipoCambio ?? 0)
          : (venta.total || 0);

        if (!mapa[area]) mapa[area] = {};
        mapa[area][año] = (mapa[area][año] || 0) + montoPen;
      });

      // Transformar en array
      const resultado = Object.entries(mapa).map(([area, vals]) => ({
        area,
        [anioComparar1!]: vals[anioComparar1!] || 0,
        [anioComparar2!]: vals[anioComparar2!] || 0
      }));

      setDataComparacionArea(resultado);
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

    const datosPie = obtenerDatosPie();
    const resumenTotalSoles = datosPie.find(d => d.moneda === "Soles")?.valor || 0;
    const resumenTotalDolares = datosPie.find(d => d.moneda === "Dólares")?.valor || 0;
    const resumenVentasConvertidas = tipoCambio != null
        ? resumenTotalDolares * tipoCambio
        : 0;
    const resumenTotalAnualPen = resumenTotalSoles + resumenVentasConvertidas;

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
            <div
              id="contenedorGraficas"
              className="mx-auto p-6 bg-white rounded-lg shadow"
              style={{ maxWidth: "100%" }}
            >
              <div className="w-full flex gap-4 min-h-[300px] rounded-lg shadow p-4 bg-white">
                {/* Pastel */}
                <div className="w-full md:w-1/2">
                  <h2 className="text-lg font-semibold mb-4">
                    Ingresos Totales {mesSeleccionado ? "del Mes" : "Anuales"}
                  </h2>

                  {/* 3 columnas: PieChart (2/3) + Resumen (1/3) */}
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Gráfico */}
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart key={JSON.stringify(datosPie)}>
                          <Pie
                            data={datosPie}
                            dataKey="valor"
                            nameKey="moneda"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            labelLine={false}
                            label={({ name, value }) =>
                              `${name}: ${typeof value === 'number'
                                ? value.toLocaleString('es-PE', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })
                                : '0.00'}`
                            }
                          >
                            <Cell fill="#10B981" />
                            <Cell fill="#3B82F6" />
                          </Pie>
                          <Tooltip formatter={(value: number) =>
                              `S/. ${value.toLocaleString('es-PE', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}`
                            }/>
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Resumen “Venta Anual” */}
                    <div className="w-full md:w-1/3 bg-gray-50 p-4 rounded-lg shadow-inner">
                      <h3 className="font-semibold text-gray-700 mb-2">Venta Anual</h3>

                      <p className="text-sm text-gray-600 mb-2">
                          Valor del dólar actualmente:
                          <span className="font-medium ml-1">
                            {tipoCambio != null
                              ? ` S/ ${tipoCambio.toLocaleString("es-PE", {
                                  minimumFractionDigits: 3,
                                  maximumFractionDigits: 3
                                })}`
                              : "Cargando..."}
                          </span>
                      </p>

                      <p className="text-sm text-gray-600 mb-2">
                        Ventas de dólares a soles:
                        <span className="font-medium ml-1">
                          {tipoCambio != null
                              ? ` S/ ${resumenVentasConvertidas.toLocaleString("es-PE", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}`
                              : "-"}
                        </span>
                      </p>

                      <p className="text-sm text-gray-600">
                        Ventas anuales totales:
                        <span className="font-bold ml-1">
                          S/ {tipoCambio != null
                              ? resumenTotalAnualPen.toLocaleString("es-PE", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })
                              : resumenTotalSoles.toLocaleString("es-PE", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                {/* Barras por Área */}
                <div className="w-full md:w-1/2">
                  <h2 className="text-lg font-semibold mb-4">Servicios por Área {mesSeleccionado ? "del Mes" : "(Anual)"}</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={obtenerDatosPorAreaFiltrada()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="area" />
                      <YAxis />
                      <Tooltip formatter={(value: number) =>
                        value.toLocaleString('es-PE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })
                      }/>
                      <Legend />
                      <Bar dataKey="total" fill="#EF4444" onClick={handleBarClick}>
                        <LabelList
                          dataKey="total"
                          position="top"
                          formatter={(label: unknown) =>
                            typeof label === 'number'
                              ? `S/. ${label.toLocaleString('es-PE', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}`
                              : ''
                          }
                        />
                      </Bar>
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
                onClick={handleComparar}
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
            {dataComparacionArea.length === 0 ? (
                <p className="text-center text-gray-500">
                Selecciona dos años distintos y pulsa "Comparar".
                </p>
            ) : (
                <table className="w-full border text-sm">
                <thead>
                <tr>
                 <th className="border px-2 py-1">Área</th>
                 <th className="border px-2 py-1">{anioComparar1}</th>
                 <th className="border px-2 py-1">{anioComparar2}</th>
               </tr>
             </thead>
             <tbody>
               {dataComparacionArea.map((fila, i) => (
                 <tr key={i}>
                   <td className="border px-2 py-1">{fila.area}</td>
                   <td className="border px-2 py-1">
                     S/ {fila[anioComparar1!].toLocaleString("es-PE", {
                       minimumFractionDigits: 2,
                       maximumFractionDigits: 2
                     })}
                   </td>
                   <td className="border px-2 py-1">
                     S/ {fila[anioComparar2!].toLocaleString("es-PE", {
                       minimumFractionDigits: 2,
                       maximumFractionDigits: 2
                     })}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         )}
          </div>
        )}
        <AnimatePresence>
          {modalVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40"
              style={{ backdropFilter: "blur(4px)" }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden mx-4"
              >
                <h2 className="text-xl font-semibold mb-4 flex-shrink-0">
                  Ventas en área: {areaSeleccionada}
                </h2>

               <div className="flex-1 overflow-y-auto mb-4 pr-2 max-h-[60vh]">
                      <ul className="space-y-4">
                       {ventasAreaSeleccionada.map(venta => (
                        <li key={venta.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium break-words">{venta.cliente || "Sin cliente"}</p>
                          <p className="text-xs text-gray-500">
                            {convertirFechaFactura(venta.fechaFactura).toLocaleDateString(
                              "es-PE"
                            )}
                          </p>
                        </div>
                        <span className="font-semibold">
                          {venta.moneda}{" "}
                          {venta.total.toLocaleString("es-PE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setModalVisible(false)}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex-shrink-0"
                >
                  Cerrar
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
};