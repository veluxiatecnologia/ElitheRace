import React, { useState, useEffect } from 'react';

const OfflineNotice = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#e74c3c',
            color: 'white',
            textAlign: 'center',
            padding: '10px',
            zIndex: 9999,
            fontWeight: 'bold',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
            ⚠️ Sem conexão com a internet. Verifique sua rede.
        </div>
    );
};

export default OfflineNotice;
