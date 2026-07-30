// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Admin from "./Admin.jsx";
import Login from "./auth/Login.jsx";
import Register from "./auth/Register.jsx";
import ProductDesigner from "./components/ProductDesigner.jsx";
import DesignUploadModal from "./components/DesignUploadModal.jsx";
import ServicesSection from "./components/ServicesSection.jsx";
import WorksSection from "./components/WorksSection.jsx";
import ClientsSection from "./components/ClientsSection.jsx";
import AboutFaqSection from "./components/AboutFaqSection.jsx";
import PublicLayout from "./layouts/PublicLayout.jsx";
import CatalogPage from "./pages/CatalogPage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import SeoHead from "./seo/SeoHead.jsx";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from "./seo/siteConfig.js";
import { useSettings } from "./context/SettingsContext.jsx";
import { buildWhatsAppUrl } from "./utils/whatsapp.js";
import { exportDesignToPng, downloadDataUrl } from "./utils/exportDesignPng.js";
import './App.css';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function LandingPage() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('save'); // 'save' | 'quote'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDesign, setPendingDesign] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [successType, setSuccessType] = useState('save');
  const { settings } = useSettings();
  const mayoristaWpp = buildWhatsAppUrl(
    settings.whatsapp_number,
    'Hola! Quiero consultar por presupuesto mayorista'
  );

  const handleFinalizeDesign = (designData) => {
    setPendingDesign(designData);
    setModalMode('save');
    setIsContactModalOpen(true);
  };

  const handleRequestQuote = (designData) => {
    setPendingDesign(designData);
    setModalMode('quote');
    setIsContactModalOpen(true);
  };

  const submitDesign = async (contactData, isQuote) => {
    if (!pendingDesign) return;
    setIsSubmitting(true);
    setUploadSuccess(false);

    try {
      const { layers, product, color, view } = pendingDesign;

      const layersPayload = await Promise.all(
        layers.map(async (layer, i) => ({
          index: i + 1,
          fileName: layer.file.name,
          logoData: await fileToBase64(layer.file),
          transform: {
            x: layer.x,
            y: layer.y,
            width: layer.width,
            rotation: layer.rotation,
            scaleX: layer.scaleX,
          },
        }))
      );

      const designPayload = {
        comment: `${layers.length} imagen${layers.length > 1 ? 'es' : ''} · ${product?.title || 'Remera + Estampado'}`,
        layers: layersPayload,
        view,
        color: color.id,
        productId: product?.id,
      };

      const leadRes = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: contactData.nombre,
          telefono: contactData.telefono,
          email: contactData.email,
        }),
      });

      if (!leadRes.ok) throw new Error('No se pudo guardar el contacto');
      const { leadId } = await leadRes.json();

      const designRes = await fetch('/api/canvas-designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          product: product?.title || 'Remera + Estampado',
          bgColor: color.hex,
          customerComment: JSON.stringify(designPayload),
          logoData: layersPayload[0]?.logoData,
        }),
      });

      if (!designRes.ok) throw new Error('No se pudo guardar el diseño');
      const { designId } = await designRes.json();

      if (isQuote) {
        await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_id: leadId,
            design_id: designId,
            quantity: contactData.cantidad || 1,
            product_type: product?.title || 'Remera + Estampado',
            color: color?.label || color?.id,
            notes: contactData.notas || '',
          }),
        });
      }

      let pngBase64 = null;
      if (!isQuote) {
        try {
          pngBase64 = await exportDesignToPng({
            mockupSrc: pendingDesign.mockupSrc,
            layers: pendingDesign.layers,
          });
          downloadDataUrl(pngBase64, `halfmoon-${contactData.nombre || 'diseno'}.png`);
        } catch (exportErr) {
          console.warn('No se pudo exportar PNG:', exportErr);
        }

        if (contactData.email && pngBase64) {
          await fetch('/api/send-design-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName: contactData.nombre,
              customerEmail: contactData.email,
              productTitle: product?.title || 'Remera + Estampado',
              pngBase64,
            }),
          });
        }
      }

      setIsContactModalOpen(false);
      setPendingDesign(null);
      setSuccessType(isQuote ? 'quote' : 'save');
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 6000);
    } catch (error) {
      console.error("Error guardando diseño:", error);
      alert('Hubo un error al guardar. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactSubmit = async (contactData) => {
    await submitDesign(contactData, modalMode === 'quote');
  };

  const scrollToCustomizer = () => {
    document.getElementById('personalizar')?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (window.location.hash === '#personalizar') {
      setTimeout(scrollToCustomizer, 150);
    }
  }, []);

  return (
    <>
      <SeoHead title={DEFAULT_TITLE} description={DEFAULT_DESCRIPTION} path="/" />
      <main>
        <section id="inicio" className="hero-section hero-section-banner">
          <div className="hero-overlay" />
          <div className="hero-content">
            <span className="hero-badge">Indumentaria · Córdoba</span>
            <h1 className="hero-title">
              BIENVENIDO A LA<br /><span className="text-highlight">FAMILIA HALFMOON</span>
            </h1>
            <p className="hero-lead">
              Remeras, buzos y estampados personalizados en Córdoba. Tu estilo, tu marca, tu prenda.
            </p>
            <div className="hero-tags">
              <span>Minorista</span>
              <span>Mayorista</span>
              <span>Personalizados</span>
            </div>
            <div className="hero-actions">
              <button type="button" onClick={scrollToCustomizer} className="hero-btn-primary">
                Diseñá tu prenda
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
              <a
                href={mayoristaWpp}
                target="_blank"
                rel="noreferrer"
                className="hero-btn-secondary"
              >
                Presupuesto mayorista
              </a>
            </div>
          </div>
        </section>

        <ServicesSection />
        <WorksSection />
        <ClientsSection />

        <section id="personalizar" className="customizer-section customizer-section-full">
          <div className="customizer-full-header">
            <h2>Personalizador HalfMoon</h2>
            <p>Subí tus logos, movelos por toda la prenda y guardá el diseño</p>
          </div>

          {uploadSuccess && (
            <div className="upload-toast">
              ✓ {successType === 'quote'
                ? 'Presupuesto solicitado. Te contactamos en hasta 3 días hábiles.'
                : 'Diseño guardado y descargado. Te enviamos una copia por email.'}
            </div>
          )}

          <div className="customizer-designer-wrap">
            <ProductDesigner
              onFinalizeDesign={handleFinalizeDesign}
              onRequestQuote={handleRequestQuote}
            />
          </div>
        </section>

        <AboutFaqSection />
      </main>

      <DesignUploadModal
        isOpen={isContactModalOpen}
        onClose={() => { setIsContactModalOpen(false); setPendingDesign(null); }}
        onSubmit={handleContactSubmit}
        isSubmitting={isSubmitting}
        productTitle={pendingDesign?.product?.title}
        mode={modalMode}
        colorLabel={pendingDesign?.color?.label}
      />
    </>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/catalogo/:id" element={<ProductPage />} />
        </Route>
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={isAuthenticated ? <Admin /> : <Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
