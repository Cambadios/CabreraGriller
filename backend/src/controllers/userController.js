// src/controllers/userController.js
import * as User from '../models/userModel.js';

export const list = async (req, res, next) => {
  try {
    const users = await User.getAllUsers();
    res.json(users);
  } catch (err) { next(err); }
};

export const get = async (req, res, next) => {
  try {
    const user = await User.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.createUser({ name, email });
    res.status(201).json(user);
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const user = await User.updateUser(req.params.id, req.body);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    const ok = await User.deleteUser(req.params.id);
    if (!ok) return res.status(404).json({ message: 'User not found' });
    res.status(204).send();
  } catch (err) { next(err); }
};
