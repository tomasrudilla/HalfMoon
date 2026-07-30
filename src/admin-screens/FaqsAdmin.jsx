import ContentAdmin from './ContentAdmin.jsx';

const EMPTY = { question: '', answer: '', sort_order: 0, is_active: true };

export default function FaqsAdmin() {
  return (
    <ContentAdmin
      apiPath="faqs"
      title="Preguntas frecuentes"
      subtitle="FAQ de la home. Se usan en la web y en el schema SEO (JSON-LD)."
      emptyForm={EMPTY}
      fields={[
        { key: 'question', label: 'Pregunta', required: true },
        { key: 'answer', label: 'Respuesta', type: 'textarea', rows: 5, required: true },
        { key: 'sort_order', label: 'Orden', type: 'number' },
      ]}
      renderCard={(item) => (
        <div style={{ padding: '12px' }}>
          <strong style={{ display: 'block', marginBottom: 6 }}>{item.question}</strong>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.45 }}>
            {item.answer?.slice(0, 120)}{item.answer?.length > 120 ? '…' : ''}
          </p>
          {item.is_active === false && (
            <span style={{ fontSize: 11, color: '#b45309', marginTop: 8, display: 'inline-block' }}>
              Oculta en web
            </span>
          )}
        </div>
      )}
    />
  );
}
