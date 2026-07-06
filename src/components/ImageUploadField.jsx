import { useRef } from 'react';
import { readImageFile } from '../utils/imageUpload.js';

export default function ImageUploadField({ label, value, onChange, required = false }) {
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    try {
      const dataUrl = await readImageFile(file);
      onChange(dataUrl);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={`img-upload-field ${value ? 'has-image' : ''}`}>
      <label>{label}{required ? ' *' : ''}</label>
      <div
        className="img-upload-slot"
        onClick={() => !value && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {value ? (
          <>
            <img src={value} alt={label} />
            <button type="button" className="img-upload-remove" onClick={(e) => { e.stopPropagation(); onChange(''); }}>×</button>
          </>
        ) : (
          <>
            <span>📷</span>
            <span>Clic para subir</span>
          </>
        )}
      </div>
      <input
        type="text"
        className="img-upload-url"
        placeholder="O pegá URL de imagen"
        value={value?.startsWith('data:') ? '' : (value || '')}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
