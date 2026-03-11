/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, notes } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Insert the new guest into Supabase
        const { data, error } = await supabase
            .from('guests')
            .insert([{ name, email, notes }])
            .select();

        if (error) throw error;

        return NextResponse.json({ message: 'Guest added successfully', guest: data[0] }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}