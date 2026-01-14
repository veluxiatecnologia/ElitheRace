import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import './MemberCard.css';

const MemberCard = ({ user, profileData }) => {
    const [flipped, setFlipped] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    useEffect(() => {
        if (user?.id) {
            generateQR();
        }
    }, [user]);

    const generateQR = async () => {
        try {
            // Member Token format
            const qrData = JSON.stringify({
                type: 'elithe_member',
                userId: user.id,
                timestamp: Date.now()
            });

            const url = await QRCode.toDataURL(qrData, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            setQrCodeUrl(url);
        } catch (err) {
            console.error(err);
        }
    };

    // Determine Role Label
    const roleLabel = user?.user_metadata?.role === 'admin' ? 'DIRETORIA' : 'PILOTO';

    // Stars Logic
    const stars = profileData?.estrelinhas || 0;
    const renderStars = () => {
        return '⭐'.repeat(stars) || 'Novato';
    };

    return (
        <div className="member-card-container" onClick={() => setFlipped(!flipped)}>
            <div className={`member-card ${flipped ? 'flipped' : ''}`}>

                {/* FRONT */}
                <div className="member-card-front">
                    <div className="holographic-overlay"></div>

                    <div className="card-header">
                        <div className="card-logo">ELITHE RACING</div>
                        <div className="card-role-badge">{roleLabel}</div>
                    </div>

                    <div className="card-body">
                        <img
                            src={profileData?.avatar_url || `https://ui-avatars.com/api/?name=${profileData?.nome || 'User'}&background=D4AF37&color=000`}
                            alt="Avatar"
                            className="card-avatar"
                        />
                        <div className="card-info">
                            <div className="card-name">{profileData?.nome?.split(' ').slice(0, 2).join(' ') || 'Membro Elithe'}</div>
                            <div className="card-level">{renderStars()}</div>
                        </div>
                    </div>

                    <div className="card-footer">
                        <div className="card-detail">
                            <div className="card-label">Tipo Sanguíneo</div>
                            <div className="card-value">{profileData?.tipo_sanguineo || '-'}</div>
                        </div>

                        <div className="card-chip"></div>

                        <div className="card-detail" style={{ textAlign: 'right' }}>
                            <div className="card-label">Membro Desde</div>
                            <div className="card-value">2024</div>
                            {/* In future, use created_at date */}
                        </div>
                    </div>
                </div>

                {/* BACK */}
                <div className="member-card-back">
                    <div className="qr-code-wrapper">
                        {qrCodeUrl && <img src={qrCodeUrl} alt="Member QR" />}
                    </div>
                    <div className="qr-label">Carteirinha Digital</div>
                    <div className="qr-sub">Apresente para Check-in</div>
                </div>

            </div>
        </div>
    );
};

export default MemberCard;
