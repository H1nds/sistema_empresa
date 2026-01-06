import { useState, useEffect } from "react";
import {
    collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp
} from "firebase/firestore";
import { db } from "../services/firebase";
import { toast } from 'sonner';
import { arrayMove } from "@dnd-kit/sortable";
import type { Venta } from "../types/types";

export const useVentas = () => {
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [order, setOrder] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const ventasRef = collection(db, "ventas");

    useEffect(() => {
        const unsubscribe = onSnapshot(ventasRef, async (snapshot) => {
            const docsWithPos = snapshot.docs.map((snap) => {
                const data = snap.data() as any;
                return {
                    id: snap.id,
                    position: typeof data.position === "number" ? data.position : Number.MAX_SAFE_INTEGER,
                    ...data,
                } as Venta;
            });

            // Ordenar por posición
            docsWithPos.sort((a, b) => (a.position || 0) - (b.position || 0));

            setVentas(docsWithPos);
            setOrder(docsWithPos.map(v => v.id));
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const agregarVenta = async (nuevaVenta: Omit<Venta, 'id'>) => {
        try {
            await addDoc(ventasRef, {
                ...nuevaVenta,
                position: ventas.length,
                fechaCreacion: Timestamp.now()
            });
            toast.success("Venta registrada correctamente");
        } catch (error) {
            console.error(error);
            toast.error("Error al registrar venta");
        }
    };

    const eliminarVenta = async (id: string) => {
        try {
            await deleteDoc(doc(db, "ventas", id));
            toast.success("Venta eliminada");
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar");
        }
    };

    const editarVenta = async (id: string, data: Partial<Venta>) => {
        try {
            await updateDoc(doc(db, "ventas", id), data);
            toast.success("Venta actualizada");
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar");
        }
    };

    const reordenarVentas = async (activeId: string, overId: string) => {
        const oldIndex = order.indexOf(activeId);
        const newIndex = order.indexOf(overId);

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

        const newOrder = arrayMove(order, oldIndex, newIndex);
        setOrder(newOrder); // Optimistic UI update

        try {
            // Actualizar en lote (batch) sería ideal, pero por ahora loop simple
            // Nota: En producción idealmente se usa batch de firestore
            await Promise.all(newOrder.map((id, idx) =>
                updateDoc(doc(db, "ventas", id), { position: idx })
            ));
        } catch (error) {
            console.error("Error reordenando", error);
            toast.error("Error al guardar el nuevo orden");
        }
    };

    return {
        ventas,
        order,
        loading,
        agregarVenta,
        eliminarVenta,
        editarVenta,
        reordenarVentas
    };
};