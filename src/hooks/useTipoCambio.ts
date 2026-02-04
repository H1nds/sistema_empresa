import { useState, useEffect } from "react";

// Estructura de nuestro objeto de tasas
interface RatesMap {
    general: number;
    [year: string]: number; // Permite '2025', '2026', etc.
}

export const useTipoCambio = () => {
    // Estado inicial seguro
    const [rates, setRates] = useState<RatesMap>({ general: 3.85 });

    // Cargar al iniciar
    useEffect(() => {
        const savedRates = localStorage.getItem("sistema_tasas_cambio");
        if (savedRates) {
            try {
                setRates(JSON.parse(savedRates));
            } catch (e) {
                console.error("Error cargando tasas", e);
            }
        }
    }, []);

    // Función para obtener la tasa según el filtro
    // Si year es null o "", devuelve la general.
    // Si existe tasa para el año, la devuelve. Si no, devuelve la general.
    const getRate = (year?: number | string | null): number => {
        if (!year) return rates.general;
        const yearKey = year.toString();
        return rates[yearKey] || rates.general;
    };

    // Función para actualizar una tasa específica
    const updateRate = (yearKey: string, value: number) => {
        const newRates = { ...rates, [yearKey]: value };
        setRates(newRates);
        localStorage.setItem("sistema_tasas_cambio", JSON.stringify(newRates));
    };

    return { rates, getRate, updateRate };
};