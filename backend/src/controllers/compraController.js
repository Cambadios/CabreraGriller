// backend/src/controllers/compraController.js
import { createCompra, getComprasPorFecha } from '../models/compraModel.js';
import { getIO } from '../socket.js';

/**
 * POST /api/compras
 * Crea una nueva compra (egreso)
 */
export const crearCompraHandler = async (req, res) => {
  try {
    const id_usuario = req.user?.id_usuario; // viene del token

    const {
      fecha,
      categoria,
      descripcion,
      proveedor,
      monto,
      observaciones,
    } = req.body;

    if (!id_usuario) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    if (!fecha || !descripcion || monto === undefined || monto === null) {
      return res.status(400).json({
        mensaje: 'Los campos fecha, descripción y monto son obligatorios',
      });
    }

    const montoNumber = Number(monto);
    if (Number.isNaN(montoNumber) || montoNumber < 0) {
      return res.status(400).json({
        mensaje: 'El monto debe ser un número mayor o igual a 0',
      });
    }

    const nuevaCompra = await createCompra({
      id_usuario,
      fecha,
      categoria: categoria || null,
      descripcion,
      proveedor: proveedor || null,
      monto: montoNumber,
      observaciones: observaciones || null,
    });

    const io = getIO();
    io.emit('compra:nueva', nuevaCompra);
    io.to('rol:ADMIN').emit('admin:refresh', { tipo: 'compras' });
    io.to('rol:ADMIN').emit('admin:refresh', { tipo: 'gananciaNeta' });

    return res.status(201).json({
      mensaje: 'Compra registrada correctamente',
      compra: nuevaCompra,
    });
  } catch (error) {
    console.error('❌ Error al crear compra:', error);
    return res.status(500).json({ mensaje: 'Error al registrar la compra' });
  }
};

/**
 * GET /api/compras?fecha=YYYY-MM-DD
 * Lista compras de un día
 */
export const listarComprasPorFechaHandler = async (req, res) => {
  try {
    let { fecha } = req.query;

    if (!fecha) {
      const hoy = new Date();
      fecha = hoy.toISOString().substring(0, 10);
    }

    const compras = await getComprasPorFecha(fecha);

    return res.status(200).json(compras);
  } catch (error) {
    console.error('❌ Error al obtener compras por fecha:', error);
    return res.status(500).json({
      mensaje: 'Error al obtener las compras',
      detalle: error.message,
    });
  }
};
