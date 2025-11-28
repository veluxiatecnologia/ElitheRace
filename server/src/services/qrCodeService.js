const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique QR code for event check-in
 * @param {number} confirmationId - The confirmation ID
 * @returns {Promise<{token: string, qrCodeDataURL: string}>}
 */
async function generateCheckInQRCode(confirmationId) {
    // Generate unique token
    const token = uuidv4();

    // Create QR code data payload
    const qrData = JSON.stringify({
        type: 'elithe_checkin',
        confirmationId,
        token,
        timestamp: Date.now()
    });

    try {
        // Generate QR code as data URL (base64 PNG)
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'H', // High error correction
            type: 'image/png',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return { token, qrCodeDataURL };
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Validate QR code data format
 * @param {string} qrData - The scanned QR code data
 * @returns {object|null} Parsed data or null if invalid
 */
function validateQRCodeData(qrData) {
    try {
        const parsed = JSON.parse(qrData);

        // Validate required fields
        if (
            parsed.type === 'elithe_checkin' &&
            parsed.confirmationId &&
            parsed.token &&
            parsed.timestamp
        ) {
            return parsed;
        }

        return null;
    } catch (error) {
        return null;
    }
}

module.exports = {
    generateCheckInQRCode,
    validateQRCodeData
};
