import type { Venta } from "../../types/types";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2 } from "lucide-react";
import { Tooltip } from 'react-tooltip';

interface Props {
    ventas: Venta[];
    order: string[];
    onDragEnd: (event: DragEndEvent) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string, data: Partial<Venta>) => void; // Puedes implementar edición completa después
}

const SortableRow = ({ venta, onDelete }: { venta: Venta, onDelete: (id: string) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: venta.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        position: isDragging ? "relative" as const : "static" as const,
    };

    // Calcular estado
    const calcularEstado = (fecha: string, plazo: number) => {
        if (!fecha) return { color: "bg-gray-400", texto: "Sin fecha" };
        if (plazo === 0) return { color: "bg-green-500", texto: "Pagado" };
        const fechaLimite = new Date(fecha);
        fechaLimite.setDate(fechaLimite.getDate() + plazo);
        const hoy = new Date();
        const diff = fechaLimite.getTime() - hoy.getTime();
        if (diff < 0) return { color: "bg-red-500", texto: "Vencido" };
        return { color: "bg-blue-500", texto: "En plazo" };
    };

    const estado = calcularEstado(venta.fechaFactura, Number(venta.plazoDePago) || 0);

    return (
        <tr
            ref={setNodeRef} style={style} {...attributes} {...listeners}
            className={`group hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${isDragging ? "bg-blue-50 shadow-lg" : "bg-white"}`}
        >
            <td className="p-4 font-medium text-gray-900">{venta.cliente}</td>
            <td className="p-4 text-gray-500">{venta.servicio}</td>
            <td className="p-4 text-center">
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono font-bold">{venta.comprobante}</span>
            </td>
            <td className="p-4 text-gray-600">{venta.fechaFactura}</td>
            <td className="p-4 text-center">
                <div
                    className={`w-3 h-3 rounded-full mx-auto ${estado.color}`}
                    data-tooltip-id={`tt-${venta.id}`}
                    data-tooltip-content={estado.texto}
                />
                <Tooltip id={`tt-${venta.id}`} />
            </td>
            <td className="p-4 text-right font-medium text-gray-900">
                {venta.moneda} {Number(venta.total).toFixed(2)}
            </td>
            <td className="p-4 text-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-2">
                    <button className="p-1 hover:text-blue-600 text-gray-400"><Pencil size={16} /></button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(venta.id); }} // Detiene el drag al hacer click
                        onPointerDown={(e) => e.stopPropagation()} // Importante para que no inicie el drag
                        className="p-1 hover:text-red-600 text-gray-400"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export const VentasTable = ({ ventas, order, onDragEnd, onDelete }: Props) => {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    // Ordenar visualmente basado en el array 'order'
    const sortedVentas = order.map(id => ventas.find(v => v.id === id)).filter(Boolean) as Venta[];

    if (ventas.length === 0) return <div className="p-8 text-center text-gray-500">No hay ventas registradas.</div>;

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold tracking-wider">
                        <tr>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Servicio</th>
                            <th className="p-4 text-center">Comprobante</th>
                            <th className="p-4">Fecha</th>
                            <th className="p-4 text-center">Estado</th>
                            <th className="p-4 text-right">Total</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <SortableContext items={order} strategy={verticalListSortingStrategy}>
                        <tbody className="divide-y divide-gray-100">
                            {sortedVentas.map(venta => (
                                <SortableRow key={venta.id} venta={venta} onDelete={onDelete} />
                            ))}
                        </tbody>
                    </SortableContext>
                </table>
            </div>
        </DndContext>
    );
};