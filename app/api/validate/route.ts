/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

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
        const { ticketId } = await request.json();

        if (!ticketId) {
            return NextResponse.json({ error: 'No ticket data found in QR.' }, { status: 400 });
        }

        // 1. Look up the ticket in the database
        const { data: guest, error: fetchError } = await supabase
            .from('guests')
            .select('*')
            .eq('ticket_id', ticketId)
            .single();

        // If no guest matches this ID, it's a fake or broken ticket
        if (fetchError || !guest) {
            return NextResponse.json({ error: '❌ INVALID TICKET: Not found in system.' }, { status: 404 });
        }

        // 2. Check if it has already been used
        if (guest.is_used) {
            return NextResponse.json({
                error: `⚠️ ALREADY SCANNED: Ticket for ${guest.name} has already been used!`
            }, { status: 403 });
        }

        // 3. If valid and unused, mark it as used!
        const { error: updateError } = await supabase
            .from('guests')
            .update({ is_used: true })
            .eq('id', guest.id);

        if (updateError) throw updateError;

        return NextResponse.json({
            message: `✅ SUCCESS: Valid ticket for ${guest.name}! Let them in.`
        }, { status: 200 });

    } catch (error: any) {
        console.error('Validation Error:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}