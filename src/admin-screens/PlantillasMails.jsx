import { useEffect, useMemo, useRef, useState } from 'react';
import './PlantillasMails.css';

const TABS = [
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'transactional', label: 'Presupuestos y pedidos' },
];

const SAMPLE = {
  nombre: 'Santiago',
  cliente: 'Santiago',
  prenda: 'Remeras',
  cantidad: '10',
  total: '$150.000',
  sena: '$50.000',
  saldo: '$100.000',
  pedido: 'ORD-001',
  negocio: 'Half Moon Indumentaria',
};

function renderTokens(text, vars) {
  return String(text || '').replace(/\{(\w+)\}|<(\w+)>/g, (_m, a, b) => {
    const key = a || b;
    const value = vars[key];
    return value == null || value === '' ? '' : String(value);
  });
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPreviewHtml({ businessName, title, body, imageUrl, ctaUrl, ctaLabel }) {
  const withLinks = escapeHtml(body).replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" style="color:#059669;text-decoration:underline;">$1</a>'
  );
  const paragraphs = withLinks
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => `<p style="margin:0 0 14px;line-height:1.6;color:#334155;">${line}</p>`)
    .join('');

  const imageBlock =
    imageUrl && /^https?:\/\//i.test(imageUrl)
      ? `<div style="margin:0 0 20px;"><img src="${escapeHtml(imageUrl)}" alt="" style="display:block;width:100%;max-width:100%;height:auto;border-radius:8px;" /></div>`
      : '';

  const ctaBlock =
    ctaUrl && ctaLabel && /^https?:\/\//i.test(ctaUrl)
      ? `<div style="margin:8px 0 4px;"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:8px;">${escapeHtml(ctaLabel)}</a></div>`
      : '';

  return `<!DOCTYPE html><html lang="es"><body style="margin:0;padding:16px;background:#f1f5f9;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#0f172a;padding:18px 24px;">
      <span style="color:#fff;font-size:17px;font-weight:700;">${escapeHtml(businessName)}</span>
    </div>
    <div style="padding:24px;">
      ${title ? `<h1 style="margin:0 0 14px;font-size:18px;color:#0f172a;">${escapeHtml(title)}</h1>` : ''}
      ${imageBlock}
      ${paragraphs}
      ${ctaBlock}
    </div>
    <div style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <span style="font-size:12px;color:#64748b;">${escapeHtml(businessName)} · Indumentaria y estampados · Córdoba, Argentina</span>
    </div>
  </div>
</body></html>`;
}

