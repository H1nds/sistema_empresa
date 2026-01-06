import type { Venta } from "../../types/types";
import { TrendingUp, AlertCircle, CheckCircle2, DollarSign } from "lucide-react";

export const VentasStats = ({ ventas }: { ventas: Venta[] }) => {
    // Cálculos simples para los stats
    const totalVentas = ventas.length;
    const montoTotal = ventas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
    const pagadas = ventas.filter(v => Number(v.plazoDePago) === 0).length; // Asumiendo lógica plazo 0 = pagado

    // Formateador de moneda
    const formatMoney = (amount: number) =>
        new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

    const stats = [
        { label: "Total Facturado", value: formatMoney(montoTotal), icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
        { label: "Ventas Totales", value: totalVentas, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Completadas", value: pagadas, icon: CheckCircle2, color: "text-indigo-600", bg: "bg-indigo-100" },
        { label: "Pendientes", value: totalVentas - pagadas, icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-100" },
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
                    </div>
                </div>
            ))}
        </div>
    );
};