import { useState, useEffect } from "react";
import { db, storage } from "../services/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface Producto {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    proveedor: string;
    imagenUrl: string;
}

export const useProductos = () => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);

    const cargarProductos = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "productos"));
            const querySnapshot = await getDocs(q);
            const prods = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Producto[];
            setProductos(prods);
        } catch (error) {
            console.error("Error cargando productos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarProductos();
    }, []);

    const agregarProducto = async (productoData: Omit<Producto, 'id' | 'imagenUrl'>, archivoImagen: File) => {
        try {
            const imagenRef = ref(storage, `productos/${Date.now()}_${archivoImagen.name}`);
            await uploadBytes(imagenRef, archivoImagen);
            const imagenUrl = await getDownloadURL(imagenRef);

            const nuevoProducto = { ...productoData, imagenUrl, fechaCreacion: new Date().toISOString() };
            await addDoc(collection(db, "productos"), nuevoProducto);

            await cargarProductos();
            return true;
        } catch (error) {
            console.error("Error al guardar producto:", error);
            throw error;
        }
    };

    // --- NUEVA FUNCIÓN: EDITAR PRODUCTO ---
    const editarProducto = async (id: string, productoData: Partial<Producto>, archivoImagen?: File) => {
        try {
            let imagenUrl = productoData.imagenUrl;

            // Si el usuario subió una foto nueva, la guardamos y obtenemos su nuevo link
            if (archivoImagen) {
                const imagenRef = ref(storage, `productos/${Date.now()}_${archivoImagen.name}`);
                await uploadBytes(imagenRef, archivoImagen);
                imagenUrl = await getDownloadURL(imagenRef);
            }

            const docRef = doc(db, "productos", id);
            await updateDoc(docRef, {
                ...productoData,
                ...(imagenUrl && { imagenUrl }), // Solo actualiza la imagen si hay una URL válida
                fechaActualizacion: new Date().toISOString()
            });

            await cargarProductos();
            return true;
        } catch (error) {
            console.error("Error al editar producto:", error);
            throw error;
        }
    };

    const eliminarProducto = async (id: string) => {
        try {
            await deleteDoc(doc(db, "productos", id));
            setProductos(productos.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error eliminando:", error);
        }
    };

    return { productos, loading, agregarProducto, editarProducto, eliminarProducto };
};