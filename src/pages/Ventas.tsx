import { useEffect, useState, useRef, useMemo } from "react";
import { db } from "../services/firebase";
import {
    collection,
    addDoc,
    onSnapshot,
} from "firebase/firestore";
import { deleteDoc, doc, Timestamp } from "firebase/firestore";
import { updateDoc } from "firebase/firestore";
import { toast } from 'sonner';
import { motion, AnimatePresence } from "framer-motion";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    verticalListSortingStrategy,
    useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2, Save, X, Maximize2, FileDown, FileUp, FilePlus2 } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface Venta {
    id: string;
    area: string;
    cliente: string;
    servicio: string;
    moneda: "S/" | "$";
    comprobante: string;
    mesServicio: string;
    fechaFactura: string;
    plazoDePago: number | "";
    fechaPagoCtaCte: string;
    abonoCtaCte: number | "";
    fechaPagoDeducible: string;
    igvdeducible: number | "";
    subtotal: number | "";
    igv: number | "";
    total: number | "";
}

interface VentaExcel {
    Cliente?: string;
    Area?: string;
    Servicio?: string;
    Moneda?: "S/" | "$";
    "N° Comprobante"?: string;
    "Mes de Servicio"?: string;
    "Fecha Factura"?: string;
    "Plazo de Pago (días)"?: string | number;
    "F. Abono CTA. CTE"?: string;
    "Abono CTA. CTE"?: string | number;
    "F. Abono CTA. DETRAC"?: string;
    "Abono CTA. DETRAC"?: string | number;
    Subtotal?: string | number;
    IGV?: string | number;
    Total?: string | number;
}

interface SortableRowProps {
    id: string;
    children: React.ReactNode;
}

function SortableRow({ id, children }: SortableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: isDragging ? CSS.Transform.toString(transform) : "none",
        transition,
        zIndex: isDragging ? 999 : undefined,
        boxShadow: isDragging ? "0px 4px 12px rgba(0,0,0,0.2)" : "none",
        cursor: "grab"
    };

    return (
        <motion.tr
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            initial={false}
            animate={{ scale: isDragging ? 1.02 : 1 }}
            transition={{ duration: 0.2 }}
            layout
        >
            {children}
        </motion.tr>
    );
}

