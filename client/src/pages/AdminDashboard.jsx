import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import LoadingSkeleton from '../components/LoadingSkeleton';
import PermissionWarning from '../components/PermissionWarning';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import API_URL from '../config/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Data States
    const [events, setEvents] = useState([]);
    const [peTemplates, setPeTemplates] = useState([]);
    const [activeTab, setActiveTab] = useState('events');

    // UI States
    const [loading, setLoading] = useState(true);
    const [showPermission, setShowPermission] = useState(false);

    // Modals States
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isPeModalOpen, setIsPeModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);

    // Form States
    const [editingEventId, setEditingEventId] = useState(null);
    const [formData, setFormData] = useState({
        nome: '', data: '', destino: '', link_maps_destino: '', link_inscricao: '', observacoes: '', pedagios: '', banner_url: ''
    });
    const [pes, setPes] = useState([{ nome_pe: '', horario_pe: '', link_maps_pe: '' }]);
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    // PE Manager States
    const [newPeTemplate, setNewPeTemplate] = useState({ nome: '', localizacao: '' });
    const [editingPeId, setEditingPeId] = useState(null);

    // WhatsApp State
    const [whatsappText, setWhatsappText] = useState('');
    const [whatsappTemplate, setWhatsappTemplate] = useState('');

    useEffect(() => {
        const role = user?.user_metadata?.role || user?.role;
        if (user && role !== 'admin') {
            setShowPermission(true);
            return;
        }
        if (user) {
            fetchEvents();
            fetchPeTemplates();
        }
    }, [user]);

    // --- Fetching Data ---

    const getAuthHeader = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return { 'Authorization': `Bearer ${session?.access_token}` };
    };

    const fetchEvents = async () => {
        try {
            const headers = await getAuthHeader();
            const res = await fetch(API_URL + '/api/events', { headers });
            const data = await res.json();
            setEvents(data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar eventos');
        } finally {
            setLoading(false);
        }
    };

    const fetchPeTemplates = async () => {
        try {
            const res = await fetch(API_URL + '/api/pe-templates');
            const data = await res.json();
            setPeTemplates(data);
        } catch (error) {
            console.error(error);
        }
    };

    // --- Event Management ---

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePeChange = (index, field, value) => {
        const newPes = [...pes];
        if (field === 'template_id') {
            const template = peTemplates.find(t => t.id === parseInt(value));
            if (template) {
                newPes[index] = {
                    ...newPes[index],
                    nome_pe: template.nome,
                    link_maps_pe: template.localizacao,
                    template_id: value
                };
            }
        } else {
            newPes[index][field] = value;
        }
        setPes(newPes);
    };

    const addPeField = () => {
        setPes([...pes, { nome_pe: '', horario_pe: '', link_maps_pe: '', destino_pe_id: null }]);
    };

    const removePeField = (index) => {
        const newPes = pes.filter((_, i) => i !== index);
        setPes(newPes);
    };

    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBannerFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setBannerPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const uploadBanner = async () => {
        if (!bannerFile) return null;
        setUploading(true);
        try {
            const fileExt = bannerFile.name.split('.').pop();
            const fileName = Date.now() + "-" + Math.random().toString(36).substring(7) + "." + fileExt;
            const { error: uploadError } = await supabase.storage
                .from('event-banners')
                .upload(fileName, bannerFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('event-banners')
                .getPublicUrl(fileName);
            return data.publicUrl;
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Erro ao fazer upload do banner');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmitEvent = async () => {
        setSaving(true);
        try {
            let bannerUrl = formData.banner_url;
            if (bannerFile) {
                const uploadedUrl = await uploadBanner();
                if (uploadedUrl) bannerUrl = uploadedUrl;
                else throw new Error('Falha no upload do banner');
            }

            const headers = await getAuthHeader();
            const validPes = pes.filter(pe => pe.nome_pe && pe.horario_pe);
            const method = editingEventId ? 'PUT' : 'POST';
            const url = editingEventId ? API_URL + '/api/events/' + editingEventId : API_URL + '/api/events';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ ...formData, banner_url: bannerUrl, pes: validPes })
            });

            if (res.ok) {
                toast.success(editingEventId ? 'Evento atualizado!' : 'Evento criado!');
                closeEventModal();
                fetchEvents();
            } else {
                throw new Error('Erro ao salvar evento');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Erro ao salvar evento');
        } finally {
            setSaving(false);
        }
    };

    const openEventModal = (event = null) => {
        if (event) {
            setEditingEventId(event.id);
            setFormData({
                nome: event.nome,
                data: event.data,
                destino: event.destino || '',
                link_maps_destino: event.link_maps_destino || '',
                link_inscricao: event.link_inscricao || '',
                observacoes: event.observacoes || '',
                pedagios: event.pedagios || '',
                banner_url: event.banner_url || ''
            });
            setBannerPreview(event.banner_url || null);
            fetchEventPes(event.id);
        } else {
            setEditingEventId(null);
            setFormData({ nome: '', data: '', destino: '', link_maps_destino: '', link_inscricao: '', observacoes: '', pedagios: '', banner_url: '' });
            setPes([{ nome_pe: '', horario_pe: '', link_maps_pe: '', destino_pe_id: null }]);
            setBannerPreview(null);
            setBannerFile(null);
        }
        setIsEventModalOpen(true);
    };

    const fetchEventPes = async (eventId) => {
        try {
            const headers = await getAuthHeader();
            const res = await fetch(API_URL + '/api/events/' + eventId + '/pes', { headers });
            const eventPes = await res.json();

            // Map API fields to component state fields and match with templates
            const mappedPes = eventPes.map(pe => {
                const nome = pe.nome || pe.nome_pe; // Handle both cases just in case
                const horario = pe.horario || pe.horario_pe;
                const localizacao = pe.localizacao || pe.link_maps_pe;

                let templateId = pe.template_id;

                // Try to find matching template if ID is missing
                if (!templateId && nome) {
                    // Normalize strings for comparison (trim and lowercase)
                    const normalizedName = nome.trim().toLowerCase();
                    const matchingTemplate = peTemplates.find(t => t.nome.trim().toLowerCase() === normalizedName);

                    if (matchingTemplate) {
                        templateId = matchingTemplate.id;
                    }
                }

                return {
                    ...pe,
                    nome_pe: nome,
                    horario_pe: horario,
                    link_maps_pe: localizacao,
                    template_id: templateId,
                    destino_pe_id: pe.destino_pe_id || null
                };
            });

            setPes(mappedPes.length > 0 ? mappedPes : [{ nome_pe: '', horario_pe: '', link_maps_pe: '' }]);
        } catch (error) {
            console.error(error);
        }
    };

    const closeEventModal = () => {
        setIsEventModalOpen(false);
        setEditingEventId(null);
        setBannerFile(null);
    };

    const toggleActive = async (id, currentStatus) => {
        try {
            const headers = await getAuthHeader();
            await fetch(API_URL + '/api/events/' + id + '/active', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ ativo: !currentStatus })
            });
            fetchEvents();
            toast.success(`Evento ${!currentStatus ? 'ativado' : 'desativado'}`);
        } catch (error) {
            toast.error('Erro ao alterar status');
        }
    };

    const deleteEvent = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este evento?')) return;
        try {
            const headers = await getAuthHeader();
            await fetch(API_URL + '/api/events/' + id, { method: 'DELETE', headers });
            fetchEvents();
            toast.success('Evento excluído');
        } catch (error) {
            toast.error('Erro ao excluir evento');
        }
    };

    const handleCreateEvent = () => {
        openEventModal();
    };

    const handleEditEvent = (event) => {
        openEventModal(event);
    };

    const handleActivateEvent = (id) => {
        toggleActive(id, false);
    };

    const handleDeleteEvent = (id) => {
        deleteEvent(id);
    };

    // --- PE Manager ---

    const handleCreatePeTemplate = async (e) => {
        e.preventDefault();
        try {
            if (editingPeId) {
                const { error } = await supabase
                    .from('pe_templates')
                    .update({ nome: newPeTemplate.nome, localizacao: newPeTemplate.localizacao })
                    .eq('id', editingPeId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('pe_templates')
                    .insert([newPeTemplate]);
                if (error) throw error;
            }
            setNewPeTemplate({ nome: '', localizacao: '' });
            setEditingPeId(null);
            fetchPeTemplates();
            toast.success('PE salvo com sucesso');
        } catch (error) {
            toast.error('Erro ao salvar PE');
        }
    };

    const handleDeletePeTemplate = async (id) => {
        const deletePromise = new Promise(async (resolve, reject) => {
            try {
                const { error } = await supabase.from('pe_templates').delete().eq('id', id);
                if (error) throw error;
                await fetchPeTemplates();
                resolve();
            } catch (error) {
                console.error('Error deleting PE:', error);
                reject(error);
            }
        });

        toast.promise(deletePromise, {
            loading: 'Excluindo PE...',
            success: 'PE excluído com sucesso!',
            error: 'Erro ao excluir PE'
        });
    };

    // --- WhatsApp ---

    const fetchWhatsappTemplate = async () => {
        try {
            const headers = await getAuthHeader();
            const res = await fetch(API_URL + '/api/settings/whatsapp-template', { headers });
            const data = await res.json();
            setWhatsappTemplate(data.template || '');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar template');
        }
    };

    const openSettingsModal = async () => {
        setIsSettingsModalOpen(true);
        try {
            const headers = await getAuthHeader();
            const res = await fetch(API_URL + '/api/settings/whatsapp-template', { headers });
            const data = await res.json();
            setWhatsappTemplate(data.template || '');
        } catch (error) {
            console.error(error);
        }
    };

    const saveWhatsAppTemplate = async () => {
        try {
            const headers = await getAuthHeader();
            await fetch(API_URL + '/api/settings/whatsapp-template', {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ template: whatsappTemplate })
            });
            toast.success('Template salvo!');
            setIsSettingsModalOpen(false);
        } catch (error) {
            toast.error('Erro ao salvar template');
        }
    };

    const generateWhatsapp = async (id) => {
        const toastId = toast.loading('Gerando lista...');
        try {
            const headers = await getAuthHeader();
            const [eventRes, pesRes, confRes, templateRes] = await Promise.all([
                fetch(API_URL + '/api/events/' + id, { headers }),
                fetch(API_URL + '/api/events/' + id + '/pes', { headers }),
                fetch(API_URL + '/api/events/' + id + '/confirmations', { headers }),
                fetch(API_URL + '/api/settings/whatsapp-template', { headers })
            ]);

            const event = await eventRes.json();
            const pes = await pesRes.json();
            const confirmations = await confRes.json();
            const templateData = await templateRes.json();
            let template = templateData.template;

            if (!template) throw new Error('Template não configurado');

            // Fetch PE Templates to map destination IDs to names
            const peTemplatesRes = await fetch(API_URL + '/api/pe-templates', { headers });
            const peTemplates = await peTemplatesRes.json();

            // Create a map of PE Template IDs to names for destination lookup
            const peTemplateMap = {};
            peTemplates.forEach(template => {
                peTemplateMap[template.id] = template.nome;
            });

            let pesList = pes.map(pe => {
                const destinoPe = pe.destino_pe_id ? peTemplateMap[pe.destino_pe_id] : null;
                const destinoText = destinoPe ? ` SEGUE PARA ${destinoPe.toUpperCase()}` : '';
                return `⛽ ${pe.nome} ▶️ SAIDA ÁS ${pe.horario}${destinoText}${pe.localizacao ? `\n👇👇👇\n${pe.localizacao}` : ''}`;
            }).join('\n\n');

            confirmations.sort((a, b) => (a.usuario_nome || '').localeCompare(b.usuario_nome || ''));
            let confList = confirmations.map((conf, i) => {
                const num = String(i + 2).padStart(2, '0');
                let line = `🏍${num} ${conf.usuario_nome || 'Desconhecido'} – ${conf.moto_dia} – ${conf.pe_escolhido}`;
                if (conf.nova_moto) line += ` 🆕`;
                if (conf.aniversariante_semana) line += ` 🎂`;
                return line;
            }).join('\n');

            let text = template
                .replace(/{DESTINO}/g, event.destino.toUpperCase())
                .replace(/{DESTINO_NOME}/g, event.destino)
                .replace(/{DATA}/g, event.data.split('-').reverse().join('/'))
                .replace(/{LINK_INSCRICAO}/g, event.link_inscricao || '')
                .replace(/{LINK_MAPS_DESTINO}/g, event.link_maps_destino || '')
                .replace(/{PEDAGIOS}/g, event.pedagios || '')
                .replace(/{LISTA_PES}/g, pesList)
                .replace(/{LISTA_CONFIRMADOS}/g, confList)
                .replace(/{NOME_EVENTO}/g, event.nome)
                .replace(/{NOME}/g, event.nome);

            setWhatsappText(text);
            setIsWhatsappModalOpen(true);
            toast.dismiss(toastId);
        } catch (error) {
            toast.error(error.message || 'Erro ao gerar lista', { id: toastId });
        }
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(whatsappText);
        toast.success('Copiado!');
    };

    // --- User Management ---
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const headers = await getAuthHeader();
            const res = await fetch(API_URL + '/api/users', { headers });
            if (!res.ok) throw new Error('Erro ao buscar usuários');
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar usuários');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handlePromoteUser = async (userId, userName) => {
        if (!window.confirm(`Tem certeza que deseja promover ${userName} a Administrador?`)) return;

        const toastId = toast.loading('Promovendo usuário...');
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/api/users/${userId}/promote`, {
                method: 'PUT',
                headers
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao promover usuário');

            toast.success('Usuário promovido com sucesso!', { id: toastId });
            fetchUsers(); // Refresh list
        } catch (error) {
            console.error(error);
            toast.error(error.message, { id: toastId });
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`ATENÇÃO: Tem certeza que deseja EXCLUIR PERMANENTEMENTE o usuário ${userName}? Essa ação não pode ser desfeita.`)) return;

        const toastId = toast.loading('Excluindo usuário...');
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/api/users/${userId}`, {
                method: 'DELETE',
                headers
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao excluir usuário');

            toast.success('Usuário excluído com sucesso!', { id: toastId });
            fetchUsers(); // Refresh list
        } catch (error) {
            console.error(error);
            toast.error(error.message, { id: toastId });
        }
    };

    if (showPermission) {
        return <PermissionWarning />;
    }

    if (loading) {
        return (
            <div className="admin-container">
                <div className="admin-header">
                    <h1>Painel Administrativo</h1>
                </div>
                <div className="admin-grid">
                    <LoadingSkeleton height="200px" />
                    <LoadingSkeleton height="200px" />
                    <LoadingSkeleton height="200px" />
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>Painel Administrativo</h1>
                <p>Gerencie eventos, pontos de encontro e configurações do sistema.</p>
            </div>

            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'events' ? 'active' : ''}`}
                    onClick={() => setActiveTab('events')}
                >
                    📅 Eventos
                </button>
                <button
                    className={`admin-tab ${activeTab === 'pes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pes')}
                >
                    📍 Pontos de Encontro
                </button>
                <button
                    className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('users');
                        fetchUsers();
                    }}
                >
                    👥 Usuários
                </button>
                <button
                    className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    ⚙️ Configurações
                </button>
            </div>

            <div className="admin-content">
                {/* --- Events Tab --- */}
                {activeTab === 'events' && (
                    <div className="admin-section">
                        <div className="section-header">
                            <h2>Gerenciar Eventos</h2>
                            <Button icon="+" onClick={handleCreateEvent}>Novo Evento</Button>
                        </div>

                        <div className="events-list">
                            {events.map(event => (
                                <div key={event.id} className={`event-card ${!event.ativo ? 'inactive' : ''}`}>
                                    <div className="event-info">
                                        <h3>{event.nome}</h3>
                                        <div className="event-meta">
                                            <span>📅 {new Date(event.data).toLocaleDateString()}</span>
                                            <span>📍 {event.destino}</span>
                                        </div>
                                        {!event.ativo && <Badge variant="warning">Inativo</Badge>}
                                    </div>
                                    <div className="event-actions">
                                        <Button variant="secondary" size="small" onClick={() => handleEditEvent(event)}>✏️ Editar</Button>
                                        <Button variant="danger" size="small" onClick={() => handleDeleteEvent(event.id)}>🗑️ Excluir</Button>
                                        {!event.ativo && (
                                            <Button variant="primary" size="small" onClick={() => handleActivateEvent(event.id)}>✅ Ativar</Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {events.length === 0 && <p className="empty-state">Nenhum evento cadastrado.</p>}
                        </div>
                    </div>
                )}

                {/* --- PEs Tab --- */}
                {activeTab === 'pes' && (
                    <div className="admin-section">
                        <div className="section-header">
                            <h2>Modelos de Ponto de Encontro</h2>
                            <div className="add-pe-form">
                                <Input
                                    placeholder="Nome do PE (ex: Posto BR)"
                                    value={newPeTemplate.nome}
                                    onChange={(e) => setNewPeTemplate({ ...newPeTemplate, nome: e.target.value })}
                                />
                                <Input
                                    placeholder="Link do Google Maps"
                                    value={newPeTemplate.localizacao}
                                    onChange={(e) => setNewPeTemplate({ ...newPeTemplate, localizacao: e.target.value })}
                                />
                                <Button onClick={handleSavePeTemplate} disabled={!newPeTemplate.nome}>
                                    {editingPeId ? 'Atualizar' : 'Adicionar'}
                                </Button>
                                {editingPeId && (
                                    <Button variant="ghost" onClick={() => {
                                        setEditingPeId(null);
                                        setNewPeTemplate({ nome: '', localizacao: '' });
                                    }}>Cancelar</Button>
                                )}
                            </div>
                        </div>

                        <div className="pes-list">
                            {peTemplates.map(pe => (
                                <div key={pe.id} className="pe-card">
                                    <div className="pe-info">
                                        <strong>{pe.nome}</strong>
                                        <a href={pe.localizacao} target="_blank" rel="noopener noreferrer" className="pe-link">
                                            🗺️ Ver no mapa
                                        </a>
                                    </div>
                                    <div className="pe-actions">
                                        <Button variant="ghost" size="small" onClick={() => handleEditPeTemplate(pe)}>✏️</Button>
                                        <Button variant="ghost" size="small" className="text-red" onClick={() => handleDeletePeTemplate(pe.id)}>🗑️</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- Users Tab --- */}
                {activeTab === 'users' && (
                    <div className="admin-section">
                        <div className="section-header">
                            <h2>Gerenciar Usuários</h2>
                            <Button variant="ghost" onClick={fetchUsers} disabled={loadingUsers}>🔄 Atualizar</Button>
                        </div>

                        {loadingUsers ? (
                            <div className="users-list">
                                <LoadingSkeleton height="60px" />
                                <LoadingSkeleton height="60px" />
                                <LoadingSkeleton height="60px" />
                            </div>
                        ) : (
                            <div className="users-list">
                                {users.map(u => (
                                    <div key={u.id} className="user-card">
                                        <div className="user-avatar">
                                            {u.avatar_url ? (
                                                <img src={u.avatar_url} alt={u.nome} />
                                            ) : (
                                                <div className="avatar-placeholder">{u.nome?.charAt(0)}</div>
                                            )}
                                        </div>
                                        <div className="user-info">
                                            <h3>{u.nome} {u.role === 'admin' && <Badge variant="gold">ADMIN</Badge>}</h3>
                                            <p>{u.email}</p>
                                            <span className="user-moto">{u.moto_atual || 'Sem moto cadastrada'}</span>
                                        </div>
                                        <div className="user-actions">
                                            {u.role !== 'admin' && (
                                                <Button
                                                    variant="secondary"
                                                    size="small"
                                                    onClick={() => handlePromoteUser(u.id, u.nome)}
                                                    title="Promover a Administrador"
                                                >
                                                    ⚡ Promover
                                                </Button>
                                            )}
                                            <Button
                                                variant="danger"
                                                size="small"
                                                onClick={() => handleDeleteUser(u.id, u.nome)}
                                                title="Excluir Usuário"
                                            >
                                                🗑️ Excluir
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {users.length === 0 && <p className="empty-state">Nenhum usuário encontrado.</p>}
                            </div>
                        )}
                    </div>
                )}

                {/* --- Settings Tab --- */}
                {activeTab === 'settings' && (
                    <div className="admin-section">
                        <div className="section-header">
                            <h2>Configurações do WhatsApp</h2>
                        </div>
                        <div className="settings-card">
                            <p className="settings-desc">
                                Personalize a mensagem padrão enviada para o grupo do WhatsApp.
                                Variáveis disponíveis: <code>{'{NOME}'}</code>, <code>{'{DATA}'}</code>, <code>{'{DESTINO}'}</code>, <code>{'{LINK_INSCRICAO}'}</code>, <code>{'{OBSERVACOES}'}</code>
                            </p>
                            <Button onClick={() => {
                                fetchWhatsappTemplate();
                                setIsWhatsappModalOpen(true);
                            }}>
                                📱 Editar Template WhatsApp
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                title={editingEventId ? "Editar Evento" : "Novo Evento"}
            >
                <form onSubmit={handleSubmitEvent} className="event-form">
                    <Input label="Nome do Evento" name="nome" value={formData.nome} onChange={handleInputChange} required />
                    <Input label="Data" type="date" name="data" value={formData.data} onChange={handleInputChange} required />
                    <Input label="Destino" name="destino" value={formData.destino} onChange={handleInputChange} required />
                    <Input label="Link Google Maps (Destino)" name="link_maps_destino" value={formData.link_maps_destino} onChange={handleInputChange} />
                    <Input label="Link de Inscrição (Sympla/Outros)" name="link_inscricao" value={formData.link_inscricao} onChange={handleInputChange} />
                    <Input label="Pedágios (Valor Total)" name="pedagios" value={formData.pedagios} onChange={handleInputChange} placeholder="Ex: R$ 25,00" />

                    <div className="form-group">
                        <label>Banner do Evento</label>
                        <div className="banner-upload">
                            {bannerPreview && <img src={bannerPreview} alt="Preview" className="banner-preview" />}
                            <input type="file" accept="image/*" onChange={handleBannerChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Observações</label>
                        <textarea
                            name="observacoes"
                            value={formData.observacoes}
                            onChange={handleInputChange}
                            rows="4"
                            className="form-textarea"
                        />
                    </div>

                    <div className="pes-section">
                        <h3>Pontos de Encontro</h3>
                        {pes.map((pe, index) => (
                            <div key={index} className="pe-row">
                                <div className="pe-inputs">
                                    <Input
                                        placeholder="Nome do PE"
                                        value={pe.nome_pe}
                                        onChange={(e) => handlePeChange(index, 'nome_pe', e.target.value)}
                                        list="pe-suggestions"
                                    />
                                    <datalist id="pe-suggestions">
                                        {peTemplates.map(t => <option key={t.id} value={t.nome} />)}
                                    </datalist>

                                    <Input
                                        type="time"
                                        value={pe.horario_pe}
                                        onChange={(e) => handlePeChange(index, 'horario_pe', e.target.value)}
                                    />
                                </div>
                                {index > 0 && (
                                    <button type="button" className="remove-pe-btn" onClick={() => removePeField(index)}>×</button>
                                )}
                            </div>
                        ))}
                        <Button type="button" variant="secondary" size="small" onClick={addPeField}>+ Adicionar PE</Button>
                    </div>

                    <div className="modal-actions">
                        <Button type="button" variant="ghost" onClick={() => setIsEventModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" loading={saving}>{editingEventId ? 'Salvar Alterações' : 'Criar Evento'}</Button>
                    </div>
                </form>
            </Modal>

            {/* Settings Modal */}
            <Modal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                title="Configurações"
                size="lg"
                footer={<Button variant="primary" onClick={saveWhatsAppTemplate}>Salvar Template</Button>}
            >
                <div className="form-group">
                    <label className="block text-gold font-bold mb-2">Template WhatsApp</label>
                    <p className="text-xs text-gray-400 mb-2">Variáveis: {'{NOME}'}, {'{DESTINO}'}, {'{DATA}'}, {'{LINK_INSCRICAO}'}, {'{LINK_MAPS_DESTINO}'}, {'{PEDAGIOS}'}, {'{LISTA_PES}'}, {'{LISTA_CONFIRMADOS}'}</p>
                    <textarea
                        value={whatsappTemplate}
                        onChange={(e) => setWhatsappTemplate(e.target.value)}
                        rows="15"
                        className="w-full bg-carbon-lighter border border-glass-border rounded-md p-3 text-white font-mono text-sm focus:border-gold outline-none"
                    />
                </div>
            </Modal>

            {/* WhatsApp Result Modal */}
            <Modal
                isOpen={isWhatsappModalOpen}
                onClose={() => setIsWhatsappModalOpen(false)}
                title="Lista WhatsApp Gerada"
                size="md"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsWhatsappModalOpen(false)}>Fechar</Button>
                        <Button variant="primary" onClick={copyToClipboard} icon="📋">Copiar Texto</Button>
                    </>
                }
            >
                <textarea
                    value={whatsappText}
                    readOnly
                    rows="15"
                    className="w-full bg-carbon-lighter border border-glass-border rounded-md p-3 text-white font-mono text-sm focus:border-gold outline-none"
                />
            </Modal>
        </div>
    );
};

export default AdminDashboard;
