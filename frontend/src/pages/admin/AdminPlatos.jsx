// src/pages/admin/AdminPlatos.jsx
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getPlatos,
  createPlato,
  updatePlato,
  deletePlato,
} from '../../services/platoService';

const AdminPlatos = () => {
  const { token } = useAuth();

  const [platos, setPlatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    id_plato: null,
    nombre: '',
    descripcion: '', // observaciones
    precio: '',
    categoria: '', // tipo_plato
    disponible: true, // estado
  });

  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // 🔍 Buscador
  const [busqueda, setBusqueda] = useState('');

  const cargarPlatos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await getPlatos(token);
      setPlatos(data);
    } catch (err) {
      setError(err.message || 'Error al cargar platos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (token) {
      cargarPlatos();
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagenFile(file);
      setImagenPreview(URL.createObjectURL(file));
    } else {
      setImagenFile(null);
      setImagenPreview(null);
    }
  };

  const resetForm = () => {
    setFormData({
      id_plato: null,
      nombre: '',
      descripcion: '',
      precio: '',
      categoria: '',
      disponible: true,
    });
    setImagenFile(null);
    setImagenPreview(null);
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('nombre', formData.nombre);
      fd.append('tipo_plato', formData.categoria);
      fd.append('precio', formData.precio || '0');
      fd.append('stock_actual', '0');
      fd.append('estado', formData.disponible ? 'true' : 'false');
      fd.append('observaciones', formData.descripcion || '');

      if (imagenFile) {
        fd.append('imagen', imagenFile);
      }

      if (isEditing && formData.id_plato != null) {
        await updatePlato(token, formData.id_plato, fd);
      } else {
        await createPlato(token, fd);
      }

      await cargarPlatos();
      resetForm();
    } catch (err) {
      setError(err.message || 'Error al guardar plato');
    } finally {
      setEnviando(false);
    }
  };

  const handleEdit = (plato) => {
    setFormData({
      id_plato: plato.id_plato,
      nombre: plato.nombre || '',
      descripcion: plato.observaciones || '',
      precio: plato.precio != null ? String(plato.precio) : '',
      categoria: plato.tipo_plato || '',
      disponible:
        typeof plato.estado === 'boolean'
          ? plato.estado
          : Boolean(plato.estado),
    });

    setImagenFile(null);
    setImagenPreview(plato.imagen_url || null);

    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (plato) => {
    const confirmar = window.confirm(
      `¿Eliminar el plato "${plato.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmar) return;

    try {
      setError('');
      await deletePlato(token, plato.id_plato);
      await cargarPlatos();
    } catch (err) {
      setError(err.message || 'Error al eliminar plato');
    }
  };

  // 🔍 Filtrado por búsqueda (nombre / tipo_plato / observaciones)
  const platosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return platos;

    return platos.filter((p) => {
      const nombre = (p.nombre || '').toLowerCase();
      const tipo = (p.tipo_plato || '').toLowerCase();
      const obs = (p.observaciones || '').toLowerCase();
      return (
        nombre.includes(term) ||
        tipo.includes(term) ||
        obs.includes(term)
      );
    });
  }, [platos, busqueda]);

  return (
    <div className="space-y-6">
      {/* FORMULARIO */}
      <section className="bg-white rounded-xl shadow p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold mb-4">
          {isEditing ? 'Editar plato' : 'Nuevo plato'}
        </h2>

        {error && (
          <div className="mb-4 bg-red-100 text-red-700 text-sm p-3 rounded">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring focus:ring-slate-300"
              placeholder="Ej. Hamburguesa clásica"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <input
              type="text"
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring focus:ring-slate-300"
              placeholder="Ej. Almuerzo, Bebidas, Postres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Precio (Bs.)
            </label>
            <input
              type="number"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring focus:ring-slate-300"
              min="0"
              step="0.1"
              required
            />
          </div>

          <div className="flex items-center gap-2 mt-2 md:mt-6">
            <input
              id="disponible"
              type="checkbox"
              name="disponible"
              checked={formData.disponible}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <label htmlFor="disponible" className="text-sm">
              Disponible
            </label>
          </div>

          {/* Imagen */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Imagen</label>
            <input
              type="file"
              name="imagen"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm"
            />
            {imagenPreview && (
              <div className="mt-2">
                <p className="text-xs text-slate-500 mb-1">Vista previa:</p>
                <img
                  src={imagenPreview}
                  alt="Vista previa"
                  className="w-24 h-24 rounded object-cover border"
                />
              </div>
            )}
          </div>

          {/* Descripción */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring focus:ring-slate-300"
              rows={3}
              placeholder="Describe brevemente el plato, ingredientes, tamaño, etc."
            />
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-2 justify-end">
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg text-sm border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={enviando}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-60"
            >
              {enviando
                ? isEditing
                  ? 'Guardando...'
                  : 'Creando...'
                : isEditing
                ? 'Guardar cambios'
                : 'Crear plato'}
            </button>
          </div>
        </form>
      </section>

      {/* LISTADO EN CARDS */}
      <section className="bg-white rounded-xl shadow p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between mb-4">
          <h3 className="text-lg font-semibold">Lista de platos</h3>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {/* Buscador */}
            <div className="relative flex-1">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o categoría..."
                className="w-full border rounded-full pl-3 pr-8 py-1.5 text-sm outline-none focus:ring focus:ring-slate-200"
              />
              <span className="absolute right-2 top-1.5 text-slate-400 text-xs">
                🔍
              </span>
            </div>

            <button
              onClick={cargarPlatos}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 self-end md:self-auto"
            >
              Actualizar
            </button>
          </div>
        </div>

        {cargando ? (
          <p className="text-sm text-slate-500">Cargando platos...</p>
        ) : platos.length === 0 ? (
          <p className="text-sm text-slate-500">No hay platos registrados.</p>
        ) : platosFiltrados.length === 0 ? (
          <p className="text-sm text-slate-500">
            No se encontraron platos para &quot;{busqueda}&quot;.
          </p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {platosFiltrados.map((plato) => (
              <div
                key={plato.id_plato}
                className="border rounded-xl overflow-hidden shadow-sm flex flex-col"
              >
                {/* Imagen arriba */}
                <div className="w-full h-32 bg-slate-100 flex items-center justify-center overflow-hidden">
                  {plato.imagen_url ? (
                    <img
                      src={plato.imagen_url}
                      alt={plato.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">
                      Sin imagen
                    </span>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold line-clamp-2">
                        {plato.nombre}
                      </h4>
                      {plato.tipo_plato && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {plato.tipo_plato}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-800">
                      Bs. {Number(plato.precio || 0).toFixed(2)}
                    </span>
                  </div>

                  {plato.observaciones && (
                    <p className="text-xs text-slate-600 line-clamp-3">
                      {plato.observaciones}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-1">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold
                        ${
                          plato.estado
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-600'
                        }
                      `}
                    >
                      {plato.estado ? 'Disponible' : 'No disponible'}
                    </span>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(plato)}
                        className="text-[11px] px-2 py-1 rounded border border-slate-300 hover:bg-slate-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(plato)}
                        className="text-[11px] px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPlatos;
