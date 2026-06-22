// src/admin-screens/NuevoDiseno.jsx
import ProductDesigner from '../components/ProductDesigner.jsx';
import './Dashboard.css';

export default function NuevoDiseno({ setActiveTab }) {
  const handleTestDesign = (designData) => {
    alert(
      `Diseño de prueba listo:\n` +
      `· ${designData.layers.length} imagen(es)\n` +
      `· Prenda: ${designData.product?.title}\n` +
      `· Color: ${designData.color?.label}\n\n` +
      `Usá "Guardar diseño" en la web pública para enviarlo a un cliente real.`
    );
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Laboratorio: Nuevo Diseño Manual</h2>
          <p>Probá estampados, colores y posiciones antes de pasarlos a producción.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-outline" onClick={() => setActiveTab('dashboard')}>
            ← Volver al dashboard
          </button>
        </div>
      </div>

      <div className="table-container" style={{ padding: '24px', overflow: 'hidden' }}>
        <ProductDesigner onFinalizeDesign={handleTestDesign} />
      </div>
    </>
  );
}
