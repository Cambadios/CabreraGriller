// src/pages/Clientes.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  obtenerClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
} from '../../services/clienteService';

const Clientes = () => {
  const { token } = useAuth(); // ⚠️ Asegúrate que tu AuthContext exponga 'token'
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [modoEdicion, setModoEdicion] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);

  const [form, setForm] = useState({
    nombre_completo: '',
    telefono: '',
    direccion: '',
  });

  const resetForm = () => {
    setForm({ nombre_completo: '', telefono: '', direccion: '' });
    setModoEdicion(false);
    setClienteEditando(null);
  };

  const cargarClientes = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerClientes(token);
      setClientes(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron obtener los clientes');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre_completo.trim()) {
      setError('El nombre completo es obligatorio');
      return;
    }

    try {
      setError('');
      if (modoEdicion && clienteEditando) {
        await actualizarCliente(clienteEditando.id_cliente, form, token);
      } else {
        await crearCliente(form, token);
      }
      await cargarClientes();
      resetForm();
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al guardar el cliente');
    }
  };

  const handleEditar = (cliente) => {
    setModoEdicion(true);
    setClienteEditando(cliente);
    setForm({
      nombre_completo: cliente.nombre_completo || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
    });
  };

  const handleEliminar = async (id) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este cliente?');
    if (!confirmar) return;

    try {
      setError('');
      await eliminarCliente(id, token);
      await cargarClientes();
    } catch (err) {
      console.error(err);
      setError('No se pudo eliminar el cliente');
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Clientes</h1>

      {/* Formulario */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">
          {modoEdicion ? 'Editar cliente' : 'Registrar nuevo cliente'}
        </h2>

        {error && (
          <div className="mb-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nombre_completo"
              value={form.nombre_completo}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Teléfono
            </label>
            <input
              type="text"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Ej. 77777777"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Dirección
            </label>
            <input
              type="text"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Ej. Zona Central"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              {modoEdicion ? 'Actualizar' : 'Guardar'}
            </button>

            {modoEdicion && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-semibold rounded border border-gray-300 hover:bg-gray-100"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Listado de clientes</h2>

        {cargando ? (
          <p className="text-sm text-gray-600">Cargando clientes...</p>
        ) : clientes.length === 0 ? (
          <p className="text-sm text-gray-600">No hay clientes registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 border">ID</th>
                  <th className="px-3 py-2 border">Nombre completo</th>
                  <th className="px-3 py-2 border">Teléfono</th>
                  <th className="px-3 py-2 border">Dirección</th>
                  <th className="px-3 py-2 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id_cliente} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border text-center">{c.id_cliente}</td>
                    <td className="px-3 py-2 border">{c.nombre_completo}</td>
                    <td className="px-3 py-2 border">{c.telefono || '-'}</td>
                    <td className="px-3 py-2 border">{c.direccion || '-'}</td>
                    <td className="px-3 py-2 border text-center space-x-2">
                      <button
                        onClick={() => handleEditar(c)}
                        className="px-2 py-1 text-xs rounded bg-yellow-400 hover:bg-yellow-500"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(c.id_cliente)}
                        className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clientes;
