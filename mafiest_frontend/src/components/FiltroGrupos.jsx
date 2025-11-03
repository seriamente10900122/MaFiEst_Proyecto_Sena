import React, { useState, useEffect } from 'react';
import grupoService from '../services/grupos';

const FiltroGrupos = ({ onGrupoChange, user }) => {
  const [grupos, setGrupos] = useState([]);
  const [selectedGrupo, setSelectedGrupo] = useState('');

  useEffect(() => {
    if (user && user.token) {
      grupoService.setToken(user.token);
      cargarGrupos();
    }
  }, [user]);

  const cargarGrupos = async () => {
    try {
      // Si el usuario tiene grupos, filtra solo los suyos
      const gruposData = await grupoService.getAll();
      let gruposFiltrados = gruposData;
      if (user && user.grupos && Array.isArray(user.grupos)) {
        // Soporta [{id, nombre}] o [id]
        const grupoIds = user.grupos.map(gr => gr.id ? Number(gr.id) : Number(gr));
        gruposFiltrados = gruposData.filter(g => grupoIds.includes(Number(g.id)));
      }
      setGrupos(gruposFiltrados);
    } catch (error) {
      console.error('Error al cargar grupos:', error);
    }
  };

  const handleChange = (event) => {
    const grupoId = event.target.value;
    setSelectedGrupo(grupoId);
    onGrupoChange(grupoId);
  };

  // Renderizar selector de grupos si hay grupos disponibles
  return (
    <div style={{ margin: '16px 0' }}>
      <label htmlFor="grupo-select" style={{ marginRight: 8 }}>Filtrar por grupo:</label>
      <select
        id="grupo-select"
        value={selectedGrupo}
        onChange={handleChange}
        style={{ padding: '4px 8px' }}
      >
        <option value="">Todos los grupos</option>
        {grupos.map(grupo => (
          <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
        ))}
      </select>
    </div>
  );
};

export default FiltroGrupos;