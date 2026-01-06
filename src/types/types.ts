import { Timestamp } from "firebase/firestore";

export interface Venta {
    id: string;
    cliente: string;
    area: string;
    servicio: string;
    moneda: "S/" | "$";
    comprobante: string;
    mesServicio: string;
    fechaFactura: string;
    plazoDePago: number | "";
    fechaPagoCtaCte: string;
    abonoCtaCte: number | "";
    fechaPagoDeducible: string;
    igvdeducible: number | "";
    subtotal: number | "";
    igv: number | "";
    total: number | "";
    position?: number;
    fechaCreacion?: Timestamp;
}