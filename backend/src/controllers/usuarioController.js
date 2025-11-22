// backend/src/controllers/usuarioController.js
import {
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario
} from '../models/usuarioModel.js';
import { getIO } from '../socket.js';

// 📋 Listar usuarios
export const listarUsuarios = async (_req, res) => {
  try {
    const usuarios = await getAllUsuarios();
    res.status(200).json(usuarios);
  } catch (error) {
    console.error('❌ Error al listar usuarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener los usuarios' });
  }
};

// 🔎 Obtener uno por ID
export const obtenerUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await getUsuarioById(id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.status(200).json(usuario);
  } catch (error) {
    console.error('❌ Error al obtener usuario:', error);
    res.status(500).json({ mensaje: 'Error al obtener el usuario' });
  }
};

// ➕ Crear usuario
export const crearUsuarioHandler = async (req, res) => {
  try {
    const { nombre_completo, alias, password, rol } = req.body;

    if (!nombre_completo || !alias || !password || !rol) {
      return res.status(400).json({
        mensaje: 'nombre_completo, alias, password y rol son obligatorios'
      });
    }

    const nuevo = await createUsuario({ nombre_completo, alias, password, rol });

    const io = getIO();
    io.emit('usuario:nuevo', nuevo);
    io.to('rol:ADMIN').emit('admin:refresh', { tipo: 'usuarios' });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    res.status(500).json({ mensaje: 'Error al crear el usuario' });
  }
};

// ✏️ Actualizar usuario
export const actualizarUsuarioHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;

    const actualizado = await updateUsuario(id, datos);
    if (!actualizado) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const io = getIO();
    io.emit('usuario:actualizado', actualizado);
    io.to('rol:ADMIN').emit('admin:refresh', { tipo: 'usuarios' });

    res.status(200).json(actualizado);
  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el usuario' });
  }
};

// ❌ Desactivar usuario
export const eliminarUsuarioHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await deleteUsuario(id);
    if (!eliminado) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const io = getIO();
    io.emit('usuario:eliminado', { id_usuario: id });
    io.to('rol:ADMIN').emit('admin:refresh', { tipo: 'usuarios' });

    res.status(200).json({ mensaje: 'Usuario desactivado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el usuario' });
  }
};
