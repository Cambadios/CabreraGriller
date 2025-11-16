// src/pages/cajero/CajeroPedidosDelDia.jsx
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getPedidosPorFecha,
  getPedidoById,
  pagarPedido,
} from '../../services/pedidoService';
import { useNavigate } from 'react-router-dom';

const hoyISO = () => new Date().toISOString().slice(0, 10);

const formatearHora = (fechaHora) => {
  if (!fechaHora) return '-';
  const d = new Date(fechaHora);
  return d.toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatearFechaLarga = (fecha) => {
  if (!fecha) return '-';
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es-BO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const CajeroPedidosDelDia = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [fecha, setFecha] = useState(hoyISO());
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');

  // Modal de pago en detalle
  const [pagoModalAbierto, setPagoModalAbierto] = useState(false);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO'); // EFECTIVO | QR
  const [montoRecibido, setMontoRecibido] = useState('');
  const [errorPago, setErrorPago] = useState('');
  const [enviandoPago, setEnviandoPago] = useState(false);

  const cargarPedidos = useCallback(
    async (fechaConsulta) => {
      if (!token) return;
      setCargando(true);
      setError('');
      try {
        const data = await getPedidosPorFecha(token, fechaConsulta);
        setPedidos(data || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error al cargar pedidos');
        setPedidos([]);
      } finally {
        setCargando(false);
      }
    },
    [token]
  );

  useEffect(() => {
    cargarPedidos(fecha);
  }, [fecha, cargarPedidos]);

  const manejarBuscar = (e) => {
    e.preventDefault();
    if (!fecha) {
      setFecha(hoyISO());
    } else {
      cargarPedidos(fecha);
    }
  };

  const manejarHoy = () => {
    const hoy = hoyISO();
    setFecha(hoy);
    cargarPedidos(hoy);
  };

  const totalDia = pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);

  const abrirDetalle = async (id_pedido) => {
    if (!token) return;
    setCargandoDetalle(true);
    setErrorDetalle('');
    try {
      const data = await getPedidoById(token, id_pedido);
      setPedidoSeleccionado(data);
    } catch (err) {
      console.error(err);
      setErrorDetalle(err.message || 'Error al cargar detalle del pedido');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarDetalle = () => {
    setPedidoSeleccionado(null);
    setErrorDetalle('');
    setPagoModalAbierto(false);
    setErrorPago('');
    setMontoRecibido('');
    setMetodoPago('EFECTIVO');
  };

  const totalPedidoSeleccionado = Number(
    pedidoSeleccionado?.total || 0
  );

  const cambio =
    metodoPago === 'EFECTIVO'
      ? Math.max(Number(montoRecibido || 0) - totalPedidoSeleccionado, 0)
      : 0;

  const abrirModalPago = () => {
    setErrorPago('');
    setMontoRecibido('');
    setMetodoPago('EFECTIVO');
    setPagoModalAbierto(true);
  };

  const manejarPagarPedido = async () => {
    if (!pedidoSeleccionado) return;

    if (!['EFECTIVO', 'QR'].includes(metodoPago)) {
      setErrorPago('Selecciona un método de pago válido');
      return;
    }

    if (metodoPago === 'EFECTIVO') {
      const recibido = Number(montoRecibido || 0);
      if (recibido <= 0) {
        setErrorPago('Ingresa el monto recibido en efectivo');
        return;
      }
      if (recibido < totalPedidoSeleccionado) {
        setErrorPago('El monto recibido es menor al total del pedido');
        return;
      }
    }

    try {
      setErrorPago('');
      setEnviandoPago(true);

      await pagarPedido(token, pedidoSeleccionado.id_pedido, metodoPago);

      await cargarPedidos(fecha);

      setPedidoSeleccionado((prev) =>
        prev
          ? {
              ...prev,
              estado: 'PAGADO',
              tipo_pago: metodoPago,
            }
          : prev
      );

      setPagoModalAbierto(false);
      setMontoRecibido('');
    } catch (err) {
      console.error(err);
      setErrorPago(err.message || 'Error al registrar el pago');
    } finally {
      setEnviandoPago(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Título y filtros */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Pedidos del día
          </h2>
          <p className="text-sm text-slate-500">
            Fecha seleccionada:{' '}
            <span className="font-medium capitalize">
              {formatearFechaLarga(fecha)}
            </span>
          </p>
        </div>

        <form
          onSubmit={manejarBuscar}
          className="flex flex-wrap items-center gap-2"
        >
          <label className="text-sm text-slate-600">
            Fecha:{' '}
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="ml-1 border border-slate-300 rounded-md px-2 py-1 text-sm"
            />
          </label>

          <button
            type="submit"
            className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-white hover:bg-slate-900"
          >
            Buscar
          </button>

          <button
            type="button"
            onClick={manejarHoy}
            className="px-3 py-1.5 text-sm rounded-md border border-slate-300 hover:bg-slate-100"
          >
            Hoy
          </button>
        </form>
      </div>

      {/* Resumen del día */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Total pedidos
          </p>
          <p className="text-2xl font-bold text-slate-800">
            {pedidos.length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Monto total del día
          </p>
          <p className="text-2xl font-bold text-emerald-600">
            Bs {totalDia.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Estado
          </p>
          <p className="text-sm text-slate-700">
            {cargando
              ? 'Cargando pedidos...'
              : pedidos.length === 0
              ? 'Sin pedidos registrados en esta fecha'
              : 'Pedidos cargados'}
          </p>
        </div>
      </div>

      {/* Errores */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Tabla de pedidos */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">
            Listado de pedidos
          </h3>
          {cargando && (
            <span className="text-xs text-slate-500">Cargando...</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">
                  #
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">
                  Hora
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">
                  Cajero
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">
                  Cliente
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">
                  Entrega
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">
                  Pago
                </th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600">
                  Total (Bs)
                </th>
                <th className="px-3 py-2 text-center font-semibold text-slate-600">
                  Estado
                </th>
                <th className="px-3 py-2 text-center font-semibold text-slate-600">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length === 0 && !cargando && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-4 text-center text-slate-500"
                  >
                    No hay pedidos registrados para esta fecha.
                  </td>
                </tr>
              )}

              {pedidos.map((p) => (
                <tr
                  key={p.id_pedido}
                  className="border-b last:border-b-0 hover:bg-slate-50"
                >
                  <td className="px-3 py-2 text-slate-700">
                    {p.id_pedido}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {formatearHora(p.fecha_hora)}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {p.cajero || '-'}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {p.cliente || 'Consumidor final'}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {p.tipo_entrega === 'MESA' ? 'En mesa' : 'Para llevar'}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {p.tipo_pago}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-800 font-semibold">
                    {Number(p.total || 0).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.estado === 'PAGADO'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-300'
                      }`}
                    >
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => abrirDetalle(p.id_pedido)}
                        className="text-xs px-2 py-1 rounded-md bg-slate-800 text-white hover:bg-slate-900"
                      >
                        Ver detalle
                      </button>

                      {p.estado === 'PENDIENTE' && (
                        <button
                          onClick={() =>
                            navigate(`/cajero/pedidos?pedido=${p.id_pedido}`)
                          }
                          className="text-xs px-2 py-1 rounded-md bg-yellow-500 text-white hover:bg-yellow-600"
                        >
                          Continuar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel de detalle del pedido */}
      {pedidoSeleccionado && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">
                Detalle pedido #{pedidoSeleccionado.id_pedido}
              </h3>
              <button
                onClick={cerrarDetalle}
                className="text-slate-500 hover:text-slate-700 text-lg"
              >
                ×
              </button>
            </div>

            <div className="px-4 py-3 space-y-2 text-sm">
              {errorDetalle && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-md mb-2">
                  {errorDetalle}
                </div>
              )}

              <p>
                <span className="font-medium text-slate-700">
                  Fecha y hora:{' '}
                </span>
                {formatearHora(pedidoSeleccionado.fecha_hora)} (
                {new Date(pedidoSeleccionado.fecha_hora).toLocaleDateString(
                  'es-BO'
                )}
                )
              </p>
              <p>
                <span className="font-medium text-slate-700">Cajero:</span>{' '}
                {pedidoSeleccionado.cajero}
              </p>
              <p>
                <span className="font-medium text-slate-700">Cliente:</span>{' '}
                {pedidoSeleccionado.cliente || 'Consumidor final'}
              </p>

              {/* Entrega y Pago separados */}
              <p>
                <span className="font-medium text-slate-700">Entrega:</span>{' '}
                {pedidoSeleccionado.tipo_entrega === 'MESA'
                  ? 'En mesa'
                  : 'Para llevar'}
              </p>
              <p>
                <span className="font-medium text-slate-700">Pago:</span>{' '}
                {pedidoSeleccionado.tipo_pago}
              </p>

              <div className="mt-3">
                <p className="font-medium text-slate-700 mb-1">
                  Platos del pedido
                </p>
                {cargandoDetalle ? (
                  <p className="text-xs text-slate-500">
                    Cargando detalle...
                  </p>
                ) : pedidoSeleccionado.detalles &&
                  pedidoSeleccionado.detalles.length > 0 ? (
                  <div className="border border-slate-200 rounded-md overflow-hidden">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-2 py-1 text-left font-semibold text-slate-600">
                            Plato
                          </th>
                          <th className="px-2 py-1 text-right font-semibold text-slate-600">
                            Cant
                          </th>
                          <th className="px-2 py-1 text-right font-semibold text-slate-600">
                            Precio
                          </th>
                          <th className="px-2 py-1 text-right font-semibold text-slate-600">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pedidoSeleccionado.detalles.map((d) => (
                          <tr
                            key={d.id_detalle}
                            className="border-b last:border-b-0"
                          >
                            <td className="px-2 py-1">
                              {d.plato}
                            </td>
                            <td className="px-2 py-1 text-right">
                              {d.cantidad}
                            </td>
                            <td className="px-2 py-1 text-right">
                              {Number(d.precio_unitario || 0).toFixed(2)}
                            </td>
                            <td className="px-2 py-1 text-right font-semibold">
                              {Number(d.subtotal || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No hay detalles para este pedido.
                  </p>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">
                  Total: Bs {totalPedidoSeleccionado.toFixed(2)}
                </span>

                {pedidoSeleccionado.estado === 'PENDIENTE' && (
                  <button
                    onClick={abrirModalPago}
                    className="px-3 py-1.5 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Registrar pago
                  </button>
                )}
              </div>
            </div>

            <div className="px-4 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={cerrarDetalle}
                className="px-3 py-1.5 text-xs rounded-md border border-slate-300 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pago */}
      {pedidoSeleccionado && pagoModalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                Pagar pedido #{pedidoSeleccionado.id_pedido}
              </h2>
              <button
                className="text-sm text-slate-500 hover:text-slate-700"
                type="button"
                onClick={() => {
                  if (!enviandoPago) {
                    setPagoModalAbierto(false);
                    setErrorPago('');
                    setMontoRecibido('');
                    setMetodoPago('EFECTIVO');
                  }
                }}
              >
                ✖
              </button>
            </div>

            <p className="text-sm text-slate-700">
              Total a pagar:{' '}
              <span className="font-semibold">
                Bs {totalPedidoSeleccionado.toFixed(2)}
              </span>
            </p>

            <div>
              <p className="text-xs font-medium mb-1">Método de pago</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setMetodoPago('EFECTIVO')}
                  className={
                    'px-2 py-2 rounded-lg border text-center ' +
                    (metodoPago === 'EFECTIVO'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200')
                  }
                >
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('QR')}
                  className={
                    'px-2 py-2 rounded-lg border text-center ' +
                    (metodoPago === 'QR'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200')
                  }
                >
                  QR
                </button>
              </div>
            </div>

            {metodoPago === 'EFECTIVO' && (
              <div className="space-y-1">
                <label className="block text-xs font-medium">
                  Monto recibido (Bs.)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-slate-600">
                  Cambio:{' '}
                  <span className="font-semibold">
                    Bs {cambio.toFixed(2)}
                  </span>
                </p>
              </div>
            )}

            {errorPago && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-md">
                {errorPago}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={enviandoPago}
                onClick={() => {
                  if (!enviandoPago) {
                    setPagoModalAbierto(false);
                    setErrorPago('');
                    setMontoRecibido('');
                    setMetodoPago('EFECTIVO');
                  }
                }}
                className="px-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={enviandoPago}
                onClick={manejarPagarPedido}
                className="px-3 py-1.5 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {enviandoPago ? 'Registrando...' : 'Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CajeroPedidosDelDia;
