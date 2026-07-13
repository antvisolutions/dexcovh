import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { KeyRound, User, AlertTriangle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: { nombre: string; isAdmin: boolean; permitidoPaneles: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !password) return;
    setLoading(true);
    setErrorMsg('');

    try {
      // Direct equivalent query to main.dart (ilike on username and equality on password)
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .ilike('nombre', nombre.trim())
        .eq('password', password.trim());

      if (error) throw error;

      if (data && data.length > 0) {
        const user = data[0];
        const loggedUser = {
          nombre: user.nombre,
          isAdmin: !!user.is_admin,
          permitidoPaneles: user.permitido_paneles || 'dashboard,leads,projects,cotizador,agenda,tareas'
        };
        
        // Save session locally
        localStorage.setItem('dexcov_user_nombre', loggedUser.nombre);
        localStorage.setItem('dexcov_user_is_admin', String(loggedUser.isAdmin));
        localStorage.setItem('dexcov_user_permitido_paneles', loggedUser.permitidoPaneles);
        
        onLoginSuccess(loggedUser);
      } else {
        setErrorMsg('Usuario o contraseña incorrectos.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error de conexión a la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      backgroundImage: 'radial-gradient(circle at center, rgba(0, 210, 255, 0.12) 0%, transparent 60%)',
    }}>
      <div className="glass-panel" style={{
        padding: '40px',
        width: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        border: '1px solid rgba(0, 210, 255, 0.2)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), var(--glow-cyan)'
      }}>
        {/* Animated 3D Logo Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '60px', height: '60px', filter: 'drop-shadow(0 0 12px rgba(0, 210, 255, 0.8))' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              <polygon points="50,5 90,30 90,70 50,95 10,70 10,30" fill="none" stroke="#00d2ff" strokeWidth="4" />
              <polygon points="50,5 90,30 50,50" fill="rgba(0, 210, 255, 0.2)" stroke="rgba(0, 210, 255, 0.3)" strokeWidth="1" />
              <polygon points="90,30 90,70 50,50" fill="rgba(0, 112, 243, 0.3)" stroke="rgba(0, 210, 255, 0.3)" strokeWidth="1" />
              <polygon points="90,70 50,95 50,50" fill="rgba(99, 102, 241, 0.4)" stroke="rgba(0, 210, 255, 0.3)" strokeWidth="1" />
              <polygon points="50,95 10,70 50,50" fill="rgba(0, 112, 243, 0.4)" stroke="rgba(0, 210, 255, 0.3)" strokeWidth="1" />
              <polygon points="10,70 10,30 50,50" fill="rgba(0, 210, 255, 0.25)" stroke="rgba(0, 210, 255, 0.3)" strokeWidth="1" />
              <polygon points="10,30 50,5 50,50" fill="rgba(99, 102, 241, 0.15)" stroke="rgba(0, 210, 255, 0.3)" strokeWidth="1" />
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 900,
              letterSpacing: '-1px',
              background: 'linear-gradient(135deg, #ffffff 40%, #00d2ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Dexcov HUD
            </h1>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--text-secondary)' }}>Ingreso Autorizado</span>
          </div>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Usuario</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Nombre de usuario"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: '38px', width: '100%' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Contraseña</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: '38px', width: '100%' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Validando Credenciales...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};
