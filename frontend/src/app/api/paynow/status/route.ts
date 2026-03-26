import { NextResponse } from 'next/server';
// @ts-ignore
import { Paynow } from 'paynow';

export async function POST(req: Request) {
    try {
        const { poll_url } = await req.json();
        
        const integrationId = process.env.PAYNOW_INTEGRATION_ID || "";
        const integrationKey = process.env.PAYNOW_INTEGRATION_KEY || "";
        
        const paynow = new Paynow(integrationId, integrationKey);
        const status = await paynow.pollTransaction(poll_url);
        
        return NextResponse.json(status);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
