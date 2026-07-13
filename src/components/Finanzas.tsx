import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Calculator,
  Percent
} from 'lucide-react';

interface ExpenseItem {
  id: number;
  concepto: string;
  monto: number;
  categoria: 'Infraestructura' | 'Herramientas SaaS' | 'Nominas y Honorarios' | 'Marketing' | 'Otros';
  fecha: string;
}

interface ReceivableItem {
  id: number;
  cliente: string;
  concepto: string;
  montoPendiente: number;
  telefono: string;
}

export const Finanzas: React.FC = () => {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [mrrMaintenance, setMrrMaintenance] = useState(0);

  // Expense Registrations
  const [expensesList, setExpensesList] = useState<ExpenseItem[]>([]);
  const [expConcepto, setExpConcepto] = useState('');
  const [expMonto, setExpMonto] = useState('');
  const [expCategoria, setExpCategoria] = useState<'Infraestructura' | 'Herramientas SaaS' | 'Nominas y Honorarios' | 'Marketing' | 'Otros'>('Infraestructura');

  // Receivables
  const [receivables, setReceivables] = useState<ReceivableItem[]>([]);

  // Break-even Calculator States
  const [beCostosFijos, setBeCostosFijos] = useState('15000');
  const [bePrecioProyecto, setBePrecioProyecto] = useState('3500');

  const loadData = async () => {
    try {
      const { data: clients, error: clientsError } = await supabase.from('clientes').select('*');
      if (clientsError) throw clientsError;

      // Calculations
      let incomeSum = 0;
      let maintenanceCount = 0;
      const calculatedReceivables: ReceivableItem[] = [];

      clients?.forEach((c: any) => {
        incomeSum += c.precio_total || 0;
        
        if (c.estatus === 'En Proceso') {
          const remaining = (c.precio_total || 0) / 2;
          if (remaining > 0) {
            calculatedReceivables.push({
              id: c.id,
              cliente: c.nombre,
              concepto: c.paquete || 'Software a Medida',
              montoPendiente: remaining,
              telefono: c.tel || ''
            });
          }
        }

        if (c.pidio_mantenimiento) {
          maintenanceCount++;
        }
      });

      setTotalIncome(incomeSum);
      setMrrMaintenance(maintenanceCount * 150); // $150 per client
      setReceivables(calculatedReceivables);

    } catch (err) {
      console.error('Error loading financial statistics:', err);
    }

    // Load Expenses
    const savedExpenses = localStorage.getItem('dexcov_expenses');
    if (savedExpenses) {
      const parsed = JSON.parse(savedExpenses);
      setExpensesList(parsed);
      const expenseSum = parsed.reduce((acc: number, item: any) => acc + item.monto, 0);
      setTotalExpenses(expenseSum);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expConcepto.trim() || !expMonto) return;

    const item: ExpenseItem = {
      id: Date.now(),
      concepto: expConcepto.trim(),
      monto: parseFloat(expMonto),
      categoria: expCategoria,
      fecha: new Date().toLocaleDateString('es-MX')
    };

    const updated = [item, ...expensesList];
    setExpensesList(updated);
    localStorage.setItem('dexcov_expenses', JSON.stringify(updated));

    const expenseSum = updated.reduce((acc, i) => acc + i.monto, 0);
    setTotalExpenses(expenseSum);

    // Log Activity
    await supabase.from('actividades').insert({
      texto: `registró un gasto de $${expMonto} por concepto de "${expConcepto.trim()}"`,
      tipo: 'admin',
      autor: 'Finanzas'
    });

    setExpConcepto('');
    setExpMonto('');
  };

  const handleDeleteExpense = (id: number) => {
    const updated = expensesList.filter(e => e.id !== id);
    setExpensesList(updated);
    localStorage.setItem('dexcov_expenses', JSON.stringify(updated));
    const expenseSum = updated.reduce((acc, i) => acc + i.monto, 0);
    setTotalExpenses(expenseSum);
  };

  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;



  // Break-even
  const fixedCosts = parseFloat(beCostosFijos) || 0;
  const projectPrice = parseFloat(bePrecioProyecto) || 1;
  const breakEvenQty = projectPrice > 0 ? Math.ceil(fixedCosts / projectPrice) : 0;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <DollarSign size={28} style={{ color: 'var(--color-cyan)' }} />
          Control de Finanzas y Métricas
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Módulo de administración contable, egresos, cuentas por cobrar y análisis financiero.</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ingresos Totales (Ventas)</span>
          <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px', color: '#10b981' }}>
            ${totalIncome.toLocaleString()}
          </h3>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Egresos Totales (Gastos)</span>
          <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px', color: '#ef4444' }}>
            ${totalExpenses.toLocaleString()}
          </h3>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Utilidad Neta</span>
          <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px', color: netProfit >= 0 ? 'var(--color-cyan)' : '#ef4444' }}>
            ${netProfit.toLocaleString()}
          </h3>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Margen de Utilidad</span>
          <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Percent size={20} />
            {profitMargin.toFixed(1)}%
          </h3>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>MRR Estimado (Mantenimiento)</span>
          <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px', color: '#8b5cf6' }}>
            ${mrrMaintenance.toLocaleString()}/mes
          </h3>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Left: Expenses section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Add Expense Form */}
          <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Registrar Gasto</h3>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Concepto</label>
                <input 
                  type="text" 
                  value={expConcepto} 
                  onChange={(e) => setExpConcepto(e.target.value)} 
                  placeholder="Ej. Servidor Supabase" 
                  className="glass-input" 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Monto ($)</label>
                  <input 
                    type="number" 
                    value={expMonto} 
                    onChange={(e) => setExpMonto(e.target.value)} 
                    placeholder="120" 
                    className="glass-input" 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Categoría</label>
                  <select 
                    value={expCategoria} 
                    onChange={(e) => setExpCategoria(e.target.value as any)} 
                    className="glass-input"
                    style={{ background: '#0b0f19' }}
                  >
                    <option value="Infraestructura">Infraestructura</option>
                    <option value="Herramientas SaaS">Herramientas SaaS</option>
                    <option value="Nominas y Honorarios">Nóminas y Honorarios</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '6px' }}>
                <Plus size={16} />
                Guardar Gasto
              </button>
            </form>
          </div>

          {/* Expenses List */}
          <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Lista de Egresos</h3>
            {expensesList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay gastos registrados.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                {expensesList.map((e) => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--card-border)', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>{e.concepto}</h4>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{e.fecha} - {e.categoria}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <strong style={{ color: '#ef4444' }}>-${e.monto.toLocaleString()}</strong>
                      <button onClick={() => handleDeleteExpense(e.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right: Receivables & Break-even Calculator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Cuentas por Cobrar (Receivables) */}
          <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Cuentas por Cobrar (Saldos 50%)</h3>
            {receivables.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay saldos pendientes por cobrar en proyectos activos.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {receivables.map((r) => (
                  <div key={r.id} style={{ padding: '12px', background: '#0a0d16', border: '1px solid var(--card-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{r.cliente}</h4>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.concepto}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ color: 'var(--color-cyan)', fontSize: '15px' }}>${r.montoPendiente.toLocaleString()}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tel: {r.telefono}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Break-even calculator */}
          <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={18} style={{ color: 'var(--color-cyan)' }} />
              Punto de Equilibrio
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Costos Fijos Mensuales ($)</label>
                  <input 
                    type="number" 
                    value={beCostosFijos} 
                    onChange={(e) => setBeCostosFijos(e.target.value)} 
                    className="glass-input" 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Precio Promedio Proyecto ($)</label>
                  <input 
                    type="number" 
                    value={bePrecioProyecto} 
                    onChange={(e) => setBePrecioProyecto(e.target.value)} 
                    className="glass-input" 
                  />
                </div>
              </div>

              <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.1)', borderRadius: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Proyectos requeridos al mes:</span>
                <h4 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-cyan)', marginTop: '4px' }}>
                  {breakEvenQty} {breakEvenQty === 1 ? 'Proyecto' : 'Proyectos'}
                </h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Meta de facturación mensual mínima para cubrir costos: <strong>${fixedCosts.toLocaleString()}</strong>
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
