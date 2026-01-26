import { useEffect, useState } from "react";
import type { Venta } from "../../types/types";
import { TrendingUp, AlertCircle, CheckCircle2, Banknote } from "lucide-react"; // Usamos Banknote en vez de DollarSign

export const VentasStats = ({ ventas }: { ventas: Venta[] }) => {
    const [tipoCambio, setTipoCambio] = useState<number>(3.85); // Valor por defecto seguro

    // Al cargar, buscamos si el cliente definió un tipo de cambio en la otra pestaña
    useEffect(() => {
        const cambioGuardado = localStorage.getItem("tipoCambioSistema");
        if (cambioGuardado) {
            setTipoCambio(parseFloat(cambioGuardado));
        }
    }, []);

    // 1. CORRECCIÓN DE SUMA (Punto 1): Convertimos dólares a soles
    const montoTotal = ventas.reduce((acc, v) => {
        const totalVenta = Number(v.total) || 0;
        if (v.moneda === "$") {
            return acc + (totalVenta * tipoCambio);
        } else {
            return acc + totalVenta;
        }
    }, 0);

    const totalVentas = ventas.length;
    const pagadas = ventas.filter(v => Number(v.plazoDePago) === 0).length;

    // Formateador de moneda en Soles
    const formatMoney = (amount: number) =>
        new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

    const stats = [
        {
            label: "Total Facturado (Est.)",
            value: formatMoney(montoTotal),
            icon: Banknote, // 4. CAMBIO DE ICONO (Punto 4)
            color: "text-green-600",
            bg: "bg-green-100"
        },
        {
            label: "Ventas Totales",
            value: totalVentas,
            icon: TrendingUp,
            color: "text-blue-600",
            bg: "bg-blue-100"
        },
        {
            label: "Completadas",
            value: pagadas,
            icon: CheckCircle2,
            color: "text-indigo-600",
            bg: "bg-indigo-100"
        },
        {
            label: "Pendientes",
            value: totalVentas - pagadas,
            icon: AlertCircle,
            color: "text-orange-600",
            bg: "bg-orange-100"
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
                <div key={idx} className="card p-4 flex items-center gap-4 hover:shadow-lg transition-shadow">
                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                        <stat.icon size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                        <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                        {/* Pequeña nota para que el cliente sepa qué tipo de cambio se usó */}
                        {idx === 0 && (
                            <p className="text-[10px] text-gray-400 mt-1">
                                Ref. Dólar: S/ {tipoCambio.toFixed(2)}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};