// backend/src/controllers/platoController.js
import {
  getAllPlatos,
  getPlatoById,
  createPlato,
  updatePlato,
  deletePlato
} from '../models/platoModel.js';

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
        mensaje: 'Los campos nombre, tipo_plato y precio son obligatorios'
      });
    }

    const nuevoPlato = await createPlato({ nombre, tipo_plato, precio, stock_actual });
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
    const datos = req.body;

    const actualizado = await updatePlato(id, datos);
    if (!actualizado) return res.status(404).json({ mensaje: 'Plato no encontrado' });
    res.status(200).json(actualizado);
  } catch (error) {
    console.error('❌ Error al actualizar plato:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el plato' });
  }
};

// ❌ Eliminar (desactivar) plato
export const eliminarPlatoHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await deletePlato(id);
    if (!eliminado) return res.status(404).json({ mensaje: 'Plato no encontrado' });
    res.status(200).json({ mensaje: 'Plato eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar plato:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el plato' });
  }
};
