import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { toast } from 'sonner';
import type { Gasto } from "../types/types";

export const useGastos = () => {
    const [gastos, setGastos] = useState<Gasto[]>([]);
    const [loading, setLoading] = useState(true);

    const gastosRef = collection(db, "gastos");

    useEffect(() => {
        const unsubscribe = onSnapshot(gastosRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Gasto));

            // Ordenar por fecha (más reciente primero)
            data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

            setGastos(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const agregarGasto = async (gasto: Omit<Gasto, 'id'>) => {
        try {
            await addDoc(gastosRef, {
                ...gasto,
                fechaCreacion: Timestamp.now()
            });
            toast.success("Gasto registrado");
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar");
        }
    };

    const eliminarGasto = async (id: string) => {
        if (!id) {
            console.error("Error: ID no válido para eliminar");
            return;
        }
        try {
            await deleteDoc(doc(db, "gastos", id));
            // toast.success("Gasto eliminado"); // Opcional si ya usas SweetAlert en la página
        } catch (error) {
            console.error("Error Firebase:", error);
            throw error; // Lanzamos el error para que la página lo detecte
        }
    };
    const editarGasto = async (id: string, data: Partial<Gasto>) => {
        try {
            await updateDoc(doc(db, "gastos", id), data);
            toast.success("Gasto actualizado");
        } catch (error) {
            toast.error("Error al editar");
        }
    };

    return { gastos, loading, agregarGasto, eliminarGasto, editarGasto };
};