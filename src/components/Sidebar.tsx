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
  DollarSign,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: { nombre: string; isAdmin: boolean; permitidoPaneles: string };
  onLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onLogout,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) => {
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
    <>
      {/* Mobile Overlay Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 5, 12, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 140,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className="no-print"
        style={{
          width: isCollapsed ? '80px' : '260px',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          background: 'rgba(6, 7, 13, 0.96)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          padding: isCollapsed ? '24px 8px' : '24px 16px',
          zIndex: 150,
          justifyContent: 'space-between',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: window.innerWidth <= 768 && !isMobileOpen ? 'translateX(-100%)' : 'translateX(0)'
        }}
      >
        <div>
          {/* Logo & Header Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '8px 0 24px 0' : '8px 12px 24px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '24px',
            position: 'relative'
          }}>
            {/* Logo representation */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px' 
            }}>
              <div style={{ position: 'relative', width: '38px', height: '38px', flexShrink: 0 }}>
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
              
              {!isCollapsed && (
                <div style={{ transition: 'opacity 0.2s ease' }}>
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
              )}
            </div>

            {/* Mobile Close Button */}
            {window.innerWidth <= 768 && (
              <button 
                onClick={() => setIsMobileOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth <= 768) {
                      setIsMobileOpen(false);
                    }
                  }}
                  title={isCollapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: isCollapsed ? '0' : '12px',
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
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? 'inset 0 0 10px rgba(56, 189, 248, 0.05)' : 'none'
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
                  <Icon size={18} style={{ color: isActive ? 'var(--color-cyan)' : '#6b7280', flexShrink: 0 }} />
                  {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile & Desktop Collapse Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Desktop Collapse Arrow Button */}
          {window.innerWidth > 768 && (
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.02)',
                color: '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-cyan)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280';
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              }}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}

          {/* User Profile Info */}
          <div style={{
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: isCollapsed ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: isCollapsed ? '12px' : '0'
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
                color: '#060810',
                flexShrink: 0
              }}>
                {currentUser.nombre ? currentUser.nombre.substring(0, 2).toUpperCase() : 'DX'}
              </div>
              {!isCollapsed && (
                <div style={{ transition: 'opacity 0.2s ease' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f3f4f6' }}>{currentUser.nombre}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }}></span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>Online</span>
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={onLogout}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280';
                e.currentTarget.style.background = 'none';
              }}
              title="Cerrar Sesión"
            >
              <Power size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

