/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { Resend } from 'resend';
import QRCode from 'qrcode';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }
        const { guestId, name, email } = await request.json();

        if (!guestId || !email) {
            return NextResponse.json({ error: 'Missing guest ID or email' }, { status: 400 });
        }

        // 1. Generate a secure, unique ticket ID
        const ticketId = crypto.randomUUID();

        // 2. Generate the QR Code as a raw Buffer instead of a Data URL
        const qrBuffer = await QRCode.toBuffer(ticketId, {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' }
        });

        // 3. Update the database
        const { error: dbError } = await supabase
            .from('guests')
            .update({
                payment_status: true,
                ticket_id: ticketId
            })
            .eq('id', guestId);

        if (dbError) throw dbError;

        // 4. Send the Email with an Inline Attachment
        const { error: emailError } = await resend.emails.send({
            from: 'Batch Party <onboarding@resend.dev>',
            to: email,
            subject: 'Your Batch Party Ticket is Here!',
            html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2>Hi ${name}!</h2>
          <p>Your payment has been confirmed. Here is your official e-ticket.</p>
          <p>Please present this QR code at the door (either on your phone or printed).</p>
          <img src="cid:ticket-qr" alt="Your Ticket QR Code" style="margin: 20px auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
          <p style="color: #666; font-size: 12px; margin-top: 20px;">Ticket ID: ${ticketId}</p>
        </div>
      `,
            attachments: [
                {
                    filename: 'ticket-qr.png',
                    content: qrBuffer,
                    content_id: 'ticket-qr', // This links the attachment to the HTML image tag
                },
            ],
        });

        if (emailError) throw emailError;

        return NextResponse.json({ message: 'Ticket generated and sent!' }, { status: 200 });

    } catch (error: any) {
        console.error('Ticket Generation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}