# MaFiEst - Plataforma Educativa

## Descripción
MaFiEst es una plataforma educativa diseñada para facilitar el aprendizaje de matemáticas. Permite la gestión de usuarios, grupos, actividades y asesorías.

## Estructura del Proyecto
- `mafiest_frontend/`: Aplicación React (Vite)
- `mafiest_backend/`: API REST Node.js/Express

## Requisitos Previos
- Node.js 18 o superior
- PostgreSQL 14 o superior
- npm o yarn

## Instalación

### Backend
```bash
cd mafiest_backend
npm install
cp .env.example .env
# Configurar variables en .env
npm run setup # Inicializar base de datos
npm run dev
```

### Frontend
```bash
cd mafiest_frontend
npm install
npm run dev
```

## Variables de Entorno

### Backend
Crear un archivo `.env` basado en `.env.example` con las siguientes variables:
- `PORT`: Puerto del servidor
- `NODE_ENV`: Entorno (development/production)
- `DB_*`: Configuración de base de datos
- `JWT_SECRET`: Clave secreta para JWT

### Frontend
En producción:
- `VITE_API_URL`: URL del backend

## Scripts Disponibles

### Backend
- `npm start`: Iniciar en producción
- `npm run dev`: Iniciar en desarrollo
- `npm test`: Ejecutar pruebas
- `npm run setup`: Configurar base de datos

### Frontend
- `npm run dev`: Iniciar en desarrollo
- `npm run build`: Construir para producción
- `npm run preview`: Preview de producción

## Despliegue
El proyecto está configurado para desplegarse en Render:
- Backend: Web Service
- Frontend: Static Site