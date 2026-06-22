import { useState } from 'react';
import Modal from './Modal.jsx';
import './DesignUploadModal.css';

export default function DesignUploadModal({ isOpen, onClose, onSubmit, isSubmitting, productTitle }) {
  const [formData, setFormData] = useState({ nombre: '', telefono: '', email: '' });

  const resetForm = () => setFormData({ nombre: '', telefono: '', email: '' });

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
          <span className="design-modal-badge">Último paso</span>
          <h2 className="design-modal-title">Guardá tu diseño</h2>
          <p className="design-modal-subtitle">
            {productTitle
              ? <>Tu diseño en <strong>{productTitle}</strong> está listo. Te descargamos el PNG y te lo enviamos por email.</>
              : 'Dejanos tus datos: descargamos el PNG y te lo mandamos por correo.'}
          </p>
        </div>

        <form className="design-modal-form" onSubmit={handleSubmit}>
          <div className="design-modal-fields">
            <div className="design-field">
              <label htmlFor="nombre">Nombre y Apellido *</label>
              <input
                id="nombre"
                type="text"
                placeholder="Ej: Martín Sejas"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div className="design-field-row">
              <div className="design-field">
                <label htmlFor="telefono">WhatsApp *</label>
                <input
                  id="telefono"
                  type="tel"
                  placeholder="+54 9 11 1234-5678"
                  required
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div className="design-field">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  placeholder="hola@correo.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="design-modal-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Confirmar y enviar diseño →'}
          </button>
        </form>
      </div>
    </Modal>
  );
}
