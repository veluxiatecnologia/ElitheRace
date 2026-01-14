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
    const [whatsappTemplate, setWhatsappTemplate] = useState('');

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

    // User Management States
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Photo Moderation States
    const [pendingPhotos, setPendingPhotos] = useState([]);
    const [isModerationModalOpen, setIsModerationModalOpen] = useState(false);
    const [loadingPending, setLoadingPending] = useState(false);

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
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error(error.message, { id: toastId });
        }
    };

    const handleDemoteUser = async (userId, userName) => {
        if (!window.confirm(`Tem certeza que deseja remover ${userName} de Administrador?`)) return;

        const toastId = toast.loading('Removendo privilégios...');
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/api/users/${userId}/demote`, {
                method: 'PUT',
                headers
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao remover privilégios');

            toast.success('Privilégios removidos com sucesso!', { id: toastId });
            fetchUsers();
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
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error(error.message, { id: toastId });
        }
    };


    // --- Photo Moderation ---
    const fetchPendingPhotos = async () => {
        setLoadingPending(true);
        try {
            const headers = await getAuthHeader();
            const res = await fetch(API_URL + '/api/gallery/pending', { headers });
            if (!res.ok) throw new Error('Erro ao buscar fotos pendentes');
            const data = await res.json();
            setPendingPhotos(data);
            setIsModerationModalOpen(true);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar fotos pendentes');
        } finally {
            setLoadingPending(false);
        }
    };

    const handleModeratePhoto = async (photoId, status) => {
        const toastId = toast.loading(status === 'approved' ? 'Aprovando...' : 'Rejeitando...');
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/api/gallery/photos/${photoId}/moderate`, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (!res.ok) throw new Error('Erro ao moderar foto');

            toast.success(status === 'approved' ? 'Foto aprovada! ✅' : 'Foto rejeitada ❌', { id: toastId });

            // Remove from list locally
            setPendingPhotos(prev => prev.filter(p => p.id !== photoId));

            // If empty, close modal
            if (pendingPhotos.length <= 1) {
                setIsModerationModalOpen(false);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message, { id: toastId });
        }
    };

    if (loading) return <div className="p-8"><LoadingSkeleton count={5} height={40} /></div>;
    if (showPermission) return <PermissionWarning />;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1 className="admin-title">Painel Admin</h1>
                <div className="admin-actions">
                    <Button variant="secondary" onClick={() => navigate('/admin/checkin-scanner')} icon="📷">
                        Scanner Check-in
                    </Button>
                    <Button variant="secondary" onClick={() => navigate('/admin/analytics')} icon="📊">
                        Analytics
                    </Button>
                    <Button variant="secondary" onClick={openSettingsModal} icon="⚙️">
                        Configs
                    </Button>
                    <Button variant="secondary" onClick={() => setIsPeModalOpen(true)} icon="📍">
                        Gerenciar PEs
                    </Button>
                    <Button variant="secondary" onClick={fetchUsers} icon="👥">
                        Gerenciar Usuários
                    </Button>
                    <Button variant="secondary" onClick={fetchPendingPhotos} icon="🖼️">
                        Moderar Fotos
                    </Button>
                    <Button variant="primary" onClick={() => openEventModal()} icon="➕">
                        Novo Evento
                    </Button>
                </div>
            </div>

            {/* Event List */}
            <div className="event-list">
                {events.map(event => (
                    <div key={event.id} className="event-card">
                        <div className="event-info">
                            <div className="event-header">
                                <h3 className="event-name">{event.nome}</h3>
                                <Badge variant={event.ativo ? 'success' : 'danger'} size="small" dot>
                                    {event.ativo ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </div>
                            <div className="event-meta">
                                <span className="event-meta-item">📅 {event.data.split('-').reverse().join('/')}</span>
                                <span className="event-meta-item">📍 {event.destino}</span>
                            </div>
                        </div>

                        <div className="event-actions">
                            <Button variant={event.ativo ? 'danger' : 'success'} onClick={() => toggleActive(event.id, event.ativo)}>
                                {event.ativo ? 'Desativar' : 'Ativar'}
                            </Button>
                            <Button variant="secondary" onClick={() => openEventModal(event)} icon="✏️">
                                Editar
                            </Button>
                            <Button variant="secondary" onClick={() => generateWhatsapp(event.id)} icon="📱" className="bg-green-600 hover:bg-green-700 border-none text-white">
                                Zap
                            </Button>
                            <Button variant="danger" onClick={() => deleteEvent(event.id)} icon="🗑️" />
                        </div>
                    </div>
                ))}
            </div>

            {/* --- MODALS --- */}

            {/* Event Modal */}
            <Modal
                isOpen={isEventModalOpen}
                onClose={closeEventModal}
                title={editingEventId ? 'Editar Evento' : 'Novo Evento'}
                size="lg"
                footer={
                    <>
                        <Button variant="ghost" onClick={closeEventModal} disabled={saving}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmitEvent} loading={saving} icon="✓">Salvar</Button>
                    </>
                }
            >
                <div className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <Input label="Nome do Rolê" name="nome" value={formData.nome} onChange={handleInputChange} />
                        </div>
                        <Input label="Data" type="date" name="data" value={formData.data} onChange={handleInputChange} />
                    </div>

                    <Input label="Destino" name="destino" value={formData.destino} onChange={handleInputChange} />
                    <Input label="Link Maps Destino" name="link_maps_destino" value={formData.link_maps_destino} onChange={handleInputChange} placeholder="https://maps.google.com/..." />

                    <div className="form-group">
                        <label className="block text-sm text-gray-400 mb-2">Banner do Evento</label>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            {bannerPreview && (
                                <div className="relative group">
                                    <img src={bannerPreview} alt="Preview" className="w-full md:w-32 h-32 object-cover rounded border border-gray-600" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                                        <span className="text-xs text-white">Preview</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex-1 w-full">
                                <label className="flex items-center justify-center w-full md:w-auto px-4 py-2 bg-gold text-black font-bold rounded cursor-pointer hover:bg-yellow-500 transition-colors">
                                    <span>📷 Escolher Imagem</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBannerChange}
                                        className="hidden"
                                    />
                                </label>
                                <p className="text-xs text-gray-500 mt-2">Recomendado: 1080x500px (Formato Faixa)</p>
                                {bannerFile && <p className="text-xs text-green-500 mt-1">Arquivo selecionado: {bannerFile.name}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="block text-sm text-gray-400 mb-2">Observações</label>
                            <textarea name="observacoes" value={formData.observacoes} onChange={handleInputChange} rows="3" className="w-full bg-carbon-lighter border border-glass-border rounded-md p-2 text-white focus:border-gold outline-none" />
                        </div>
                        <div className="form-group">
                            <label className="block text-sm text-gray-400 mb-2">Pedágios</label>
                            <textarea name="pedagios" value={formData.pedagios} onChange={handleInputChange} rows="3" className="w-full bg-carbon-lighter border border-glass-border rounded-md p-2 text-white focus:border-gold outline-none" />
                        </div>
                    </div>

                    <div className="border-t border-glass-border pt-4 mt-2">
                        <h4 className="text-gold font-bold mb-3">Pontos de Encontro (PEs)</h4>
                        {pes.map((pe, index) => (
                            <div key={index} className="flex flex-col gap-2 mb-4 p-3 bg-carbon-lighter rounded border border-glass-border">
                                <select
                                    value={pe.template_id || ''}
                                    onChange={(e) => handlePeChange(index, 'template_id', e.target.value)}
                                    className="w-full bg-carbon border border-glass-border rounded-md text-white focus:border-gold outline-none pe-select"
                                >
                                    <option value="">Selecione um PE...</option>
                                    {peTemplates.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                </select>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={pe.horario_pe || ''}
                                        onChange={(e) => handlePeChange(index, 'horario_pe', e.target.value)}
                                        type="time"
                                        placeholder="Horário"
                                        className="mb-0 pe-time-input"
                                    />
                                    <Button
                                        variant="danger"
                                        onClick={() => removePeField(index)}
                                        icon="✕"
                                        className="pe-delete-btn"
                                    />
                                </div>
                                <select
                                    value={pe.destino_pe_id || ''}
                                    onChange={(e) => handlePeChange(index, 'destino_pe_id', e.target.value)}
                                    className="w-full bg-carbon border border-glass-border rounded-md text-white focus:border-gold outline-none pe-select p-2"
                                >
                                    <option value="">➡️ Segue para PE... (Opcional)</option>
                                    {peTemplates.map(template => (
                                        <option key={template.id} value={template.id}>
                                            {template.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                        <Button variant="secondary" onClick={addPeField} icon="➕" className="w-50">Adicionar PE</Button>
                    </div>
                </div>
            </Modal>

            {/* PE Manager Modal */}
            <Modal
                isOpen={isPeModalOpen}
                onClose={() => setIsPeModalOpen(false)}
                title="Gerenciar Pontos de Encontro"
                size="md"
            >
                <form onSubmit={handleCreatePeTemplate} className="mb-6 p-4 bg-carbon-lighter rounded-lg border border-glass-border">
                    <h4 className="text-sm font-bold text-gray-400 mb-3 uppercase">{editingPeId ? 'Editar PE' : 'Novo PE'}</h4>
                    <div className="grid gap-3">
                        <Input label="Nome do PE" value={newPeTemplate.nome} onChange={(e) => setNewPeTemplate({ ...newPeTemplate, nome: e.target.value })} required />
                        <Input label="Link Maps" value={newPeTemplate.localizacao} onChange={(e) => setNewPeTemplate({ ...newPeTemplate, localizacao: e.target.value })} required />
                        <div className="flex gap-2 justify-end">
                            {editingPeId && <Button variant="ghost" onClick={() => { setEditingPeId(null); setNewPeTemplate({ nome: '', localizacao: '' }); }}>Cancelar</Button>}
                            <Button variant="primary" type="submit">{editingPeId ? 'Atualizar' : 'Adicionar'}</Button>
                        </div>
                    </div>
                </form>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {peTemplates.map(template => (
                        <div key={template.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-carbon border border-glass-border rounded hover:border-gold transition-colors">
                            <div className="w-full sm:w-auto">
                                <div className="font-bold text-white">{template.nome}</div>
                                <div className="text-xs text-gray-500 truncate max-w-full sm:max-w-[200px]">{template.localizacao}</div>
                            </div>
                            <div className="flex w-full sm:w-auto justify-end" style={{ gap: '24px' }}>
                                <Button size="medium" variant="secondary" onClick={() => { setNewPeTemplate({ nome: template.nome, localizacao: template.localizacao }); setEditingPeId(template.id); }}>✏️</Button>
                                <Button size="medium" variant="danger" onClick={() => handleDeletePeTemplate(template.id)}>🗑️</Button>
                            </div>
                        </div>
                    ))}
                </div>
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

            {/* Users Management Modal */}
            <Modal
                isOpen={loadingUsers || users.length > 0}
                onClose={() => setUsers([])}
                title="Gerenciar Usuários"
                size="lg"
            >
                {loadingUsers ? (
                    <div className="space-y-2">
                        <LoadingSkeleton height={60} />
                        <LoadingSkeleton height={60} />
                        <LoadingSkeleton height={60} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {users.map(u => (
                            <div key={u.id} className="event-card">
                                <div className="event-info">
                                    <div className="event-header" style={{ alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                background: u.avatar_url ? 'transparent' : 'linear-gradient(135deg, #d4af37 0%, #f4d46f 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '20px',
                                                fontWeight: 'bold',
                                                color: '#1a1a1a',
                                                flexShrink: 0,
                                                overflow: 'hidden'
                                            }}>
                                                {u.avatar_url ? (
                                                    <img
                                                        src={u.avatar_url}
                                                        alt={u.nome}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                ) : (
                                                    u.nome?.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="event-name" style={{ marginBottom: '4px' }}>{u.nome}</h3>
                                                {u.role === 'admin' && <Badge variant="gold" size="small">ADMIN</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="event-meta" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                        <span className="event-meta-item">📧 {u.email}</span>
                                        <span className="event-meta-item">🏍️ {u.moto_atual || 'Sem moto'}</span>
                                    </div>
                                </div>

                                <div className="event-actions" style={{ marginTop: '12px' }}>
                                    {u.role === 'admin' ? (
                                        <Button size="small" variant="secondary" onClick={() => handleDemoteUser(u.id, u.nome)} icon="⬇️">
                                            Despromover
                                        </Button>
                                    ) : (
                                        <Button size="small" variant="primary" onClick={() => handlePromoteUser(u.id, u.nome)} icon="⚡">
                                            Promover
                                        </Button>
                                    )}
                                    <Button size="small" variant="danger" onClick={() => handleDeleteUser(u.id, u.nome)} icon="🗑️">
                                        Excluir
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {users.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>
                                Nenhum usuário encontrado.
                            </div>
                        )}
                    </div>
                )}

            </Modal>

            {/* Photo Moderation Modal */}
            <Modal
                isOpen={isModerationModalOpen}
                onClose={() => setIsModerationModalOpen(false)}
                title="Moderação de Fotos"
                size="lg"
                footer={<Button variant="ghost" onClick={() => setIsModerationModalOpen(false)}>Fechar</Button>}
            >
                {loadingPending ? (
                    <div className="p-8"><LoadingSpinner /></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingPhotos.length === 0 ? (
                            <div className="col-span-full text-center py-8 text-gray-500">
                                Nenhuma foto pendente.
                            </div>
                        ) : (
                            pendingPhotos.map(photo => (
                                <div key={photo.id} className="relative group bg-carbon-lighter border border-glass-border rounded-lg overflow-hidden">
                                    <div className="aspect-square relative">
                                        <img src={photo.url} alt="Pendente" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                {photo.profiles?.avatar_url ? (
                                                    <img src={photo.profiles.avatar_url} className="w-6 h-6 rounded-full border border-gold" />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/50 flex items-center justify-center text-[10px] text-gold">
                                                        {photo.profiles?.nome?.charAt(0)}
                                                    </div>
                                                )}
                                                <span className="text-sm text-white truncate">{photo.profiles?.nome}</span>
                                            </div>
                                            {photo.events?.nome && (
                                                <span className="text-xs text-gray-400 truncate mb-1">📅 {photo.events.nome}</span>
                                            )}
                                            {photo.caption && (
                                                <p className="text-xs text-gray-300 italic truncate">"{photo.caption}"</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-2 grid grid-cols-2 gap-2">
                                        <Button size="small" variant="success" onClick={() => handleModeratePhoto(photo.id, 'approved')} icon="✓">
                                            Aprovar
                                        </Button>
                                        <Button size="small" variant="danger" onClick={() => handleModeratePhoto(photo.id, 'rejected')} icon="✕">
                                            Rejeitar
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminDashboard;
