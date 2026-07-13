import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Plus, 
  Trash2, 
  Mail, 
  Phone, 
  Megaphone
} from 'lucide-react';

interface ContactItem {
  id: number;
  nombre: string;
  email: string;
  tel: string;
  origen: string;
  notas: string;
}

export const Marketing: React.FC = () => {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [tel, setTel] = useState('');
  const [origen, setOrigen] = useState('Instagram');
  const [notas, setNotas] = useState('');

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contactos_marketing')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching marketing contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();

    const channel = supabase
      .channel('realtime_marketing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contactos_marketing' }, () => {
        fetchContacts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    try {
      const { error } = await supabase
        .from('contactos_marketing')
        .insert({
          nombre: nombre.trim(),
          email: email.trim(),
          tel: tel.trim(),
          origen,
          notas: notas.trim()
        });

      if (error) throw error;

      // Log Activity
      await supabase.from('actividades').insert({
        text: `agregó un contacto de marketing: "${nombre.trim()}" (${origen})`,
        tipo: 'marketing',
        autor: 'Marketing'
      });

      setNombre('');
      setEmail('');
      setTel('');
      setNotas('');
      setOrigen('Instagram');
      alert('Contacto registrado correctamente.');
    } catch (err: any) {
      console.error(err);
      alert(`Error al registrar contacto: ${err.message}`);
    }
  };

  const handleDeleteContact = async (id: number, name: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar a ${name}?`)) return;
    try {
      const { error } = await supabase
        .from('contactos_marketing')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log Activity
      await supabase.from('actividades').insert({
        text: `eliminó al contacto de marketing: "${name}"`,
        tipo: 'marketing',
        autor: 'Marketing'
      });
    } catch (err) {
      console.error('Error deleting contact:', err);
    }
  };

  // Metrics
  const totalContacts = contacts.length;
  const countByOrigin = (org: string) => contacts.filter(c => c.origen === org).length;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Megaphone size={28} style={{ color: 'var(--color-cyan)' }} />
          Marketing y Contactos
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Módulo de captación de leads de marketing, embudos rápidos y seguimiento de prospectos en campañas.</p>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Contactos</span>
          <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px', color: 'var(--color-cyan)' }}>{totalContacts}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Instagram</span>
          <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px', color: '#ffffff' }}>{countByOrigin('Instagram')}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Facebook</span>
          <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px', color: '#ffffff' }}>{countByOrigin('Facebook')}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sitio Web</span>
          <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px', color: '#ffffff' }}>{countByOrigin('Web')}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Físico / Recomendado</span>
          <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px', color: '#ffffff' }}>{countByOrigin('Fisico')}</h3>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Left Form: Add Contact */}
        <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', height: 'fit-content' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Agregar Contacto</h3>
          <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Nombre completo</label>
              <input 
                type="text" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                placeholder="Ej. Juan Pérez" 
                className="glass-input" 
                required 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Ej. juan@correo.com" 
                className="glass-input" 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Teléfono</label>
              <input 
                type="text" 
                value={tel} 
                onChange={(e) => setTel(e.target.value)} 
                placeholder="Ej. 8112345678" 
                className="glass-input" 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Canal de Origen</label>
              <select 
                value={origen} 
                onChange={(e) => setOrigen(e.target.value)} 
                className="glass-input"
                style={{ background: '#0b0f19' }}
              >
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Web">Sitio Web</option>
                <option value="Fisico">Físico / Recomendado</option>
                <option value="Campaña Ad">Campaña Publicitaria</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Notas rápidas</label>
              <textarea 
                value={notas} 
                onChange={(e) => setNotas(e.target.value)} 
                placeholder="Interesado en software ERP o página web" 
                className="glass-input" 
                style={{ height: '70px', resize: 'none' }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
              <Plus size={16} />
              Guardar Contacto
            </button>
          </form>
        </div>

        {/* Right list: Contact Database */}
        <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Base de Datos de Marketing</h3>
          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Cargando contactos...</p>
          ) : contacts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay contactos de marketing registrados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {contacts.map((c) => (
                <div key={c.id} style={{ padding: '14px', background: '#0a0d16', border: '1px solid var(--card-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{c.nombre}</h4>
                      <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--color-cyan)', borderRadius: '4px', fontWeight: 600 }}>
                        {c.origen}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {c.email && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} />
                          {c.email}
                        </span>
                      )}
                      {c.tel && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} />
                          {c.tel}
                        </span>
                      )}
                    </div>
                    {c.notas && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>"{c.notas}"</p>}
                  </div>

                  <button 
                    onClick={() => handleDeleteContact(c.id, c.nombre)} 
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
