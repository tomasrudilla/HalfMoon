// src/admin-screens/Leads.jsx
import { useState, useEffect } from 'react';

export default function Leads() {
  const [leadsList, setLeadsList] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/leads')
      .then(res => res.json())
      .then(data => setLeadsList(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Base de Datos de Clientes</h2>
          <p>Contactos consolidados de la web y registros comerciales.</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Directorio Completo</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ verticalAlign: 'middle' }}>CONTACTO</th>
              <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>TELÉFONO</th>
              <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>EMAIL</th>
              <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>ORIGEN</th>
              <th style={{ verticalAlign: 'middle', textAlign: 'center' }}>FECHA INGRESO</th>
            </tr>
          </thead>
          <tbody>
            {leadsList.map((lead) => (
              <tr key={lead.id}>
                <td style={{ verticalAlign: 'middle', fontWeight: 'bold' }}>{lead.full_name}</td>
                <td style={{ verticalAlign: 'middle', textAlign: 'center', color: '#64748b' }}>{lead.phone}</td>
                <td style={{ verticalAlign: 'middle', textAlign: 'center', color: '#64748b' }}>{lead.email || '—'}</td>
                <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>{lead.origin}</td>
                <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>{new Date(lead.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}