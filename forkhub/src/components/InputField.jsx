import React from 'react';
import './styles/InputField.css';

export default function InputField({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  error,
  disabled = false,
  required = false
}) {
  return (
    <div className="input-field">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`input-control ${error ? 'input-error' : ''}`}
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}