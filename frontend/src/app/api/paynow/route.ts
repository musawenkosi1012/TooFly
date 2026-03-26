import { NextResponse } from 'next/server';
// @ts-ignore
import { Paynow } from 'paynow';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { items, email, method, phone } = body;

        // 1. Initialize Paynow
        const integrationId = process.env.PAYNOW_INTEGRATION_ID || "";
        const integrationKey = process.env.PAYNOW_INTEGRATION_KEY || "";
        
        let paynow = new Paynow(integrationId, integrationKey);
        paynow.resultUrl = process.env.PAYNOW_RESULT_URL || "http://localhost:3000/api/paynow/update";
        paynow.returnUrl = process.env.PAYNOW_RETURN_URL || "http://localhost:3000/success";

        // 2. Create Payment — In test mode, authemail MUST match merchant's registered email
        const merchantEmail = process.env.PAYNOW_MERCHANT_EMAIL || email || "guest@toofly.co.zw";
        let payment = paynow.createPayment(`TF-${Date.now()}`, merchantEmail);
        // 3. Add items
        for (const item of items) {
            payment.add(item.name, item.price * item.quantity);
        }

        // 4. Send to Paynow API
        let response;
        if (method && method !== 'web') {
            // Direct Mobile Payment
            response = await paynow.sendMobile(payment, phone, method);
        } else {
            // Standard Web Payment (Redirect)
            response = await paynow.send(payment);
        }
        
        if (response.success) {
            return NextResponse.json({ 
                redirect_url: response.redirectUrl || null, 
                poll_url: response.pollUrl,
                instructions: response.instructions || null, // Mobile might have instructions
                success: true
            });
        } else {
            console.error("Paynow Error:", response.error);
            return NextResponse.json({ error: response.error, success: false }, { status: 400 });
        }
    } catch (err: any) {
        console.error("Paynow API Error:", err);
        return NextResponse.json({ error: err.message || "Failed to initiate payment." }, { status: 500 });
    }
}
