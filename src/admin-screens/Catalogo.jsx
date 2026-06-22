// src/admin-screens/Catalogo.jsx
import { useState, useEffect } from 'react';

export default function Catalogo() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CORRECCIÓN: Apuntamos a la ruta real y validamos que sea un array
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          console.error('El formato recibido no es correcto:', data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Catálogo & Precios</h2>
          <p>Administración directa de los productos mapeados automáticamente en la Landing pública.</p>
        </div>
      </div>
      
      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px' }}>Cargando catálogo...</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ARTÍCULO</th>
                <th style={{ textAlign: 'center' }}>CATEGORÍA</th>
                <th style={{ textAlign: 'center' }}>STOCK</th>
                <th style={{ textAlign: 'center' }}>PRECIO</th>
                <th style={{ textAlign: 'center' }}>OFERTA</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong><br/>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{item.description}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.category}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.stock || '-'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#94a3b8' }}>{item.price}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#000' }}>{item.promo_price || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}