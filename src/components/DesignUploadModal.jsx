import { useState } from 'react';
import Modal from './Modal.jsx';
import './DesignUploadModal.css';

export default function DesignUploadModal({
  isOpen, onClose, onSubmit, isSubmitting, productTitle, mode = 'save', colorLabel,
}) {
  const isQuote = mode === 'quote';
  const [formData, setFormData] = useState({
    nombre: '', telefono: '', email: '', cantidad: 1, notas: '',
  });

  const resetForm = () => setFormData({ nombre: '', telefono: '', email: '', cantidad: 1, notas: '' });

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
    resetForm();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="">
      <div className="design-modal">
        <div className="design-modal-header">
          <span className="design-modal-badge">{isQuote ? 'Presupuesto' : 'Último paso'}</span>
          <h2 className="design-modal-title">
            {isQuote ? 'Pedí tu presupuesto' : 'Guardá tu diseño'}
          </h2>
          <p className="design-modal-subtitle">
            {isQuote ? (
              <>Te contactamos en hasta <strong>3 días hábiles</strong> con un presupuesto personalizado. No se muestra precio automático.</>
            ) : productTitle ? (
              <>Tu diseño en <strong>{productTitle}</strong> está listo. Te descargamos el PNG y te lo enviamos por email.</>
            ) : (
              'Dejanos tus datos: descargamos el PNG y te lo mandamos por correo.'
            )}
          </p>
        </div>

        <form className="design-modal-form" onSubmit={handleSubmit}>
          <div className="design-modal-fields">
            <div className="design-field">
              <label htmlFor="nombre">Nombre y Apellido *</label>
              <input id="nombre" type="text" required value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
            </div>

            <div className="design-field-row">
              <div className="design-field">
                <label htmlFor="telefono">WhatsApp *</label>
                <input id="telefono" type="tel" required value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
              </div>
              <div className="design-field">
                <label htmlFor="email">Email {isQuote ? '' : '*'}</label>
                <input id="email" type="email" required={!isQuote} value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>

            {isQuote && (
              <>
                <div className="design-field-row">
                  <div className="design-field">
                    <label htmlFor="cantidad">Cantidad aproximada *</label>
                    <input id="cantidad" type="number" min="1" required value={formData.cantidad}
                      onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })} />
                  </div>
                  {colorLabel && (
                    <div className="design-field">
                      <label>Color elegido</label>
                      <input type="text" value={colorLabel} disabled />
                    </div>
                  )}
                </div>
                <div className="design-field">
                  <label htmlFor="notas">Notas adicionales</label>
                  <textarea id="notas" rows={2} value={formData.notas} placeholder="Talle, fechas, otras prendas..."
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })} />
                </div>
              </>
            )}
          </div>

          <button type="submit" className="design-modal-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando…' : isQuote ? 'Enviar solicitud de presupuesto →' : 'Confirmar y enviar diseño →'}
          </button>
        </form>
      </div>
    </Modal>
  );
}
