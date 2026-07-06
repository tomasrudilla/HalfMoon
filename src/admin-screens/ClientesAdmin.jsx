import ContentAdmin from './ContentAdmin.jsx';

const EMPTY = { name: '', logo_url: '', sort_order: 0, is_active: true };

export default function ClientesAdmin() {
  return (
    <ContentAdmin
      apiPath="clientes"
      title="Nuestros Clientes"
      subtitle="Logos de marcas que confían en HalfMoon."
      emptyForm={EMPTY}
      fields={[
        { key: 'name', label: 'Nombre marca', required: true },
        { key: 'logo_url', label: 'Logo', type: 'image', required: true },
        { key: 'sort_order', label: 'Orden', type: 'number' },
      ]}
      renderCard={(item) => (
        <div style={{ padding: 20, textAlign: 'center', minHeight: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <img src={item.logo_url} alt={item.name} style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }} />
          <p style={{ fontSize: 12, marginTop: 8, color: '#64748b' }}>{item.name}</p>
        </div>
      )}
    />
  );
}
