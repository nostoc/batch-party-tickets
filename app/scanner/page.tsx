/* eslint-disable react-hooks/immutability */
'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function Scanner() {
    const [scanResult, setScanResult] = useState<{ status: 'success' | 'error', message: string } | null>(null);
    const [isScanning, setIsScanning] = useState(true);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Only initialize the scanner if we are in "scanning" mode
        if (isScanning && !scannerRef.current) {
            scannerRef.current = new Html5QrcodeScanner(
                "qr-reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
            );

            scannerRef.current.render(onScanSuccess, onScanFailure);
        }

        // Cleanup function when component unmounts or stops scanning
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => console.error("Failed to clear html5QrcodeScanner. ", error));
                scannerRef.current = null;
            }
        };
    }, [isScanning]);

    const onScanSuccess = async (decodedText: string) => {
        // Stop scanning immediately to prevent duplicate API calls
        setIsScanning(false);

        try {
            const res = await fetch('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId: decodedText }),
            });

            const data = await res.json();

            if (res.ok) {
                setScanResult({ status: 'success', message: data.message });
            } else {
                setScanResult({ status: 'error', message: data.error });
            }
        } catch (error) {
            setScanResult({ status: 'error', message: 'Network error. Try again.' });
        }
    };

    const onScanFailure = () => {
        // We ignore failures because it fails constantly until a QR is perfectly in view
    };

    const resetScanner = () => {
        setScanResult(null);
        setIsScanning(true);
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">

                <div className="bg-gray-800 p-4 text-center">
                    <h1 className="text-2xl font-bold text-white">Door Scanner</h1>
                </div>

                {isScanning ? (
                    <div className="p-4">
                        <div id="qr-reader" className="w-full"></div>
                        <p className="text-center text-gray-500 mt-4 text-sm">Point camera at QR code</p>
                    </div>
                ) : (
                    <div className={`p-8 text-center ${scanResult?.status === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                        <div className={`text-4xl mb-4 ${scanResult?.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {scanResult?.status === 'success' ? '✅' : '❌'}
                        </div>
                        <h2 className={`text-xl font-bold mb-6 ${scanResult?.status === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                            {scanResult?.message}
                        </h2>
                        <button
                            onClick={resetScanner}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700"
                        >
                            Scan Next Ticket
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}