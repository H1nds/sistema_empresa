import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { deleteDoc, doc } from "firebase/firestore";
import { updateDoc } from "firebase/firestore";
import { toast } from 'sonner';
import { motion, AnimatePresence } from "framer-motion";

interface Venta {
  id: string;
  producto: string;
  cantidad: number;
  precio: number;
  fecha: Timestamp;
}

export const Ventas = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [precio, setPrecio] = useState(0);  

  const ventasRef = collection(db, "ventas");

  const agregarVenta = async () => {
  if (!producto || cantidad <= 0 || precio <= 0) {
    if (!producto) toast.error("Debes ingresar un producto.");
    else if (cantidad <= 0) toast.error("La cantidad debe ser mayor a cero.");
    else if (precio <= 0) toast.error("El precio debe ser mayor a cero.");
    return;
  }

  try {
    await addDoc(ventasRef, {
      producto,
      cantidad,
      precio,
      fecha: Timestamp.now(),
    });

    setProducto("");
    setCantidad(1);
    setPrecio(0);
    toast.success("Venta registrada correctamente.");
  } catch (error) {
    console.error("Error al agregar venta:", error);
    toast.error("Ocurrió un error al registrar la venta.");
  }
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

const guardarEdicion = async (id: string) => {
  const { producto, cantidad, precio } = ventaEditada;

  if (!producto || cantidad == null || precio == null) {
    toast.error("Por favor completa todos los campos.");
    return;
  }

  if (cantidad <= 0 || precio <= 0) {
    toast.error("Cantidad y precio deben ser mayores a cero.");
    return;
  }

  try {
    const docRef = doc(db, "ventas", id);
    await updateDoc(docRef, {
      producto,
      cantidad,
      precio,
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
    const unsubscribe = onSnapshot(ventasRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Venta[];

      setVentas(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Registrar nueva venta</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Producto"
            className="border p-2 rounded"
            value={producto}
            onChange={(e) => setProducto(e.target.value)}
          />
          <input
            type="number"
            placeholder="Cantidad"
            className="border p-2 rounded"
            value={cantidad}
            onChange={(e) => setCantidad(parseInt(e.target.value))}
          />
          <input
            type="number"
            placeholder="Precio"
            className="border p-2 rounded"
            value={precio}
            onChange={(e) => setPrecio(parseFloat(e.target.value))}
          />
          <button
            onClick={agregarVenta}
            className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600"
          >
            Agregar
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Ventas registradas</h3>
        <table className="w-full border border-gray-300 rounded text-left">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Producto</th>
              <th className="p-2">Cantidad</th>
              <th className="p-2">Precio</th>
              <th className="p-2">Total</th>
              <th className="p-2">Fecha</th>
              <th className="p-2">Acciones</th>
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
                        value={ventaEditada.producto ?? venta.producto}
                        onChange={(e) =>
                          setVentaEditada((prev) => ({ ...prev, producto: e.target.value }))
                        }
                        className="border p-1 rounded w-full"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={ventaEditada.cantidad ?? venta.cantidad}
                        onChange={(e) =>
                          setVentaEditada((prev) => ({
                            ...prev,
                            cantidad: parseInt(e.target.value),
                          }))
                        }
                        className="border p-1 rounded w-full"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={ventaEditada.precio ?? venta.precio}
                        onChange={(e) =>
                          setVentaEditada((prev) => ({
                            ...prev,
                            precio: parseFloat(e.target.value),
                          }))
                        }
                        className="border p-1 rounded w-full"
                      />
                    </td>
                    <td className="p-2 font-semibold">
                      S/{" "}
                      {(
                        (ventaEditada.precio ?? venta.precio) *
                        (ventaEditada.cantidad ?? venta.cantidad)
                      ).toFixed(2)}
                    </td>
                    <td className="p-2 text-sm text-gray-600">
                      {venta.fecha.toDate().toLocaleString()}
                    </td>
                    <td className="p-2 space-x-2">
                      <button
                        onClick={() => guardarEdicion(venta.id)}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => {
                          setVentaEditando(null);
                          setVentaEditada({});
                        }}
                        className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm"
                      >
                        Cancelar
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2">{venta.producto}</td>
                    <td className="p-2">{venta.cantidad}</td>
                    <td className="p-2">S/ {venta.precio.toFixed(2)}</td>
                    <td className="p-2 font-semibold">
                      S/ {(venta.precio * venta.cantidad).toFixed(2)}
                    </td>
                    <td className="p-2 text-sm text-gray-600">
                      {venta.fecha.toDate().toLocaleString()}
                    </td>
                    <td className="p-2 space-x-2">
                      <button
                        onClick={() => {
                          setVentaEditando(venta.id);
                          setVentaEditada({
                            producto: venta.producto,
                            cantidad: venta.cantidad,
                            precio: venta.precio,
                          });
                        }}
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setVentaAEliminar(venta.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                      >
                        Eliminar
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {ventas.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  Aún no hay ventas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>

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
    </div>
  );
};