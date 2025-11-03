
import React, { useEffect } from 'react';

const toastStyles = {
  position: 'fixed',
  top: '30px',
  right: '30px',
  zIndex: 9999,
  minWidth: '300px',
  maxWidth: '90vw',
  padding: '16px 24px',
  borderRadius: '8px',
  color: '#fff',
  fontWeight: 'bold',
  fontSize: '1.1rem',
  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  transition: 'opacity 0.4s',
  opacity: 1
};

const typeColors = {
  success: '#198754',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#0dcaf0',
  default: '#333'
};

const iconMap = {
  success: '✔️',
  danger: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  default: '🔔'
};

const ToastNotification = ({ show, message, type = 'default', onClose, duration = 3500 }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, onClose, duration]);

  if (!show || !message) return null;

  // Si el mensaje es un objeto con una propiedad 'message', usar ese valor
  const displayMessage = typeof message === 'object' && message.message ? message.message : message;
  // Si el mensaje es un objeto con una propiedad 'type', usar ese tipo
  const displayType = typeof message === 'object' && message.type ? message.type : type;

  return (
    <div
      style={{
        ...toastStyles,
        background: typeColors[displayType] || typeColors.default,
        opacity: show ? 1 : 0
      }}
      role="alert"
    >
      <span style={{fontSize: '1.5rem'}}>{iconMap[displayType] || iconMap.default}</span>
      <span style={{flex: 1}}>{displayMessage}</span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          fontSize: '1.3rem',
          cursor: 'pointer',
          marginLeft: '8px',
          lineHeight: 1
        }}
        aria-label="Cerrar notificación"
      >×</button>
    </div>
  );
};

export default ToastNotification;
