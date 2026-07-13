import React, { useState, useEffect } from 'react';
import { Plus, CalendarDays, Trash2, Send } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface NoteItem {
  id: number;
  texto: string;
  autor: string;
  imp: boolean;
  fecha: string;
}

interface EventItem {
  id: number;
  titulo: string;
  fecha: string;
  autor: string;
}

interface AgendaProps {
  currentUser: { nombre: string; isAdmin: boolean };
}

export const Agenda: React.FC<AgendaProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'notas' | 'agenda'>('notas');
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Input states
  const [newNote, setNewNote] = useState('');
  const [noteImportant, setNoteImportant] = useState(false);

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');

  const fetchAgendaData = async () => {
    try {
      const { data: notesData, error: notesError } = await supabase
        .from('notas')
        .select('*')
        .order('id', { ascending: false });

      const { data: eventsData, error: eventsError } = await supabase
        .from('eventos')
        .select('*')
        .order('fecha', { ascending: true });

      if (notesError) throw notesError;
      if (eventsError) throw eventsError;

      setNotes(notesData || []);
      setEvents(eventsData || []);
    } catch (err) {
      console.error('Error loading agenda data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendaData();

    // Subscribe to realtime updates for both tables
    const notesChan = supabase.channel('realtime_notes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notas' }, () => {
        fetchAgendaData();
      })
      .subscribe();

    const eventsChan = supabase.channel('realtime_events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos' }, () => {
        fetchAgendaData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notesChan);
      supabase.removeChannel(eventsChan);
    };
  }, []);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const { error } = await supabase
        .from('notas')
        .insert({
          texto: newNote.trim(),
          autor: currentUser.nombre,
          imp: noteImportant,
          fecha: new Date().toLocaleDateString('es-MX')
        });

      if (error) throw error;

      // Log activity
      await supabase.from('actividades').insert({
        texto: `publicó una nota: "${newNote.trim()}"`,
        tipo: 'nota',
        autor: currentUser.nombre
      });

      setNewNote('');
      setNoteImportant(false);
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  const handleDeleteNote = async (id: number, texto: string) => {
    if (!window.confirm('¿Eliminar esta nota?')) return;
    try {
      const { error } = await supabase
        .from('notas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log activity
      await supabase.from('actividades').insert({
        texto: `eliminó una nota: "${texto.substring(0, 30)}..."`,
        tipo: 'nota',
        autor: currentUser.nombre
      });
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) return;

    try {
      const { error } = await supabase
        .from('eventos')
        .insert({
          titulo: newEventTitle.trim(),
          fecha: newEventDate,
          autor: currentUser.nombre
        });

      if (error) throw error;

      // Log activity
      await supabase.from('actividades').insert({
        texto: `agendó el evento "${newEventTitle.trim()}" para el ${new Date(newEventDate).toLocaleDateString('es-MX')}`,
        tipo: 'evento',
        autor: currentUser.nombre
      });

      setNewEventTitle('');
      setNewEventDate('');
    } catch (err) {
      console.error('Error adding event:', err);
    }
  };

  const handleDeleteEvent = async (id: number, titulo: string) => {
    if (!window.confirm('¿Eliminar este evento?')) return;
    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log activity
      await supabase.from('actividades').insert({
        texto: `eliminó el evento agendado "${titulo}"`,
        tipo: 'evento',
        autor: currentUser.nombre
      });
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarDays className="glow-text-cyan" />
            Agenda y Notas (Tiempo Real)
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Muro de anuncios importantes del equipo y calendario de entregas compartido.</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('notas')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            background: activeTab === 'notas' ? 'rgba(0, 210, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)',
            color: activeTab === 'notas' ? '#00d2ff' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px'
          }}
        >
          Muro de Notas
        </button>
        <button
          onClick={() => setActiveTab('agenda')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            background: activeTab === 'agenda' ? 'rgba(0, 210, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)',
            color: activeTab === 'agenda' ? '#00d2ff' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px'
          }}
        >
          Fechas de Entrega (Agenda)
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando datos...</div>
      ) : activeTab === 'notas' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Note input */}
          <form onSubmit={handleAddNote} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Escribe una nota importante para el equipo..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="glass-input"
                style={{ flex: 1 }}
                required
              />
              <button type="submit" className="btn-primary" style={{ padding: '12px' }}>
                <Send size={18} />
              </button>
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={noteImportant}
                onChange={(e) => setNoteImportant(e.target.checked)}
                style={{ accentColor: 'var(--color-cyan)' }}
              />
              Marcar como Importante / Alerta (Fondo rojo)
            </label>
          </form>

          {/* Notes list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notes.map((note) => (
              <div
                key={note.id}
                className="glass-panel"
                style={{
                  padding: '16px 20px',
                  background: note.imp ? 'rgba(239, 68, 68, 0.1)' : 'var(--card-bg)',
                  borderColor: note.imp ? 'rgba(239, 68, 68, 0.3)' : 'var(--card-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <p style={{ fontSize: '15px', color: '#ffffff', fontWeight: 500, lineHeight: '1.4' }}>{note.texto}</p>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    <span>Por: <strong>{note.autor}</strong></span>
                    <span>-</span>
                    <span>{note.fecha}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id, note.texto)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* New Event Form */}
          <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} style={{ color: 'var(--color-cyan)' }} />
              Añadir Evento
            </h3>
            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Detalle del Evento</label>
                <input
                  type="text"
                  placeholder="Ej. Entrega de Beta Dexcov ERP"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="glass-input"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Fecha de Entrega</label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="glass-input"
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
                Guardar Fecha
              </button>
            </form>
          </div>

          {/* Events List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Cronograma de Entregas</h3>
            {events.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>No hay entregas agendadas.</div>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.id}
                  className="glass-panel"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: 'var(--color-indigo)',
                      border: '1px solid rgba(99, 102, 241, 0.15)'
                    }}>
                      <CalendarDays size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700 }}>{evt.titulo}</h4>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Agendado por: {evt.autor}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-cyan)' }}>
                      {new Date(evt.fecha).toLocaleDateString('es-MX')}
                    </span>
                    <button
                      onClick={() => handleDeleteEvent(evt.id, evt.titulo)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};
