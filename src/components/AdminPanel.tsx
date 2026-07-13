import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Users, 
  ShieldAlert, 
  Plus, 
  CheckSquare, 
  Trash2,
  Lock,
  Check
} from 'lucide-react';

interface Colaborador {
  id: number;
  nombre: string;
  is_admin: boolean;
  permitido_paneles: string;
}

interface SoporteTicket {
  id: number;
  tipo: string;
  descripcion: string;
  fecha: string;
}

interface GlobalTask {
  id: number;
  titulo: string;
  asignado_a: string;
  completada: boolean;
}

const AVAILABLE_PANELS = [
  { id: 'dashboard', label: 'Inicio' },
  { id: 'leads', label: 'Leads & Pitch' },
  { id: 'projects', label: 'Proyectos' },
  { id: 'cotizador', label: 'Cotizador' },
  { id: 'agenda', label: 'Agenda & Notas' },
  { id: 'tareas', label: 'Mis Tareas' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'finanzas', label: 'Finanzas' },
  { id: 'admin-panel', label: 'Panel Admin' }
];

export const AdminPanel: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'team' | 'tickets'>('team');

  // Collaborators
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [newColabNombre, setNewColabNombre] = useState('');
  const [newColabPass, setNewColabPass] = useState('');
  const [newColabIsAdmin, setNewColabIsAdmin] = useState(false);
  const [newColabPanels, setNewColabPanels] = useState<string[]>([
    'dashboard', 'leads', 'projects', 'cotizador', 'agenda', 'tareas'
  ]);

  // Tickets & Global Tasks
  const [tickets, setTickets] = useState<SoporteTicket[]>([]);
  const [ticketTipo, setTicketTipo] = useState('Bug Critico');
  const [ticketDesc, setTicketDesc] = useState('');

  const [globalTasks, setGlobalTasks] = useState<GlobalTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  const loadData = async () => {
    try {
      const { data: users, error: usersError } = await supabase.from('usuarios').select('*');
      if (usersError) throw usersError;

      // Map collaborators
      const mappedColabs = users?.map((u: any) => ({
        id: u.id,
        nombre: u.nombre,
        is_admin: u.is_admin || false,
        permitido_paneles: u.permitido_paneles || 'dashboard,leads,projects,cotizador,agenda,tareas'
      })) || [];
      setColaboradores(mappedColabs);

    } catch (err) {
      console.error('Error loading team:', err);
    }

    const savedTickets = localStorage.getItem('dexcov_tickets');
    if (savedTickets) setTickets(JSON.parse(savedTickets));

    const { data: tasksData } = await supabase.from('tareas').select('*').order('id', { ascending: false });
    setGlobalTasks(tasksData || []);
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('admin_realtime_tareas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tareas' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddColaborador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColabNombre.trim() || !newColabPass.trim()) return;

    try {
      const { error } = await supabase.from('usuarios').insert({
        nombre: newColabNombre.trim(),
        password: newColabPass.trim(),
        is_admin: newColabIsAdmin,
        permitido_paneles: newColabPanels.join(',')
      });

      if (error) throw error;

      // Log Activity
      await supabase.from('actividades').insert({
        texto: `registró al nuevo colaborador "${newColabNombre.trim()}"`,
        tipo: 'admin',
        autor: 'Administrador'
      });

      alert('Colaborador registrado exitosamente.');
      setNewColabNombre('');
      setNewColabPass('');
      setNewColabIsAdmin(false);
      setNewColabPanels(['dashboard', 'leads', 'projects', 'cotizador', 'agenda', 'tareas']);
      loadData();
    } catch (err: any) {
      console.error(err);
      alert(`Error al registrar colaborador: ${err.message}`);
    }
  };

  const handleDeleteColaborador = async (col: Colaborador) => {
    if (col.nombre.toLowerCase() === 'admin' || col.nombre.toLowerCase() === 'antonio') {
      alert('No se puede eliminar al administrador principal.');
      return;
    }
    if (!window.confirm(`¿Seguro que deseas eliminar al colaborador "${col.nombre}" de forma permanente?`)) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', col.id);

      if (error) throw error;

      // Log Activity
      await supabase.from('actividades').insert({
        texto: `eliminó al colaborador "${col.nombre}"`,
        tipo: 'admin',
        autor: 'Administrador'
      });

      alert('Colaborador eliminado.');
      loadData();
    } catch (err: any) {
      console.error(err);
      alert(`Error al eliminar colaborador: ${err.message}`);
    }
  };

  const handleChangePassword = async (col: Colaborador) => {
    const newPass = prompt(`Introduce la nueva contraseña para ${col.nombre}:`);
    if (newPass === null) return;
    if (!newPass.trim()) {
      alert('La contraseña no puede estar vacía.');
      return;
    }

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ password: newPass.trim() })
        .eq('id', col.id);

      if (error) throw error;
      alert('Contraseña actualizada con éxito.');
    } catch (err: any) {
      console.error(err);
      alert(`Error al cambiar contraseña: ${err.message}`);
    }
  };

  const handleToggleAdminStatus = async (col: Colaborador) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ is_admin: !col.is_admin })
        .eq('id', col.id);

      if (error) throw error;
      loadData();
    } catch (err: any) {
      console.error(err);
      alert(`Error al actualizar estado admin: ${err.message}`);
    }
  };

  const handleTogglePanelPermission = async (colab: Colaborador, panelId: string) => {
    let currentPanels = colab.permitido_paneles ? colab.permitido_paneles.split(',') : [];
    if (currentPanels.includes(panelId)) {
      currentPanels = currentPanels.filter(p => p !== panelId);
    } else {
      currentPanels.push(panelId);
    }

    const panelsString = currentPanels.join(',');

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ permitido_paneles: panelsString })
        .eq('id', colab.id);

      if (error) throw error;
      loadData();
    } catch (err: any) {
      console.error('Error toggling panel permission:', err);
      alert('Error al actualizar permisos.');
    }
  };

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDesc.trim()) return;

    const item: SoporteTicket = {
      id: Date.now(),
      tipo: ticketTipo,
      descripcion: ticketDesc.trim(),
      fecha: new Date().toLocaleDateString('es-MX')
    };

    const updated = [item, ...tickets];
    setTickets(updated);
    localStorage.setItem('dexcov_tickets', JSON.stringify(updated));
    setTicketDesc('');
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskAssignee) return;

    try {
      const { error } = await supabase.from('tareas').insert({
        titulo: newTaskTitle.trim(),
        asignado_a: newTaskAssignee,
        completada: false
      });

      if (error) throw error;

      // Log Activity
      await supabase.from('actividades').insert({
        texto: `asignó la tarea "${newTaskTitle.trim()}" a ${newTaskAssignee}`,
        tipo: 'tarea',
        autor: 'Administrador'
      });

      setNewTaskTitle('');
    } catch (err) {
      console.error('Error assigning task:', err);
    }
  };

  const handleToggleTaskStatus = async (id: number) => {
    const task = globalTasks.find(t => t.id === id);
    if (!task) return;
    const nextStatus = !task.completada;

    try {
      const { error } = await supabase
        .from('tareas')
        .update({ completada: nextStatus })
        .eq('id', id);

      if (error) throw error;

      // Log Activity
      await supabase.from('actividades').insert({
        texto: `${nextStatus ? 'marcó como completada' : 'reabrió'} la tarea "${task.titulo}"`,
        tipo: 'tarea',
        autor: 'Administrador'
      });
    } catch (err) {
      console.error('Error toggling task status:', err);
    }
  };

  const handleDeleteTicket = (id: number) => {
    const updated = tickets.filter(t => t.id !== id);
    setTickets(updated);
    localStorage.setItem('dexcov_tickets', JSON.stringify(updated));
  };

  const handleNewColabPanelCheckbox = (panelId: string) => {
    if (newColabPanels.includes(panelId)) {
      setNewColabPanels(newColabPanels.filter(p => p !== panelId));
    } else {
      setNewColabPanels([...newColabPanels, panelId]);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Lock size={28} style={{ color: 'var(--color-cyan)' }} />
          Panel de Control Administrativo
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Módulo de administración de colaboradores, control de accesos a paneles y soporte técnico.</p>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActiveSubTab('team')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid var(--card-border)',
            background: activeSubTab === 'team' ? 'rgba(56, 189, 248, 0.1)' : '#111827',
            color: activeSubTab === 'team' ? 'var(--color-cyan)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px'
          }}
        >
          Colaboradores y Permisos
        </button>
        <button
          onClick={() => setActiveSubTab('tickets')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid var(--card-border)',
            background: activeSubTab === 'tickets' ? 'rgba(56, 189, 248, 0.1)' : '#111827',
            color: activeSubTab === 'tickets' ? 'var(--color-cyan)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px'
          }}
        >
          Soporte y Tareas
        </button>
      </div>

      {/* Tab Contents */}
      {activeSubTab === 'team' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="animate-fade-in">
          
          {/* Register Colab */}
          <div className="glass-panel" style={{ padding: '24px', height: 'fit-content', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Agregar Colaborador</h3>
            <form onSubmit={handleAddColaborador} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Nombre de Usuario</label>
                <input
                  type="text"
                  value={newColabNombre}
                  onChange={(e) => setNewColabNombre(e.target.value)}
                  placeholder="Nombre"
                  className="glass-input"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Contraseña</label>
                <input
                  type="text"
                  value={newColabPass}
                  onChange={(e) => setNewColabPass(e.target.value)}
                  placeholder="Contraseña"
                  className="glass-input"
                  required
                />
              </div>

              {/* Panel Access Control Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Paneles Permitidos</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {AVAILABLE_PANELS.map(p => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={newColabPanels.includes(p.id)}
                        onChange={() => handleNewColabPanelCheckbox(p.id)}
                        style={{ accentColor: 'var(--color-cyan)' }}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={newColabIsAdmin}
                  onChange={(e) => setNewColabIsAdmin(e.target.checked)}
                  style={{ accentColor: 'var(--color-cyan)' }}
                />
                Asignar privilegios de Administrador
              </label>

              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                Guardar Colaborador
              </button>
            </form>
          </div>

          {/* Colabs list with active permissions toggles */}
          <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Miembros del Equipo y Accesos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {colaboradores.map((col) => {
                const allowedList = col.permitido_paneles ? col.permitido_paneles.split(',') : [];
                return (
                  <div
                    key={col.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      padding: '16px',
                      background: '#0a0d16',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 700, color: '#ffffff' }}>{col.nombre}</span>
                        <button
                          type="button"
                          onClick={() => handleChangePassword(col)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-cyan)',
                            cursor: 'pointer',
                            fontSize: '11px',
                            textDecoration: 'underline',
                            padding: 0
                          }}
                        >
                          Contraseña
                        </button>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleAdminStatus(col)}
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            border: 'none',
                            background: col.is_admin ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: col.is_admin ? 'var(--color-cyan)' : 'var(--text-secondary)',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          title="Alternar rol del usuario"
                        >
                          {col.is_admin ? 'ADMIN' : 'COLABORADOR'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteColaborador(col)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(239, 68, 68, 0.7)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Eliminar Colaborador"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                        Permisos de Panel:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {AVAILABLE_PANELS.map(p => {
                          const isAllowed = allowedList.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => handleTogglePanelPermission(col, p.id)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid',
                                borderColor: isAllowed ? 'var(--color-cyan)' : 'var(--card-border)',
                                background: isAllowed ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                                color: isAllowed ? 'var(--color-cyan)' : 'var(--text-muted)',
                                fontSize: '10px',
                                cursor: 'pointer',
                                fontWeight: 500,
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'tickets' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="animate-fade-in">
          {/* Left Column: Tickets and Tasks Forms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Create Ticket */}
            <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Crear Ticket de Soporte</h3>
              <form onSubmit={handleAddTicket} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tipo de Falla</label>
                  <select value={ticketTipo} onChange={(e) => setTicketTipo(e.target.value)} className="glass-input" style={{ background: '#0b0f19' }}>
                    <option value="Bug Critico">Bug Crítico</option>
                    <option value="Servidor Caido">Servidor Caído</option>
                    <option value="Optimizacion">Optimización</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Descripción del Problema</label>
                  <textarea
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                    placeholder="Describe el incidente técnico."
                    className="glass-input"
                    style={{ height: '70px', resize: 'none' }}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '6px' }}>
                  Enviar Ticket
                </button>
              </form>
            </div>

            {/* Assign Task */}
            <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Asignar Nueva Tarea</h3>
              <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Título de Tarea</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Ej. Crear base de datos para cotizador"
                    className="glass-input"
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Asignar a (Usuario)</label>
                  <select value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} className="glass-input" style={{ background: '#0b0f19' }}>
                    <option value="">Selecciona Colaborador</option>
                    {colaboradores.map(c => (
                      <option key={c.nombre} value={c.nombre}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '6px' }}>
                  Asignar Tarea
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Support Tickets & Tasks Lists */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Tickets List */}
            <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Bandeja de Soporte</h3>
              {tickets.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay reportes activos.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tickets.map((t) => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--card-border)', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>{t.tipo}</span>
                        <p style={{ fontSize: '14px', marginTop: '2px', color: '#ffffff' }}>{t.descripcion}</p>
                      </div>
                      <button onClick={() => handleDeleteTicket(t.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}>
                        Resolver
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Global Tasks List */}
            <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Tareas del Equipo</h3>
              {globalTasks.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay tareas asignadas.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {globalTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderBottom: '1px solid var(--card-border)'
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                        <input
                          type="checkbox"
                          checked={task.completada}
                          onChange={() => handleToggleTaskStatus(task.id)}
                          style={{ accentColor: 'var(--color-cyan)' }}
                        />
                        <span style={{ textDecoration: task.completada ? 'line-through' : 'none', color: task.completada ? 'var(--text-muted)' : '#ffffff' }}>
                          {task.titulo}
                        </span>
                      </label>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Para: {task.asignado_a}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