export const Ventas = () => {
    const tablaRef = useRef<HTMLTableElement>(null);
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [order, setOrder] = useState<string[]>([]);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );
    const [yearFilter, setYearFilter] = useState<string>("All");
    const [monthFilter, setMonthFilter] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Generar años únicos a partir de los datos
    const years = Array.from(
        new Set(ventas.map((v) => new Date(v.fechaFactura).getFullYear().toString()))
    ).sort((a, b) => +b - +a);

    // Opciones de mes
    const months = [
        { value: "All", label: "Todos" },
        { value: "1", label: "Enero" },
        { value: "2", label: "Febrero" },
        { value: "3", label: "Marzo" },
        { value: "4", label: "Abril" },
        { value: "5", label: "Mayo" },
        { value: "6", label: "Junio" },
        { value: "7", label: "Julio" },
        { value: "8", label: "Agosto" },
        { value: "9", label: "Setiembre" },
        { value: "10", label: "Octubre" },
        { value: "11", label: "Noviembre" },
        { value: "12", label: "Diciembre" }
    ];
    const [nuevaVenta, setNuevaVenta] = useState<Venta>({
        id: "",
        cliente: "",
        area: "",
        servicio: "",
        moneda: "S/",
        comprobante: "",
        mesServicio: "",
        fechaFactura: "",
        plazoDePago: "",
        fechaPagoCtaCte: "",
        abonoCtaCte: "",
        fechaPagoDeducible: "",
        igvdeducible: "",
        subtotal: "",
        igv: "",
        total: "",
    });

    const ventasRef = collection(db, "ventas");

    const agregarVenta = async () => {
        const {
            cliente,
            area,
            servicio,
            moneda,
            comprobante,
            mesServicio,
            fechaFactura,
            plazoDePago,
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
            !area ||
            !servicio ||
            !comprobante ||
            !mesServicio ||
            !fechaFactura ||
            Number(plazoDePago) < 0 ||
            !fechaPagoCtaCte ||
            Number(abonoCtaCte) < 0 ||
            !fechaPagoDeducible ||
            Number(igvdeducible) < 0 ||
            Number(subtotal) < 0 ||
            Number(igv) < 0 ||
            Number(total) < 0
        ) {
            toast.error("Por favor, completa todos los campos correctamente.");
            return;
        }

        try {
            await addDoc(ventasRef, {
                cliente,
                area,
                servicio,
                moneda,
                comprobante,
                mesServicio,
                fechaFactura,
                plazoDePago,
                fechaPagoCtaCte,
                abonoCtaCte,
                fechaPagoDeducible,
                igvdeducible,
                subtotal,
                igv,
                total,
                position: order.length
            });

            // Limpiar formulario
            setNuevaVenta({
                id: "",
                cliente: "",
                area: "",
                servicio: "",
                moneda: "S/",
                comprobante: "",
                mesServicio: "",
                fechaFactura: "",
                plazoDePago: 0,
                fechaPagoCtaCte: "",
                abonoCtaCte: 0,
                fechaPagoDeducible: "",
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
            [name]: ["plazoDePago", "abonoCtaCte", "igvdeducible", "subtotal", "igv", "total"].includes(name)
                ? value === "" ? "" : parseFloat(value)
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

    const convertirExcelDate = (serial: number) => {
        const fechaBase = new Date(1899, 11, 30);
        fechaBase.setDate(fechaBase.getDate() + serial);
        return fechaBase.toISOString().split('T')[0]; // formato YYYY-MM-DD
    };

    const handleImportarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: VentaExcel[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            toast.error("El archivo Excel está vacío o mal formateado.");
            return;
        }

        const nuevasVentas = jsonData.map((row) => ({
            cliente: row.Cliente || "",
            area: row.Area || "",
            servicio: row.Servicio || "",
            moneda: row.Moneda === "$" || row.Moneda === "S/" ? row.Moneda : "S/",
            comprobante: row["N° Comprobante"] || "",
            mesServicio: row["Mes de Servicio"] || "",
            fechaFactura: typeof row["Fecha Factura"] === 'number' ? convertirExcelDate(row["Fecha Factura"]) : row["Fecha Factura"],
            plazoDePago: parseFloat(row["Plazo de Pago (días)"]?.toString() || "0") || 0,
            fechaPagoCtaCte: typeof row["F. Abono CTA. CTE"] === 'number' ? convertirExcelDate(row["F. Abono CTA. CTE"]) : row["F. Abono CTA. CTE"],
            abonoCtaCte: parseFloat(row["Abono CTA. CTE"]?.toString() || "0") || 0,
            fechaPagoDeducible: typeof row["F. Abono CTA. DETRAC"] === 'number' ? convertirExcelDate(row["F. Abono CTA. DETRAC"]) : row["F. Abono CTA. DETRAC"],
            igvdeducible: parseFloat(row["Abono CTA. DETRAC"]?.toString() || "0") || 0,
            subtotal: parseFloat(row.Subtotal?.toString() || "0") || 0,
            igv: parseFloat(row.IGV?.toString() || "0") || 0,
            total: parseFloat(row.Total?.toString() || "0") || 0,
            fechaCreacion: Timestamp.now(),
        }));

        try {
            for (const [idx, venta] of nuevasVentas.entries()) {
                const docRef = await addDoc(ventasRef, venta);
                await updateDoc(docRef, { position: order.length + idx });
            }
            toast.success("Ventas importadas correctamente.");
        } catch (err) {
            console.error("Error importando ventas:", err);
            toast.error("Ocurrió un error al importar.");
        }
    };

    const handleExportarExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Ventas");

        const columns = [
            { header: "Cliente", key: "cliente" },
            { header: "Area", key: "area" },
            { header: "Servicio", key: "servicio" },
            { header: "Moneda", key: "moneda" },
            { header: "N° Comprobante", key: "comprobante" },
            { header: "Mes Servicio", key: "mesServicio" },
            { header: "Fecha Factura", key: "fechaFactura" },
            { header: "Plazo de Pago (días)", key: "plazoDePago" },
            { header: "F. Abono CTA. CTE", key: "fechaPagoCtaCte" },
            { header: "Abono CTA. CTE", key: "abonoCtaCte" },
            { header: "F. Abono CTA. DETRAC", key: "fechaPagoDeducible" },
            { header: "Abono CTA. DETRAC", key: "igvdeducible" },
            { header: "Subtotal", key: "subtotal" },
            { header: "IGV", key: "igv" },
            { header: "Total", key: "total" },
        ];

        worksheet.columns = columns;

        worksheet.addRows(ventas);

        // Estilo de encabezado
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { vertical: "middle", horizontal: "center" };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFEFEFEF" },
            };
            cell.border = {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" },
            };
        });

        // Estilo para todas las celdas
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
                cell.border = {
                    top: { style: "thin" },
                    bottom: { style: "thin" },
                    left: { style: "thin" },
                    right: { style: "thin" },
                };
            });
        });

        // Ajuste automático de columnas
        worksheet.columns.forEach((column) => {
            let maxLength = 0;
            column.eachCell?.({ includeEmpty: true }, (cell) => {
                const text = cell.value ? cell.value.toString() : "";
                maxLength = Math.max(maxLength, text.length);
            });
            column.width = maxLength + 5;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), "ventas.xlsx");
    };

    const handleExportarPDF = () => {
        const doc = new jsPDF("l", "pt", "a4");

        doc.text("Ventas Registradas", 40, 30);

        const columnasExportar = [
            { header: "Cliente", dataKey: "cliente" },
            { header: "Area", dataKey: "area" },
            { header: "Servicio", dataKey: "servicio" },
            { header: "Moneda", dataKey: "moneda" },
            { header: "N° Comprobante", dataKey: "comprobante" },
            { header: "Mes de Servicio", dataKey: "mesServicio" },
            { header: "Fecha Factura", dataKey: "fechaFactura" },
            { header: "Plazo de Pago (días)", dataKey: "plazoDePago" },
            { header: "Pago CTA. CTE", dataKey: "fechaPagoCtaCte" },
            { header: "Abono CTA. CTE", dataKey: "abonoCtaCte" },
            { header: "Pago CTA. DETRAC", dataKey: "fechaPagoDeducible" },
            { header: "Abono CTA. DETRAC", dataKey: "igvdeducible" },
            { header: "Subtotal", dataKey: "subtotal" },
            { header: "IGV", dataKey: "igv" },
            { header: "Total", dataKey: "total" },
        ];

        const filas = ventas.map((venta) => ({
            cliente: venta.cliente || "",
            area: venta.area || "",
            servicio: venta.servicio || "",
            moneda: venta.moneda || "",
            comprobante: venta.comprobante || "",
            mesServicio: venta.mesServicio || "",
            fechaFactura: venta.fechaFactura || "",
            plazoDePago: typeof venta.plazoDePago === "number" ? venta.plazoDePago.toFixed(2) : "",
            fechaPagoCtaCte: venta.fechaPagoCtaCte || "",
            abonoCtaCte: typeof venta.abonoCtaCte === "number" ? venta.abonoCtaCte.toFixed(2) : "",
            fechaPagoDeducible: venta.fechaPagoDeducible || "",
            igvdeducible: typeof venta.igvdeducible === "number" ? venta.igvdeducible.toFixed(2) : "",
            subtotal: typeof venta.subtotal === "number" ? venta.subtotal.toFixed(2) : "",
            igv: typeof venta.igv === "number" ? venta.igv.toFixed(2) : "",
            total: typeof venta.total === "number" ? venta.total.toFixed(2) : "",
        }));

        autoTable(doc, {
            head: [columnasExportar.map((col) => col.header)],
            body: filas.map((row) => columnasExportar.map((col) => (row as any)[col.dataKey])),
            startY: 50,
            styles: {
                fontSize: 8,
                halign: "center",
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: "#ffffff",
                fontStyle: "bold",
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245],
            },
        });

        doc.save("ventas.pdf");
    };

    const guardarEdicion = async (id: string) => {
        const {
            cliente,
            area,
            servicio,
            moneda,
            comprobante,
            mesServicio,
            fechaFactura,
            plazoDePago,
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
            !area ||
            !servicio ||
            !moneda ||
            !comprobante ||
            !mesServicio ||
            !fechaFactura ||
            plazoDePago == null ||
            !fechaPagoCtaCte ||
            abonoCtaCte == null ||
            !fechaPagoDeducible ||
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
                area,
                servicio,
                moneda,
                comprobante,
                mesServicio,
                fechaFactura,
                plazoDePago,
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
        const initializedRef = { current: false };

        const unsubscribe = onSnapshot(ventasRef, async (snapshot) => {
            // 1) Lee todos los docs y extrae data + position
            const docsWithPos = snapshot.docs.map((snap) => {
                const data = snap.data() as any;
                return {
                    id: snap.id,
                    // si no hay position, asigno un valor muy grande para que queden al final
                    position: typeof data.position === "number" ? data.position : Number.MAX_SAFE_INTEGER,
                    ...data,
                } as Venta & { position: number };
            });

            // 2) Si es la primera vez, intenta inicializar positions (si hay docs sin position)
            if (!initializedRef.current) {
                const missing = docsWithPos.filter(v => v.position === Number.MAX_SAFE_INTEGER);
                if (missing.length > 0) {
                    // intento seguro: hago updates y capturo fallos individuales para no romper todo
                    await Promise.all(
                        missing.map((v, idx) => {
                            const ref = doc(db, "ventas", v.id);
                            // uso catch en cada update para que no rechace Promise.all
                            return updateDoc(ref, { position: idx }).catch((err) => {
                                console.warn(`No pude inicializar position para ${v.id}`, err);
                                // no rethrow
                            });
                        })
                    );
                }
                // marcamos como inicializado (aunque hayan fallado algunos updates,
                // ya no seguiremos intentando cada snapshot)
                initializedRef.current = true;
                // continuamos para ordenar y setear estado local (no retornamos)
            }

            // 3) Ordena por position y actualiza estado
            docsWithPos.sort((a, b) => a.position - b.position);
            setVentas(docsWithPos);
            setOrder(docsWithPos.map((v) => v.id));
        });

        return () => unsubscribe();
    }, []);

    const calcularEstado = (fechaFactura: string, plazoDePago: number) => {
        if (plazoDePago === 0) return { color: "bg-green-500", texto: "Pagado" };

        const fecha = new Date(fechaFactura);
        const ahora = new Date();
        const fechaLimite = new Date(fecha);
        fechaLimite.setDate(fecha.getDate() + plazoDePago);

        const tiempoTotal = fechaLimite.getTime() - fecha.getTime();
        const tiempoRestante = fechaLimite.getTime() - ahora.getTime();
        const porcentajeRestante = tiempoRestante / tiempoTotal;

        if (tiempoRestante < 0) return { color: "bg-red-500", texto: "Vencido" };
        if (porcentajeRestante < 0.5) return { color: "bg-yellow-500", texto: "Por vencer pronto" };
        return { color: "bg-green-500", texto: "Dentro del plazo" };
    };

    const handleDragEnd = async ({ active, over }: any) => {
        if (!over || active.id === over.id) {
            console.log("🚫 drop inválido o mismo elemento, nada que hacer");
            return;
        }

        // 1) UI: reordena localmente
        const oldIndex = order.indexOf(active.id);
        const newIndex = order.indexOf(over.id);
        const newOrder = arrayMove(order, oldIndex, newIndex);
        setOrder(newOrder);

        // 2) BD: persiste en Firestore
        console.log("📝 Persistiendo nuevo orden:", newOrder);
        try {
            await Promise.all(
                newOrder.map((id, idx) => {
                    console.log(`→ updateDoc(ventas/${id}) { position: ${idx} }`);
                    return updateDoc(doc(db, "ventas", id), { position: idx });
                })
            );
            console.log("✅ Firestore actualizado");
            toast.success("Orden guardado en la BD");
        } catch (error) {
            console.error("❌ Error guardando orden en Firestore:", error);
            toast.error("Error guardando orden");
        }
    };

    const filteredVentas = useMemo(() => {
        return order
            .map((id) => ventas.find((v) => v.id === id)!)
            .filter((v) => {
                const fecha = new Date(v.fechaFactura);
                // Filtrar por año
                if (yearFilter !== "All" && fecha.getFullYear().toString() !== yearFilter)
                    return false;
                // Filtrar por mes
                if (
                    monthFilter !== "All" &&
                    (fecha.getMonth() + 1).toString() !== monthFilter
                )
                    return false;
                // Filtrar por texto
                if (searchQuery) {
                    const term = searchQuery.toLowerCase();
                    return (
                        v.cliente.toLowerCase().includes(term) ||
                        v.area.toLowerCase().includes(term) ||
                        v.servicio.toLowerCase().includes(term) ||
                        v.comprobante.toLowerCase().includes(term)
                    );
                }
                return true;
            });
    }, [ventas, order, yearFilter, monthFilter, searchQuery]);

    const filteredOrder = useMemo(
        () => order.filter((id) => filteredVentas.some((v) => v.id === id)),
        [order, filteredVentas]
    );

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
                                        name="area"
                                        placeholder="Area"
                                        className="border p-2 rounded"
                                        value={nuevaVenta.area}
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
                                        type="number"
                                        name="plazoDePago"
                                        placeholder="Plazo de Pago (días)"
                                        className="border p-2 rounded"
                                        value={nuevaVenta.plazoDePago}
                                        onChange={handleInputChange}
                                        min={0}
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
                                        type="date"
                                        name="fechaPagoDeducible"
                                        className="border p-2 rounded"
                                        value={nuevaVenta.fechaPagoDeducible}
                                        onChange={handleInputChange}
                                    />
                                    <input
                                        type="number"
                                        name="igvdeducible"
                                        placeholder="Abono CTA. DETRAC"
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
                <div className="flex gap-4 mb-4 items-center">
                    {/* Importar Excel */}
                    <motion.label
                        className="cursor-pointer p-2 rounded hover:bg-gray-100"
                        whileHover={{ scale: 1.1 }}
                        title="Importar Excel"
                    >
                        <FilePlus2 className="w-5 h-5" />
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            onChange={handleImportarExcel}
                        />
                    </motion.label>

                    {/* Exportar Excel */}
                    <motion.button
                        onClick={handleExportarExcel}
                        className="p-2 rounded hover:bg-gray-100"
                        whileHover={{ scale: 1.1 }}
                        title="Exportar Excel"
                    >
                        <FileDown className="w-5 h-5" />
                    </motion.button>

                    {/* Exportar PDF */}
                    <motion.button
                        onClick={handleExportarPDF}
                        className="p-2 rounded hover:bg-gray-100"
                        whileHover={{ scale: 1.1 }}
                        title="Exportar PDF"
                    >
                        <FileUp className="w-5 h-5" />
                    </motion.button>
                </div>
                {/* —————— FILTROS —————— */}
                <div className="w-full">
                    <motion.div
                        className="w-full flex flex-row flex-wrap justify-start items-center gap-4 mb-6"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* 1) Buscador */}
                        <input
                            type="text"
                            placeholder="Buscar palabra clave..."
                            className="border rounded p-2 flex-grow min-w-[200px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        {/* 2) Selección de año */}
                        <select
                            className="border rounded p-2 min-w-[140px]"
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                        >
                            <option value="All">Todos los años</option>
                            {years.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        {/* 3) Selección de mes */}
                        <select
                            className="border rounded p-2 min-w-[100px]"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                        >
                            <option value="All">Todos los meses</option>
                            {months
                                .filter((m) => m.value !== "All")
                                .map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                        </select>

                        <motion.button
                            onClick={() => setMostrarTablaExpandida(true)}
                            title="Expandir tabla"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-gray-600 hover:text-black p-2"
                        >
                            <Maximize2 className="w-6 h-6" />
                        </motion.button>

                    </motion.div>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={filteredOrder} strategy={verticalListSortingStrategy}>
                        <div className="w-full overflow-x-auto">
                            <div className="min-w-[1200px] max-h-[60vh] overflow-y-auto">
                                <table
                                    ref={tablaRef}
                                    className="min-w-full table-auto text-sm text-center border-separate border-spacing-0"
                                >
                                    <thead className="sticky top-0 z-10 bg-white shadow-sm">
                                        <tr className="bg-gray-200 border-b border-gray-300 text-gray-700 text-sm uppercase">
                                            <th className="p-2">Cliente</th>
                                            <th className="p-2">Area</th>
                                            <th className="p-2">Servicio</th>
                                            <th className="p-2">Moneda</th>
                                            <th className="p-2">N° Comprobante</th>
                                            <th className="p-2">Mes de Servicio</th>
                                            <th className="p-2">Fecha Factura</th>
                                            <th className="p-2 text-center">Plazo de Pago (días)</th>
                                            <th className="p-2 text-center">Estado</th>
                                            <th className="p-2">F. Abono CTA. CTE</th>
                                            <th className="p-2">Abono CTA. CTE</th>
                                            <th className="p-2">F. Abono CTA. DETRAC</th>
                                            <th className="p-2">Abono CTA. DETRAC</th>
                                            <th className="p-2">Subtotal</th>
                                            <th className="p-2">IGV</th>
                                            <th className="p-2">Total</th>
                                            <th className="p-2">Acciones</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredOrder
                                            .map((id) => ventas.find((v) => v.id === id)!)
                                            .map((venta) => (
                                                <SortableRow key={venta.id} id={venta.id}>
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
                                                                    value={ventaEditada.area ?? venta.area}
                                                                    onChange={(e) =>
                                                                        setVentaEditada((prev) => ({ ...prev, area: e.target.value }))
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
                                                                    type="number"
                                                                    value={ventaEditada.plazoDePago !== undefined ? ventaEditada.plazoDePago : (venta.plazoDePago || "")}
                                                                    onChange={(e) =>
                                                                        setVentaEditada((prev) => ({
                                                                            ...prev,
                                                                            plazoDePago: e.target.value === "" ? "" : parseInt(e.target.value),
                                                                        }))
                                                                    }
                                                                    className="border p-1 rounded w-full"
                                                                    min={0}
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                {(() => {
                                                                    const estado = calcularEstado(
                                                                        venta.fechaFactura,
                                                                        typeof ventaEditada.plazoDePago === "number" ? ventaEditada.plazoDePago : Number(ventaEditada.plazoDePago) || 0
                                                                    );
                                                                    return (
                                                                        <>
                                                                            <span
                                                                                className={`inline-block w-3 h-3 rounded-full animate-pulse ${estado.color}`}
                                                                                data-tooltip-id={`tooltip-${venta.id}`}
                                                                                data-tooltip-content={estado.texto}
                                                                            />
                                                                            <Tooltip
                                                                                id={`tooltip-${venta.id}`}
                                                                                place="top"
                                                                                className="z-50"
                                                                            />
                                                                        </>
                                                                    );
                                                                })()}
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
                                                                    type="date"
                                                                    value={ventaEditada.fechaPagoDeducible ?? venta.fechaPagoDeducible}
                                                                    onChange={(e) =>
                                                                        setVentaEditada((prev) => ({ ...prev, fechaPagoDeducible: e.target.value }))
                                                                    }
                                                                    className="border p-1 rounded w-full"
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
                                                            <td className="p-2">{venta.area}</td>
                                                            <td className="p-2">{venta.servicio}</td>
                                                            <td className="p-2">{venta.moneda}</td>
                                                            <td className="p-2">{venta.comprobante}</td>
                                                            <td className="p-2">{venta.mesServicio}</td>
                                                            <td className="p-2">{venta.fechaFactura}</td>
                                                            <td className="p-2">{venta.plazoDePago}</td>
                                                            <td className="p-2 text-center">
                                                                {(() => {
                                                                    const estado = calcularEstado(venta.fechaFactura, Number(venta.plazoDePago));

                                                                    if (estado.texto === "Pagado") {
                                                                        return <span className="font-bold text-blue-600">Pagado</span>;
                                                                    }

                                                                    return (
                                                                        <>
                                                                            <span
                                                                                className={`inline-block w-3 h-3 rounded-full animate-pulse ${estado.color}`}
                                                                                data-tooltip-id={`tooltip-${venta.id}`}
                                                                                data-tooltip-content={estado.texto}
                                                                            />
                                                                            <Tooltip
                                                                                id={`tooltip-${venta.id}`}
                                                                                place="top"
                                                                                className="z-50"
                                                                            />
                                                                        </>
                                                                    );
                                                                })()}
                                                            </td>
                                                            <td className="p-2">{venta.fechaPagoCtaCte}</td>
                                                            <td className="p-2">
                                                                {typeof venta.abonoCtaCte === "number"
                                                                    ? venta.abonoCtaCte.toFixed(2)
                                                                    : "-"}
                                                            </td>
                                                            <td className="p-2">{venta.fechaPagoDeducible}</td>
                                                            <td className="p-2">
                                                                {typeof venta.igvdeducible === "number"
                                                                    ? venta.igvdeducible.toFixed(2)
                                                                    : "-"}
                                                            </td>
                                                            <td className="p-2">
                                                                {typeof venta.subtotal === "number"
                                                                    ? venta.subtotal.toFixed(2)
                                                                    : "-"}
                                                            </td>
                                                            <td className="p-2">
                                                                {typeof venta.igv === "number"
                                                                    ? venta.igv.toFixed(2)
                                                                    : "-"}
                                                            </td>
                                                            <td className="p-2">
                                                                {typeof venta.total === "number"
                                                                    ? venta.total.toFixed(2)
                                                                    : "-"}
                                                            </td>
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
                                                </SortableRow>
                                            ))}
                                        {ventas.length === 0 && (
                                            <tr>
                                                <td colSpan={17} className="p-4 text-center text-gray-500">
                                                    Aún no hay ventas registradas
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </SortableContext>
                </DndContext>

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
                    <div className="fixed inset-0 z-50">
                        <motion.div
                            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50"
                            style={{ backdropFilter: 'blur(6px)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-white w-[90vw] max-h-[90vh] overflow-auto rounded-xl shadow-2xl p-6 relative"
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.85, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">Ventas registradas</h2>
                                    <button
                                        onClick={() => setMostrarTablaExpandida(false)}
                                        className="text-red-500 font-medium hover:underline"
                                    >
                                        <X size={30} />
                                    </button>
                                </div>

                                <div className="w-full overflow-x-auto">
                                    <div className="min-w-[1200px] max-h-[60vh] overflow-y-auto border rounded-lg shadow-inner">
                                        <table
                                            ref={tablaRef}
                                            className="min-w-full table-auto text-sm text-center border-separate border-spacing-0"
                                        >
                                            <thead className="sticky top-0 z-10 bg-white shadow-sm">
                                                <tr className="bg-gray-200 border-b border-gray-300 text-gray-700 text-sm uppercase">
                                                    <th className="p-2">Cliente</th>
                                                    <th className="p-2">Area</th>
                                                    <th className="p-2">Servicio</th>
                                                    <th className="p-2">Moneda</th>
                                                    <th className="p-2">N° Comprobante</th>
                                                    <th className="p-2">Mes de Servicio</th>
                                                    <th className="p-2">Fecha Factura</th>
                                                    <th className="p-2 text-center">Plazo de Pago (días)</th>
                                                    <th className="p-2 text-center">Estado</th>
                                                    <th className="p-2">F. Abono CTA. CTE</th>
                                                    <th className="p-2">Abono CTA. CTE</th>
                                                    <th className="p-2">F. Abono CTA. DETRAC</th>
                                                    <th className="p-2">IAbono CTA. DETRAC</th>
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
                                                                        value={ventaEditada.area ?? venta.area}
                                                                        onChange={(e) =>
                                                                            setVentaEditada((prev) => ({ ...prev, area: e.target.value }))
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
                                                                        type="number"
                                                                        value={ventaEditada.plazoDePago ?? venta.plazoDePago ?? ""}
                                                                        onChange={(e) =>
                                                                            setVentaEditada((prev) => ({
                                                                                ...prev,
                                                                                plazoDePago: parseInt(e.target.value) || 0,
                                                                            }))
                                                                        }
                                                                        className="border p-1 rounded w-full"
                                                                        min={0}
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    {(() => {
                                                                        const estado = calcularEstado(
                                                                            venta.fechaFactura,
                                                                            typeof ventaEditada.plazoDePago === "number" ? ventaEditada.plazoDePago : Number(ventaEditada.plazoDePago) || 0
                                                                        );
                                                                        return (
                                                                            <>
                                                                                <span
                                                                                    className={`inline-block w-3 h-3 rounded-full animate-pulse ${estado.color}`}
                                                                                    data-tooltip-id={`tooltip-${venta.id}`}
                                                                                    data-tooltip-content={estado.texto}
                                                                                />
                                                                                <Tooltip
                                                                                    id={`tooltip-${venta.id}`}
                                                                                    place="top"
                                                                                    className="z-50"
                                                                                />
                                                                            </>
                                                                        );
                                                                    })()}
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
                                                                        type="date"
                                                                        value={ventaEditada.fechaPagoDeducible ?? venta.fechaPagoDeducible}
                                                                        onChange={(e) =>
                                                                            setVentaEditada((prev) => ({ ...prev, fechaPagoDeducible: e.target.value }))
                                                                        }
                                                                        className="border p-1 rounded w-full"
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
                                                                <td className="p-2">{venta.area}</td>
                                                                <td className="p-2">{venta.servicio}</td>
                                                                <td className="p-2">{venta.moneda}</td>
                                                                <td className="p-2">{venta.comprobante}</td>
                                                                <td className="p-2">{venta.mesServicio}</td>
                                                                <td className="p-2">{venta.fechaFactura}</td>
                                                                <td className="p-2 text-center">{venta.plazoDePago ?? "-"}</td>
                                                                <td className="p-2 text-center">
                                                                    {(() => {
                                                                        const estado = calcularEstado(venta.fechaFactura, Number(venta.plazoDePago));

                                                                        if (estado.texto === "Pagado") {
                                                                            return <span className="font-bold text-blue-600">Pagado</span>;
                                                                        }

                                                                        return (
                                                                            <>
                                                                                <span
                                                                                    className={`inline-block w-3 h-3 rounded-full animate-pulse ${estado.color}`}
                                                                                    data-tooltip-id={`tooltip-${venta.id}`}
                                                                                    data-tooltip-content={estado.texto}
                                                                                />
                                                                                <Tooltip
                                                                                    id={`tooltip-${venta.id}`}
                                                                                    place="top"
                                                                                    className="z-50"
                                                                                />
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </td>
                                                                <td className="p-2">{venta.fechaPagoCtaCte}</td>
                                                                <td className="p-2">
                                                                    {typeof venta.abonoCtaCte === "number"
                                                                        ? venta.abonoCtaCte.toFixed(2)
                                                                        : "-"}
                                                                </td>
                                                                <td className="p-2">{venta.fechaPagoDeducible}</td>
                                                                <td className="p-2">
                                                                    {typeof venta.igvdeducible === "number"
                                                                        ? venta.igvdeducible.toFixed(2)
                                                                        : "-"}
                                                                </td>
                                                                <td className="p-2">
                                                                    {typeof venta.subtotal === "number"
                                                                        ? venta.subtotal.toFixed(2)
                                                                        : "-"}
                                                                </td>
                                                                <td className="p-2">
                                                                    {typeof venta.igv === "number"
                                                                        ? venta.igv.toFixed(2)
                                                                        : "-"}
                                                                </td>
                                                                <td className="p-2">
                                                                    {typeof venta.total === "number"
                                                                        ? venta.total.toFixed(2)
                                                                        : "-"}
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
                                    </div>
                                </div>

                            </motion.div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};