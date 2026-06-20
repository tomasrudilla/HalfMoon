// src/components/Modal.jsx
import './Modal.css';

export default function Modal({ isOpen, onClose, children, title }) {
  // Si no está abierto, no renderizamos nada
  if (!isOpen) return null;

  return (
    // Cerrar si hacen clic en el fondo oscuro
    <div className="modal-overlay" onClick={onClose}>
      {/* Detener la propagación del clic para que no cierre si tocan el contenido */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        
        {title && (
          <div className="modal-header">
            <h3>{title}</h3>
          </div>
        )}
        
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}