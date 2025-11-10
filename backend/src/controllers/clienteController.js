// backend/src/controllers/clienteController.js
import {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente
} from '../models/clienteModel.js';

// 📋 Listar todos los clientes
export const listarClientes = async (req, res) => {
  try {
    const clientes = await getAllClientes();
    res.status(200).json(clientes);
  } catch (error) {
    console.error('❌ Error al listar clientes:', error);
    res.status(500).json({ mensaje: 'Error al obtener los clientes' });
  }
};

// 🔎 Obtener un cliente por ID
export const obtenerCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await getClienteById(id);
    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    res.status(200).json(cliente);
  } catch (error) {
    console.error('❌ Error al obtener cliente:', error);
    res.status(500).json({ mensaje: 'Error al obtener el cliente' });
  }
};

// ➕ Crear un nuevo cliente
export const crearClienteHandler = async (req, res) => {
  try {
    const { nombre_completo, telefono, direccion } = req.body;

    if (!nombre_completo) {
      return res.status(400).json({ mensaje: 'El campo nombre_completo es obligatorio' });
    }

    const nuevoCliente = await createCliente({ nombre_completo, telefono, direccion });
    res.status(201).json(nuevoCliente);
  } catch (error) {
    console.error('❌ Error al crear cliente:', error);
    res.status(500).json({ mensaje: 'Error al crear el cliente' });
  }
};

// ✏️ Actualizar cliente
export const actualizarClienteHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;

    const actualizado = await updateCliente(id, datos);
    if (!actualizado) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    res.status(200).json(actualizado);
  } catch (error) {
    console.error('❌ Error al actualizar cliente:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el cliente' });
  }
};

// ❌ Eliminar cliente
export const eliminarClienteHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await deleteCliente(id);
    if (!eliminado) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    res.status(200).json({ mensaje: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar cliente:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el cliente' });
  }
};
