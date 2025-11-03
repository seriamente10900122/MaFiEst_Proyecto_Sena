import { useState } from "react";
import userService from "../services/user";
import ToastNotification from "../components/Notification";

const ListaUsuarios = ({ usuarios, onUserDeleted, user }) => {
  const [message, setMessage] = useState(null);

  const handleDelete = async (id, username) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al usuario ${username}?`)) {
      try {
        await userService.deleteUser(id);
        setMessage(`✅ Usuario ${username} eliminado correctamente`);
        if (onUserDeleted) onUserDeleted();
      } catch (error) {
        console.error(error);
        setMessage(`❌ Error al eliminar el usuario: ${error.response?.data?.error || error.message}`);
      }
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <div className="container min-vh-100" style={{ minHeight: "80vh" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "2rem",
          width: "100%",
          margin: "0 auto",
          justifyItems: "center",
        }}
      >
        {usuarios.map((u) => (
          <div key={u.id} style={{ width: "100%" }}>
            <div
              className="card shadow-sm w-100 usuario-card-animada"
              style={{
                borderRadius: "16px",
                border: "1.5px solid #232b47",
                transition: "transform 0.3s cubic-bezier(.25,.8,.25,1), box-shadow 0.3s",
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              }}
            >
              {/* Animación para tarjetas de usuario */}
              <style>{`
                .usuario-card-animada:hover {
                  transform: translateY(-1px) scale(1.04);
                  box-shadow: 0 12px 32px rgba(63,166,255,0.25), 0 2px 8px rgba(0,0,0,0.10);
                  border-color: #3fa6ff;
                }
              `}</style>

              <div className="card-header d-flex justify-content-center align-items-center bg-light" style={{ borderRadius: "16px 16px 0 0", padding: "1.5rem" }}>
                <div className="avatar-circle">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombre)}&background=random&size=60`} 
                    alt={`Avatar de ${u.nombre}`}
                    className="rounded-circle"
                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                  />
                </div>
              </div>

              <div className="card-body">
                <div className="text-center mb-3">
                  <strong>Usuario:</strong>{" "}
                  <span style={{ fontWeight: "500" }}>{u.username}</span>
                </div>
                <div>
                  <strong>Rol: </strong>
                  <span
                    className={`badge ${
                      u.rol === "administrador"
                        ? "bg-danger"
                        : u.rol === "docente"
                        ? "bg-success"
                        : "bg-primary"
                    }`}
                  >
                    {u.rol}
                  </span>
                </div>
                <div className="mb-2">
                  <strong>Nombre:</strong>{" "}
                  <span style={{ fontWeight: "500" }}>{u.nombre}</span>
                </div>
                <div className="mb-2">
                  <strong>Email:</strong>{" "}
                  <span style={{ fontWeight: "500" }}>{u.email}</span>
                </div>
                <div className="mb-2">
                  <strong>Grupos:</strong>{" "}
                  <span style={{ fontWeight: "500" }}>
                    {u.grupos && u.grupos.length > 0
                      ? u.grupos.map((g) => g.nombre).join(", ")
                      : "No asignado"}
                  </span>
                </div>
              </div>

              {user?.username !== u.username && (
                <div className="card-footer border-0">
                  <button
                    onClick={() => handleDelete(u.id, u.username)}
                    className="btn btn-primary btn-sm" style={{ fontWeight: 600, borderRadius: '6px', minWidth: '60px', padding: '4px 12px', fontSize: '0.95rem', display: 'inline-block' }}
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {message && <ToastNotification message={message} />}
    </div>
  );
};

export default ListaUsuarios;
