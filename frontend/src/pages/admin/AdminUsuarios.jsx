// src/pages/Usuarios.jsx
import { useEffect, useState } from 'react';
import {
  fetchUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from '../../services/usuarioService';

const ROLES = ['ADMIN', 'MOZO', 'COCINA', 'CAJA']; // ajusta según tu enum user_role

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // para formulario
  const [formData, setFormData] = useState({
    nombre_completo: '',
    alias: '',
    password: '',
    rol: '',
    estado: true,
  });

  const [editId, setEditId] = useState(null); // null = creando, no editando

  // Cargar usuarios al inicio
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchUsuarios();
      setUsuarios(data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');

      // Validación básica
      if (!formData.nombre_completo || !formData.alias || !formData.rol) {
        setError('Nombre, alias y rol son obligatorios');
        return;
      }

      if (!editId && !formData.password) {
        setError('La contraseña es obligatoria al crear un usuario');
        return;
      }

      if (editId) {
        // 🟡 Modo edición
        const payload = {
          nombre_completo: formData.nombre_completo,
          alias: formData.alias,
          rol: formData.rol,
          estado: formData.estado,
        };

        // Solo mandamos password si el usuario escribió algo nuevo
        if (formData.password.trim() !== '') {
          payload.password = formData.password;
        }

        await updateUsuario(editId, payload);
      } else {
        // 🟢 Modo creación
        await createUsuario({
          nombre_completo: formData.nombre_completo,
          alias: formData.alias,
          password: formData.password,
          rol: formData.rol,
        });
      }

      // Limpiar y recargar lista
      resetForm();
      cargarUsuarios();
    } catch (err) {
      console.error(err);
      setError('Error al guardar el usuario');
    }
  };

  const handleEdit = (usuario) => {
    setEditId(usuario.id_usuario);
    setFormData({
      nombre_completo: usuario.nombre_completo,
      alias: usuario.alias,
      password: '',
      rol: usuario.rol,
      estado: usuario.estado,
    });
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      nombre_completo: '',
      alias: '',
      password: '',
      rol: '',
      estado: true,
    });
    setError('');
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('¿Seguro que deseas desactivar este usuario?');
    if (!ok) return;

    try {
      await deleteUsuario(id);
      cargarUsuarios();
    } catch (err) {
      console.error(err);
      setError('Error al desactivar el usuario');
    }
  };

  return (
    <div className="p-6 w-full">
      <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>

      {/* FORMULARIO */}
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-2">
          {editId ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h2>

        {error && (
          <div className="mb-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <label className="text-sm font-medium">Nombre completo</label>
            <input
              type="text"
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              className="border rounded px-2 py-1"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">Alias (usuario)</label>
            <input
              type="text"
              name="alias"
              value={formData.alias}
              onChange={handleChange}
              className="border rounded px-2 py-1"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">
              Contraseña {editId && <span className="text-xs text-gray-500">(dejar vacío para no cambiar)</span>}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="border rounded px-2 py-1"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">Rol</label>
            <select
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              className="border rounded px-2 py-1"
            >
              <option value="">-- Selecciona un rol --</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {editId && (
            <div className="flex items-center">
              <label className="text-sm font-medium mr-2">Activo</label>
              <input
                type="checkbox"
                name="estado"
                checked={formData.estado}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm"
            >
              {editId ? 'Actualizar' : 'Crear'}
            </button>

            {editId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500 text-sm"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TABLA */}
      <div className="bg-white shadow rounded overflow-x-auto">
        <div className="p-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Lista de usuarios</h2>
          {loading && <span className="text-sm text-gray-500">Cargando...</span>}
        </div>

        <table className="min-w-full text-sm border-t">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1 text-left">ID</th>
              <th className="border px-2 py-1 text-left">Nombre</th>
              <th className="border px-2 py-1 text-left">Alias</th>
              <th className="border px-2 py-1 text-left">Rol</th>
              <th className="border px-2 py-1 text-left">Estado</th>
              <th className="border px-2 py-1 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No hay usuarios registrados
                </td>
              </tr>
            )}

            {usuarios.map((u) => (
              <tr key={u.id_usuario}>
                <td className="border px-2 py-1">{u.id_usuario}</td>
                <td className="border px-2 py-1">{u.nombre_completo}</td>
                <td className="border px-2 py-1">{u.alias}</td>
                <td className="border px-2 py-1">{u.rol}</td>
                <td className="border px-2 py-1">
                  {u.estado ? (
                    <span className="text-green-600 font-semibold">Activo</span>
                  ) : (
                    <span className="text-red-600 font-semibold">Inactivo</span>
                  )}
                </td>
                <td className="border px-2 py-1 text-center">
                  <button
                    onClick={() => handleEdit(u)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded text-xs mr-2 hover:bg-yellow-600"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(u.id_usuario)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                  >
                    Desactivar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
