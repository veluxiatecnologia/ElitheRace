import React, { useEffect, useState, useRef } from 'react';
import API_URL from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import FormCard from '../components/FormCard';
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import toast from 'react-hot-toast';

import MemberCard from '../components/MemberCard';
import './Profile.css';

const Profile = () => {
    const { user } = useAuth();
    const { refreshProfile } = useProfile();
    const [history, setHistory] = useState([]);
    const [profileData, setProfileData] = useState({
        nome: '',
        email: '',
        telefone: '',
        data_nascimento: '',
        tipo_sanguineo: '',
        moto_atual: '',
        avatar_url: '',
        participacoes_totais: 0,
        estrelinhas: 0,
        level: 1,
        xp: 0
    });
    const [userMedals, setUserMedals] = useState([]);
    const [editData, setEditData] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchProfileData();
            fetchHistory();
            fetchUserMedals();
        }
    }, [user]);

    const fetchProfileData = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            setProfileData({
                nome: data.nome || '',
                email: data.email || '',
                telefone: data.telefone || '',
                data_nascimento: data.data_nascimento || '',
                tipo_sanguineo: data.tipo_sanguineo || '',
                moto_atual: data.moto_atual || '',
                avatar_url: data.avatar_url || '',
                participacoes_totais: data.participacoes_totais || 0,
                estrelinhas: data.estrelinhas || 0,
                level: data.level || 1,
                xp: data.xp || 0
            });
            setEditData({
                nome: data.nome || '',
                telefone: data.telefone || '',
                data_nascimento: data.data_nascimento || '',
                tipo_sanguineo: data.tipo_sanguineo || '',
                moto_atual: data.moto_atual || ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Erro ao carregar perfil');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('participacoes')
                .select(`
                    *,
                    eventos (
                        id,
                        nome,
                        data,
                        destino
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedHistory = data.map(p => ({
                id: p.id,
                evento_nome: p.eventos?.nome || 'Evento desconhecido',
                evento_data: p.eventos?.data || '',
                evento_destino: p.eventos?.destino || '',
                moto_dia: p.moto_dia || profileData.moto_atual
            }));

            setHistory(formattedHistory);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const fetchUserMedals = async () => {
        try {
            const { data, error } = await supabase
                .from('user_medals')
                .select(`
                    *,
                    medals (
                        id,
                        name,
                        description,
                        icon_url
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;

            const medals = data.map(um => ({
                id: um.medals.id,
                name: um.medals.name,
                description: um.medals.description,
                icon_url: um.medals.icon_url
            }));

            setUserMedals(medals);
        } catch (error) {
            console.error('Error fetching medals:', error);
        }
    };

    const handlePhoneChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
            value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
            setEditData({ ...editData, telefone: value });
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setEditData({
            nome: profileData.nome,
            telefone: profileData.telefone,
            data_nascimento: profileData.data_nascimento,
            tipo_sanguineo: profileData.tipo_sanguineo,
            moto_atual: profileData.moto_atual
        });
        setIsEditing(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    nome: editData.nome,
                    telefone: editData.telefone,
                    data_nascimento: editData.data_nascimento,
                    tipo_sanguineo: editData.tipo_sanguineo,
                    moto_atual: editData.moto_atual
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Perfil atualizado com sucesso!');
            setProfileData({ ...profileData, ...editData });
            setIsEditing(false);
            refreshProfile();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Erro ao atualizar perfil');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarClick = () => {
        if (!uploadingAvatar) {
            fileInputRef.current?.click();
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('Imagem muito grande! Máximo 2MB');
            return;
        }

        setUploadingAvatar(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setProfileData({ ...profileData, avatar_url: publicUrl });
            toast.success('Avatar atualizado!');
            refreshProfile();
        } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.error('Erro ao fazer upload da imagem');
        } finally {
            setUploadingAvatar(false);
        }
    };

    if (loading) return <LoadingSpinner fullPage text="Carregando perfil..." />;

    return (
        <div className="profile-page">
            <div className="profile-container">

                {/* Profile Header */}
                <div className="profile-header">
                    <div className="profile-content">
                        {/* Avatar */}
                        <div className="profile-avatar-wrapper">
                            <div className="profile-avatar">
                                {profileData.avatar_url ? (
                                    <img src={profileData.avatar_url} alt="Avatar" />
                                ) : (
                                    <span>{profileData.nome.charAt(0).toUpperCase()}</span>
                                )}
                                <div
                                    className={`profile-avatar-overlay ${uploadingAvatar ? 'profile-avatar-uploading' : ''}`}
                                    onClick={handleAvatarClick}
                                >
                                    {uploadingAvatar ? (
                                        <>
                                            <div className="text-2xl mb-1">⏳</div>
                                            <span>Enviando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-2xl mb-1">📷</div>
                                            <span>Alterar Foto</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {/* Info */}
                        <div>
                            <h1 className="profile-name">{profileData.nome}</h1>
                            <div className="profile-role">
                                👑 PILOTO
                            </div>
                            <p className="profile-email">{profileData.email}</p>
                        </div>

                        {/* Edit Button */}
                        <div style={{ marginTop: 'var(--spacing-md)' }}>
                            {!isEditing ? (
                                <Button
                                    variant="secondary"
                                    onClick={handleEdit}
                                    icon="✏️"
                                >
                                    Editar Perfil
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="danger"
                                        onClick={handleCancel}
                                        style={{ marginRight: 'var(--spacing-sm)' }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleSave}
                                        loading={saving}
                                    >
                                        Salvar Alterações
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Member Card */}
                <div className="mb-6">
                    <MemberCard user={user} profileData={profileData} />
                    <p className="text-center text-muted text-sm mt-2">Toque no cartão para ver seu QR Code</p>
                </div>

                {/* Gamification Card - Below Member Card */}
                <div className="bg-gradient-to-r from-carbon-light to-carbon border border-glass-border rounded-xl p-6 mb-6 shadow-lg">
                    <div className="flex items-center gap-6">
                        {/* Level Badge */}
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-full border-2 border-gold flex items-center justify-center bg-black/40 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                                <div className="text-center">
                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Nível</div>
                                    <div className="text-3xl font-bold text-gold leading-none mt-1">{profileData.level || 1}</div>
                                </div>
                            </div>
                        </div>

                        {/* XP Progress */}
                        <div className="flex-1">
                            <div className="flex justify-between items-baseline mb-2">
                                <h3 className="text-lg font-bold text-white">Progressão</h3>
                                <span className="text-sm text-gold font-bold">{profileData.xp || 0} / {(profileData.level || 1) * 1000} XP</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden mb-2 border border-gray-700">
                                <div
                                    className="h-full bg-gradient-to-r from-gold via-yellow-500 to-gold transition-all duration-300"
                                    style={{ width: `${Math.min(100, ((profileData.xp || 0) / ((profileData.level || 1) * 1000)) * 100)}%` }}
                                ></div>
                            </div>

                            <p className="text-xs text-gray-400">
                                Faltam <span className="text-white font-semibold">{((profileData.level || 1) * 1000) - (profileData.xp || 0)} XP</span> para o próximo nível
                            </p>
                        </div>
                    </div>

                    {/* Medals */}
                    {userMedals.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-glass-border">
                            <h4 className="text-xs text-gray-400 font-bold uppercase mb-3 tracking-wide">Medalhas Conquistadas</h4>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {userMedals.map(medal => (
                                    <div key={medal.id} className="flex-shrink-0 text-center group" title={medal.description}>
                                        <div className="text-3xl mb-1 transform group-hover:scale-125 transition-transform cursor-help">
                                            {medal.icon_url}
                                        </div>
                                        <div className="text-[10px] text-gray-500 w-16 truncate">{medal.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Link to="/ranking" className="block mt-4 text-center text-sm text-gold hover:text-yellow-400 transition-colors">
                        Ver Ranking Global →
                    </Link>
                </div>

                {/* Edit Form */}
                {isEditing && (
                    <FormCard title="Editar Informações" className="mb-6" maxWidth={900} centered={false}>
                        <div className="edit-form-grid">
                            <Input
                                label="Nome Completo"
                                value={editData.nome}
                                onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                                icon="👤"
                            />
                            <Input
                                label="Telefone"
                                value={editData.telefone}
                                onChange={handlePhoneChange}
                                icon="📱"
                                placeholder="(11) 99999-9999"
                                maxLength={15}
                            />
                            <Input
                                label="Data de Nascimento"
                                type="date"
                                value={editData.data_nascimento}
                                onChange={(e) => setEditData({ ...editData, data_nascimento: e.target.value })}
                                icon="📅"
                            />
                            <Input
                                label="Tipo Sanguíneo"
                                value={editData.tipo_sanguineo}
                                onChange={(e) => setEditData({ ...editData, tipo_sanguineo: e.target.value })}
                                icon="🩸"
                                placeholder="Ex: O+"
                                maxLength={3}
                            />
                            <Input
                                label="Moto Atual"
                                value={editData.moto_atual}
                                onChange={(e) => setEditData({ ...editData, moto_atual: e.target.value })}
                                icon="🏍️"
                                placeholder="Ex: Honda CB 500X"
                            />
                        </div>
                    </FormCard>
                )}

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">🏁</div>
                        <div className="stat-label">Rolês</div>
                        <div className="stat-value">{profileData.participacoes_totais || 0}</div>
                    </div>

                    <div className="stat-card highlight">
                        <div className="stat-icon">⭐</div>
                        <div className="stat-label">Estrelinhas</div>
                        <div className="stat-value">{profileData.estrelinhas || 0}</div>
                        <div className="stat-subtext">
                            Próxima em {4 - ((profileData.participacoes_totais || 0) % 4)} rolês
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">🏍️</div>
                        <div className="stat-label">Máquina</div>
                        <div className="stat-value text-lg truncate">
                            {profileData.moto_atual || '---'}
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <FormCard title="Histórico de Estrada" subtitle="Seus rolês com a família Elithe" maxWidth={900} centered={false}>
                    {history.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-4 opacity-50">🏁</div>
                            <p className="text-muted">Você ainda não participou de nenhum evento.</p>
                            <Link to="/" className="text-gold hover:underline mt-2 inline-block">
                                Ver próximo rolê →
                            </Link>
                        </div>
                    ) : (
                        <div className="history-list">
                            {history.map((item) => (
                                <div key={item.id} className="history-item">
                                    <div className="history-icon">🏁</div>
                                    <div className="history-info">
                                        <h4 className="history-title">{item.evento_nome}</h4>
                                        <div className="history-meta">
                                            <span>📅 {new Date(item.evento_data).toLocaleDateString('pt-BR')}</span>
                                            <span>📍 {item.evento_destino}</span>
                                        </div>
                                        <div className="history-moto">
                                            🏍️ {item.moto_dia}
                                        </div>
                                    </div>
                                    <Badge variant="success" dot>Confirmado</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </FormCard>
            </div>
        </div>
    );
};

export default Profile;