export default function PlantillasMails() {
  const [tab, setTab] = useState('newsletter');
  const [templates, setTemplates] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [businessName, setBusinessName] = useState('Half Moon Indumentaria');
  const bodyRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [tplRes, settingsRes] = await Promise.all([
        fetch('/api/email-templates'),
        fetch('/api/settings'),
      ]);
      const list = await tplRes.json();
      const settings = await settingsRes.json();
      if (Array.isArray(list)) setTemplates(list);
      if (settings?.business_name) setBusinessName(settings.business_name);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => templates.filter((t) => t.category === tab),
    [templates, tab]
  );

  useEffect(() => {
    if (!filtered.length) {
      setSelectedSlug(null);
      setDraft(null);
      return;
    }
    const stillThere = filtered.some((t) => t.slug === selectedSlug);
    const next = stillThere ? selectedSlug : filtered[0].slug;
    if (next !== selectedSlug) setSelectedSlug(next);
  }, [filtered, selectedSlug]);

  useEffect(() => {
    const current = templates.find((t) => t.slug === selectedSlug);
    if (!current) {
      setDraft(null);
      return;
    }
    setDraft({ ...current });
  }, [selectedSlug, templates]);

  const setField = (key, value) => setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  const insertToken = (token) => {
    const el = bodyRef.current;
    const text = draft?.body || '';
    const at = el?.selectionStart ?? text.length;
    const next = `${text.slice(0, at)}{${token}}${text.slice(at)}`;
    setField('body', next);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = at + token.length + 2;
      el?.setSelectionRange(pos, pos);
    });
  };

  const insertLink = () => {
    const label = window.prompt('Texto del enlace', 'Ver catálogo');
    if (!label) return;
    const url = window.prompt('URL (https://...)', 'https://halfmoon.com.ar');
    if (!url || !/^https?:\/\//i.test(url)) {
      alert('La URL tiene que empezar con http:// o https://');
      return;
    }
    const el = bodyRef.current;
    const text = draft?.body || '';
    const at = el?.selectionStart ?? text.length;
    const snippet = `[${label}](${url})`;
    setField('body', `${text.slice(0, at)}${snippet}${text.slice(at)}`);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/email-templates/${draft.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar');
      setTemplates((prev) => prev.map((t) => (t.slug === data.slug ? { ...t, ...data } : t)));
      showToast('Plantilla guardada');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const sampleVars = useMemo(
    () => ({ ...SAMPLE, negocio: businessName || SAMPLE.negocio }),
    [businessName]
  );

  const preview = useMemo(() => {
    if (!draft) return { subject: '', html: '' };
    const title = renderTokens(draft.title, sampleVars);
    const body = renderTokens(draft.body, sampleVars);
    const subject = renderTokens(draft.subject, sampleVars);
    return {
      subject,
      html: buildPreviewHtml({
        businessName: sampleVars.negocio,
        title,
        body,
        imageUrl: draft.image_url,
        ctaUrl: draft.cta_url,
        ctaLabel: draft.cta_label,
      }),
    };
  }, [draft, sampleVars]);

  return (
    <div className="mail-tpl">
      <div className="page-header">
        <div>
          <h2 style={{ color: '#000' }}>Plantillas de mail</h2>
          <p>
            Armá el asunto, título, texto, imagen y botón de cada mail. Usá variables como{' '}
            <code>{'{nombre}'}</code> o <code>{'{prenda}'}</code>.
          </p>
        </div>
        <button type="button" className="btn-dark" onClick={save} disabled={!draft || saving}>
          {saving ? 'Guardando…' : 'Guardar plantilla'}
        </button>
      </div>

      <div className="mail-tpl-tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`mail-tpl-tab ${tab === item.id ? 'is-active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mail-tpl-empty">Cargando plantillas…</p>
      ) : (
        <div className="mail-tpl-layout">
          <aside className="mail-tpl-list">
            {filtered.map((item) => (
              <button
                key={item.slug}
                type="button"
                className={`mail-tpl-list-item ${selectedSlug === item.slug ? 'is-active' : ''}`}
                onClick={() => setSelectedSlug(item.slug)}
              >
                <strong>{item.label}</strong>
                <span>{item.description}</span>
                {!item.enabled && <em>Pausada</em>}
              </button>
            ))}
          </aside>

          {draft ? (
            <div className="mail-tpl-main">
              <section className="mail-tpl-editor">
                <div className="mail-tpl-switch-row">
                  <div>
                    <strong>Plantilla activa</strong>
                    <span>Si la pausás, ese mail no se envía.</span>
                  </div>
                  <button
                    type="button"
                    className={`mail-tpl-toggle ${draft.enabled ? 'is-on' : ''}`}
                    onClick={() => setField('enabled', !draft.enabled)}
                    aria-pressed={draft.enabled}
                  >
                    <span />
                  </button>
                </div>

                <label className="mail-tpl-field">
                  <span>Asunto</span>
                  <input
                    type="text"
                    value={draft.subject || ''}
                    onChange={(e) => setField('subject', e.target.value)}
                  />
                </label>

                <label className="mail-tpl-field">
                  <span>Título (dentro del mail)</span>
                  <input
                    type="text"
                    value={draft.title || ''}
                    onChange={(e) => setField('title', e.target.value)}
                  />
                </label>

                <div className="mail-tpl-field">
                  <div className="mail-tpl-field-head">
                    <span>Cuerpo</span>
                    <button type="button" className="mail-tpl-link-btn" onClick={insertLink}>
                      + Enlace
                    </button>
                  </div>
                  <textarea
                    ref={bodyRef}
                    rows={8}
                    value={draft.body || ''}
                    onChange={(e) => setField('body', e.target.value)}
                    placeholder="Hola {nombre}! …"
                  />
                  <div className="mail-tpl-tokens">
                    {(draft.tokens || []).map((token) => (
                      <button
                        key={token}
                        type="button"
                        className="mail-tpl-token"
                        onClick={() => insertToken(token)}
                      >
                        {`{${token}}`}
                      </button>
                    ))}
                  </div>
                  <p className="mail-tpl-hint">
                    Enlaces: escribí <code>[texto](https://…)</code> o usá el botón. También
                    acepta <code>{'<nombre>'}</code> además de <code>{'{nombre}'}</code>.
                  </p>
                </div>

                <label className="mail-tpl-field">
                  <span>Imagen (URL https)</span>
                  <input
                    type="url"
                    value={draft.image_url || ''}
                    onChange={(e) => setField('image_url', e.target.value)}
                    placeholder="https://…/banner.jpg"
                  />
                </label>

                <div className="mail-tpl-cta-grid">
                  <label className="mail-tpl-field">
                    <span>Botón · texto</span>
                    <input
                      type="text"
                      value={draft.cta_label || ''}
                      onChange={(e) => setField('cta_label', e.target.value)}
                      placeholder="Ver catálogo"
                    />
                  </label>
                  <label className="mail-tpl-field">
                    <span>Botón · URL</span>
                    <input
                      type="url"
                      value={draft.cta_url || ''}
                      onChange={(e) => setField('cta_url', e.target.value)}
                      placeholder="https://halfmoon.com.ar"
                    />
                  </label>
                </div>
              </section>

              <section className="mail-tpl-preview">
                <div className="mail-tpl-preview-meta">
                  <span>Vista previa</span>
                  <strong>{preview.subject || '(sin asunto)'}</strong>
                </div>
                <iframe
                  title="Vista previa del mail"
                  className="mail-tpl-iframe"
                  sandbox=""
                  srcDoc={preview.html}
                />
              </section>
            </div>
          ) : (
            <p className="mail-tpl-empty">Elegí una plantilla de la lista.</p>
          )}
        </div>
      )}

      {toast && (
        <div className={`mail-tpl-toast ${toast.type === 'error' ? 'is-error' : ''}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
