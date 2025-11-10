// backend/src/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUsuarioByAlias, createUsuarioSeguro } from '../models/usuarioModel.js';

// 🔹 Login
export const login = async (req, res) => {
  try {
    const { alias, password } = req.body;

    if (!alias || !password)
      return res.status(400).json({ mensaje: 'Alias y contraseña son obligatorios' });

    const usuario = await getUsuarioByAlias(alias);
    if (!usuario) return res.status(401).json({ mensaje: 'Usuario no encontrado' });

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida)
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

    // Crear token JWT
    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        rol: usuario.rol,
        alias: usuario.alias,
        nombre: usuario.nombre_completo
      },
      process.env.JWT_SECRET || 'clave_super_secreta',
      { expiresIn: '8h' }
    );

    res.status(200).json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre_completo: usuario.nombre_completo,
        rol: usuario.rol,
        alias: usuario.alias
      }
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ mensaje: 'Error al iniciar sesión' });
  }
};

// 🔹 Registro rápido (solo para pruebas / admin)
export const registrar = async (req, res) => {
  try {
    const { nombre_completo, alias, password, rol } = req.body;

    if (!nombre_completo || !alias || !password || !rol)
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });

    const nuevo = await createUsuarioSeguro({ nombre_completo, alias, password, rol });
    res.status(201).json({ mensaje: 'Usuario creado', usuario: nuevo });
  } catch (error) {
    console.error('❌ Error al registrar usuario:', error);
    res.status(500).json({ mensaje: 'Error al registrar usuario' });
  }
};
