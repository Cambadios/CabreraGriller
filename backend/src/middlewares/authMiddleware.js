// backend/src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';

// Verifica token
export const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ mensaje: 'Token no proporcionado' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_super_secreta');
    req.usuario = decoded; // usuario logueado disponible
    next();
  } catch (error) {
    console.error('❌ Token inválido:', error);
    res.status(403).json({ mensaje: 'Token inválido o expirado' });
  }
};

// Verifica si es ADMIN
export const soloAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'ADMIN')
    return res.status(403).json({ mensaje: 'Acceso solo para administradores' });
  next();
};
