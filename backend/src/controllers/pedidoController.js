// backend/src/controllers/pedidoController.js
import { createPedido, getAllPedidos, getPedidoById } from '../models/pedidoModel.js';

// 📋 Listar todos los pedidos
export const listarPedidos = async (req, res) => {
  try {
    const pedidos = await getAllPedidos();
    res.status(200).json(pedidos);
  } catch (error) {
    console.error('❌ Error al listar pedidos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los pedidos' });
  }
};

// 🔎 Obtener un pedido por ID
export const obtenerPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await getPedidoById(id);
    if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    res.status(200).json(pedido);
  } catch (error) {
    console.error('❌ Error al obtener pedido:', error);
    res.status(500).json({ mensaje: 'Error al obtener el pedido' });
  }
};

// ➕ Crear nuevo pedido
export const crearPedidoHandler = async (req, res) => {
  try {
    const { id_cliente, id_usuario, tipo_entrega, tipo_pago, detalles } = req.body;

    if (!id_usuario || !tipo_entrega || !tipo_pago || !Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        mensaje: 'Faltan datos obligatorios: id_usuario, tipo_entrega, tipo_pago o detalles'
      });
    }

    const pedido = await createPedido({ id_cliente, id_usuario, tipo_entrega, tipo_pago, detalles });
    res.status(201).json({
      mensaje: 'Pedido creado exitosamente',
      id_pedido: pedido.id_pedido,
      total: pedido.total
    });
  } catch (error) {
    console.error('❌ Error al crear pedido:', error);
    res.status(500).json({ mensaje: error.message || 'Error al registrar el pedido' });
  }
};
