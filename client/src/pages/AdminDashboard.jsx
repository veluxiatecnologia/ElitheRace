import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const AdminDashboard = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState({
        nome: '', data: '', destino: '', link_maps_destino: '', link_inscricao: '', observacoes: '', pedagios: '', banner_url: ''
    });
    const [pes, setPes] = useState([{ nome_pe: '', horario_pe: '', link_maps_pe: '' }]);
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [whatsappText, setWhatsappText] = useState('');
    const [peTemplates, setPeTemplates] = useState([]);
    const [showPeManager, setShowPeManager] = useState(false);
    const [newPeTemplate, setNewPeTemplate] = useState({ nome: '', localizacao: '' });
    const [editingPeId, setEditingPeId] = useState(null);
    const [editingEventId, setEditingEventId] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Check role in user_metadata (from Supabase Auth) or profiles table
        // For now, check user_metadata as we updated it
        const role = user?.user_metadata?.role || user?.role; // Fallback to user.role if mapped in context
        if (user && role !== 'admin') {
            navigate('/');
            return;
        }
        if (user) {
            fetchEvents();
            fetchPeTemplates();
        }
    }, [user]);

    const fetchPeTemplates = async () => {
        try {
            const res = await fetch('/api/pe-templates');
            const data = await res.json();
            setPeTemplates(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreatePeTemplate = async (e) => {
        e.preventDefault();
        try {
            if (editingPeId) {
                // Update existing PE
                const { error } = await supabase
                    .from('pe_templates')
                    .update({ nome: newPeTemplate.nome, localizacao: newPeTemplate.localizacao })
                    .eq('id', editingPeId);

                if (error) throw error;
                setEditingPeId(null);
            } else {
                // Create new PE
                const { data, error } = await supabase
                    .from('pe_templates')
                    .insert([newPeTemplate])
                    .select();

                if (error) throw error;
            }

            setNewPeTemplate({ nome: '', localizacao: '' });
            fetchPeTemplates();
        } catch (error) {
            console.error('Error saving PE:', error);
            alert('Erro ao salvar PE: ' + error.message);
        }
    };

    const handleEditPeTemplate = (template) => {
        setNewPeTemplate({ nome: template.nome, localizacao: template.localizacao });
        setEditingPeId(template.id);
    };

    const handleCancelEditPe = () => {
        setNewPeTemplate({ nome: '', localizacao: '' });
        setEditingPeId(null);
    };

    const handleDeletePeTemplate = async (id) => {
        try {
            const { error } = await supabase
                .from('pe_templates')
                .delete()
                .eq('id', id);

            if (error) throw error;

            fetchPeTemplates();
        } catch (error) {
            console.error('Error deleting PE:', error);
            alert('Erro ao excluir PE: ' + error.message);
        }
    };

    const getAuthHeader = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return {
            'Authorization': `Bearer ${session?.access_token}`
        };
    };

    const fetchEvents = async () => {
        try {
            const headers = await getAuthHeader();
            const res = await fetch('/api/events', { headers });
            const data = await res.json();
            setEvents(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePeChange = (index, field, value) => {
        const newPes = [...pes];

        if (field === 'template_id') {
            // When template is selected, auto-fill nome_pe and link_maps_pe
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
        setPes([...pes, { nome_pe: '', horario_pe: '', link_maps_pe: '' }]);
    };

    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBannerFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setBannerPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadBanner = async () => {
        if (!bannerFile) return null;

        setUploading(true);
        try {
            const fileExt = bannerFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('event-banners')
                .upload(filePath, bannerFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('event-banners')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Upload error:', error);
            alert('Erro ao fazer upload do banner');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Upload banner if selected
            let bannerUrl = formData.banner_url;
            if (bannerFile) {
                bannerUrl = await uploadBanner();
                if (!bannerUrl) return; // Upload failed
            }

            const headers = await getAuthHeader();

            // Filter out empty PEs
            const validPes = pes.filter(pe => pe.nome_pe && pe.horario_pe);

            const method = editingEventId ? 'PUT' : 'POST';
            const url = editingEventId ? `/api/events/${editingEventId}` : '/api/events';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: JSON.stringify({ ...formData, banner_url: bannerUrl, pes: validPes })
            });
            if (res.ok) {
                setShowCreate(false);
                setFormData({ nome: '', data: '', destino: '', link_maps_destino: '', link_inscricao: '', observacoes: '', pedagios: '', banner_url: '' });
                setPes([{ nome_pe: '', horario_pe: '', link_maps_pe: '' }]);
                setBannerFile(null);
                setBannerPreview(null);
                setEditingEventId(null);
                fetchEvents();
            } else {
                alert('Erro ao salvar evento');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar evento');
        }
    };

    const handleEditEvent = async (eventId) => {
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`/api/events/${eventId}`, { headers });
            const event = await res.json();

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

            // Fetch PEs for this event
            const pesRes = await fetch(`/api/events/${eventId}/pes`, { headers });
            const eventPes = await pesRes.json();
            setPes(eventPes.length > 0 ? eventPes : [{ nome_pe: '', horario_pe: '', link_maps_pe: '' }]);

            setEditingEventId(eventId);
            setShowCreate(true);
        } catch (error) {
            console.error('Error loading event:', error);
            alert('Erro ao carregar evento');
        }
    };

    const handleCancelEditEvent = () => {
        setFormData({ nome: '', data: '', destino: '', link_maps_destino: '', link_inscricao: '', observacoes: '', pedagios: '', banner_url: '' });
        setPes([{ nome_pe: '', horario_pe: '', link_maps_pe: '' }]);
        setBannerFile(null);
        setBannerPreview(null);
        setEditingEventId(null);
        setShowCreate(false);
    };

    const toggleActive = async (id, currentStatus) => {
        try {
            const headers = await getAuthHeader();
            await fetch(`/api/events/${id}/active`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: JSON.stringify({ ativo: !currentStatus })
            });
            fetchEvents();
        } catch (error) {
            console.error(error);
        }
    };

    const deleteEvent = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este evento?')) return;
        try {
            const headers = await getAuthHeader();
            await fetch(`/api/events/${id}`, {
                method: 'DELETE',
                headers
            });
            fetchEvents();
        } catch (error) {
            console.error(error);
        }
    };

    const [whatsappTemplate, setWhatsappTemplate] = useState('');
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        if (showSettings) {
            fetchWhatsAppTemplate();
        }
    }, [showSettings]);

    const fetchWhatsAppTemplate = async () => {
        try {
            const headers = await getAuthHeader();
            const res = await fetch('/api/settings/whatsapp-template', { headers });
            const data = await res.json();
            setWhatsappTemplate(data.template);
        } catch (error) {
            console.error('Error fetching template:', error);
        }
    };

    const saveWhatsAppTemplate = async () => {
        try {
            const headers = await getAuthHeader();
            await fetch('/api/settings/whatsapp-template', {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ template: whatsappTemplate })
            });
            alert('Template salvo com sucesso!');
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Erro ao salvar template');
        }
    };

    const generateWhatsapp = async (id) => {
        try {
            const headers = await getAuthHeader();

            // Fetch all necessary data
            const [eventRes, pesRes, confRes, templateRes] = await Promise.all([
                fetch(`/api/events/${id}`, { headers }),
                fetch(`/api/events/${id}/pes`, { headers }),
                fetch(`/api/events/${id}/confirmations`, { headers }),
                fetch('/api/settings/whatsapp-template', { headers })
            ]);

            const event = await eventRes.json();
            const pes = await pesRes.json();
            const confirmations = await confRes.json();
            const templateData = await templateRes.json();
            let template = templateData.template;

            if (!template) {
                alert('Template não encontrado. Configure-o na aba Configurações.');
                return;
            }

            // Format PEs List
            let pesList = '';
            pes.forEach(pe => {
                pesList += `⛽ ${pe.nome} 🕒 ${pe.horario}`;
                if (pe.localizacao) pesList += `\n${pe.localizacao}`;
                pesList += `\n\n`;
            });

            // Format Confirmations List
            let confList = '';
            // Sort by name
            confirmations.sort((a, b) => (a.usuario_nome || '').localeCompare(b.usuario_nome || ''));

            confirmations.forEach((conf, index) => {
                const num = String(index + 2).padStart(2, '0');
                confList += `🏍${num} ${conf.usuario_nome || 'Desconhecido'} – ${conf.moto_dia} – ${conf.pe_escolhido}`;
                if (conf.nova_moto) confList += ` 🆕`;
                if (conf.aniversariante_semana) confList += ` 🎂`;
                confList += `\n`;
            });

            // Replace Placeholders
            let text = template
                .replace(/{DESTINO}/g, event.destino.toUpperCase())
                .replace(/{DESTINO_NOME}/g, event.destino)
                .replace(/{DATA}/g, event.data.split('-').reverse().join('/')) // Format date to DD/MM/YYYY
                .replace(/{LINK_INSCRICAO}/g, event.link_inscricao || '')
                .replace(/{LINK_MAPS_DESTINO}/g, event.link_maps_destino || '')
                .replace(/{PEDAGIOS}/g, event.pedagios || '')
                .replace(/{LISTA_PES}/g, pesList)
                .replace(/{LISTA_CONFIRMADOS}/g, confList)
                .replace(/{NOME_EVENTO}/g, event.nome);

            setWhatsappText(text);
            // Copy to clipboard
            navigator.clipboard.writeText(text);
            alert('Texto copiado para a área de transferência!');
        } catch (error) {
            console.error(error);
            alert('Erro ao gerar lista WhatsApp');
        }
    };

    if (loading) return <div className="container mt-4">Carregando...</div>;

    return (
        <div className="container mt-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-gold">Painel Admin</h1>
                <div className="flex gap-2">
                    <button className="btn" style={{ background: '#333' }} onClick={() => { setShowSettings(!showSettings); setShowPeManager(false); setShowCreate(false); }}>
                        {showSettings ? 'Fechar Configs' : 'Configurações'}
                    </button>
                    <button className="btn" style={{ background: '#333' }} onClick={() => { setShowPeManager(!showPeManager); setShowSettings(false); setShowCreate(false); }}>
                        {showPeManager ? 'Fechar PEs' : 'Gerenciar PEs'}
                    </button>
                    <button className="btn btn-primary" onClick={() => { setShowCreate(!showCreate); setShowSettings(false); setShowPeManager(false); }}>
                        {showCreate ? 'Cancelar' : 'Novo Evento'}
                    </button>
                </div>
            </div>

            {showSettings && (
                <div className="card mb-4">
                    <h3>Configuração do Template WhatsApp</h3>
                    <p className="text-sm text-gray-400 mb-2">
                        Use os marcadores: {'{DESTINO}'}, {'{DATA}'}, {'{LINK_INSCRICAO}'}, {'{LINK_MAPS_DESTINO}'}, {'{PEDAGIOS}'}, {'{LISTA_PES}'}, {'{LISTA_CONFIRMADOS}'}
                    </p>
                    <textarea
                        value={whatsappTemplate}
                        onChange={(e) => setWhatsappTemplate(e.target.value)}
                        rows="20"
                        style={{ width: '100%', fontFamily: 'monospace', background: '#222', color: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #444' }}
                    />
                    <button onClick={saveWhatsAppTemplate} className="btn btn-primary mt-2">
                        Salvar Template
                    </button>
                </div>
            )}

            {showPeManager && (
                <div className="card mb-4">
                    <h3>Gerenciar Pontos de Encontro</h3>
                    <form onSubmit={handleCreatePeTemplate} className="mb-4">
                        <div className="flex gap-2">
                            <input
                                placeholder="Nome do PE"
                                value={newPeTemplate.nome}
                                onChange={(e) => setNewPeTemplate({ ...newPeTemplate, nome: e.target.value })}
                                required
                                style={{ flex: 1 }}
                            />
                            <input
                                placeholder="Link do Google Maps"
                                value={newPeTemplate.localizacao}
                                onChange={(e) => setNewPeTemplate({ ...newPeTemplate, localizacao: e.target.value })}
                                required
                                style={{ flex: 2 }}
                            />
                            <button type="submit" className="btn btn-primary">
                                {editingPeId ? 'Atualizar PE' : 'Adicionar PE'}
                            </button>
                            {editingPeId && (
                                <button type="button" onClick={handleCancelEditPe} className="btn" style={{ background: '#666' }}>
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                    <div>
                        <h4 style={{ marginBottom: '10px' }}>PEs Cadastrados:</h4>
                        {peTemplates.length === 0 ? (
                            <p style={{ color: '#888' }}>Nenhum PE cadastrado ainda.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {peTemplates.map(template => (
                                    <div key={template.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#1a1a1a', borderRadius: '4px' }}>
                                        <div>
                                            <strong>{template.nome}</strong>
                                            <br />
                                            <small style={{ color: '#888' }}>{template.localizacao}</small>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => handleEditPeTemplate(template)}
                                                className="btn"
                                                style={{ fontSize: '0.8rem', padding: '5px 10px', background: '#d4af37', color: '#000' }}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeletePeTemplate(template.id)}
                                                className="btn btn-danger"
                                                style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                                            >
                                                Excluir
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showCreate && (
                <div className="card mb-4">
                    <h3>{editingEventId ? 'Editar Evento' : 'Criar Novo Evento'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="flex gap-2">
                            <div style={{ flex: 1 }}>
                                <label>Nome do Rolê</label>
                                <input name="nome" value={formData.nome} onChange={handleInputChange} required />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>Data (YYYY-MM-DD)</label>
                                <input type="date" name="data" value={formData.data} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <label>Destino</label>
                        <input name="destino" value={formData.destino} onChange={handleInputChange} required />

                        <label>Link Maps Destino</label>
                        <input name="link_maps_destino" value={formData.link_maps_destino} onChange={handleInputChange} />

                        <label>Banner do Evento</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerChange}
                            style={{ marginBottom: '10px' }}
                        />
                        {bannerPreview && (
                            <div style={{ marginBottom: '10px' }}>
                                <img
                                    src={bannerPreview}
                                    alt="Preview"
                                    style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: '8px' }}
                                />
                            </div>
                        )}
                        {uploading && <p style={{ color: 'var(--color-gold)' }}>Fazendo upload...</p>}

                        <label>Observações</label>
                        <textarea name="observacoes" value={formData.observacoes} onChange={handleInputChange} rows="3" />

                        <label>Pedágios</label>
                        <textarea name="pedagios" value={formData.pedagios} onChange={handleInputChange} rows="2" placeholder="Ex: Pedágio 1 - R$ 5,00" />

                        <h4 className="text-gold mt-4 mb-4">Pontos de Encontro (PEs)</h4>
                        {pes.map((pe, index) => (
                            <div key={index} className="flex gap-2 mb-2" style={{ alignItems: 'center' }}>
                                <select
                                    value={pe.template_id || ''}
                                    onChange={(e) => handlePeChange(index, 'template_id', e.target.value)}
                                    style={{ flex: 2 }}
                                >
                                    <option value="">Selecione um PE</option>
                                    {peTemplates.map(template => (
                                        <option key={template.id} value={template.id}>{template.nome}</option>
                                    ))}
                                </select>
                                <input
                                    type="time"
                                    value={pe.horario_pe}
                                    onChange={(e) => handlePeChange(index, 'horario_pe', e.target.value)}
                                    placeholder="Horário"
                                    style={{ flex: 1 }}
                                />
                            </div>
                        ))}
                        <button type="button" onClick={addPeField} className="btn" style={{ background: '#333', color: 'white', marginBottom: '20px' }}>+ Adicionar PE</button>

                        <button type="submit" className="btn btn-primary" style={{ width: editingEventId ? '48%' : '100%', marginRight: editingEventId ? '2%' : '0' }}>
                            {editingEventId ? 'Atualizar Evento' : 'Salvar Evento'}
                        </button>
                        {editingEventId && (
                            <button type="button" onClick={handleCancelEditEvent} className="btn" style={{ width: '48%', marginLeft: '2%', background: '#666' }}>
                                Cancelar
                            </button>
                        )}
                    </form>
                </div>
            )}

            <div className="card">
                <h3>Eventos</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
                            <th style={{ padding: '10px' }}>Data</th>
                            <th style={{ padding: '10px' }}>Nome</th>
                            <th style={{ padding: '10px' }}>Ativo</th>
                            <th style={{ padding: '10px' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(event => (
                            <tr key={event.id} style={{ borderBottom: '1px solid #333' }}>
                                <td style={{ padding: '10px' }}>{event.data}</td>
                                <td style={{ padding: '10px' }}>{event.nome}</td>
                                <td style={{ padding: '10px' }}>
                                    <button
                                        onClick={() => toggleActive(event.id, event.ativo)}
                                        style={{
                                            background: event.ativo ? 'green' : '#333',
                                            color: 'white',
                                            padding: '5px 10px',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        {event.ativo ? 'Ativo' : 'Inativo'}
                                    </button>
                                </td>
                                <td style={{ padding: '10px' }}>
                                    <button onClick={() => handleEditEvent(event.id)} className="btn" style={{ background: '#d4af37', color: '#000', marginRight: '10px', fontSize: '0.8rem' }}>Editar</button>
                                    <button onClick={() => generateWhatsapp(event.id)} className="btn" style={{ background: '#25D366', color: 'white', marginRight: '10px', fontSize: '0.8rem' }}>WhatsApp</button>
                                    <button onClick={() => deleteEvent(event.id)} className="btn btn-danger" style={{ fontSize: '0.8rem' }}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {whatsappText && (
                <div className="card mt-4">
                    <h3>Texto WhatsApp Gerado</h3>
                    <textarea
                        value={whatsappText}
                        readOnly
                        rows="15"
                        style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                    />
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
