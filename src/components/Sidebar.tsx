import React from 'react';
import { 
  Users2, 
  Layers, 
  FileText, 
  CalendarDays, 
  CheckSquare, 
  ShieldCheck,
  Power,
  LayoutDashboard,
  Megaphone,
  DollarSign
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: { nombre: string; isAdmin: boolean; permitidoPaneles: string };
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout }) => {
  const allMenuItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads & Pitch', icon: Users2 },
    { id: 'projects', label: 'Proyectos', icon: Layers },
    { id: 'cotizador', label: 'Cotizador', icon: FileText },
    { id: 'agenda', label: 'Agenda & Notas', icon: CalendarDays },
    { id: 'tareas', label: 'Mis Tareas', icon: CheckSquare },
    { id: 'marketing', label: 'Marketing', icon: Megaphone },
    { id: 'finanzas', label: 'Finanzas', icon: DollarSign },
  ];

  if (currentUser.isAdmin) {
    allMenuItems.push({ id: 'admin-panel', label: 'Panel Admin', icon: ShieldCheck });
  }

  // Filter based on allowed panels in database
  const allowedPanels = currentUser.permitidoPaneles ? currentUser.permitidoPaneles.split(',') : [];
  
  const menuItems = allMenuItems.filter(item => {
    // Admins see everything, other users see only what is allowed
    if (currentUser.isAdmin) return true;
    return allowedPanels.includes(item.id);
  });

  return (
    <div style={{
      width: '260px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      background: 'rgba(6, 7, 13, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(56, 189, 248, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      zIndex: 100,
      justifyContent: 'space-between'
    }}>
      <div>
        {/* Glowing Logo Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 12px 24px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          marginBottom: '24px'
        }}>
          {/* Logo representation */}
          <div style={{ position: 'relative', width: '38px', height: '38px' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              <polygon points="50,5 90,30 90,70 50,95 10,70 10,30" fill="none" stroke="#38bdf8" strokeWidth="3" />
              <polygon points="50,5 50,95" fill="none" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="2" />
              <polygon points="10,30 90,30" fill="none" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="2" />
              <polygon points="10,70 90,70" fill="none" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="2" />
              <polygon points="50,5 90,70 10,70" fill="none" stroke="rgba(2, 132, 199, 0.5)" strokeWidth="2" />
              <polygon points="50,95 90,30 10,30" fill="none" stroke="rgba(99, 102, 241, 0.5)" strokeWidth="2" />
              
              <polygon points="50,5 90,30 50,50" fill="rgba(56, 189, 248, 0.2)" />
              <polygon points="90,30 90,70 50,50" fill="rgba(2, 132, 199, 0.3)" />
              <polygon points="90,70 50,95 50,50" fill="rgba(99, 102, 241, 0.4)" />
              <polygon points="50,95 10,70 50,50" fill="rgba(2, 132, 199, 0.4)" />
              <polygon points="10,70 10,30 50,50" fill="rgba(56, 189, 248, 0.25)" />
              <polygon points="10,30 50,5 50,50" fill="rgba(99, 102, 241, 0.15)" />
            </svg>
          </div>
          
          <div>
            <h1 style={{
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #ffffff 30%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'baseline'
            }}>
              Dex<span style={{ color: '#38bdf8', fontWeight: 400, marginLeft: '3px' }}>cov</span>
            </h1>
            <span style={{
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: '#9ca3af',
              display: 'block',
              marginTop: '-2px'
            }}>Command Center</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(2, 132, 199, 0.05) 100%)' : 'transparent',
                  color: isActive ? 'var(--color-cyan)' : '#9ca3af',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '15px',
                  textAlign: 'left',
                  borderLeft: isActive ? '3px solid var(--color-cyan)' : '3px solid transparent',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#9ca3af';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={18} style={{ color: isActive ? 'var(--color-cyan)' : '#6b7280' }} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile */}
      <div style={{
        paddingTop: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-blue) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#000000',
          }}>
            DX
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f3f4f6' }}>{currentUser.nombre}</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }}></span>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Online</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onLogout}
          style={{
            background: 'none',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          title="Cerrar Sesión"
        >
          <Power size={16} />
        </button>
      </div>
    </div>
  );
};
