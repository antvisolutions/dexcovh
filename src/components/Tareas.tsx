import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface Task {
  id: number;
  titulo: string;
  asignado_a: string;
  completada: boolean;
}

interface TareasProps {
  currentUser: { nombre: string; isAdmin: boolean };
}

export const Tareas: React.FC<TareasProps> = ({ currentUser }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tareas')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('realtime_tareas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tareas' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleTask = async (task: Task) => {
    const nextStatus = !task.completada;
    try {
      const { error } = await supabase
        .from('tareas')
        .update({ completada: nextStatus })
        .eq('id', task.id);
      
      if (error) throw error;

      // Log activity
      await supabase.from('actividades').insert({
        texto: `${nextStatus ? 'marcó como completada' : 'reabrió'} la tarea "${task.titulo}"`,
        tipo: 'tarea',
        autor: currentUser.nombre
      });

    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('tareas')
        .insert({
          titulo: newTitle.trim(),
          asignado_a: currentUser.nombre,
          completada: false
        })
        .select();

      if (error) throw error;

      // Log activity
      await supabase.from('actividades').insert({
        texto: `creó la tarea "${newTitle.trim()}"`,
        tipo: 'tarea',
        autor: currentUser.nombre
      });

      setNewTitle('');
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const handleDeleteTask = async (id: number, titulo: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta tarea?')) return;
    try {
      const { error } = await supabase
        .from('tareas')
        .delete()
        .eq('id', id);
      if (error) throw error;

      // Log activity
      await supabase.from('actividades').insert({
        texto: `eliminó la tarea "${titulo}"`,
        tipo: 'tarea',
        autor: currentUser.nombre
      });
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const myTasks = tasks.filter(t => t.asignado_a && t.asignado_a.toLowerCase() === currentUser.nombre.toLowerCase());

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 800 }}>Mis Tareas</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Tareas pendientes asignadas a {currentUser.nombre} en tiempo real.</p>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Añadir una nueva tarea rápida..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="glass-input"
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          style={{
            background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-blue) 100%)',
            color: '#060810',
            border: 'none',
            borderRadius: '8px',
            padding: '0 16px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={18} />
          <span>Agregar</span>
        </button>
      </form>

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Cargando tareas...</div>
        ) : myTasks.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No tienes tareas pendientes asignadas.
          </div>
        ) : (
          myTasks.map((task) => (
            <div
              key={task.id}
              className="glass-panel"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                background: task.completada ? 'rgba(255, 255, 255, 0.02)' : 'var(--card-bg)',
                borderColor: task.completada ? 'rgba(255, 255, 255, 0.05)' : 'var(--card-border)',
                transition: 'all 0.2s ease'
              }}
            >
              <div 
                onClick={() => toggleTask(task)} 
                style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flex: 1 }}
              >
                <div style={{ color: task.completada ? '#10b981' : 'var(--text-muted)' }}>
                  {task.completada ? <CheckSquare size={20} /> : <Square size={20} />}
                </div>
                <span style={{
                  fontSize: '15px',
                  color: task.completada ? 'var(--text-muted)' : '#ffffff',
                  textDecoration: task.completada ? 'line-through' : 'none'
                }}>
                  {task.titulo}
                </span>
              </div>
              <button
                onClick={() => handleDeleteTask(task.id, task.titulo)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(239, 68, 68, 0.6)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.6)'}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
