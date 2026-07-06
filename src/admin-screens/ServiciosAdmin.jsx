import ContentAdmin from './ContentAdmin.jsx';

const EMPTY = { title: '', description: '', image_url: '', sort_order: 0, is_active: true };

export default function ServiciosAdmin() {
  return (
    <ContentAdmin
      apiPath="servicios"
      title="Nuestros Servicios"
      subtitle="Las 3 tarjetas de servicios en la home."
      emptyForm={EMPTY}
      fields={[
        { key: 'title', label: 'Título', required: true },
        { key: 'description', label: 'Descripción', type: 'textarea' },
        { key: 'image_url', label: 'Imagen', type: 'image' },
        { key: 'sort_order', label: 'Orden', type: 'number' },
      ]}
      renderCard={(item) => (
        <>
          {item.image_url && <img src={item.image_url} alt={item.title} style={{ width: '100%', height: 100, objectFit: 'cover' }} />}
          <div style={{ padding: '12px' }}>
            <strong>{item.title}</strong>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>{item.description?.slice(0, 60)}...</p>
          </div>
        </>
      )}
    />
  );
}
