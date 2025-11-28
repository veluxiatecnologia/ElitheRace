import React from 'react';
import Badge from './Badge';
import Button from './Button';
import './QRCodeDisplay.css';

const QRCodeDisplay = ({
    qrCode,
    eventName,
    userName,
    checkedInAt,
    onDownload
}) => {
    const handleDownload = () => {
        if (!qrCode) return;

        // Create download link
        const link = document.createElement('a');
        link.href = qrCode;
        link.download = `qrcode-${eventName.replace(/\s+/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (onDownload) onDownload();
    };

    if (!qrCode) {
        return (
            <div className="qr-display qr-display-empty">
                <div className="qr-empty-icon">📱</div>
                <p>QR Code não disponível</p>
            </div>
        );
    }

    return (
        <div className="qr-display">
            <div className="qr-header">
                <h3 className="qr-title">🎫 Seu QR Code</h3>
                {checkedInAt && (
                    <Badge variant="success" size="small" dot>
                        ✓ Check-in realizado
                    </Badge>
                )}
            </div>

            <div className="qr-event-info">
                <p className="qr-event-name">{eventName}</p>
                {userName && <p className="qr-user-name">👤 {userName}</p>}
            </div>

            <div className="qr-code-container">
                <img
                    src={qrCode}
                    alt="QR Code para check-in"
                    className="qr-code-image"
                />
                {!checkedInAt && (
                    <div className="qr-scan-instruction">
                        📷 Apresente este código no evento
                    </div>
                )}
            </div>

            {checkedInAt && (
                <div className="qr-checked-in-info">
                    <p className="text-success">
                        Check-in realizado em {new Date(checkedInAt).toLocaleString('pt-BR')}
                    </p>
                </div>
            )}

            {!checkedInAt && (
                <div className="qr-actions">
                    <Button
                        variant="secondary"
                        onClick={handleDownload}
                        icon="💾"
                        className="w-full"
                    >
                        Salvar QR Code
                    </Button>
                </div>
            )}

            <div className="qr-instructions">
                <p className="text-sm text-muted">
                    {checkedInAt
                        ? 'Você já fez check-in neste evento!'
                        : 'Guarde este QR Code para fazer check-in no dia do evento'
                    }
                </p>
            </div>
        </div>
    );
};

export default QRCodeDisplay;
