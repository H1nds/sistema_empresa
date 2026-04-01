import { useState, useEffect } from "react";
import { db, storage } from "../services/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query, updateDoc, arrayUnion } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { CartItem } from "../pages/Proveedores";

interface PedidoItem {
    id: string;
    nombre: string;
    proveedor: string;
    precioSnap: number;
}

export interface Pedido {
    id: string;
    cliente: string; // ¡NUEVO! A quién va dirigida
    items: PedidoItem[];
    totalSoles: number; // Para tus gráficas internas
    totalMostrar: number; // El total que vio el cliente
    moneda: "PEN" | "USD"; // ¡NUEVO!
    aplicarIGV: boolean; // ¡NUEVO!
    tasaCambio: number; // ¡NUEVO!
    fechaPedido: string;
    estado: "PENDIENTE" | "COMPLETADO" | "CANCELADO";
    boletasUrls: string[];
}

export const usePedidos = () => {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);

    const cargarPedidos = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "pedidos"), orderBy("fechaPedido", "desc"));
            const querySnapshot = await getDocs(q);
            const ped = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Pedido[];
            setPedidos(ped);
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarPedidos();
    }, []);

    // Actualizamos la función para recibir la data contable completa
    const agregarPedido = async (
        carrito: CartItem[],
        totalSoles: number,
        totalMostrar: number,
        moneda: "PEN" | "USD",
        aplicarIGV: boolean,
        tasaCambio: number,
        cliente: string
    ) => {
        try {
            const itemsSnap: PedidoItem[] = carrito.map(item => ({
                id: item.id,
                nombre: item.nombre,
                proveedor: item.proveedor,
                precioSnap: Number(item.precioEditable) || item.precio
            }));

            const nuevoPedido: Omit<Pedido, 'id'> = {
                cliente: cliente || "Cliente General",
                items: itemsSnap,
                totalSoles,
                totalMostrar,
                moneda,
                aplicarIGV,
                tasaCambio,
                fechaPedido: new Date().toISOString(),
                estado: "PENDIENTE",
                boletasUrls: []
            };

            const docRef = await addDoc(collection(db, "pedidos"), nuevoPedido);
            await cargarPedidos();
            return docRef.id;
        } catch (error) {
            console.error("Error placing order:", error);
            throw error;
        }
    };

    const eliminarPedido = async (id: string) => {
        try {
            await deleteDoc(doc(db, "pedidos", id));
            setPedidos(pedidos.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting order:", error);
        }
    };

    const subirBoleta = async (pedidoId: string, archivo: File) => {
        try {
            const boletaRef = ref(storage, `pedidos/${pedidoId}/${Date.now()}_${archivo.name}`);
            await uploadBytes(boletaRef, archivo);
            const boletaUrl = await getDownloadURL(boletaRef);
            await updateDoc(doc(db, "pedidos", pedidoId), { boletasUrls: arrayUnion(boletaUrl) });
            await cargarPedidos();
            return boletaUrl;
        } catch (error) {
            console.error("Error uploading receipt:", error);
            throw error;
        }
    };

    return { pedidos, loading, agregarPedido, eliminarPedido, subirBoleta };
};