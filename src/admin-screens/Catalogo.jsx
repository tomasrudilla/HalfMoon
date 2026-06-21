// src/admin-screens/Catalogo.jsx
import { useState, useEffect } from 'react';

export default function Catalogo() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch('/api/catalogo')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Catálogo & Precios</h2>
          <p>Administración directa de los productos mapeados automáticamente en la Landing pública.</p>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ARTÍCULO</th>
              <th style={{ textAlign: 'center' }}>CATEGORÍA</th>
              <th style={{ textAlign: 'center' }}>STOCK</th>
              <th style={{ textAlign: 'center' }}>PRECIO MINORISTA</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.title}</strong><br/><span style={{ fontSize: '12px', color: '#64748b' }}>{item.description}</span></td>
                <td style={{ textAlign: 'center' }}>{item.category}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.stock}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#000' }}>{item.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}