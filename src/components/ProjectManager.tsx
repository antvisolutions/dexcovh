import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  FolderGit2, 
  Search,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Trash2
} from 'lucide-react';

interface Project {
  id: number;
  nombre: string;
  tel: string;
  precio_total: number;
  tipo_pago: string;
  metodo_pago: string;
  dominio: string;
  paquete: string;
  estatus: 'En Proceso' | 'Terminado';
  fase_proyecto: string;
  pidio_mantenimiento: boolean;
  mantenimientos_realizados?: number;
}

interface ProjectManagerProps {
  currentUser: { nombre: string; isAdmin: boolean };
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ currentUser }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'En Proceso' | 'Terminado' | 'Mantenimiento'>('En Proceso');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedProjectForFase, setSelectedProjectForFase] = useState<Project | null>(null);
  const [newFase, setNewFase] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();

    const channel = supabase
      .channel('realtime_clientes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateFase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForFase || !newFase) return;

    try {
      const isEntregado = newFase === 'Entregado';
      const { error } = await supabase
        .from('clientes')
        .update({
          fase_proyecto: newFase,
          estatus: isEntregado ? 'Terminado' : 'En Proceso'
        })
        .eq('id', selectedProjectForFase.id);

      if (error) throw error;
      
      // Log Activity
      await supabase.from('actividades').insert({
        texto: `actualizó el proyecto de "${selectedProjectForFase.nombre}" a la fase "${newFase}"${isEntregado ? ' (Entregado)' : ''}`,
        tipo: 'proyecto',
        autor: currentUser.nombre
      });

      setSelectedProjectForFase(null);
      alert('Fase actualizada exitosamente.');
    } catch (err: any) {
      console.error(err);
      alert(`Error al actualizar fase: ${err.message}`);
    }
  };

  const handleDeleteProject = async (projectId: number, projectName: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el proyecto "${projectName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      // Log Activity
      await supabase.from('actividades').insert({
        texto: `eliminó el proyecto "${projectName}"`,
        tipo: 'proyecto',
        autor: currentUser.nombre
      });

      alert('Proyecto eliminado exitosamente.');
    } catch (err: any) {
      console.error(err);
      alert(`Error al eliminar proyecto: ${err.message}`);
    }
  };

  const filteredProjects = projects.filter(proj => {
    let matchesTab = false;
    if (activeSubTab === 'En Proceso') {
      matchesTab = proj.estatus === 'En Proceso';
    } else if (activeSubTab === 'Terminado') {
      matchesTab = proj.estatus === 'Terminado' && !proj.pidio_mantenimiento;
    } else if (activeSubTab === 'Mantenimiento') {
      matchesTab = proj.pidio_mantenimiento === true;
    }

    const matchesSearch = proj.nombre.toLowerCase().includes(search.toLowerCase()) || 
                          proj.paquete.toLowerCase().includes(search.toLowerCase()) ||
                          proj.dominio.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Tab Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderGit2 className="glow-text-cyan" />
            Control de Proyectos (Supabase Realtime)
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Administración y fases de desarrollo sincronizadas en vivo.</p>
        </div>
      </div>

      {/* Filters & Search bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['En Proceso', 'Terminado', 'Mantenimiento'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                background: activeSubTab === tab ? 'rgba(0, 210, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                color: activeSubTab === tab ? '#00d2ff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                transition: 'all 0.2s ease'
              }}
            >
              {tab === 'En Proceso' ? 'En Desarrollo' : tab === 'Terminado' ? 'Terminados' : 'Soporte Mensual'}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar proyecto o dominio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input"
            style={{ paddingLeft: '38px', width: '280px' }}
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Cargando proyectos...</div>
      ) : filteredProjects.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No hay proyectos en esta sección.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px'
        }}>
          {filteredProjects.map((proj) => (
            <div key={proj.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{proj.nombre}</h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                    Paquete: <strong>{proj.paquete}</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: proj.estatus === 'Terminado' ? '#10b981' : '#00d2ff',
                    background: proj.estatus === 'Terminado' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 210, 255, 0.1)',
                    border: `1px solid ${proj.estatus === 'Terminado' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 210, 255, 0.2)'}`
                  }}>
                    {proj.estatus}
                  </span>
                  
                  {currentUser.isAdmin && (
                    <button
                      onClick={() => handleDeleteProject(proj.id, proj.nombre)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        transition: 'all 0.2s'
                      }}
                      title="Eliminar proyecto"
                      className="delete-project-btn"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress and Phase */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={14} style={{ color: 'var(--color-cyan)' }} />
                  Fase: <strong style={{ color: 'var(--text-primary)' }}>{proj.fase_proyecto || 'Diseño Inicial'}</strong>
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Dominio: <strong>{proj.dominio || 'N/A'}</strong>
                </span>
              </div>

              {/* Budget Details */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '13px',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <DollarSign size={14} style={{ color: 'var(--color-cyan)' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Costo:</span>
                  <span style={{ fontWeight: 600 }}>${proj.precio_total?.toLocaleString()} MXN/USD</span>
                </div>
                
                {proj.estatus === 'En Proceso' ? (
                  <button
                    onClick={() => {
                      setSelectedProjectForFase(proj);
                      setNewFase(proj.fase_proyecto || 'UI/UX y Diseño');
                    }}
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '12px', boxShadow: 'none' }}
                  >
                    Actualizar Fase
                  </button>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '12px', fontWeight: 600 }}>
                    <ShieldCheck size={14} />
                    Entregado
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Phase Modal */}
      {selectedProjectForFase && (
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
          <form onSubmit={handleUpdateFase} className="glass-panel" style={{
            padding: '30px',
            width: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-cyan)', marginBottom: '8px' }}>
              Actualizar Fase de Proyecto
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Fase del Proyecto</label>
              <select 
                value={newFase} 
                onChange={(e) => setNewFase(e.target.value)} 
                className="glass-input"
                style={{ background: '#0c1020' }}
              >
                <option value="UI/UX y Diseño">UI/UX y Diseño</option>
                <option value="Aprobación de Cliente">Aprobación de Cliente</option>
                <option value="Desarrollo Frontend">Desarrollo Frontend</option>
                <option value="Backend y Pruebas">Backend y Pruebas</option>
                <option value="Entregado">Entregado</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setSelectedProjectForFase(null)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary">Actualizar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
