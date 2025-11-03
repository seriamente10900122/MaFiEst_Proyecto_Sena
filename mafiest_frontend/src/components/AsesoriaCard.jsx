import React from 'react';

const AsesoriaCard = ({ asesoria, user, onEdit, onDelete }) => {
  const isAdminOrDocente = user && (user.rol === 'administrador' || user.rol === 'docente');
  return (
    <div className="grabacion-card mb-3">
      <div className="grabacion-header d-flex justify-content-between align-items-center">
        <h3>{asesoria.titulo}</h3>
        {isAdminOrDocente && (
          <div>
            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => onEdit(asesoria)}>Editar</button>
            <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(asesoria)}>Eliminar</button>
          </div>
        )}
      </div>
      <div className="grabacion-body">
        <p>{asesoria.descripcion}</p>
        <div className="grabacion-info mb-2">
          <div><strong>Fecha:</strong> {
            asesoria.fecha && /^\d{4}-\d{2}-\d{2}/.test(asesoria.fecha)
              ? (() => {
                  // Convertimos la fecha directamente desde el string YYYY-MM-DD
                  const [y, m, d] = asesoria.fecha.substring(0,10).split('-');
                  return `${d}/${m}/${y}`;
                })()
              : 'Sin fecha'
          }</div>
          <div><strong>Hora:</strong> {asesoria.horaInicio ? asesoria.horaInicio : 'Sin hora'}{asesoria.horaFin ? ` - ${asesoria.horaFin}` : ''}</div>
          <div><strong>Lugar:</strong> {asesoria.lugar ? asesoria.lugar : 'Sin lugar'}</div>
          <div><strong>Precio:</strong> {asesoria.precio ? `$${asesoria.precio}` : 'Sin precio'}</div>
          <div><strong>Docente encargado:</strong> {asesoria.docente?.nombre || asesoria.docenteNombre || 'Desconocido'}</div>
          <div><strong>Estado:</strong> <span className={`badge ${asesoria.estado === 'pendiente' ? 'bg-warning' : asesoria.estado === 'cancelada' ? 'bg-danger' : 'bg-success'}`}>{asesoria.estado}</span></div>
        </div>
      </div>
    </div>
  );
};

export default AsesoriaCard;
