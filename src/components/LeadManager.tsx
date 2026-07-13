import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Users, 
  Plus, 
  MessageCircle, 
  Globe, 
  Cpu, 
  Trash2, 
  Edit,
  Sparkles,
  CheckCircle,
  XCircle,
  Save,
  X,
  Phone,
  Download,
  Search,
  Filter
} from 'lucide-react';

interface Lead {
  id: number;
  nombre: string;
  tipo_negocio: string;
  tel: string;
  instagram: string;
  facebook: string;
  tiene_web: boolean;
  estatus: 'Pendiente' | 'Aceptado' | 'Rechazado';
  convertido?: boolean;
}

interface LeadManagerProps {
  currentUser: { nombre: string; isAdmin: boolean };
}

export const LeadManager: React.FC<LeadManagerProps> = ({ currentUser }) => {
  const [leads, setLeads] = useState<Lead[]>([]);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');

  // Modals Visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);
  const [selectedLeadForProj, setSelectedLeadForProj] = useState<Lead | null>(null);
  const [selectedLeadForIA, setSelectedLeadForIA] = useState<Lead | null>(null);

  // New Lead Form States
  const [nombre, setNombre] = useState('');
  const [tipoNegocio, setTipoNegocio] = useState('Restaurante / Comida');
  const [tel, setTel] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tieneWeb, setTieneWeb] = useState(false);

  // Edit Lead Modal States
  const [editNombre, setEditNombre] = useState('');
  const [editTipoNegocio, setEditTipoNegocio] = useState('');
  const [editTel, setEditTel] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editFacebook, setEditFacebook] = useState('');
  const [editTieneWeb, setEditTieneWeb] = useState(false);
  const [editEstatus, setEditEstatus] = useState<'Pendiente' | 'Aceptado' | 'Rechazado'>('Pendiente');

  // Convert to Project Form States
  const [precioTotal, setPrecioTotal] = useState('5000');
  const [tipoPago, setTipoPago] = useState('Anticipo 50%');
  const [metodoPago, setMetodoPago] = useState('Transferencia');
  const [dominio, setDominio] = useState('Dominio Nuevo');
  const [paquete, setPaquete] = useState('1. LANDING PAGE / WEB');
  const [pidioMantenimiento, setPidioMantenimiento] = useState(false);

  // IA States
  const [loadingIA, setLoadingIA] = useState(false);
  const [generatedPitch, setGeneratedPitch] = useState('');

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
    
    const channel = supabase
      .channel('realtime_leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !tel) return;

    try {
      const { error } = await supabase.from('leads').insert({
        nombre: nombre.trim(),
        tel: tel.trim(),
        tiene_web: tieneWeb,
        instagram: instagram.trim(),
        facebook: facebook.trim(),
        tipo_negocio: tipoNegocio,
        creado_por: currentUser.nombre,
        estatus: 'Pendiente'
      });

      if (error) throw error;
      
      // Log Activity
      await supabase.from('actividades').insert({
        texto: `creó un nuevo lead para "${nombre.trim()}" (${tipoNegocio})`,
        tipo: 'lead',
        autor: currentUser.nombre
      });

      setNombre('');
      setTel('');
      setInstagram('');
      setFacebook('');
      setTieneWeb(false);
      setShowAddModal(false);
      alert('Lead guardado exitosamente.');
    } catch (err: any) {
      console.error(err);
      alert(`Error al insertar: ${err.message}`);
    }
  };

  // Start Edit Mode
  const handleStartEdit = (lead: Lead) => {
    setSelectedLeadForEdit(lead);
    setEditNombre(lead.nombre);
    setEditTipoNegocio(lead.tipo_negocio);
    setEditTel(lead.tel);
    setEditInstagram(lead.instagram || '');
    setEditFacebook(lead.facebook || '');
    setEditTieneWeb(lead.tiene_web);
    setEditEstatus(lead.estatus);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForEdit || !editNombre || !editTel) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          nombre: editNombre.trim(),
          tipo_negocio: editTipoNegocio,
          tel: editTel.trim(),
          instagram: editInstagram.trim(),
          facebook: editFacebook.trim(),
          tiene_web: editTieneWeb,
          estatus: editEstatus
        })
        .eq('id', selectedLeadForEdit.id);

      if (error) throw error;

      // Log Activity
      await supabase.from('actividades').insert({
        texto: `actualizó los datos del lead "${editNombre.trim()}"`,
        tipo: 'lead',
        autor: currentUser.nombre
      });

      setSelectedLeadForEdit(null);
      alert('Lead actualizado con éxito.');
    } catch (err: any) {
      console.error(err);
      alert(`Error al actualizar lead: ${err.message}`);
    }
  };

  // Update Status
  const handleUpdateStatus = async (id: number, estatus: 'Pendiente' | 'Aceptado' | 'Rechazado') => {
    const lead = leads.find(l => l.id === id);
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({ estatus })
        .eq('id', id);

      if (error) throw error;

      // Log Activity
      if (lead) {
        await supabase.from('actividades').insert({
          texto: `cambió el estatus del lead "${lead.nombre}" a ${estatus}`,
          tipo: 'lead',
          autor: currentUser.nombre
        });
      }
    } catch (err) {
      console.error('Error updating status...', err);
    }
  };

  const handleDeleteLead = async (id: number) => {
    const lead = leads.find(l => l.id === id);
    if (!window.confirm('¿Seguro que deseas eliminar este prospecto?')) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log Activity
      if (lead) {
        await supabase.from('actividades').insert({
          texto: `eliminó el lead "${lead.nombre}"`,
          tipo: 'lead',
          autor: currentUser.nombre
        });
      }
    } catch (err) {
      console.error('Error deleting lead...', err);
    }
  };

  const handleDeleteAllLeads = async () => {
    if (!window.confirm('¡ATENCIÓN! ¿Seguro que deseas eliminar TODOS los leads de la base de datos de forma permanente?')) return;
    if (!window.confirm('¿Realmente estás seguro? Esta acción no se puede deshacer y borrará la base de datos de leads por completo.')) return;
    
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .gt('id', 0);

      if (error) throw error;

      // Log Activity
      await supabase.from('actividades').insert({
        texto: `eliminó permanentemente TODOS los prospectos del sistema`,
        tipo: 'lead',
        autor: currentUser.nombre
      });

      alert('Todos los leads han sido eliminados de la base de datos.');
    } catch (err: any) {
      console.error('Error deleting all leads:', err);
      alert(`Error al eliminar todos los leads: ${err.message}`);
    }
  };

  const handleConvertProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForProj) return;

    try {
      // 1. Insert into clientes (projects)
      const { error: insertError } = await supabase.from('clientes').insert({
        nombre: selectedLeadForProj.nombre,
        tel: selectedLeadForProj.tel,
        precio_total: parseFloat(precioTotal),
        tipo_pago: tipoPago,
        metodo_pago: metodoPago,
        dominio: dominio,
        paquete: paquete,
        creado_por: currentUser.nombre,
        pidio_mantenimiento: pidioMantenimiento,
        dia_corte_mantenimiento: pidioMantenimiento ? new Date().getDate() : null,
        estatus: 'En Proceso',
        fase_proyecto: 'UI/UX y Diseño'
      });

      if (insertError) throw insertError;

      // 2. Update lead status to convertido: true
      const { error: updateError } = await supabase
        .from('leads')
        .update({ convertido: true })
        .eq('id', selectedLeadForProj.id);

      if (updateError) throw updateError;

      // Log Activity
      await supabase.from('actividades').insert({
        texto: `convirtió el lead "${selectedLeadForProj.nombre}" en Proyecto de desarrollo (${paquete})`,
        tipo: 'proyecto',
        autor: currentUser.nombre
      });

      setSelectedLeadForProj(null);
      alert('Convertido a proyecto con éxito.');
    } catch (err: any) {
      console.error(err);
      alert(`Error al convertir: ${err.message}`);
    }
  };

  const handleGeneratePitch = async (lead: Lead) => {
    setSelectedLeadForIA(lead);
    setLoadingIA(true);
    setGeneratedPitch('');

    const apiKey = 'AIzaSyAHMlIgS4eObu1TN_-crpqGscaEvZ6CnbE';
    const prompt = `
      Actúa como un Consultor Tecnológico de "Dexcov", una agencia B2B de desarrollo de software a medida y aplicaciones móviles.
      Redacta un mensaje de acercamiento profesional por WhatsApp para un negocio local.
      
      PROHIBICIÓN ESTRICTA: NO utilices emojis en absoluto. El tono debe ser formal, corporativo y serio.
      
      Contexto del cliente:
      - Negocio: ${lead.nombre}
      - Giro: ${lead.tipo_negocio}
      - Situación: ${lead.tiene_web ? 'Tienen sitio web pero es desactualizado o poco funcional.' : 'No tienen herramientas de automatización ni presencia digital profesional.'}
      
      PAQUETES DISPONIBLES EN DEXCOV (Sugerir el más conveniente):
      1. DEXCOV CORE: Desarrollo de plataformas y portales de software.
      2. DEXCOV HUB OPERATIVO: Un software a medida para automatizar operaciones de negocio.
      
      REGLAS:
      1. Devuelve SOLAMENTE el mensaje de WhatsApp. Sin introducciones.
      2. Tono formal pero moderno y directo. Español de México.
      3. Mantén el mensaje en un máximo de 3 párrafos.
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar la propuesta.';
      setGeneratedPitch(text.trim());
    } catch (error) {
      console.error(error);
      setGeneratedPitch('Error al conectar con la API de Gemini.');
    } finally {
      setLoadingIA(false);
    }
  };

  const sendWhatsApp = () => {
    if (!selectedLeadForIA || !generatedPitch) return;
    const cleanPhone = selectedLeadForIA.tel.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(generatedPitch)}`;
    window.open(url, '_blank');
    setSelectedLeadForIA(null);
  };

  // CSV Export function
  const exportToCSV = () => {
    if (leads.length === 0) {
      alert('No hay leads para exportar.');
      return;
    }

    const headers = ['ID', 'Nombre', 'Giro', 'WhatsApp', 'Instagram', 'Facebook', 'Tiene Web', 'Estatus', 'Convertido'];
    const rows = leads.map(l => [
      l.id,
      l.nombre,
      l.tipo_negocio,
      l.tel,
      l.instagram || '',
      l.facebook || '',
      l.tiene_web ? 'Sí' : 'No',
      l.estatus,
      l.convertido ? 'Sí' : 'No'
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_dexcov_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filters application
  const getFilteredLeads = (status: 'Pendiente' | 'Aceptado' | 'Rechazado') => {
    return leads
      .filter(l => l.estatus === status)
      .filter(l => {
        const matchesSearch = 
          l.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.tel.includes(searchQuery) ||
          l.tipo_negocio.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesSpecialty = 
          filterSpecialty === '' || l.tipo_negocio === filterSpecialty;
        
        return matchesSearch && matchesSpecialty;
      });
  };

  const pendingLeads = getFilteredLeads('Pendiente');
  const acceptedLeads = getFilteredLeads('Aceptado');
  const rejectedLeads = getFilteredLeads('Rechazado');

  const renderLeadCard = (lead: Lead) => (
    <div 
      key={lead.id} 
      className="glass-panel" 
      style={{ 
        padding: '16px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '10px',
        background: 'var(--bg-secondary)',
        borderColor: 'var(--card-border)',
        borderRadius: '12px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{lead.nombre}</h4>
          <span style={{
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(56, 189, 248, 0.1)',
            color: 'var(--color-cyan)',
            fontSize: '10px',
            fontWeight: 600,
            display: 'inline-block',
            marginTop: '4px'
          }}>
            {lead.tipo_negocio}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button 
            onClick={() => handleStartEdit(lead)}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            title="Editar"
          >
            <Edit size={14} />
          </button>
          <button 
            onClick={() => handleDeleteLead(lead.id)}
            style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.7)', cursor: 'pointer', padding: '4px' }}
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Phone size={12} style={{ color: 'var(--color-cyan)' }} />
        <span>{lead.tel || 'No registrado'}</span>
      </div>

      <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Globe size={11} style={{ color: lead.tiene_web ? '#10b981' : '#ef4444' }} />
          {lead.tiene_web ? 'Con Web' : 'Sin Web'}
        </span>
        {lead.instagram && <span>IG: {lead.instagram}</span>}
      </div>

      {/* Action buttons based on state */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', paddingTop: '10px', borderTop: '1px solid var(--card-border)' }}>
        {lead.estatus === 'Pendiente' && (
          <>
            <button
              onClick={() => handleUpdateStatus(lead.id, 'Aceptado')}
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600
              }}
            >
              <CheckCircle size={12} />
              Aceptar
            </button>

            <button
              onClick={() => handleUpdateStatus(lead.id, 'Rechazado')}
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600
              }}
            >
              <XCircle size={12} />
              Rechazar
            </button>

            <button
              onClick={() => handleGeneratePitch(lead)}
              className="btn-primary"
              style={{ padding: '4px 8px', fontSize: '11px', marginLeft: 'auto', boxShadow: 'none', borderRadius: '6px' }}
            >
              <Cpu size={12} />
              Pitch IA
            </button>
          </>
        )}

        {lead.estatus === 'Aceptado' && (
          lead.convertido ? (
            <div style={{
              width: '100%',
              textAlign: 'center',
              padding: '4px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '6px',
              color: '#10b981',
              fontSize: '11px',
              fontWeight: 600
            }}>
              Convertido a Proyecto
            </div>
          ) : (
            <button
              onClick={() => setSelectedLeadForProj(lead)}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '6px', fontSize: '11px', borderRadius: '6px' }}
            >
              <Sparkles size={12} />
              Convertir a Proyecto
            </button>
          )
        )}

        {lead.estatus === 'Rechazado' && (
          <button
            onClick={() => handleUpdateStatus(lead.id, 'Pendiente')}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-secondary)',
              padding: '6px',
              borderRadius: '6px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Reabrir y Recuperar
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', color: '#ffffff' }}>
            <Users size={28} style={{ color: 'var(--color-cyan)' }} />
            Tablero de Prospectos (Leads)
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Visualiza tu embudo comercial en tiempo real. Gestiona y convierte prospectos de forma eficiente.</p>
        </div>
      </div>

      {/* Control Bar (Filters, Search and Actions) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        flexWrap: 'wrap'
      }}>
        {/* Search & Select filters */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Buscar por nombre, whatsapp o giro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input"
              style={{ width: '100%', paddingLeft: '36px' }}
            />
          </div>

          <div style={{ position: 'relative', width: '200px' }}>
            <Filter size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="glass-input"
              style={{ width: '100%', paddingLeft: '32px', background: '#0b0f19' }}
            >
              <option value="">Todos los Giros</option>
              <option value="Restaurante / Comida">Restaurante / Comida</option>
              <option value="Salud / Consultorio Médico">Salud / Consultorio Médico</option>
              <option value="Bienes Raíces / Inmobiliaria">Bienes Raíces / Inmobiliaria</option>
              <option value="Gimnasio / Deportes">Gimnasio / Deportes</option>
              <option value="Servicios Profesionales (Abogados, Contadores)">Servicios Profesionales</option>
              <option value="Belleza / Spa / Barbería">Belleza / Spa</option>
              <option value="Taller Automotriz">Taller Automotriz</option>
              <option value="Agencia de Viajes">Agencia de Viajes</option>
              <option value="Comercio / Tienda Física">Comercio / Tienda Física</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>

        {/* Buttons Actions */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {currentUser.isAdmin && (
            <button 
              onClick={exportToCSV}
              className="btn-secondary"
              style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
              title="Exportar base de datos a CSV"
            >
              <Download size={16} />
              <span>Descargar CSV</span>
            </button>
          )}

          {currentUser.isAdmin && (
            <button 
              onClick={handleDeleteAllLeads} 
              className="btn-secondary"
              style={{ 
                padding: '10px 16px', 
                fontSize: '13px', 
                borderColor: '#ef4444', 
                color: '#ef4444', 
                background: 'rgba(239, 68, 68, 0.05)',
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}
              title="Eliminar permanentemente todos los leads"
            >
              <Trash2 size={16} />
              <span>Limpiar Base de Datos</span>
            </button>
          )}

          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn-primary"
            style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>Agregar Prospecto</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        minHeight: '65vh',
        alignItems: 'start'
      }}>
        
        {/* Column 1: Por Contactar */}
        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--card-border)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--card-border)', paddingBottom: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-cyan)' }}>Por Contactar</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--color-cyan)', borderRadius: '10px', fontWeight: 600 }}>
              {pendingLeads.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
            {pendingLeads.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>Sin prospectos</p>
            ) : (
              pendingLeads.map(renderLeadCard)
            )}
          </div>
        </div>

        {/* Column 2: Aceptados */}
        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--card-border)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--card-border)', paddingBottom: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>Aceptados / Propuesta</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '10px', fontWeight: 600 }}>
              {acceptedLeads.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
            {acceptedLeads.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>Sin prospectos</p>
            ) : (
              acceptedLeads.map(renderLeadCard)
            )}
          </div>
        </div>

        {/* Column 3: Rechazados */}
        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--card-border)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--card-border)', paddingBottom: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>Rechazados</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '10px', fontWeight: 600 }}>
              {rejectedLeads.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
            {rejectedLeads.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>Sin prospectos</p>
            ) : (
              rejectedLeads.map(renderLeadCard)
            )}
          </div>
        </div>

      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 200
        }}>
          <form onSubmit={handleAddLead} className="glass-panel" style={{
            padding: '30px',
            width: '450px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--card-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-cyan)' }}>
                Agregar Prospecto
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Nombre de la Empresa</label>
              <input 
                type="text" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                placeholder="Ej. Café Central" 
                className="glass-input" 
                required 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Giro / Especialidad</label>
              <select 
                value={tipoNegocio} 
                onChange={(e) => setTipoNegocio(e.target.value)} 
                className="glass-input"
                style={{ background: '#0b0f19' }}
              >
                <option value="Restaurante / Comida">Restaurante / Comida</option>
                <option value="Salud / Consultorio Médico">Salud / Consultorio Médico</option>
                <option value="Bienes Raíces / Inmobiliaria">Bienes Raíces / Inmobiliaria</option>
                <option value="Gimnasio / Deportes">Gimnasio / Deportes</option>
                <option value="Servicios Profesionales (Abogados, Contadores)">Servicios Profesionales</option>
                <option value="Belleza / Spa / Barbería">Belleza / Spa</option>
                <option value="Taller Automotriz">Taller Automotriz</option>
                <option value="Agencia de Viajes">Agencia de Viajes</option>
                <option value="Comercio / Tienda Física">Comercio / Tienda Física</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>WhatsApp (Ej. 528123456789)</label>
              <input 
                type="text" 
                value={tel} 
                onChange={(e) => setTel(e.target.value)} 
                placeholder="Ej. 528123456789" 
                className="glass-input" 
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Instagram</label>
                <input 
                  type="text" 
                  value={instagram} 
                  onChange={(e) => setInstagram(e.target.value)} 
                  placeholder="Ej. @cafecentral" 
                  className="glass-input" 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Facebook URL</label>
                <input 
                  type="text" 
                  value={facebook} 
                  onChange={(e) => setFacebook(e.target.value)} 
                  placeholder="Ej. https://facebook.com/..." 
                  className="glass-input" 
                />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', marginTop: '4px' }}>
              <input 
                type="checkbox" 
                checked={tieneWeb} 
                onChange={(e) => setTieneWeb(e.target.checked)} 
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-cyan)' }}
              />
              ¿Tiene sitio web activo?
            </label>

            <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
              Guardar Lead
            </button>
          </form>
        </div>
      )}

      {/* Edit Lead Modal */}
      {selectedLeadForEdit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 200
        }}>
          <form onSubmit={handleSaveEdit} className="glass-panel" style={{
            padding: '30px',
            width: '450px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--card-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-cyan)' }}>
                Editar Prospecto
              </h3>
              <button 
                type="button" 
                onClick={() => setSelectedLeadForEdit(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Nombre de la Empresa</label>
              <input 
                type="text" 
                value={editNombre} 
                onChange={(e) => setEditNombre(e.target.value)} 
                className="glass-input" 
                required 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Giro / Especialidad</label>
              <select 
                value={editTipoNegocio} 
                onChange={(e) => setEditTipoNegocio(e.target.value)} 
                className="glass-input"
                style={{ background: '#0b0f19' }}
              >
                <option value="Restaurante / Comida">Restaurante / Comida</option>
                <option value="Salud / Consultorio Médico">Salud / Consultorio Médico</option>
                <option value="Bienes Raíces / Inmobiliaria">Bienes Raíces / Inmobiliaria</option>
                <option value="Gimnasio / Deportes">Gimnasio / Deportes</option>
                <option value="Servicios Profesionales (Abogados, Contadores)">Servicios Profesionales</option>
                <option value="Belleza / Spa / Barbería">Belleza / Spa</option>
                <option value="Taller Automotriz">Taller Automotriz</option>
                <option value="Agencia de Viajes">Agencia de Viajes</option>
                <option value="Comercio / Tienda Física">Comercio / Tienda Física</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>WhatsApp</label>
              <input 
                type="text" 
                value={editTel} 
                onChange={(e) => setEditTel(e.target.value)} 
                className="glass-input" 
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Instagram</label>
                <input 
                  type="text" 
                  value={editInstagram} 
                  onChange={(e) => setEditInstagram(e.target.value)} 
                  className="glass-input" 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Estatus Actual</label>
                <select 
                  value={editEstatus} 
                  onChange={(e) => setEditEstatus(e.target.value as any)} 
                  className="glass-input"
                  style={{ background: '#0b0f19' }}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aceptado">Aceptado</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Facebook URL</label>
              <input 
                type="text" 
                value={editFacebook} 
                onChange={(e) => setEditFacebook(e.target.value)} 
                className="glass-input" 
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', marginTop: '4px' }}>
              <input 
                type="checkbox" 
                checked={editTieneWeb} 
                onChange={(e) => setEditTieneWeb(e.target.checked)} 
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-cyan)' }}
              />
              ¿Tiene sitio web activo?
            </label>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setSelectedLeadForEdit(null)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Save size={16} />
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Convert to Project Form Modal */}
      {selectedLeadForProj && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 200
        }}>
          <form onSubmit={handleConvertProject} className="glass-panel" style={{
            padding: '30px',
            width: '450px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--card-border)'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-cyan)', marginBottom: '8px' }}>
              Convertir a Proyecto
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Precio Total ($)</label>
              <input 
                type="number" 
                value={precioTotal} 
                onChange={(e) => setPrecioTotal(e.target.value)} 
                className="glass-input" 
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Estatus de Pago</label>
                <select value={tipoPago} onChange={(e) => setTipoPago(e.target.value)} className="glass-input" style={{ background: '#0b0f19' }}>
                  <option value="Anticipo 50%">Anticipo 50%</option>
                  <option value="Pago Completo">Pago Completo</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Método de Pago</label>
                <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="glass-input" style={{ background: '#0b0f19' }}>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Dominio / Host</label>
                <select value={dominio} onChange={(e) => setDominio(e.target.value)} className="glass-input" style={{ background: '#0b0f19' }}>
                  <option value="GitHub">GitHub</option>
                  <option value="Personalizado">Personalizado</option>
                  <option value="Mantenimiento Web">Mantenimiento Web</option>
                  <option value="Dominio Nuevo">Dominio Nuevo</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Paquete de Software</label>
                <select value={paquete} onChange={(e) => setPaquete(e.target.value)} className="glass-input" style={{ background: '#0b0f19' }}>
                  <option value="1. LANDING PAGE / WEB">1. LANDING PAGE / WEB</option>
                  <option value="2. SISTEMA OPERATIVO / TOOLS">2. SISTEMA OPERATIVO / TOOLS</option>
                  <option value="3. SOFTWARE A MEDIDA">3. SOFTWARE A MEDIDA</option>
                  <option value="4. APLICACIÓN MÓVIL">4. APLICACIÓN MÓVIL</option>
                  <option value="5. E-COMMERCE CLOUD">5. E-COMMERCE CLOUD</option>
                  <option value="6. SISTEMA ENTERPRISE / ERP">6. SISTEMA ENTERPRISE / ERP</option>
                </select>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input 
                type="checkbox" 
                checked={pidioMantenimiento} 
                onChange={(e) => setPidioMantenimiento(e.target.checked)} 
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-cyan)' }}
              />
              ¿Solicita Mantenimiento Mensual?
            </label>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setSelectedLeadForProj(null)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary">Crear Proyecto</button>
            </div>
          </form>
        </div>
      )}

      {/* IA Pitch Output Modal */}
      {selectedLeadForIA && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 200
        }}>
          <div className="glass-panel" style={{
            padding: '30px',
            width: '500px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'var(--bg-secondary)',
            borderColor: 'var(--card-border)'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: '#f59e0b' }} />
              Propuesta Comercial IA
            </h3>
            
            {loadingIA ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 0' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0, 210, 255, 0.2)', borderTopColor: 'var(--color-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Gemini está redactando la propuesta...</span>
              </div>
            ) : (
              <>
                <textarea
                  value={generatedPitch}
                  onChange={(e) => setGeneratedPitch(e.target.value)}
                  style={{
                    width: '100%',
                    height: '240px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    padding: '12px',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    resize: 'none'
                  }}
                />
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setSelectedLeadForIA(null)} className="btn-secondary">Cerrar</button>
                  <button onClick={sendWhatsApp} className="btn-primary" style={{ background: '#10b981', boxShadow: 'none' }}>
                    <MessageCircle size={16} />
                    Enviar WhatsApp
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Spinner Spin Animation Style */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
