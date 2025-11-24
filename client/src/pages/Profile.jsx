import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../lib/supabaseClient';

const Profile = () => {
    const { user } = useAuth();
    const { refreshProfile } = useProfile();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [profileData, setProfileData] = useState({
        nome: '',
        email: '',
        telefone: '',
        data_nascimento: '',
        moto_atual: '',
        avatar_url: '',
        participacoes_totais: 0,
        estrelinhas: 0
    });

    const [editData, setEditData] = useState({});

    useEffect(() => {
        if (user) {
            fetchProfileData();
        }
    }, [user]);

    const getAuthHeader = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return {
            'Authorization': `Bearer ${session?.access_token}`
        };
    };

    const fetchProfileData = async () => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            const profileInfo = {
                nome: profile.nome || user.user_metadata?.nome || '',
                email: profile.email || user.email || '',
                telefone: profile.telefone || '',
                data_nascimento: profile.data_nascimento || '',
                moto_atual: profile.moto_atual || '',
                avatar_url: profile.avatar_url || '',
                participacoes_totais: profile.participacoes_totais || 0,
                estrelinhas: profile.estrelinhas || 0
            };

            setProfileData(profileInfo);
            setEditData(profileInfo);

            const headers = await getAuthHeader();
            const resHistory = await fetch('/api/events/history', { headers });
            const historyData = await resHistory.json();
            setHistory(historyData);

        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('Arquivo muito grande! Máximo 2MB.');
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('Formato inválido! Use JPG, PNG ou WebP.');
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));
            alert('Foto atualizada com sucesso!');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Erro ao fazer upload da foto');
        } finally {
            setUploading(false);
        }
    };

    const handleEditToggle = () => {
        if (isEditing) {
            setEditData(profileData);
        }
        setIsEditing(!isEditing);
    };

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    nome: editData.nome,
                    telefone: editData.telefone,
                    data_nascimento: editData.data_nascimento || null,
                    moto_atual: editData.moto_atual
                })
                .eq('id', user.id);

            if (error) throw error;

            setProfileData(editData);
            setIsEditing(false);
            refreshProfile(); // Refresh context to update navbar
            alert('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Erro ao salvar perfil');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}>
            <div className="text-gold text-xl">Carregando...</div>
        </div>
    );

    return (
        <div style={{ background: '#0a0a0a', minHeight: '100vh', paddingBottom: '60px' }}>
            <div className="container mx-auto px-4 py-6" style={{ maxWidth: '900px' }}>

                {/* Profile Header Card */}
                <div className="card mb-6" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)', padding: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '24px' }}>

                        {/* Avatar Section */}
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                background: profileData.avatar_url ? 'transparent' : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                border: '4px solid #FFD700',
                                boxShadow: '0 8px 32px rgba(255, 215, 0, 0.3)',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '48px',
                                fontWeight: 'bold',
                                color: '#000'
                            }}>
                                {profileData.avatar_url ? (
                                    <img src={profileData.avatar_url} alt="Foto de Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span>{profileData.nome.charAt(0).toUpperCase()}</span>
                                )}
                            </div>

                            {uploading && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.8)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#FFD700',
                                    fontSize: '14px'
                                }}>
                                    Enviando...
                                </div>
                            )}
                        </div>

                        {/* Name and Role */}
                        <div>
                            <h1 className="text-white" style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
                                {profileData.nome}
                            </h1>
                            <div className="text-gold" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '4px' }}>
                                {user.user_metadata?.role === 'admin' ? '⚡ Administrador' : '🏍️ Piloto'}
                            </div>
                            <div className="text-gray-400" style={{ fontSize: '14px' }}>
                                {profileData.email}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleAvatarUpload}
                                style={{ display: 'none' }}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="btn"
                                style={{ background: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}
                                disabled={uploading}
                            >
                                📷 Alterar Foto
                            </button>

                            {isEditing ? (
                                <>
                                    <button onClick={handleSave} className="btn btn-primary">
                                        ✓ Salvar
                                    </button>
                                    <button onClick={handleEditToggle} className="btn" style={{ background: '#444' }}>
                                        ✕ Cancelar
                                    </button>
                                </>
                            ) : (
                                <button onClick={handleEditToggle} className="btn" style={{ background: '#333' }}>
                                    ✏️ Editar Dados
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Edit Form (when editing) */}
                {isEditing && (
                    <div className="card mb-6">
                        <h3 className="text-gold mb-4" style={{ fontSize: '18px', fontWeight: 'bold' }}>📝 Informações Pessoais</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <div>
                                <label className="text-sm text-gray-400" style={{ display: 'block', marginBottom: '8px' }}>Nome Completo</label>
                                <input
                                    type="text"
                                    value={editData.nome}
                                    onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400" style={{ display: 'block', marginBottom: '8px' }}>Telefone</label>
                                <input
                                    type="tel"
                                    value={editData.telefone}
                                    onChange={(e) => setEditData({ ...editData, telefone: e.target.value })}
                                    placeholder="(11) 99999-9999"
                                    style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400" style={{ display: 'block', marginBottom: '8px' }}>Data de Nascimento</label>
                                <input
                                    type="date"
                                    value={editData.data_nascimento}
                                    onChange={(e) => setEditData({ ...editData, data_nascimento: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400" style={{ display: 'block', marginBottom: '8px' }}>Moto Atual</label>
                                <input
                                    type="text"
                                    value={editData.moto_atual}
                                    onChange={(e) => setEditData({ ...editData, moto_atual: e.target.value })}
                                    placeholder="Ex: Honda CB 500X"
                                    style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                    <div className="card text-center" style={{ padding: '24px', background: '#1a1a1a' }}>
                        <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏁</div>
                        <div className="text-gray-400" style={{ fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>Rolês</div>
                        <div className="text-white" style={{ fontSize: '32px', fontWeight: 'bold' }}>{profileData.participacoes_totais}</div>
                    </div>

                    <div className="card text-center" style={{ padding: '24px', background: 'linear-gradient(135deg, #1a1a0a 0%, #2a2000 100%)', border: '2px solid #FFD700' }}>
                        <div style={{ fontSize: '40px', marginBottom: '8px' }}>⭐</div>
                        <div className="text-gold" style={{ fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>Estrelinhas</div>
                        <div className="text-white" style={{ fontSize: '32px', fontWeight: 'bold' }}>{profileData.estrelinhas}</div>
                        <div className="text-gray-500" style={{ fontSize: '11px', marginTop: '8px' }}>
                            Próxima em {4 - (profileData.participacoes_totais % 4)} rolês
                        </div>
                    </div>

                    <div className="card text-center" style={{ padding: '24px', background: '#1a1a1a' }}>
                        <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏍️</div>
                        <div className="text-gray-400" style={{ fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>Máquina</div>
                        <div className="text-white" style={{ fontSize: '16px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {profileData.moto_atual || 'Não informada'}
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="card">
                    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '28px' }}>🛣️</span>
                        <h2 className="text-gold" style={{ fontSize: '24px', fontWeight: 'bold' }}>Histórico de Estrada</h2>
                    </div>

                    {history.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏁</div>
                            <p>Você ainda não participou de nenhum evento.</p>
                            <p style={{ fontSize: '14px', marginTop: '8px' }}>Confirme sua presença no próximo rolê!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {history.map((item) => (
                                <div key={item.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '16px',
                                    background: '#1a1a1a',
                                    borderRadius: '12px',
                                    border: '1px solid #222',
                                    transition: 'all 0.2s',
                                }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#FFD700'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#222'}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: 'rgba(255, 0, 0, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        flexShrink: 0
                                    }}>
                                        🏁
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 className="text-white" style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                                            {item.evento_nome}
                                        </h4>
                                        <p className="text-gray-400" style={{ fontSize: '13px' }}>
                                            {new Date(item.evento_data).toLocaleDateString('pt-BR')} • {item.evento_destino}
                                        </p>
                                        <p className="text-gray-500" style={{ fontSize: '12px', marginTop: '4px' }}>
                                            {item.moto_dia}
                                        </p>
                                    </div>
                                    <div style={{
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        background: 'rgba(0, 255, 0, 0.1)',
                                        border: '1px solid rgba(0, 255, 0, 0.3)',
                                        color: '#4ade80',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        ✓ Confirmado
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
