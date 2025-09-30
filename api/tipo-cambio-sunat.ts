// pages/api/tipo-cambio-sunat.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type Data = { venta: string } | { error: string };

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    try {
        const apiRes = await fetch('https://api.apis.net.pe/v1/tipo-cambio-sunat');
        if (!apiRes.ok) {
            throw new Error(`SUNAT API status ${apiRes.status}`);
        }
        const data = await apiRes.json();
       
        res.status(200).json({ venta: data.venta });
    } catch (err: any) {
        console.error('Error en API /tipo-cambio-sunat:', err);
        res.status(500).json({ error: 'No pudimos obtener el tipo de cambio' });
    }
}
