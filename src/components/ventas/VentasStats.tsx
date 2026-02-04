import { Banknote, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { Venta } from "../../types/types";
import { useTipoCambio } from "../../hooks/useTipoCambio";

interface Props {
    ventas: Venta[];
    filterYear: string; // Recibimos el año del filtro (vacío = general)
}

export const VentasStats = ({ ventas, filterYear }: Props) => {
    // Usamos el hook para obtener la tasa correcta según el filtro
    const { getRate } = useTipoCambio();

    // Si filterYear viene vacío (""), el hook devuelve la tasa general
    const tipoCambio = getRate(filterYear || null);

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

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(amount);

    const stats = [
        { label: "Total Facturado (Est.)", value: formatMoney(montoTotal), icon: Banknote, color: "text-green-600", bg: "bg-green-100" },
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
                        {idx === 0 && (
                            <p className="text-[10px] text-gray-400 mt-1">
                                Ref. Variable: {tipoCambio.toFixed(2)} {filterYear ? `(${filterYear})` : '(Gen)'}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};