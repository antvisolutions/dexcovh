import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { LeadManager } from './components/LeadManager';
import { ProjectManager } from './components/ProjectManager';
import { Cotizador } from './components/Cotizador';
import { Agenda } from './components/Agenda';
import { Tareas } from './components/Tareas';
import { AdminPanel } from './components/AdminPanel';
import { Finanzas } from './components/Finanzas';
import { Marketing } from './components/Marketing';
import { LoginScreen } from './components/LoginScreen';
import { Menu } from 'lucide-react';

interface UserSession {
  nombre: string;
  isAdmin: boolean;
  permitidoPaneles: string;
}

const tabColors: Record<string, { primary: string; glow: string }> = {
  dashboard: { primary: '#38bdf8', glow: '0 0 20px rgba(56, 189, 248, 0.25)' },
  leads: { primary: '#a78bfa', glow: '0 0 20px rgba(167, 139, 250, 0.25)' },
  projects: { primary: '#10b981', glow: '0 0 20px rgba(16, 185, 129, 0.25)' },
  cotizador: { primary: '#f59e0b', glow: '0 0 20px rgba(245, 158, 11, 0.25)' },
  agenda: { primary: '#6366f1', glow: '0 0 20px rgba(99, 102, 241, 0.25)' },
  tareas: { primary: '#f43f5e', glow: '0 0 20px rgba(244, 63, 94, 0.25)' },
  marketing: { primary: '#f97316', glow: '0 0 20px rgba(249, 115, 22, 0.25)' },
  finanzas: { primary: '#84cc16', glow: '0 0 20px rgba(132, 204, 22, 0.25)' },
  'admin-panel': { primary: '#ef4444', glow: '0 0 20px rgba(239, 68, 68, 0.25)' },
};

function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // Default to dashboard
  const [checkedSession, setCheckedSession] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const savedNombre = localStorage.getItem('dexcov_user_nombre');
    const savedIsAdmin = localStorage.getItem('dexcov_user_is_admin');
    const savedPermitidoPaneles = localStorage.getItem('dexcov_user_permitido_paneles') || 'dashboard,leads,projects,cotizador,agenda,tareas';
    
    if (savedNombre !== null && savedIsAdmin !== null) {
      setSession({
        nombre: savedNombre,
        isAdmin: savedIsAdmin === 'true',
        permitidoPaneles: savedPermitidoPaneles
      });
    }
    setCheckedSession(true);

    // Responsive screen checking
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('dexcov_user_nombre');
    localStorage.removeItem('dexcov_user_is_admin');
    localStorage.removeItem('dexcov_user_permitido_paneles');
    setSession(null);
  };

  const renderContent = () => {
    if (!session) return null;

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard currentUser={session} />;
      case 'leads':
        return <LeadManager currentUser={session} />;
      case 'projects':
        return <ProjectManager currentUser={session} />;
      case 'cotizador':
        return <Cotizador currentUser={session} />;
      case 'agenda':
        return <Agenda currentUser={session} />;
      case 'tareas':
        return <Tareas currentUser={session} />;
      case 'finanzas':
        return <Finanzas />;
      case 'marketing':
        return <Marketing />;
      case 'admin-panel':
        return <AdminPanel />;
      default:
        return <Dashboard currentUser={session} />;
    }
  };

  if (!checkedSession) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--color-cyan)',
        fontFamily: 'var(--font-sans)',
        fontSize: '18px'
      }}>
        Inicializando Command Center...
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onLoginSuccess={(user) => setSession(user)} />;
  }

  const activeColor = tabColors[activeTab] || tabColors.dashboard;
  
  // Calculate margins and widths dynamically based on screen size and collapse state
  const sidebarWidth = isMobileScreen ? 0 : (sidebarCollapsed ? 80 : 260);

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'var(--bg-primary)',
      '--color-cyan': activeColor.primary,
      '--glow-cyan': activeColor.glow,
      transition: 'background 0.3s ease'
    } as React.CSSProperties}>
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={session}
        onLogout={handleLogout}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        marginLeft: `${sidebarWidth}px`, 
        minHeight: '100vh',
        paddingBottom: '40px',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        maxWidth: isMobileScreen ? '100vw' : `calc(100vw - ${sidebarWidth}px)`
      }}>
        {/* Top Header info bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(6, 7, 13, 0.2)',
          backdropFilter: 'none'
        }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Hamburger menu button for mobile only */}
            {isMobileScreen && (
              <button
                onClick={() => setIsMobileOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-cyan)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Menu size={22} />
              </button>
            )}

            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Operador: </span>
              <strong style={{ color: 'var(--color-cyan)' }}>{session.nombre}</strong>
              <span style={{
                marginLeft: '10px',
                padding: '2px 8px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600,
                background: session.isAdmin ? 'rgba(0, 210, 255, 0.15)' : 'rgba(255,255,255,0.05)',
                color: session.isAdmin ? 'var(--color-cyan)' : 'var(--text-secondary)',
                border: `1px solid ${session.isAdmin ? 'var(--card-border)' : 'rgba(255,255,255,0.1)'}`
              }}>
                {session.isAdmin ? 'ADMIN' : 'COLABORADOR'}
              </span>
            </div>
          </div>
        </div>

        {/* Entry Tab Animation Container */}
        <div key={activeTab} className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
