// backend/src/controllers/pedidoController.js
import {
  createPedido,
  getPedidos,
  getPedidoById,
  actualizarPedidoPendiente,
  pagarPedido,
} from '../models/pedidoModel.js';

// 📋 Listar pedidos (todos o por fecha ?fecha=YYYY-MM-DD)
export const listarPedidos = async (req, res) => {
  try {
    const { fecha } = req.query; // opcional: ?fecha=2025-11-16
    const pedidos = await getPedidos(fecha || null);
    res.status(200).json(pedidos);
  } catch (error) {
    console.error('❌ Error al listar pedidos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los pedidos' });
  }
};

// 📋 Listar solo los pedidos de HOY
export const listarPedidosHoy = async (req, res) => {
  try {
    const hoy = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
    const pedidos = await getPedidos(hoy);
    res.status(200).json({
      fecha: hoy,
      pedidos,
    });
  } catch (error) {
    console.error('❌ Error al listar pedidos de hoy:', error);
    res.status(500).json({ mensaje: 'Error al obtener los pedidos de hoy' });
  }
};

// 🔎 Obtener un pedido por ID
export const obtenerPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await getPedidoById(id);
    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }
    res.status(200).json(pedido);
  } catch (error) {
    console.error('❌ Error al obtener pedido:', error);
    res.status(500).json({ mensaje: 'Error al obtener el pedido' });
  }
};

// ➕ Crear nuevo pedido
export const crearPedidoHandler = async (req, res) => {
  try {
    const { id_cliente, id_usuario, tipo_entrega, tipo_pago, detalles } =
      req.body;

    if (
      !id_usuario ||
      !tipo_entrega ||
      !tipo_pago ||
      !Array.isArray(detalles) ||
      detalles.length === 0
    ) {
      return res.status(400).json({
        mensaje:
          'Faltan datos obligatorios: id_usuario, tipo_entrega, tipo_pago o detalles',
      });
    }

    const pedido = await createPedido({
      id_cliente,
      id_usuario,
      tipo_entrega,
      tipo_pago,
      detalles,
    });

    res.status(201).json({
      mensaje: 'Pedido creado exitosamente',
      id_pedido: pedido.id_pedido,
      total: pedido.total,
      estado: pedido.estado,
    });
  } catch (error) {
    console.error('❌ Error al crear pedido:', error);
    res
      .status(500)
      .json({ mensaje: error.message || 'Error al registrar el pedido' });
  }
};

// 🆕 Actualizar pedido PENDIENTE (agregar más platos)
export const actualizarPedidoHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { detalles } = req.body;

    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res
        .status(400)
        .json({ mensaje: 'No se enviaron platos para agregar' });
    }

    const resultado = await actualizarPedidoPendiente(id, detalles);

    res.status(200).json({
      mensaje: resultado.mensaje,
      incremento_total: resultado.incremento_total,
    });
  } catch (error) {
    console.error('❌ Error al actualizar pedido:', error);
    res
      .status(400)
      .json({ mensaje: error.message || 'Error al actualizar pedido' });
  }
};

// 🆕 Pagar un pedido pendiente
export const pagarPedidoHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_pago } = req.body; // 'EFECTIVO' o 'QR'

    if (!tipo_pago) {
      return res
        .status(400)
        .json({ mensaje: 'Debes enviar el tipo_pago (EFECTIVO o QR)' });
    }

    const resultado = await pagarPedido(id, tipo_pago);

    res.status(200).json(resultado);
  } catch (error) {
    console.error('❌ Error al pagar pedido:', error);
    res
      .status(400)
      .json({ mensaje: error.message || 'Error al registrar el pago' });
  }
};
