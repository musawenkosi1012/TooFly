import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        
        const reference = formData.get("reference");
        const paynowReference = formData.get("paynowreference"); 
        const amount = formData.get("amount");
        const status = formData.get("status");
        const pollUrl = formData.get("pollurl");
        const hash = formData.get("hash");

        console.log("Paynow Update Received:", {
            reference,
            paynowReference,
            amount,
            status,
            pollUrl,
            hash
        });

        // If status is "Paid", deduct stock from the backend
        if (status === "Paid") {
            // You can call your backend checkout endpoint here
            // to deduct stock for the items in this order
            console.log(`Payment confirmed for reference: ${reference}`);
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Paynow update error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
