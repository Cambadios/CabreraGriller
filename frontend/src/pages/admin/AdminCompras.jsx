// src/pages/admin/AdminCompras.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getComprasPorFecha, crearCompra } from '../../services/compraService';

const hoyStr = () => new Date().toISOString().substring(0, 10);

const AdminCompras = () => {
  const { token } = useAuth();

  // 🔹 Filtro de fecha para listar compras
  const [fechaFiltro, setFechaFiltro] = useState(hoyStr);
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [totalDia, setTotalDia] = useState(0);

  // 🔹 Formulario para nueva compra
  const [form, setForm] = useState({
    fecha: hoyStr(),
    categoria: '',
    descripcion: '',
    proveedor: '',
    monto: '',
    observaciones: '',
  });
  const [guardando, setGuardando] = useState(false);

  const cargarCompras = async (fecha) => {
    try {
      setCargando(true);
      setError('');
      const data = await getComprasPorFecha(token, fecha);
      setCompras(data || []);

      const suma = (data || []).reduce(
        (acc, c) => acc + Number(c.monto || 0),
        0
      );
      setTotalDia(suma);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al cargar compras');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCompras(fechaFiltro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarCompras(fechaFiltro);
  };

  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGuardarCompra = async (e) => {
    e.preventDefault();

    if (!form.fecha || !form.descripcion || !form.monto) {
      setError('La fecha, descripción y monto son obligatorios.');
      return;
    }

    try {
      setGuardando(true);
      setError('');

      await crearCompra(token, {
        fecha: form.fecha,
        categoria: form.categoria || null,
        descripcion: form.descripcion,
        proveedor: form.proveedor || null,
        monto: Number(form.monto),
        observaciones: form.observaciones || null,
      });

      // Después de guardar, recargamos el listado del día de esa compra
      setFechaFiltro(form.fecha);
      await cargarCompras(form.fecha);

      // Limpiar algunos campos
      setForm((prev) => ({
        ...prev,
        categoria: '',
        descripcion: '',
        proveedor: '',
        monto: '',
        observaciones: '',
      }));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al registrar compra');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">🧾 Compras</h1>
        <p className="text-sm text-slate-600">
          Registra todas las compras de insumos (verduras, carne, panes, bebidas, etc.)
          para controlar tus egresos por fechas.
        </p>
      </div>

      {/* 🔹 Formulario nueva compra */}
      <div className="bg-white rounded-xl shadow p-4 space-y-4">
        <h2 className="text-lg font-semibold">Registrar nueva compra</h2>

        <form
          onSubmit={handleGuardarCompra}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-xs font-medium mb-1">
              Fecha *
            </label>
            <input
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChangeForm}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Categoría
            </label>
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleChangeForm}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="">Seleccionar...</option>
              <option value="Verduras">Verduras</option>
              <option value="Carnes">Carnes</option>
              <option value="Panadería">Panadería</option>
              <option value="Bebidas">Bebidas</option>
              <option value="Lácteos">Lácteos</option>
              <option value="Otros">Otros</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Proveedor
            </label>
            <input
              type="text"
              name="proveedor"
              value={form.proveedor}
              onChange={handleChangeForm}
              placeholder="Ej: Mercado, Carnicería X..."
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-medium mb-1">
              Descripción *
            </label>
            <input
              type="text"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChangeForm}
              placeholder="Ej: 10 kg de tomate, 5 kg de carne molida..."
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Monto (Bs.) *
            </label>
            <input
              type="number"
              name="monto"
              value={form.monto}
              onChange={handleChangeForm}
              min="0"
              step="0.01"
              className="w-full border rounded-md px-3 py-2 text-sm text-right"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <label className="block text-xs font-medium mb-1">
              Observaciones
            </label>
            <input
              type="text"
              name="observaciones"
              value={form.observaciones}
              onChange={handleChangeForm}
              placeholder="Ej: pago en efectivo, oferta, etc."
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={guardando}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Guardar compra'}
            </button>
          </div>
        </form>
      </div>

      {/* 🔹 Filtro y tabla de compras por fecha */}
      <div className="bg-white rounded-xl shadow p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <form
            onSubmit={handleBuscar}
            className="flex flex-col md:flex-row gap-2 items-start md:items-end"
          >
            <div>
              <label className="block text-xs font-medium mb-1">
                Ver compras del día
              </label>
              <input
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
            >
              Buscar
            </button>
          </form>

          <div className="text-right">
            <p className="text-sm">
              Total egresos del día:{' '}
              <span className="font-semibold">
                Bs. {totalDia.toFixed(2)}
              </span>
            </p>
            <p className="text-xs text-slate-500">
              Compras registradas: {compras.length}
            </p>
          </div>
        </div>

        {cargando && <p className="text-sm">Cargando compras...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Categoría</th>
                <th className="px-3 py-2 text-left">Descripción</th>
                <th className="px-3 py-2 text-left">Proveedor</th>
                <th className="px-3 py-2 text-right">Monto (Bs.)</th>
                <th className="px-3 py-2 text-left">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {compras.length === 0 && !cargando && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-4 text-center text-slate-500"
                  >
                    No hay compras registradas para esta fecha.
                  </td>
                </tr>
              )}

              {compras.map((c, idx) => {
                // backend esperado:
                // { id_compra, fecha, categoria, descripcion, proveedor, monto, observaciones }
                const fechaStr = c.fecha
                  ? new Date(c.fecha).toISOString().substring(0, 10)
                  : '-';

                return (
                  <tr key={c.id_compra || idx} className="border-t">
                    <td className="px-3 py-2 align-top">{idx + 1}</td>
                    <td className="px-3 py-2 align-top">{fechaStr}</td>
                    <td className="px-3 py-2 align-top">
                      {c.categoria || '-'}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {c.descripcion}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {c.proveedor || '-'}
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      {Number(c.monto || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 align-top max-w-[150px] truncate">
                      {c.observaciones || ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCompras;
