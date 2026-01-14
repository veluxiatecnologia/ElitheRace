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

            {/* Main Content Container */}
            <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-10 pb-20">

                {/* GAMIFICATION STATS - Horizontal Card */}
                <div className="bg-gradient-to-r from-[#1a1c20] to-black rounded-xl border border-glass-border shadow-lg p-5 mb-6">
                    <div className="flex flex-row items-center gap-5">

                        {/* Left: Level Badge */}
                        <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-full border-2 border-gold flex items-center justify-center bg-black/50 shadow-[0_0_10px_rgba(255,215,0,0.2)]">
                                <div className="text-center leading-tight">
                                    <div className="text-[9px] text-gray-500 font-bold uppercase">LEVEL</div>
                                    <div className="text-2xl font-oxanium font-bold text-white leading-none">{profileData.level || 1}</div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Progress Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex justify-between items-end mb-1">
                                <h3 className="text-base font-bold text-white uppercase tracking-wide truncate">Sua Jornada</h3>
                                <span className="text-xs text-gold font-bold whitespace-nowrap ml-2">{profileData.xp || 0} / {(profileData.level || 1) * 1000} XP</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden mb-1">
                                <div
                                    className="h-full bg-gradient-to-r from-gold to-yellow-600"
                                    style={{ width: `${Math.min(100, ((profileData.xp || 0) % 1000) / 10)}%` }}
                                ></div>
                            </div>

                            <div className="text-[10px] text-gray-400 text-right">
                                Faltam <span className="text-white font-semibold">{(1000 - ((profileData.xp || 0) % 1000))} XP</span> para o próximo nível
                            </div>
                        </div>

                    </div>

                    {/* Medals Grid (if any) */}
                    {userMedals.length > 0 && (
                        <div className="mt-4 border-t border-gray-800 pt-3">
                            <h4 className="text-[10px] text-gray-500 font-bold uppercase mb-2">Medalhas</h4>
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {userMedals.map(medal => (
                                    <div key={medal.id} className="flex-shrink-0 text-center" title={medal.name}>
                                        <div className="text-2xl filter drop-shadow-md mb-1 hover:scale-110 transition-transform cursor-help">
                                            {medal.icon_url}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Link to="/ranking" className="block mt-2 text-center text-xs text-gold hover:underline opacity-80">
                        Ver Ranking Global →
                    </Link>
                </div>

                {/* Member Card Section */}
                <div className="mb-6">
                    <MemberCard user={user} profileData={profileData} />
                    <p className="text-center text-gray-500 text-xs mt-2">Toque no cartão para ver seu QR Code</p>
                </div>

                {/* Editor Form (if editing) */}
                {isEditing && (
                    <div className="mb-6 bg-carbon-lighter border border-glass-border rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Editar Informações</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                className="md:col-span-2"
                            />
                        </div>
                    </div>
                )}

                {/* Stats Grid - Using Tailwind Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-carbon-lighter border border-glass-border rounded-xl p-4 text-center hover:border-gold transition-colors">
                        <div className="text-3xl mb-2">🏁</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Rolês</div>
                        <div className="text-2xl font-bold text-white">{profileData.participacoes_totais || 0}</div>
                    </div>

                    <div className="bg-carbon-lighter border border-glass-border rounded-xl p-4 text-center hover:border-gold transition-colors relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="text-3xl mb-2">⭐</div>
                        <div className="text-xs text-gold uppercase tracking-wider font-bold mb-1">Estrelinhas</div>
                        <div className="text-2xl font-bold text-white">{profileData.estrelinhas || 0}</div>
                        <div className="text-[10px] text-gray-500 mt-1">Próxima em {4 - ((profileData.participacoes_totais || 0) % 4)} rolês</div>
                    </div>

                    <div className="bg-carbon-lighter border border-glass-border rounded-xl p-4 text-center hover:border-gold transition-colors">
                        <div className="text-3xl mb-2">🏍️</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Máquina</div>
                        <div className="text-lg font-bold text-white truncate px-2">
                            {profileData.moto_atual || '---'}
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="bg-carbon-lighter border border-glass-border rounded-xl p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-white">Histórico de Estrada</h3>
                        <p className="text-xs text-gray-500">Seus rolês com a família Elithe</p>
                    </div>

                    {history.length === 0 ? (
                        <div className="text-center py-8 bg-black/20 rounded-lg">
                            <div className="text-4xl mb-3 opacity-30 grayscale">🏁</div>
                            <p className="text-gray-500 text-sm">Você ainda não participou de nenhum evento.</p>
                            <Link to="/" className="text-gold font-bold text-sm hover:underline mt-2 inline-block">
                                Ver próximo rolê →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((item) => (
                                <div key={item.id} className="bg-black/30 border border-glass-border rounded-lg p-3 flex items-center gap-3 hover:border-gold/50 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-carbon flex items-center justify-center text-xl flex-shrink-0">
                                        🏁
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <h4 className="font-bold text-white text-sm truncate">{item.evento_nome}</h4>
                                        <div className="text-xs text-gray-500 flex flex-wrap gap-x-3">
                                            <span>📅 {new Date(item.evento_data).toLocaleDateString('pt-BR')}</span>
                                            <span>📍 {item.evento_destino}</span>
                                        </div>
                                    </div>
                                    <Badge variant="success" dot className="hidden sm:flex">Confirmado</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
            );
};

            export default Profile;
