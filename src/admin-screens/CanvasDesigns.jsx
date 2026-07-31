// src/admin-screens/CanvasDesigns.jsx
import { useState, useEffect } from 'react';
import Modal from '../components/Modal.jsx';
import CanvasDesignPreview, { parseCanvasDesign } from '../components/CanvasDesignPreview.jsx';
import './Dashboard.css';

export default function CanvasDesigns() {
  const [designs, setDesigns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch('/api/canvas-designs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDesigns(data);
      })
      .catch(err => console.error(err));
  }, []);

  const selectedParsed = selected ? parseCanvasDesign(selected.customer_comment) : null;

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Galería de Diseños Canvas (Todos)</h2>
          <p>Monitoreo visual de personalizaciones armadas por la comunidad.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {designs.map((design) => (
          <div key={design.id} className="table-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <CanvasDesignPreview
              customerComment={design.customer_comment}
              productTitle={design.product_title}
              bgColor={design.bg_color || '#f1f5f9'}
              variant="card"
            />
            <div style={{ marginTop: '15px', marginBottom: 'auto' }}>
              <span className={`design-origin design-origin--${design.origin === 'quote' ? 'quote' : 'save'}`}>
                {design.origin === 'quote' ? 'Pidió presupuesto' : 'Solo guardado'}
              </span>
              <p style={{ color: '#64748b', fontSize: '12px', margin: '10px 0 3px 0' }}>Diseño de:</p>
              <h4 style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '16px', color: '#000' }}>{design.creator}</h4>
              <p style={{ color: '#1e293b', fontSize: '14px', margin: '0 0 15px 0' }}>{design.product_title}</p>
            </div>
            <button className="btn-outline" style={{ width: '100%' }} onClick={() => { setSelected(design); setIsOpen(true); }}>
              Ver Detalles completos
            </button>
          </div>
        ))}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Diseño de ${selected?.creator}`}>
        {selected && selectedParsed && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#64748b', marginBottom: '15px' }}>
              Prenda base: <strong>{selected.product_title}</strong>
              {selectedParsed.color && <> · Color: <strong>{selectedParsed.color}</strong></>}
            </p>

            <CanvasDesignPreview
              customerComment={selected.customer_comment}
              productTitle={selected.product_title}
              bgColor={selected.bg_color || '#f1f5f9'}
              variant="modal"
            />

            <div style={{ textAlign: 'left', background: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#000', marginTop: '16px' }}>
              <strong>Resumen del diseño:</strong>
              <p style={{ margin: '8px 0 0 0', color: '#334155' }}>{selectedParsed.comment}</p>
              {selectedParsed.layers.length > 0 && (
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  {selectedParsed.layers.length} archivo{selectedParsed.layers.length > 1 ? 's' : ''}:{' '}
                  {selectedParsed.layers.map((l) => l.fileName).join(', ')}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
