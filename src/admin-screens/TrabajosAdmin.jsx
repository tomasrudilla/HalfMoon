import ContentAdmin from './ContentAdmin.jsx';

const EMPTY = { title: '', category: '', image_url: '', sort_order: 0, is_active: true };

export default function TrabajosAdmin() {
  return (
    <ContentAdmin
      apiPath="trabajos"
      title="Nuestros Trabajos"
      subtitle="Galería de laburos reales en la home (sin precios)."
      emptyForm={EMPTY}
      fields={[
        { key: 'title', label: 'Título', required: true },
        { key: 'category', label: 'Categoría' },
        { key: 'image_url', label: 'Foto', type: 'image', required: true },
        { key: 'sort_order', label: 'Orden', type: 'number' },
      ]}
      renderCard={(item) => (
        <>
          <img src={item.image_url} alt={item.title} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
          <div style={{ padding: '12px' }}>
            <strong>{item.title}</strong>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>{item.category}</p>
          </div>
        </>
      )}
    />
  );
}
