/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import QRCode from 'qrcode';
import Link from 'next/link';

export default function PrintTickets() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAndGenerate = async () => {
            // 1. Fetch only guests who have paid and have a generated ticket_id
            const { data, error } = await supabase
                .from('guests')
                .select('*')
                .eq('payment_status', true)
                .not('ticket_id', 'is', null)
                .order('name', { ascending: true });

            if (error || !data) {
                console.error('Error fetching tickets', error);
                setLoading(false);
                return;
            }

            // 2. Generate QR code images for the browser to display
            const ticketsWithQR = await Promise.all(
                data.map(async (guest) => {
                    const qrUrl = await QRCode.toDataURL(guest.ticket_id, {
                        width: 150,
                        margin: 1,
                        color: { dark: '#000000', light: '#ffffff' }
                    });
                    return { ...guest, qrUrl };
                })
            );

            setTickets(ticketsWithQR);
            setLoading(false);
        };

        fetchAndGenerate();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading tickets for printing...</div>;
    }

    return (
        <div className="p-8 min-h-screen bg-gray-50">
            {/* Controls Header - This gets hidden when printing */}
            <div className="max-w-6xl mx-auto mb-8 print:hidden flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Print Physical Tickets</h1>
                    <p className="text-sm text-gray-500">Showing {tickets.length} paid tickets</p>
                </div>
                <div className="space-x-4">
                    <Link href="/admin" className="text-gray-600 hover:text-gray-900 font-medium">
                        &larr; Back to Dashboard
                    </Link>
                    <button
                        onClick={() => window.print()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-semibold shadow-sm transition-colors"
                    >
                        Print Now
                    </button>
                </div>
            </div>

            {/* Printable Grid */}
            <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 print:gap-2 print:grid-cols-4">
                {tickets.map((ticket) => (
                    <div
                        key={ticket.id}
                        // print:break-inside-avoid ensures a ticket doesn't get cut in half across two pages
                        className="bg-white border-2 border-dashed border-gray-400 p-4 flex flex-col items-center text-center print:break-inside-avoid print:shadow-none print:border-black"
                    >
                        <h2 className="font-bold text-lg text-gray-900 truncate w-full uppercase">{ticket.name}</h2>
                        <p className="text-xs text-gray-500 mb-3 truncate w-full">{ticket.email}</p>

                        <img src={ticket.qrUrl} alt="QR Code" className="w-32 h-32 mb-2" />

                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                            ID: {ticket.ticket_id.split('-')[0]}
                        </p>
                    </div>
                ))}

                {tickets.length === 0 && (
                    <p className="col-span-full text-center text-gray-500 py-10 print:hidden">
                        No paid tickets found. Mark someone as paid in the dashboard first!
                    </p>
                )}
            </div>
        </div>
    );
}