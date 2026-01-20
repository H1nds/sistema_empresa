import type { Venta } from "../../types/types";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { Tooltip } from 'react-tooltip';
import Swal from 'sweetalert2'; // Importamos la alerta bonita

interface Props {
    ventas: Venta[];
    order: string[];
    onDragEnd: (event: DragEndEvent) => void;
    onDelete: (id: string) => void;
    onEdit: (venta: Venta) => void; // Cambiamos para recibir el objeto completo al editar
}

// Helpers de formato (Moneda y Fecha)
const formatMoney = (amount: number | string | undefined) => {
    const value = Number(amount) || 0;
    return new Intl.NumberFormat('es-PE', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString + 'T00:00:00'); // Forzar zona horaria local simple
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const SortableRow = ({ venta, onDelete, onEdit }: { venta: Venta, onDelete: (id: string) => void, onEdit: (v: Venta) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: venta.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        position: isDragging ? "relative" as const : "static" as const,
    };

    // --- SOLUCIÓN PROBLEMA 2: Lógica de la Esfera ---
    const calcularEstado = (fecha: string, plazo: number) => {
        if (!fecha) return { color: "bg-gray-400", label: "Sin fecha" };
        if (Number(plazo) === 0) return { color: "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]", label: "Pagado" };

        const fechaObj = new Date(fecha);
        fechaObj.setDate(fechaObj.getDate() + plazo);
        const hoy = new Date();
        const diffTime = fechaObj.getTime() - hoy.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { color: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]", label: "Vencido" };
        if (diffDays <= 5) return { color: "bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.6)]", label: "Por vencer pronto" };

        return { color: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]", label: "En plazo" };
    };

    const estado = calcularEstado(venta.fechaFactura, Number(venta.plazoDePago) || 0);
    const cellClass = "px-4 py-3 text-sm text-gray-600 whitespace-nowrap border-b border-gray-100";

    // --- SOLUCIÓN PROBLEMA 3: Confirmación de eliminar ---
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Evita drag al hacer click
        Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                onDelete(venta.id);
                Swal.fire('¡Eliminado!', 'La venta ha sido eliminada.', 'success');
            }
        });
    };

    return (
        <tr
            ref={setNodeRef} style={style}
            className={`group hover:bg-gray-50 transition-colors ${isDragging ? "bg-blue-50 shadow-lg opacity-90" : "bg-white"}`}
        >
            {/* Columna Sticky: Cliente */}
            <td className={`${cellClass} sticky left-0 z-10 bg-white group-hover:bg-gray-50 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>
                <div className="flex items-center gap-2">
                    <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                        <GripVertical size={14} />
                    </button>
                    <span className="font-semibold text-gray-900 truncate max-w-[180px]" title={venta.cliente}>
                        {venta.cliente}
                    </span>
                </div>
            </td>

            <td className={cellClass}>{venta.area}</td>
            <td className={cellClass}><div className="truncate max-w-[200px]" title={venta.servicio}>{venta.servicio}</div></td>
            <td className={`${cellClass} text-center font-bold text-gray-500`}>{venta.moneda}</td>
            <td className={cellClass}>{venta.comprobante}</td>
            <td className={cellClass}>{venta.mesServicio}</td>
            <td className={cellClass}>{formatDate(venta.fechaFactura)}</td>

            {/* --- AQUÍ ESTÁ LA ESFERA (PROBLEMA 2) --- */}
            <td className={`${cellClass} text-center`}>
                <div className="flex justify-center items-center">
                    <div
                        data-tooltip-id={`tooltip-estado-${venta.id}`}
                        data-tooltip-content={estado.label}
                        className={`w-3 h-3 rounded-full ${estado.color} animate-pulse cursor-help`}
                    ></div>
                    <Tooltip id={`tooltip-estado-${venta.id}`} style={{ fontSize: '12px', padding: '4px 8px' }} />
                </div>
            </td>

            <td className={`${cellClass} text-center`}>{venta.plazoDePago} días</td>

            <td className={cellClass}>{formatDate(venta.fechaPagoCtaCte)}</td>
            <td className={`${cellClass} text-right`}>{venta.abonoCtaCte ? formatMoney(venta.abonoCtaCte) : '-'}</td>

            <td className={cellClass}>{formatDate(venta.fechaPagoDeducible)}</td>
            <td className={`${cellClass} text-right`}>{venta.igvdeducible ? formatMoney(venta.igvdeducible) : '-'}</td>

            <td className={`${cellClass} text-right font-mono text-gray-500`}>{formatMoney(venta.subtotal)}</td>
            <td className={`${cellClass} text-right font-mono text-gray-500`}>{formatMoney(venta.igv)}</td>
            <td className={`${cellClass} text-right font-mono font-bold text-gray-900 bg-gray-50/50`}>
                {venta.moneda} {formatMoney(venta.total)}
            </td>

            {/* Columna Sticky: Acciones */}
            <td className={`${cellClass} sticky right-0 z-10 bg-white group-hover:bg-gray-50 border-l border-gray-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] text-center`}>
                <div className="flex justify-center gap-2">
                    {/* Botón Editar Activo */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(venta); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded transition-colors"
                        title="Editar"
                    >
                        <Pencil size={16} />
                    </button>
                    {/* Botón Eliminar con SweetAlert */}
                    <button
                        onClick={handleDeleteClick}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export const VentasTable = ({ ventas, order, onDragEnd, onDelete, onEdit }: Props) => {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
    const sortedVentas = order.map(id => ventas.find(v => v.id === id)).filter(Boolean) as Venta[];

    if (ventas.length === 0) return (
        <div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
            No hay ventas registradas.
        </div>
    );

    const thClass = "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 whitespace-nowrap";

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            {/* --- SOLUCIÓN PROBLEMA 1: max-height para el scrollbar visible --- */}
            <div className="w-full relative bg-white rounded-xl shadow-card border border-gray-100 flex flex-col">
                <div className="overflow-auto w-full max-h-[calc(100vh-250px)] scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    <table className="min-w-max w-full border-collapse relative">
                        <thead className="sticky top-0 z-30 bg-gray-50 shadow-sm">
                            <tr>
                                <th className={`${thClass} sticky left-0 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[200px]`}>Cliente</th>
                                <th className={thClass}>Área</th>
                                <th className={`${thClass} min-w-[200px]`}>Servicio</th>
                                <th className={`${thClass} text-center`}>Mon</th>
                                <th className={thClass}>N° Comp.</th>
                                <th className={thClass}>Mes Serv.</th>
                                <th className={thClass}>F. Factura</th>
                                <th className={`${thClass} text-center`}>Estado</th>
                                <th className={`${thClass} text-center`}>Plazo</th>
                                <th className={thClass}>F. Abono Cta</th>
                                <th className={`${thClass} text-right`}>Abono Cta</th>
                                <th className={thClass}>F. Detrac</th>
                                <th className={`${thClass} text-right`}>IGV Detrac</th>
                                <th className={`${thClass} text-right`}>Subtotal</th>
                                <th className={`${thClass} text-right`}>IGV</th>
                                <th className={`${thClass} text-right bg-gray-100`}>Total</th>
                                <th className={`${thClass} sticky right-0 z-40 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] text-center min-w-[100px]`}>Acciones</th>
                            </tr>
                        </thead>
                        <SortableContext items={order} strategy={verticalListSortingStrategy}>
                            <tbody className="divide-y divide-gray-100">
                                {sortedVentas.map(venta => (
                                    <SortableRow key={venta.id} venta={venta} onDelete={onDelete} onEdit={onEdit} />
                                ))}
                            </tbody>
                        </SortableContext>
                    </table>
                </div>
            </div>
        </DndContext>
    );
};