/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const [guests, setGuests] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            }
        };
        checkUser();
    }, [router]);

    // Fetch guests when the page loads
    const fetchGuests = async () => {
        const { data, error } = await supabase.from('guests').select('*').order('created_at', { ascending: false });
        if (data) setGuests(data);
        if (error) console.error('Error fetching guests:', error);
    };

    useEffect(() => {
        fetchGuests();
    }, []);

    // Handle form submission
    const handleAddGuest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/guests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ name, email, notes }),
        });

        if (res.ok) {
            setName('');
            setEmail('');
            setNotes('');
            fetchGuests(); // Refresh the list
        } else {
            alert('Failed to add guest');
        }
        setLoading(false);
    };

    const handleMarkPaid = async (guestId: string, name: string, email: string) => {
        if (!confirm(`Are you sure you want to mark ${name} as paid and email their ticket?`)) return;

        setProcessingId(guestId);

        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/tickets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ guestId, name, email }),
        });
        if (res.ok) {
            alert('Ticket sent successfully!');
            fetchGuests(); // Refresh the list
        } else {
            const data = await res.json();
            alert(`Failed: ${data.error}`);
        }
        setProcessingId(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Batch Party Ticket Admin</h1>
                    <a
                        href="/admin/print"
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 font-semibold shadow-sm"
                    >
                        View Printable Tickets
                    </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Form Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md h-fit">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Add New Guest</h2>
                        <form onSubmit={handleAddGuest} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Name *</label>
                                <input
                                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                    className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Email</label>
                                <input
                                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Notes (Optional)</label>
                                <textarea
                                    value={notes} onChange={(e) => setNotes(e.target.value)}
                                    className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                                />
                            </div>
                            <button
                                type="submit" disabled={loading}
                                className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Adding...' : 'Add Guest'}
                            </button>
                        </form>
                    </div>

                    {/* Data Table Section */}
                    <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Guest List ({guests.length})</h2>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-gray-200 text-gray-600">
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Email</th>
                                    <th className="p-2 text-center">Payment Status</th>
                                    <th className="p-2 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {guests.map((guest) => (
                                    <tr key={guest.id} className="border-b border-gray-100 text-gray-800">
                                        <td className="p-2">{guest.name}</td>
                                        <td className="p-2 text-sm">{guest.email || '-'}</td>
                                        <td className="p-2 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${guest.payment_status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {guest.payment_status ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </td>
                                        <td className="p-2 text-center">
                                            {!guest.payment_status ? (
                                                <button
                                                    onClick={() => handleMarkPaid(guest.id, guest.name, guest.email)}
                                                    disabled={processingId === guest.id}
                                                    className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                                                >
                                                    {processingId === guest.id ? 'Sending...' : 'Mark Paid'}
                                                </button>
                                            ) : (
                                                <span className="text-sm text-gray-400">Ticket Sent</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {guests.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-gray-500">No guests added yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
}