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
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    const [profileData, setProfileData] = useState({
        nome: '',
        email: '',
        telefone: '',
        data_nascimento: '',
        tipo_sanguineo: '',
        moto_atual: '',
        avatar_url: '',
        participacoes_totais: 0,
        estrelinhas: 0
    });

    const [userMedals, setUserMedals] = useState([]);
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
                tipo_sanguineo: profile.tipo_sanguineo || '',
                avatar_url: profile.avatar_url || '',
                participacoes_totais: profile.participacoes_totais || 0,
                estrelinhas: profile.estrelinhas || 0,
                xp: profile.xp || 0,
                level: profile.level || 1,
                checkins_count: profile.checkins_count || 0
            };

            setProfileData(profileInfo);
            setEditData(profileInfo);

            const headers = await getAuthHeader();

            // Get Medals
            const resMedals = await fetch(`${API_URL}/api/ranking/${user.id}/medals`, { headers });
            if (resMedals.ok) {
                const medalsData = await resMedals.json();
                setUserMedals(medalsData);
            }

            const resHistory = await fetch(`${API_URL}/api/events/history`, { headers });
            const historyData = await resHistory.json();
            setHistory(historyData);

        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Erro ao carregar perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Arquivo muito grande! Máximo 2MB.');
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Formato inválido! Use JPG, PNG ou WebP.');
            return;
        }

        setUploading(true);
        const uploadPromise = new Promise(async (resolve, reject) => {
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
                resolve();
            } catch (error) {
                reject(error);
            }
        });

        toast.promise(uploadPromise, {
            loading: 'Atualizando foto...',
            success: 'Foto atualizada com sucesso! 📸',
            error: 'Erro ao atualizar foto'
        });

        try {
            await uploadPromise;
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const formatPhoneNumber = (value) => {
        // Remove all non-digit characters
        const numbers = value.replace(/\D/g, '');

        // Limit to 11 digits (Brazilian phone format)
        const limited = numbers.substring(0, 11);

        // Apply mask: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
        if (limited.length <= 10) {
            // Format: (XX) XXXX-XXXX
            return limited
                .replace(/^(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            // Format: (XX) XXXXX-XXXX
            return limited
                .replace(/^(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2');
        }
    };

    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        setEditData({ ...editData, telefone: formatted });
    };

    const handleEditToggle = () => {
        if (isEditing) {
            setEditData(profileData);
        }
        setIsEditing(!isEditing);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    nome: editData.nome,
                    telefone: editData.telefone,
                    data_nascimento: editData.data_nascimento || null,
                    tipo_sanguineo: editData.tipo_sanguineo,
                    moto_atual: editData.moto_atual
                })
                .eq('id', user.id);

            if (error) throw error;

            setProfileData(editData);
            setIsEditing(false);
            refreshProfile();
            toast.success('Perfil atualizado com sucesso! ✅');
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Erro ao salvar perfil');
        } finally {
            setSaving(false);
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
                                    className={`profile-avatar-overlay ${uploading ? 'profile-avatar-uploading' : ''}`}
                                    onClick={() => !uploading && fileInputRef.current?.click()}
                                >
                                    {uploading ? <LoadingSpinner size="small" color="gold" /> : '📷 Alterar'}
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleAvatarUpload}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {/* Info */}
                        <div>
                            <h1 className="profile-name">{profileData.nome}</h1>
                            <div className="profile-role">
                                {user.user_metadata?.role === 'admin' ? '⚡ Administrador' : '🏍️ Piloto'}
                            </div>
                            <div className="profile-email">{profileData.email}</div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 flex-wrap justify-center">
                            {!isEditing ? (
                                <Button
                                    variant="secondary"
                                    icon="✏️"
                                    onClick={handleEditToggle}
                                >
                                    Editar Perfil
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        onClick={handleEditToggle}
                                        disabled={saving}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant="primary"
                                        icon="✓"
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
            </div>

            {/* GAMIFICATION STATS - NEW PHASE 3 */}
            <div
                className="bg-gradient-to-r from-gray-900 to-black rounded-xl mb-6 border border-glass-border shadow-lg relative overflow-hidden"
                style={{ padding: '35px' }}
            >
                <div className="absolute top-0 right-0 p-2 opacity-20 text-6xl">🏆</div>

                <div style={{ maxWidth: '85%', margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">NÍVEL ATUAL</span>
                            <div className="text-3xl font-oxanium font-bold text-white leading-none mt-1">
                                Level {profileData.level || 1}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-gold font-bold text-xl">{profileData.xp || 0} XP</div>
                            <div className="text-xs text-gray-500">Próximo nível: {(profileData.level || 1) * 1000} XP</div>
                        </div>
                    </div>

                    {/* XP Bar */}
                    <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden mb-6">
                        <div
                            className="h-full bg-gradient-to-r from-gold to-yellow-500 transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(100, ((profileData.xp || 0) % 1000) / 10)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Medals Grid */}
                {userMedals.length > 0 && (
                    <div className="mt-6 border-t border-gray-800 pt-4">
                        <h4 className="text-xs text-gray-400 font-bold uppercase mb-3">Medalhas Conquistadas</h4>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {userMedals.map(medal => (
                                <div key={medal.id} className="flex-shrink-0 w-16 text-center group relative cursor-help">
                                    <div className="text-3xl filter drop-shadow-lg mb-1 transform group-hover:scale-110 transition-transform">
                                        {medal.icon_url}
                                    </div>
                                    <div className="text-[10px] text-gray-400 truncate w-full">{medal.name}</div>

                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-black/90 border border-gray-700 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                        <div className="font-bold text-gold">{medal.name}</div>
                                        <div>{medal.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <Link to="/ranking" className="block mt-4 text-center text-sm text-gold hover:underline">
                    Ver Ranking Global →
                </Link>
            </div>
            {/* END GAMIFICATION STATS */}

            {/* Member Card */}
            <div className="mb-6">
                <MemberCard user={user} profileData={profileData} />
                <p className="text-center text-muted text-sm mt-2">Toque no cartão para ver seu QR Code</p>
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
                    <div className="stat-value">{profileData.participacoes_totais}</div>
                </div>

                <div className="stat-card highlight">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-label">Estrelinhas</div>
                    <div className="stat-value">{profileData.estrelinhas}</div>
                    <div className="stat-subtext">
                        Próxima em {4 - (profileData.participacoes_totais % 4)} rolês
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
    );
};

export default Profile;
