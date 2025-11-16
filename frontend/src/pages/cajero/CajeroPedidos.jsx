import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { obtenerClientes } from '../../services/clienteService';
import { getPlatos } from '../../services/platoService';
import { createPedido } from '../../services/pedidoService';

const CajeroPedidos = () => {
  const { token, usuario } = useAuth();

  const [clientes, setClientes] = useState([]);
  const [platos, setPlatos] = useState([]);

  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Tipo de servicio
  const [tipoServicio, setTipoServicio] = useState('MESA'); // MESA | PARA_LLEVAR | RECOJO | DOMICILIO

  // Carrito
  const [items, setItems] = useState([]);

  // UI filtros catálogo
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('TODOS');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensajeOk, setMensajeOk] = useState('');
  const [enviando, setEnviando] = useState(false);

  // 🔹 Modal de pago / ticket
  const [pagoModalAbierto, setPagoModalAbierto] = useState(false);
  const [metodoPagoModal, setMetodoPagoModal] = useState('EFECTIVO'); // EFECTIVO | QR
  const [montoRecibido, setMontoRecibido] = useState('');

  // Cargar clientes y platos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError('');

        const [clientesData, platosData] = await Promise.all([
          obtenerClientes(token),
          getPlatos(token),
        ]);

        setClientes(clientesData);
        setPlatos(platosData);
      } catch (err) {
        console.error(err);
        setError('Error al cargar clientes o platos');
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tipos de plato para filtros
  const tiposPlato = useMemo(() => {
    const setTipos = new Set();
    platos.forEach((p) => {
      if (p.tipo_plato) setTipos.add(p.tipo_plato);
    });
    return ['TODOS', ...Array.from(setTipos)];
  }, [platos]);

  // Catálogo filtrado
  const platosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    return platos.filter((p) => {
      const coincideTipo =
        tipoFiltro === 'TODOS' || p.tipo_plato === tipoFiltro;
      const coincideTexto =
        !term ||
        p.nombre.toLowerCase().includes(term) ||
        (p.tipo_plato || '').toLowerCase().includes(term);
      return coincideTipo && coincideTexto;
    });
  }, [platos, busqueda, tipoFiltro]);

  const total = useMemo(
    () =>
      items.reduce(
        (acc, item) => acc + (Number(item.precio) || 0) * item.cantidad,
        0
      ),
    [items]
  );

  const cambio = useMemo(() => {
    if (metodoPagoModal !== 'EFECTIVO') return 0;
    const recibido = Number(montoRecibido || 0);
    const diff = recibido - total;
    return diff > 0 ? diff : 0;
  }, [metodoPagoModal, montoRecibido, total]);

  const clienteObj = useMemo(
    () =>
      clientes.find(
        (c) => String(c.id_cliente) === String(clienteSeleccionado)
      ),
    [clientes, clienteSeleccionado]
  );

  // Agregar 1 unidad desde catálogo (con control de stock)
  const handleAgregarDesdeCatalogo = (plato) => {
    setMensajeOk('');
    setError('');

    const stock = plato.stock_actual ?? Infinity;

    setItems((prev) => {
      const existe = prev.find((it) => it.id_plato === plato.id_plato);
      const cantidadActual = existe ? existe.cantidad : 0;
      if (cantidadActual + 1 > stock) {
        setError(
          `No hay más stock disponible de "${plato.nombre}". Stock actual: ${stock}`
        );
        return prev;
      }

      if (existe) {
        return prev.map((it) =>
          it.id_plato === plato.id_plato
            ? { ...it, cantidad: it.cantidad + 1 }
            : it
        );
      }
      return [
        ...prev,
        {
          id_plato: plato.id_plato,
          nombre: plato.nombre,
          precio: Number(plato.precio),
          cantidad: 1,
          stock_actual: plato.stock_actual,
        },
      ];
    });
  };

  const handleQuitarItem = (id_plato) => {
    setItems((prev) => prev.filter((it) => it.id_plato !== id_plato));
  };

  const handleCambiarCantidadItem = (id_plato, nuevaCantidad) => {
    const cant = Number(nuevaCantidad) || 0;
    if (cant <= 0) {
      setItems((prev) => prev.filter((it) => it.id_plato !== id_plato));
      return;
    }

    // control de stock también aquí
    const plato = platos.find((p) => p.id_plato === id_plato);
    const stock = plato?.stock_actual ?? Infinity;
    if (cant > stock) {
      setError(
        `No puedes dejar más de ${stock} unidades para ese plato (stock disponible).`
      );
      return;
    }

    setItems((prev) =>
      prev.map((it) =>
        it.id_plato === id_plato ? { ...it, cantidad: cant } : it
      )
    );
  };

  // Paso 1: validar y abrir modal de pago
  const handleAbrirModalPago = () => {
    if (!usuario || !usuario.id_usuario) {
      setError(
        'No se encontró el usuario cajero (id_usuario). Revisa el AuthContext.'
      );
      return;
    }

    if (items.length === 0) {
      setError('Debes agregar al menos un plato');
      return;
    }

    setError('');
    setMensajeOk('');
    setPagoModalAbierto(true);
  };

  // Paso 2: confirmar pago + crear pedido
  const handleConfirmarPagoYCrearPedido = async () => {
    if (metodoPagoModal === 'EFECTIVO') {
      const recibido = Number(montoRecibido || 0);
      if (recibido <= 0) {
        setError('Debes indicar el monto recibido en efectivo');
        return;
      }
      if (recibido < total) {
        setError('El monto recibido es menor al total a pagar');
        return;
      }
    }

    try {
      setError('');
      setMensajeOk('');
      setEnviando(true);

      // Info de servicio para observaciones
      const infoServicioTexto = (() => {
        switch (tipoServicio) {
          case 'MESA':
            return 'SERVICIO: En mesa';
          case 'PARA_LLEVAR':
            return 'SERVICIO: Para llevar (mostrador)';
          case 'RECOJO':
            return 'SERVICIO: Pedido para recoger';
          case 'DOMICILIO':
            return 'SERVICIO: Envío a domicilio';
          default:
            return 'SERVICIO: No especificado';
        }
      })();

      const infoPagoTexto =
        metodoPagoModal === 'EFECTIVO'
          ? `PAGO: Efectivo (recibido Bs. ${Number(
              montoRecibido || 0
            ).toFixed(2)}, cambio Bs. ${cambio.toFixed(2)})`
          : 'PAGO: QR';

      const observacionesFinal = [infoServicioTexto, infoPagoTexto, observaciones]
        .filter(Boolean)
        .join(' | ');

      // Backend: tipo_entrega: 'MESA' o 'LLEVAR'
      const tipo_entrega = tipoServicio === 'MESA' ? 'MESA' : 'LLEVAR';
      const tipo_pago = metodoPagoModal; // 'EFECTIVO' o 'QR'

      const detalles = items.map((it) => ({
        id_plato: it.id_plato,
        cantidad: it.cantidad,
      }));

      const payload = {
        id_usuario: usuario.id_usuario,
        tipo_entrega,
        tipo_pago,
        detalles,
        observaciones: observacionesFinal || null,
      };

      if (clienteSeleccionado) {
        payload.id_cliente = Number(clienteSeleccionado);
      }

      await createPedido(token, payload);

      setMensajeOk('✅ Pedido creado correctamente');
      setItems([]);
      setObservaciones('');
      setClienteSeleccionado('');
      setMetodoPagoModal('EFECTIVO');
      setMontoRecibido('');
      setPagoModalAbierto(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al crear el pedido');
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <div className="p-4">
        <p className="text-sm text-slate-600">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Cajero - Tomar pedido
          </h1>
          <p className="text-sm text-slate-600">
            Haz clic sobre los platos para agregarlos al pedido, selecciona el tipo
            de servicio y (opcional) un cliente. El pago se define al confirmar.
          </p>
        </div>
        <div className="mt-2 md:mt-0">
          <div className="inline-flex items-baseline gap-2 rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-2">
            <span className="text-xs font-medium uppercase text-emerald-700">
              Total
            </span>
            <span className="text-lg font-semibold text-emerald-800">
              Bs. {total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      {mensajeOk && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2 rounded-lg">
          {mensajeOk}
        </div>
      )}

      {/* Layout principal */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Columna izquierda */}
        <div className="space-y-4 lg:col-span-1">
          {/* Tipo de servicio */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
            <h2 className="text-lg font-semibold mb-1">Tipo de servicio</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTipoServicio('MESA')}
                className={
                  'px-2 py-2 rounded-lg border text-center ' +
                  (tipoServicio === 'MESA'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200')
                }
              >
                En mesa
              </button>
              <button
                type="button"
                onClick={() => setTipoServicio('PARA_LLEVAR')}
                className={
                  'px-2 py-2 rounded-lg border text-center ' +
                  (tipoServicio === 'PARA_LLEVAR'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200')
                }
              >
                Para llevar
              </button>
              <button
                type="button"
                onClick={() => setTipoServicio('RECOJO')}
                className={
                  'px-2 py-2 rounded-lg border text-center ' +
                  (tipoServicio === 'RECOJO'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200')
                }
              >
                Para recoger
              </button>
              <button
                type="button"
                onClick={() => setTipoServicio('DOMICILIO')}
                className={
                  'px-2 py-2 rounded-lg border text-center ' +
                  (tipoServicio === 'DOMICILIO'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200')
                }
              >
                Domicilio
              </button>
            </div>
          </div>

          {/* Cliente (opcional) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
            <h2 className="text-lg font-semibold mb-1">Cliente registrado</h2>
            <p className="text-[11px] text-slate-500">
              Opcional. Si el cliente no quiere dar su nombre, puedes dejarlo en
              blanco y registrar el pedido igual.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">
                Cliente (opcional)
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={clienteSeleccionado}
                onChange={(e) => setClienteSeleccionado(e.target.value)}
              >
                <option value="">Sin cliente (anónimo)</option>
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.nombre_completo}{' '}
                    {c.telefono ? `- ${c.telefono}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Observaciones
              </label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej. Sin cebolla, poco picante, entregar en portón café..."
                rows={2}
              />
            </div>
          </div>

          {/* Detalle rápido del pedido */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Detalle</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {items.length} ítem(s)
              </span>
            </div>

            {items.length === 0 ? (
              <p className="text-xs text-slate-500">
                Aún no hay platos en el pedido.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto max-h-52">
                  <table className="min-w-full text-xs border border-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-2 py-2 border text-left">Plato</th>
                        <th className="px-2 py-2 border text-center">Cant.</th>
                        <th className="px-2 py-2 border text-right">Subt.</th>
                        <th className="px-2 py-2 border text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.id_plato} className="hover:bg-slate-50">
                          <td className="px-2 py-2 border align-middle">
                            <span className="block font-medium text-[13px]">
                              {it.nombre}
                            </span>
                            {typeof it.stock_actual !== 'undefined' && (
                              <span className="block text-[10px] text-slate-500">
                                Stock disp.: {it.stock_actual}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2 border text-center align-middle">
                            <input
                              type="number"
                              min="1"
                              className="w-14 border rounded px-1 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                              value={it.cantidad}
                              onChange={(e) =>
                                handleCambiarCantidadItem(
                                  it.id_plato,
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td className="px-2 py-2 border text-right align-middle">
                            Bs. {(it.precio * it.cantidad).toFixed(2)}
                          </td>
                          <td className="px-2 py-2 border text-center align-middle">
                            <button
                              onClick={() => handleQuitarItem(it.id_plato)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-red-600 text-white hover:bg-red-700"
                            >
                              ✖
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-semibold">
                        <td
                          className="px-2 py-2 border text-right text-[13px]"
                          colSpan={2}
                        >
                          Total
                        </td>
                        <td className="px-2 py-2 border text-right text-[13px]">
                          Bs. {total.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 border" />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={enviando || items.length === 0}
                onClick={handleAbrirModalPago}
                className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {enviando ? 'Procesando...' : 'Confirmar pedido'}
              </button>
              <p className="mt-1 text-[11px] text-slate-500 text-center">
                Primero revisa el pago y el ticket antes de registrar.
              </p>
            </div>
          </div>
        </div>

        {/* Columna derecha: catálogo de platos */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 lg:col-span-2 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-3">
            <div>
              <h2 className="text-lg font-semibold">Catálogo de platos</h2>
              <p className="text-[11px] text-slate-500">
                Haz clic en un plato para agregar 1 unidad al pedido.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <input
                type="text"
                placeholder="Buscar por nombre o tipo..."
                className="w-full md:w-64 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <select
                className="w-full md:w-40 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
              >
                {tiposPlato.map((t) => (
                  <option key={t} value={t}>
                    {t === 'TODOS' ? 'Todos los tipos' : t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {platosFiltrados.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-slate-500">
                No se encontraron platos con ese filtro.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {platosFiltrados.map((p) => {
                const imgUrl = p.imagen_url || p.imagen || null;
                return (
                  <button
                    key={p.id_plato}
                    type="button"
                    onClick={() => handleAgregarDesdeCatalogo(p)}
                    className="group text-left bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 rounded-xl overflow-hidden shadow-sm transition-all flex flex-col"
                  >
                    <div className="relative h-24 w-full bg-slate-200 overflow-hidden">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={p.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-500">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    <div className="p-2 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs uppercase text-slate-500">
                          {p.tipo_plato || 'Plato'}
                        </p>
                        <p className="text-sm font-semibold line-clamp-2">
                          {p.nombre}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-emerald-700">
                            Bs. {Number(p.precio).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Stock: {p.stock_actual ?? 0}
                          </span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-700">
                          + Agregar
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL PAGO + TICKET */}
      {pagoModalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-xl w-full p-4 md:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Pago y ticket</h2>
              <button
                className="text-sm text-slate-500 hover:text-slate-700"
                type="button"
                onClick={() => {
                  if (!enviando) {
                    setPagoModalAbierto(false);
                    setMontoRecibido('');
                    setMetodoPagoModal('EFECTIVO');
                  }
                }}
              >
                ✖
              </button>
            </div>

            {/* Sección de pago */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Total a pagar</p>
                <p className="text-xl font-bold text-emerald-700">
                  Bs. {total.toFixed(2)}
                </p>

                <div className="mt-2">
                  <p className="text-xs font-medium mb-1">Método de pago</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setMetodoPagoModal('EFECTIVO')}
                      className={
                        'px-2 py-2 rounded-lg border text-center ' +
                        (metodoPagoModal === 'EFECTIVO'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200')
                      }
                    >
                      Efectivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoPagoModal('QR')}
                      className={
                        'px-2 py-2 rounded-lg border text-center ' +
                        (metodoPagoModal === 'QR'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200')
                      }
                    >
                      QR
                    </button>
                  </div>
                </div>

                {metodoPagoModal === 'EFECTIVO' && (
                  <div className="mt-2 space-y-1">
                    <label className="block text-xs font-medium">
                      Monto recibido (Bs.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={montoRecibido}
                      onChange={(e) => setMontoRecibido(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <p className="text-xs text-slate-600">
                      Cambio: {''}
                      <span className="font-semibold">
                        Bs. {cambio.toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Ticket preview */}
              <div className="border rounded-lg p-3 bg-slate-50 text-xs font-mono max-h-64 overflow-y-auto">
                <div className="text-center mb-2">
                  <p className="font-bold text-sm">CabreraGriller</p>
                  <p>{new Date().toLocaleString()}</p>
                </div>
                <p>
                  Cajero:{' '}
                  <span className="font-semibold">
                    {usuario?.nombre_completo || '—'}
                  </span>
                </p>
                <p>
                  Cliente:{' '}
                  <span className="font-semibold">
                    {clienteObj?.nombre_completo || 'Anónimo'}
                  </span>
                </p>
                <p>
                  Servicio:{' '}
                  <span className="font-semibold">
                    {tipoServicio === 'MESA'
                      ? 'En mesa'
                      : tipoServicio === 'PARA_LLEVAR'
                      ? 'Para llevar'
                      : tipoServicio === 'RECOJO'
                      ? 'Para recoger'
                      : 'Domicilio'}
                  </span>
                </p>
                <p>
                  Pago:{' '}
                  <span className="font-semibold">
                    {metodoPagoModal === 'EFECTIVO'
                      ? 'Efectivo'
                      : 'QR'}
                  </span>
                </p>
                {metodoPagoModal === 'EFECTIVO' && (
                  <>
                    <p>
                      Recibido:{' '}
                      <span className="font-semibold">
                        Bs. {Number(montoRecibido || 0).toFixed(2)}
                      </span>
                    </p>
                    <p>
                      Cambio:{' '}
                      <span className="font-semibold">
                        Bs. {cambio.toFixed(2)}
                      </span>
                    </p>
                  </>
                )}
                <hr className="my-2 border-slate-300" />
                <p className="font-semibold mb-1">Detalle:</p>
                {items.map((it) => (
                  <p key={it.id_plato}>
                    {it.cantidad} x {it.nombre} @ Bs.{' '}
                    {it.precio.toFixed(2)} = Bs.{' '}
                    {(it.precio * it.cantidad).toFixed(2)}
                  </p>
                ))}
                <hr className="my-2 border-slate-300" />
                <p>
                  TOTAL:{' '}
                  <span className="font-bold">
                    Bs. {total.toFixed(2)}
                  </span>
                </p>
                {observaciones && (
                  <>
                    <hr className="my-2 border-slate-300" />
                    <p>Obs: {observaciones}</p>
                  </>
                )}
                <div className="mt-2 text-center text-[10px] text-slate-500">
                  ¡Gracias por su preferencia!
                </div>
              </div>
            </div>

            {/* Botones modal */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={enviando}
                onClick={() => {
                  if (!enviando) {
                    setPagoModalAbierto(false);
                    setMontoRecibido('');
                    setMetodoPagoModal('EFECTIVO');
                  }
                }}
                className="px-4 py-2 text-xs md:text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={enviando}
                onClick={handleConfirmarPagoYCrearPedido}
                className="px-4 py-2 text-xs md:text-sm rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {enviando
                  ? 'Registrando...'
                  : 'Confirmar y registrar pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CajeroPedidos;
