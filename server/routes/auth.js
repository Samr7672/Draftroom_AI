import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();
const sign = (u) => ({
  token: jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: "7d" }),
  user: { id: u._id, name: u.name, email: u.email },
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ error: "Enter a name, email and a password of 6+ characters." });
  if (await User.findOne({ email: email.toLowerCase() }))
    return res.status(409).json({ error: "That email is already registered." });
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  res.status(201).json(sign(user));
});

router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: (req.body.email || "").toLowerCase() });
  if (!user || !(await bcrypt.compare(req.body.password || "", user.password)))
    return res.status(401).json({ error: "Email or password is incorrect." });
  res.json(sign(user));
});

export default router;
