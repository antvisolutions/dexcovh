import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  TrendingUp, 
  DollarSign, 
  Users2, 
  Layers, 
  CheckSquare, 
  CalendarDays, 
  Activity, 
  Clock
} from 'lucide-react';

interface DashboardProps {
  currentUser: { nombre: string; isAdmin: boolean };
}

interface ActivityItem {
  id: number;
  texto: string;
  tipo: string;
  autor: string;
  creado_en: string;
}

interface EventItem {
  id: number;
  titulo: string;
  fecha: string;
  autor: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser }) => {
  const [stats, setStats] = useState({
    totalIncome: 0,
    activeProjects: 0,
    activeLeads: 0,
    myPendingTasks: 0
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Clients (for income and active projects count)
      const { data: clients } = await supabase.from('clientes').select('*');
      
      // 2. Fetch Leads (for active leads count)
      const { data: leads } = await supabase.from('leads').select('*');
      
      // 3. Fetch Tasks (for current user pending tasks count)
      const { data: tasks } = await supabase
        .from('tareas')
        .select('*')
        .eq('completada', false);

      // 4. Fetch Recent Activities
      const { data: acts } = await supabase
        .from('actividades')
        .select('*')
        .order('id', { ascending: false })
        .limit(10);

      // 5. Fetch Events
      const { data: evs } = await supabase
        .from('eventos')
        .select('*')
        .order('fecha', { ascending: true })
        .limit(5);

      // Calculate stats
      let incomeSum = 0;
      let activeProjCount = 0;

      clients?.forEach((c: any) => {
        incomeSum += c.precio_total || 0;
        if (c.estatus === 'En Proceso') {
          activeProjCount++;
        }
      });

      const activeLeadsCount = leads?.filter((l: any) => l.estatus !== 'Convertido' && l.estatus !== 'Descartado').length || 0;
      const myTasksCount = tasks?.filter((t: any) => t.asignado_a && t.asignado_a.toLowerCase() === currentUser.nombre.toLowerCase()).length || 0;

      setStats({
        totalIncome: incomeSum,
        activeProjects: activeProjCount,
        activeLeads: activeLeadsCount,
        myPendingTasks: myTasksCount
      });

      setActivities(acts || []);
      setUpcomingEvents(evs || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up Realtime subscriptions
    const clientesChan = supabase.channel('dashboard_clientes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => fetchDashboardData())
      .subscribe();

    const leadsChan = supabase.channel('dashboard_leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => fetchDashboardData())
      .subscribe();

    const tareasChan = supabase.channel('dashboard_tareas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tareas' }, () => fetchDashboardData())
      .subscribe();

    const actividadesChan = supabase.channel('dashboard_actividades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'actividades' }, () => fetchDashboardData())
      .subscribe();

    const eventosChan = supabase.channel('dashboard_eventos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(clientesChan);
      supabase.removeChannel(leadsChan);
      supabase.removeChannel(tareasChan);
      supabase.removeChannel(actividadesChan);
      supabase.removeChannel(eventosChan);
    };
  }, [currentUser]);

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'lead':
        return <Users2 size={16} style={{ color: 'var(--color-cyan)' }} />;
      case 'proyecto':
        return <Layers size={16} style={{ color: 'var(--color-blue)' }} />;
      case 'tarea':
        return <CheckSquare size={16} style={{ color: 'var(--color-indigo)' }} />;
      case 'nota':
      case 'evento':
        return <CalendarDays size={16} style={{ color: 'var(--color-purple)' }} />;
      default:
        return <Activity size={16} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: 'var(--color-cyan)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(0, 210, 255, 0.1)', borderTopColor: 'var(--color-cyan)', borderRadius: '50%' }} />
          <span>Sincronizando Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg, #ffffff 40%, var(--color-cyan) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ¡Hola, {currentUser.nombre}!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Aquí tienes un resumen del estado actual de Dexcov.</p>
        </div>
        <div style={{ padding: '10px 16px', background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.15)', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>Supabase Online</span>
        </div>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        {/* Card 1: Ingresos */}
        <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Monto Cotizado (Ventas)</span>
            <div style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--color-cyan)', borderRadius: '8px', padding: '6px' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 800 }}>${stats.totalIncome.toLocaleString()}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', color: '#10b981', fontSize: '12px', fontWeight: 600 }}>
            <TrendingUp size={14} />
            <span>Monto histórico en clientes</span>
          </div>
        </div>

        {/* Card 2: Proyectos Activos */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Proyectos en Proceso</span>
            <div style={{ background: 'rgba(0, 112, 243, 0.1)', color: 'var(--color-blue)', borderRadius: '8px', padding: '6px' }}>
              <Layers size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 800 }}>{stats.activeProjects}</h3>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '12px' }}>
            Actualmente en desarrollo activo
          </div>
        </div>

        {/* Card 3: Leads Activos */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Leads de Venta</span>
            <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'var(--color-purple)', borderRadius: '8px', padding: '6px' }}>
              <Users2 size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 800 }}>{stats.activeLeads}</h3>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '12px' }}>
            Prospectos en fase de negociación
          </div>
        </div>

        {/* Card 4: Mis Tareas Pendientes */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Mis Tareas Pendientes</span>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-indigo)', borderRadius: '8px', padding: '6px' }}>
              <CheckSquare size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 800 }}>{stats.myPendingTasks}</h3>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '12px' }}>
            Asignadas a ti
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Activity Feed) & Right (Upcoming Events) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left: Activity Feed */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} style={{ color: 'var(--color-cyan)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Feed de Actividad Reciente</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activities.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
                No hay actividad reciente registrada en el sistema.
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', paddingBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', flexShrink: 0 }}>
                    {getActivityIcon(act.tipo)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                      <strong style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>{act.autor}</strong> {act.texto}
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <Clock size={10} />
                      {new Date(act.creado_en).toLocaleString('es-MX')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Upcoming Events */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={20} style={{ color: 'var(--color-purple)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Próximos Eventos</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingEvents.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0', fontSize: '14px' }}>
                No hay próximos eventos programados.
              </div>
            ) : (
              upcomingEvents.map((evt) => (
                <div key={evt.id} style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--card-border)', borderRadius: '10px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>{evt.titulo}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>{evt.fecha}</span>
                    <span style={{ color: 'var(--color-purple)' }}>Por: {evt.autor}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
