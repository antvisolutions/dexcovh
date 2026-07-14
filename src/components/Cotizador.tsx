import React, { useState } from 'react';
import { Printer, Sparkles } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface Rangos {
  [key: string]: [number, number];
}

interface CotizadorProps {
  currentUser?: { nombre: string; isAdmin: boolean };
}

export const Cotizador: React.FC<CotizadorProps> = ({ currentUser }) => {
  const [mode, setMode] = useState<'context' | 'manual'>('context');
  
  // Wizard Step State
  const [step, setStep] = useState(1);

  // 1. Simplified Context Form States (IA)
  const [ctxEmpresa, setCtxEmpresa] = useState('');
  const [ctxDescripcion, setCtxDescripcion] = useState('');
  const [ctxPresupuesto, setCtxPresupuesto] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);
  const [aiProposalText, setAiProposalText] = useState('');
  const [showAIPrintPreview, setShowAIPrintPreview] = useState(false);

  // 2. Advanced Manual Form States
  const [nomCliente, setNomCliente] = useState('');
  const [giro, setGiro] = useState('');
  const [paquete, setPaquete] = useState('LANDING PAGE / SITIO WEB');
  const [precioPaquete, setPrecioPaquete] = useState('1800');
  const [tipoDominio, setTipoDominio] = useState('Personalizado (.com/.net)');
  const [domPrecio, setDomPrecio] = useState('350');
  const [addCorreos, setAddCorreos] = useState(false);
  const [addIdioma, setAddIdioma] = useState(false);
  const [addEcommerce, setAddEcommerce] = useState(false);
  const [addExpress, setAddExpress] = useState(false);
  const [precioExpress, setPrecioExpress] = useState('1500');
  const [tiempoEntrega, setTiempoEntrega] = useState('15 a 21 días naturales');
  const [tipoMantenimiento, setTipoMantenimiento] = useState('Póliza Completa ($150/mes)');
  const [descuento, setDescuento] = useState('0');
  const [notas, setNotas] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const rangosPaquetes: Rangos = {
    'LANDING PAGE / SITIO WEB': [1800, 2500],
    'SISTEMA OPERATIVO / TOOLS': [1200, 3500],
    'DESARROLLO DE SOFTWARE A MEDIDA': [3800, 7500],
    'APLICACIÓN MÓVIL (iOS & Android)': [5500, 12000],
    'E-COMMERCE / TIENDA CLOUD': [6500, 9500],
    'SISTEMA ENTERPRISE / ERP': [0, 9999999],
  };

  const getSubtotal = () => {
    const base = parseFloat(precioPaquete) || 0;
    
    let dom = 0;
    if (tipoDominio === 'Personalizado (.com/.net)') {
      dom = parseFloat(domPrecio) || 0;
    } else if (tipoDominio === 'Económico (.online, .xyz)') {
      dom = 50;
    }

    let extra = 0;
    if (addCorreos) extra += 800;
    if (addIdioma) extra += 1500;
    if (addEcommerce && paquete !== 'E-COMMERCE / TIENDA CLOUD') extra += 2500;
    if (addExpress) extra += parseFloat(precioExpress) || 0;

    return base + dom + extra;
  };

  // Calculations
  const subtotal = getSubtotal();
  const descPercent = parseFloat(descuento) || 0;
  const dineroDescuento = subtotal * (descPercent / 100);
  const total = subtotal - dineroDescuento;
  const anticipo = total / 2;
  const restante = total - anticipo;

  const handleGeneratePdf = (e: React.FormEvent) => {
    e.preventDefault();
    const base = parseFloat(precioPaquete) || 0;
    const [min, max] = rangosPaquetes[paquete];

    if (paquete !== 'SISTEMA ENTERPRISE / ERP' && (base < min || base > max)) {
      alert(`Error: El precio de ${paquete} debe estar entre $${min} y $${max} MXN/USD.`);
      return;
    }

    setShowPrintPreview(true);
  };

  const handleGenerateAIProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctxEmpresa || !ctxDescripcion || !ctxPresupuesto) return;

    setLoadingIA(true);
    setAiProposalText('');

    const apiKey = 'AIzaSyAHMlIgS4eObu1TN_-crpqGscaEvZ6CnbE';
    const prompt = `
      Actúa como el Consultor Principal de Tecnología en "Dexcov" (Agencia de Desarrollo de Software a Medida).
      El cliente no tiene conocimientos técnicos sobre software. Solo nos ha proporcionado el contexto de su negocio, su método de trabajo y su presupuesto.
      
      Debes redactar una PROPUESTA COMERCIAL FORMAL, detallando la solución tecnológica idónea para sus necesidades, utilizando un lenguaje claro, profesional y no técnico, estructurado para impresión formal.
      
      PROHIBICIÓN ESTRICTA: NO utilices ningún tipo de emojis o caracteres especiales decorativos bajo ninguna circunstancia. El tono debe ser formal, serio, corporativo y técnico pero entendible.
      
      Datos del cliente:
      - Empresa / Negocio: ${ctxEmpresa}
      - Contexto de trabajo y necesidad: ${ctxDescripcion}
      - Presupuesto aproximado: $${ctxPresupuesto} MXN/USD
      
      La respuesta debe tener la siguiente estructura de impresión formal:
      
      1. PROPUESTA DE SOLUCIÓN:
         (Describe de manera profesional qué sistema de software se desarrollará para optimizar su forma de trabajar, justificando técnicamente la solución de forma clara).
         
      2. COMPONENTES Y MÓDULOS DEL SISTEMA:
         (Lista de 3 a 5 módulos funcionales clave del sistema detallados de forma clara y formal).
         
      3. DESGLOSE DE INVERSIÓN:
         (Establece un precio de desarrollo a medida acorde a su presupuesto de $${ctxPresupuesto}, indicando un esquema de facturación formal de anticipo del 50% para inicio de actividades y 50% al término).
         
      4. TIEMPO ESTIMADO DE ENTREGA:
         (Establece un tiempo de entrega formal en días naturales).
         
      Reglas:
      - No uses tecnicismos innecesarios pero mantén una redacción formal de ingeniería.
      - Escribe la propuesta completamente en español formal de México.
      - Ve directo al texto de la propuesta, sin mensajes introductorios ni de despedida.
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar la propuesta comercial.';
      setAiProposalText(text.trim());
      setShowAIPrintPreview(true);
    } catch (err) {
      console.error(err);
      alert('Error de red al conectar con el servidor de inteligencia artificial.');
    } finally {
      setLoadingIA(false);
    }
  };

  const handleSendAIRequest = async () => {
    try {
      const parsedBudget = parseFloat(ctxPresupuesto.replace(/[^0-9.]/g, '')) || 0;
      
      const { error } = await supabase.from('solicitudes_proyecto').insert({
        lead_id: null,
        nombre_cliente: ctxEmpresa,
        tel_cliente: '',
        precio_total: parsedBudget,
        tipo_pago: 'Anticipo 50%',
        metodo_pago: 'Transferencia',
        dominio: 'GitHub',
        paquete: '3. SOFTWARE A MEDIDA',
        pidio_mantenimiento: false,
        creado_por: currentUser?.nombre || 'Cotizador IA',
        descripcion_proyecto: `Propuesta de solución generada por IA:\n\n${aiProposalText}`,
        estatus: 'Pendiente'
      });

      if (error) throw error;

      await supabase.from('actividades').insert({
        texto: `envió una solicitud de proyecto para "${ctxEmpresa}" desde el Cotizador de contexto`,
        tipo: 'lead',
        autor: currentUser?.nombre || 'Cotizador IA'
      });

      alert('Solicitud de proyecto enviada al administrador con éxito.');
    } catch (err: any) {
      console.error(err);
      alert(`Error al enviar solicitud: ${err.message}`);
    }
  };

  const handleSendManualRequest = async () => {
    try {
      const { error } = await supabase.from('solicitudes_proyecto').insert({
        lead_id: null,
        nombre_cliente: nomCliente || 'Cliente Especial',
        tel_cliente: '',
        precio_total: total,
        tipo_pago: 'Anticipo 50%',
        metodo_pago: 'Transferencia',
        dominio: tipoDominio,
        paquete: paquete,
        pidio_mantenimiento: tipoMantenimiento !== 'Sin Mantenimiento (15 días garantía)',
        creado_por: currentUser?.nombre || 'Cotizador Manual',
        descripcion_proyecto: `Cotización manual generada. Nota: ${notas || 'Ninguna'}`,
        estatus: 'Pendiente'
      });

      if (error) throw error;

      await supabase.from('actividades').insert({
        texto: `envió una solicitud de proyecto para "${nomCliente || 'Cliente Especial'}" desde el Cotizador manual`,
        tipo: 'lead',
        autor: currentUser?.nombre || 'Cotizador Manual'
      });

      alert('Solicitud de proyecto enviada al administrador con éxito.');
    } catch (err: any) {
      console.error(err);
      alert(`Error al enviar solicitud: ${err.message}`);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  // Print Preview for AI Context Proposal
  if (showAIPrintPreview) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', justifyContent: 'flex-end' }} className="no-print">
          <button onClick={() => setShowAIPrintPreview(false)} className="btn-secondary">Volver a la edición</button>
          <button onClick={handleSendAIRequest} className="btn-primary" style={{ background: '#10b981', color: '#fff' }}>
            Enviar como Solicitud de Proyecto
          </button>
          <button onClick={triggerPrint} className="btn-primary">
            <Printer size={16} />
            Imprimir o guardar PDF
          </button>
        </div>

        <div id="print-area" style={{
          background: '#ffffff',
          color: '#1f2937',
          padding: '40px',
          borderRadius: '8px',
          fontFamily: 'sans-serif',
          lineHeight: '1.6',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #00d2ff', paddingBottom: '20px', marginBottom: '24px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', color: '#090d16', fontWeight: 800 }}>DEXCOV</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#4b5563' }}>Desarrollo de Software y Sistemas de Ingeniería</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#2563eb' }}>www.dexcov.com</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#1f2937', fontWeight: 700 }}>PROPUESTA DE SOFTWARE</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Fecha: {new Date().toLocaleDateString('es-MX')}</p>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Preparado Para:</span>
            <h3 style={{ margin: '4px 0 16px 0', fontSize: '20px', color: '#111827', fontWeight: 700 }}>{ctxEmpresa.toUpperCase()}</h3>
          </div>

          <div style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: '#374151' }}>
            {aiProposalText}
          </div>

          <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '9px', color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
            Términos de la propuesta: Anticipo del 50% al inicio del proyecto y 50% restante a la entrega y liberación del software.
            <div style={{ marginTop: '4px', fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold' }}>contacto@dexcov.com</div>
          </div>
        </div>

        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-area, #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              border: none;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      </div>
    );
  }

  // Print Preview for Manual Quote
  if (showPrintPreview) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', justifyContent: 'flex-end' }} className="no-print">
          <button onClick={() => setShowPrintPreview(false)} className="btn-secondary">Volver a la edición</button>
          <button onClick={handleSendManualRequest} className="btn-primary" style={{ background: '#10b981', color: '#fff' }}>
            Enviar como Solicitud de Proyecto
          </button>
          <button onClick={triggerPrint} className="btn-primary">
            <Printer size={16} />
            Imprimir o guardar PDF
          </button>
        </div>

        <div id="print-area" style={{
          background: '#ffffff',
          color: '#1f2937',
          padding: '40px',
          borderRadius: '8px',
          fontFamily: 'sans-serif',
          lineHeight: '1.5',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #00d2ff', paddingBottom: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', color: '#090d16', fontWeight: 800 }}>DEXCOV</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#4b5563' }}>Desarrollo de Software y Sistemas de Ingeniería</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#2563eb' }}>www.dexcov.com</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#1f2937', fontWeight: 700 }}>COTIZACIÓN</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Fecha: {new Date().toLocaleDateString('es-MX')}</p>
            </div>
          </div>

          <div style={{ margin: '24px 0' }}>
            <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Preparado Para:</span>
            <h3 style={{ margin: '4px 0', fontSize: '18px', color: '#111827', fontWeight: 700 }}>{nomCliente.toUpperCase() || 'CLIENTE ESPECIAL'}</h3>
            {giro && <p style={{ margin: 0, fontSize: '12px', color: '#4b5563' }}>Sector: {giro}</p>}
          </div>

          <h4 style={{ fontSize: '14px', margin: '0 0 8px 0', fontWeight: 'bold', color: '#374151' }}>DESGLOSE DE INVERSIÓN:</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #d1d5db' }}>
                <th style={{ textAlign: 'left', padding: '10px', fontWeight: 'bold' }}>Concepto / Descripción</th>
                <th style={{ textAlign: 'right', padding: '10px', fontWeight: 'bold', width: '120px' }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 10px' }}>
                  <strong>Proyecto: {paquete}</strong>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Incluye análisis de requerimientos, diseño de base de datos, programación responsiva y desarrollo a medida.</div>
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'right' }}>${(parseFloat(precioPaquete) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
              </tr>

              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 10px' }}>
                  Configuración de Hosting / Dominio: {tipoDominio}
                  {tipoDominio !== 'Dexcov (Gratis con GitHub)' && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>(Suscripción de pago anual)</div>}
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                  ${(tipoDominio === 'Personalizado (.com/.net)' ? (parseFloat(domPrecio) || 0) : tipoDominio === 'Económico (.online, .xyz)' ? 50 : 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {addCorreos && (
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 10px' }}>Correos Corporativos / Cuentas GSuite (Buzones configurados con nombre de dominio)</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>$800.00</td>
                </tr>
              )}

              {addIdioma && (
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 10px' }}>Localización / Multilingüe (Estructura preparada para múltiples idiomas o mercados)</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>$1,500.00</td>
                </tr>
              )}

              {addEcommerce && paquete !== 'E-COMMERCE / TIENDA CLOUD' && (
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 10px' }}>Módulo de Pasarela de Pagos (Integración con Stripe, PayPal o MercadoPago)</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>$2,500.00</td>
                </tr>
              )}

              {addExpress && (
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 10px' }}>Servicio de Entrega Express (Asignación exclusiva y prioritaria del equipo)</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>${(parseFloat(precioExpress) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                </tr>
              )}

              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 10px' }}>
                  Mantenimiento y Soporte del Sistema
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                    {tipoMantenimiento === 'Póliza Completa ($150/mes)' ? 'Soporte técnico integral, copias de seguridad semanales y monitoreo de servidores.' : 
                     tipoMantenimiento === '1 Year Free (Backups & minor adjustments)' || tipoMantenimiento === '1 Año Gratis (Backups y menores)' ? 'Incluye respaldos y ajustes de código menores sin costo.' : 
                     'Garantía básica contra bugs.'}
                  </div>
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                  {tipoMantenimiento === 'Póliza Completa ($150/mes)' ? '$150.00 / mes' : '$0.00'}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', textAlign: 'right', marginBottom: '24px' }}>
            <div style={{ width: '320px', fontSize: '13px' }}>
              {descPercent > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#6b7280' }}>
                    <span>Subtotal:</span>
                    <span>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#16a34a', fontWeight: 'bold' }}>
                    <span>Descuento ({descPercent}%):</span>
                    <span>-${dineroDescuento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #e5e7eb', fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                <span>INVERSIÓN TOTAL:</span>
                <span>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#0284c7', fontWeight: 'bold' }}>
                <span>Anticipo 50% (Para iniciar):</span>
                <span>${anticipo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#0284c7', fontWeight: 'bold' }}>
                <span>Saldo 50% (A la entrega):</span>
                <span>${restante.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {notas && (
            <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '6px', fontSize: '11px', color: '#92400e', marginBottom: '24px' }}>
              <strong>Nota Especial:</strong>
              <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{notas}</div>
            </div>
          )}

          <div style={{ fontSize: '11px', color: '#4b5563', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            <strong>Tiempos de Entrega:</strong>
            <p style={{ margin: '4px 0 0 0' }}>El tiempo estimado para presentar la primera versión funcional es de <strong>{tiempoEntrega}</strong> a partir del pago del anticipo y la recepción de requerimientos iniciales.</p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '9px', color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
            Condiciones: La publicación final del sistema y entrega de accesos se realiza tras liquidar el saldo. Vigencia de cotización: 15 días.
            <div style={{ marginTop: '4px', fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold' }}>contacto@dexcov.com</div>
          </div>
        </div>

        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-area, #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              border: none;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px' }} className="mobile-padding-reduction">
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Cotizador de Proyectos
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Estructura cotizaciones rápidas basadas en contexto B2B o configura desgloses manuales.
          </p>
        </div>

        {/* Tab mode selection switcher */}
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '4px' }}>
          <button 
            onClick={() => setMode('context')} 
            className="glow-transition"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              background: mode === 'context' ? 'var(--color-cyan)' : 'transparent',
              color: mode === 'context' ? '#060810' : 'var(--text-secondary)'
            }}
          >
            Por Contexto (IA)
          </button>
          <button 
            onClick={() => { setMode('manual'); setStep(1); }} 
            className="glow-transition"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              background: mode === 'manual' ? 'var(--color-cyan)' : 'transparent',
              color: mode === 'manual' ? '#060810' : 'var(--text-secondary)'
            }}
          >
            Desglose Manual
          </button>
        </div>
      </div>

      {mode === 'context' ? (
        /* Simplified Context Form (AI) */
        <form onSubmit={handleGenerateAIProposal} className="glass-panel animate-fade-in" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} />
            Estructuración Inteligente de Propuestas
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Nombre de la Empresa o Cliente</label>
            <input 
              type="text" 
              value={ctxEmpresa} 
              onChange={(e) => setCtxEmpresa(e.target.value)} 
              placeholder="Ej. Boutique Maria / Ferretería Central" 
              className="glass-input" 
              required 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>¿Qué hace el negocio y qué sistema necesita?</label>
            <textarea 
              value={ctxDescripcion} 
              onChange={(e) => setCtxDescripcion(e.target.value)} 
              placeholder="Describe detalladamente su forma de operar, sus puntos de dolor actuales (ej. lleva sus cuentas en papel) y lo que requiere automatizar. La IA propondrá los módulos ideales." 
              className="glass-input" 
              style={{ minHeight: '120px', resize: 'vertical' }}
              required 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '50%' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Presupuesto Estimado ($)</label>
            <input 
              type="text" 
              value={ctxPresupuesto} 
              onChange={(e) => setCtxPresupuesto(e.target.value)} 
              placeholder="Ej. 6000 USD / 90000 MXN" 
              className="glass-input" 
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: 'fit-content', marginTop: '10px' }}
            disabled={loadingIA}
          >
            {loadingIA ? (
              <>
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(6,8,16,0.2)', borderTopColor: '#060810', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: '8px' }}></div>
                Analizando contexto y estructurando propuesta...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generar propuesta formal
              </>
            )}
          </button>
        </form>
      ) : (
        /* Advanced 4-Step Wizard Form */
        <div className="glass-panel animate-fade-in" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Step Progress Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
            <span style={{ color: step === 1 ? 'var(--color-cyan)' : 'inherit' }}>1. Datos de Cliente</span>
            <span style={{ color: step === 2 ? 'var(--color-cyan)' : 'inherit' }}>2. Configuración de Software</span>
            <span style={{ color: step === 3 ? 'var(--color-cyan)' : 'inherit' }}>3. Opciones & Extras</span>
            <span style={{ color: step === 4 ? 'var(--color-cyan)' : 'inherit' }}>4. Resumen & Totales</span>
          </div>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-cyan)' }}>Paso 1: Datos del Cliente</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Empresa / Cliente</label>
                  <input 
                    type="text" 
                    value={nomCliente} 
                    onChange={(e) => setNomCliente(e.target.value)} 
                    placeholder="Ej. Distribuidora Gómez" 
                    className="glass-input" 
                    required 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Giro Comercial (Sector)</label>
                  <input 
                    type="text" 
                    value={giro} 
                    onChange={(e) => setGiro(e.target.value)} 
                    placeholder="Ej. Logística / Transporte" 
                    className="glass-input" 
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-cyan)' }}>Paso 2: Configuración del Sistema</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Paquete Base</label>
                  <select 
                    value={paquete} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setPaquete(val);
                      if (val !== 'SISTEMA ENTERPRISE / ERP') {
                        setPrecioPaquete(String(rangosPaquetes[val][0]));
                      }
                    }} 
                    className="glass-input"
                    style={{ background: '#0c1020' }}
                  >
                    {Object.keys(rangosPaquetes).map(pkg => (
                      <option key={pkg} value={pkg}>{pkg}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Precio del Paquete ($)</label>
                  <input 
                    type="number" 
                    value={precioPaquete} 
                    onChange={(e) => setPrecioPaquete(e.target.value)} 
                    className="glass-input" 
                    required 
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Dominio / Host</label>
                    <select value={tipoDominio} onChange={(e) => setTipoDominio(e.target.value)} className="glass-input" style={{ background: '#0c1020' }}>
                      <option value="Personalizado (.com/.net)">Personalizado (.com/.net)</option>
                      <option value="Dexcov (Gratis con GitHub)">Dexcov (Gratis con GitHub)</option>
                      <option value="Económico (.online, .xyz)">Económico (.online, .xyz)</option>
                    </select>
                  </div>
                  {tipoDominio === 'Personalizado (.com/.net)' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Costo Hosting Anual ($)</label>
                      <input type="number" value={domPrecio} onChange={(e) => setDomPrecio(e.target.value)} className="glass-input" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-cyan)' }}>Paso 3: Opciones y Módulos Extra</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input type="checkbox" checked={addCorreos} onChange={(e) => setAddCorreos(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-cyan)' }} />
                    Correos Corporativos (+$800)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input type="checkbox" checked={addIdioma} onChange={(e) => setAddIdioma(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-cyan)' }} />
                    Sistema Bilingüe (+$1,500)
                  </label>
                  {paquete !== 'E-COMMERCE / TIENDA CLOUD' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                      <input type="checkbox" checked={addEcommerce} onChange={(e) => setAddEcommerce(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-cyan)' }} />
                      Pasarela Stripe/MercadoPago (+$2,500)
                    </label>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input type="checkbox" checked={addExpress} onChange={(e) => setAddExpress(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-cyan)' }} />
                    Servicio de Entrega Express
                  </label>
                </div>
                
                {addExpress && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '50%' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Costo Express ($)</label>
                    <input type="number" value={precioExpress} onChange={(e) => setPrecioExpress(e.target.value)} className="glass-input" />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-cyan)' }}>Paso 4: Resumen de Inversión y Cierre</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Esquema de Mantenimiento</label>
                    <select value={tipoMantenimiento} onChange={(e) => setTipoMantenimiento(e.target.value)} className="glass-input" style={{ background: '#0c1020' }}>
                      <option value="Póliza Completa ($150/mes)">Póliza Completa ($150/mes)</option>
                      <option value="1 Año Gratis (Backups y menores)">1 Año Gratis (Backups y menores)</option>
                      <option value="Sin Mantenimiento (15 días garantía)">Sin Mantenimiento (15 días garantía)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tiempo Estimado de Entrega</label>
                    <input type="text" value={tiempoEntrega} onChange={(e) => setTiempoEntrega(e.target.value)} className="glass-input" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Descuento Aplicable (%)</label>
                    <input type="number" value={descuento} onChange={(e) => setDescuento(e.target.value)} className="glass-input" min="0" max="100" />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Nota Especial</label>
                  <textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="glass-input" style={{ height: '70px', resize: 'none' }} placeholder="Opcional..." />
                </div>
              </div>
            </div>
          )}

          {/* Wizard Buttons Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '16px' }}>
            <button
              onClick={() => setStep(prev => Math.max(1, prev - 1))}
              className="btn-secondary"
              disabled={step === 1}
              style={{ opacity: step === 1 ? 0.4 : 1 }}
            >
              Anterior
            </button>
            
            {step < 4 ? (
              <button onClick={() => setStep(prev => Math.min(4, prev + 1))} className="btn-primary">
                Siguiente
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ marginRight: '16px', textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Total Inversión:</span>
                  <strong style={{ fontSize: '16px', color: 'var(--color-cyan)' }}>${total.toLocaleString('es-MX')}</strong>
                </div>
                <button onClick={handleGeneratePdf} className="btn-primary">
                  Generar Cotización
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Spinner Spin Animation Style */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
