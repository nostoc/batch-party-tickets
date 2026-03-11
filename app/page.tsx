import { supabase } from '@/utils/supabase';

export default async function Home() {
  // Fetch all rows from the 'guests' table
  const { data: guests, error } = await supabase.from('guests').select('*');

  return (
    <main className="p-10 font-sans">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          <strong>Error connecting:</strong> {error.message}
        </div>
      )}

      {guests && guests.length === 0 && (
        <p className="text-gray-600">
          Connected successfully! But the table is empty. Add a row in the Supabase Table Editor to see it here.
        </p>
      )}

      {guests && guests.length > 0 && (
        <div className="mt-4">
          <p className="text-green-600 font-semibold mb-2">Connected successfully! Here is your data:</p>
          <pre className="bg-gray-800 text-green-400 p-4 rounded-md overflow-x-auto">
            {JSON.stringify(guests, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}