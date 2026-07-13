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

interface UserSession {
  nombre: string;
  isAdmin: boolean;
  permitidoPaneles: string;
}

function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // Default to dashboard
  const [checkedSession, setCheckedSession] = useState(false);

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
        return <Cotizador />;
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={session}
        onLogout={handleLogout}
      />
      
      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        marginLeft: '260px', 
        minHeight: '100vh',
        paddingBottom: '40px',
        position: 'relative'
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
          {/* Logout button removed from header as requested */}
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
