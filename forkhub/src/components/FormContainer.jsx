import React from 'react';
import './styles/FormContainer.css';

export default function FormContainer({ 
  title, 
  subtitle, 
  children, 
  onSubmit,
  submitButtonText = 'Submit'
}) {
  return (
    <div className="form-container">
      <div className="form-card">
        {title && <h1 className="form-title">{title}</h1>}
        {subtitle && <p className="form-subtitle">{subtitle}</p>}
        
        <form onSubmit={onSubmit} className="form">
          {children}
        </form>
      </div>
    </div>
  );
}