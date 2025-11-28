import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css';

const QRScanner = ({ onScanSuccess, onScanError }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const scannerRef = useRef(null);
    const scannerInstanceRef = useRef(null);

    useEffect(() => {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            startScanner();
        }, 100);

        return () => {
            clearTimeout(timer);
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        if (scannerInstanceRef.current) {
            return; // Scanner already running
        }

        const elementId = 'qr-reader';
        // Ensure element exists
        if (!document.getElementById(elementId)) {
            console.error(`Element ${elementId} not found`);
            return;
        }

        try {
            const html5QrCode = new Html5Qrcode(elementId);
            scannerInstanceRef.current = html5QrCode;

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            await html5QrCode.start(
                { facingMode: "environment" }, // Prefer back camera
                config,
                (decodedText, decodedResult) => {
                    // Success callback
                    if (onScanSuccess) {
                        onScanSuccess(decodedText, decodedResult);
                    }
                },
                (errorMessage) => {
                    // Error callback (ignore common scanning errors)
                    // console.log(errorMessage);
                }
            );

            setIsScanning(true);
            setError(null);
        } catch (err) {
            console.error('Error starting scanner:', err);
            setError('Não foi possível acessar a câmera. Verifique as permissões.');
            if (onScanError) {
                onScanError(err.message);
            }
        }
    };

    const stopScanner = async () => {
        if (scannerInstanceRef.current) {
            try {
                if (scannerInstanceRef.current.isScanning) {
                    await scannerInstanceRef.current.stop();
                }
                scannerInstanceRef.current.clear();
                scannerInstanceRef.current = null;
                setIsScanning(false);
            } catch (error) {
                console.error('Error stopping scanner:', error);
            }
        }
    };

    return (
        <div className="qr-scanner-container">
            <div className={`qr-scanner-wrapper ${isScanning ? 'scanning' : ''}`}>
                <div id="qr-reader" ref={scannerRef}></div>
                {isScanning && (
                    <div className="scanner-overlay">
                        <div className="scanner-line"></div>
                    </div>
                )}
                {error && (
                    <div className="scanner-error">
                        <p>{error}</p>
                        <button onClick={startScanner} className="retry-btn">Tentar Novamente</button>
                    </div>
                )}
            </div>
            <div className="scanner-instructions">
                <p>📷 Aponte a câmera para o QR Code do participante</p>
            </div>
        </div>
    );
};

export default QRScanner;
