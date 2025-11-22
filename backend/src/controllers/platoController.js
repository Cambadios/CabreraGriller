// backend/src/controllers/platoController.js
import {
  getAllPlatos,
  getPlatoById,
  createPlato,
  updatePlato,
  deletePlato,
} from '../models/platoModel.js';
import { getIO } from '../socket.js';

// 📋 Listar platos
export const listarPlatos = async (req, res) => {
  try {
    const platos = await getAllPlatos();
    res.status(200).json(platos);
  } catch (error) {
    console.error('❌ Error al listar platos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los platos' });
  }
};

// 🔎 Obtener plato por ID
export const obtenerPlato = async (req, res) => {
  try {
    const { id } = req.params;
    const plato = await getPlatoById(id);
    if (!plato) return res.status(404).json({ mensaje: 'Plato no encontrado' });
    res.status(200).json(plato);
  } catch (error) {
    console.error('❌ Error al obtener plato:', error);
    res.status(500).json({ mensaje: 'Error al obtener el plato' });
  }
};

// ➕ Crear plato
export const crearPlatoHandler = async (req, res) => {
  try {
    const { nombre, tipo_plato, precio, stock_actual } = req.body;

    if (!nombre || !tipo_plato || !precio) {
      return res.status(400).json({
        mensaje: 'Los campos nombre, tipo_plato y precio son obligatorios',
      });
    }

    let imagen_url = null;
    if (req.file) {
      imagen_url = `${req.protocol}://${req.get('host')}/uploads/platos/${req.file.filename}`;
    }

    const nuevoPlato = await createPlato({
      nombre,
      tipo_plato,
      precio: Number(precio),
      stock_actual: stock_actual != null ? Number(stock_actual) : 0,
      imagen_url,
    });

    const io = getIO();
    io.emit('plato:nuevo', nuevoPlato);
    io.to('rol:ADMIN').emit('admin:refresh', { tipo: 'platos' });

    res.status(201).json(nuevoPlato);
  } catch (error) {
    console.error('❌ Error al crear plato:', error);
    res.status(500).json({ mensaje: 'Error al crear el plato' });
  }
};

// ✏️ Actualizar plato
export const actualizarPlatoHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      tipo_plato,
      precio,
      stock_actual,
      estado,
      observaciones,
    } = req.body;

    const datosActualizados = {
      nombre,
      tipo_plato,
      precio: precio != null ? Number(precio) : undefined,
      stock_actual: stock_actual != null ? Number(stock_actual) : undefined,
      estado,
      observaciones,
    };

    if (req.file) {
      datosActualizados.imagen_url =
        `${req.protocol}://${req.get('host')}/uploads/platos/${req.file.filename}`;
    }

    const actualizado = await updatePlato(id, datosActualizados);
    if (!actualizado) return res.status(404).json({ mensaje: 'Plato no encontrado' });

    const io = getIO();
    io.emit('plato:actualizado', actualizado);
    io.to('rol:ADMIN').emit('admin:refresh', { tipo: 'platos' });

    res.status(200).json(actualizado);
  } catch (error) {
    console.error('❌ Error al actualizar plato:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el plato' });
  }
};

// ❌ Eliminar plato
export const eliminarPlatoHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await deletePlato(id);
    if (!eliminado) return res.status(404).json({ mensaje: 'Plato no encontrado' });

    const io = getIO();
    io.emit('plato:eliminado', { id_plato: id });
    io.to('rol:ADMIN').emit('admin:refresh', { tipo: 'platos' });

    res.status(200).json({ mensaje: 'Plato eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar plato:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el plato' });
  }
};
