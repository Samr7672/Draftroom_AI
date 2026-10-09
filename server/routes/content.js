import { Router } from "express";
import auth from "../middleware/auth.js";
import Content from "../models/Content.js";
import { CONTENT_TYPES, generateContent, transformContent, isAction } from "../services/ai.js";

const router = Router();
router.use(auth);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const titleFrom = (body, fallback) =>
  (body.split("\n").find((l) => l.trim()) || fallback).replace(/^[#*\s]+|[*\s]+$/g, "").slice(0, 80);

router.get("/", async (req, res) => {
  const q = (req.query.q || "").trim();
  const filter = { user: req.userId };
  if (q) {
    const re = new RegExp(escapeRe(q), "i");
    filter.$or = [{ title: re }, { topic: re }];
  }
  res.json(await Content.find(filter).sort({ updatedAt: -1 }).limit(100));
});

router.post("/generate", async (req, res) => {
  const { type, topic } = req.body;
  if (!CONTENT_TYPES[type] || !topic?.trim())
    return res.status(400).json({ error: "Choose a content type and enter a topic." });
  const body = await generateContent(req.body);
  const doc = await Content.create({
    user: req.userId, type, topic: topic.trim(), tone: req.body.tone,
    title: titleFrom(body, topic), body,
  });
  res.status(201).json(doc);
});

router.post("/:id/transform", async (req, res) => {
  const doc = await Content.findOne({ _id: req.params.id, user: req.userId });
  if (!doc) return res.status(404).json({ error: "Content not found." });
  if (!isAction(req.body.action)) return res.status(400).json({ error: "Unknown action." });
  doc.body = await transformContent({ action: req.body.action, text: req.body.text ?? doc.body, tone: req.body.tone });
  await doc.save();
  res.json(doc);
});

router.put("/:id", async (req, res) => {
  const { title, body } = req.body;
  const doc = await Content.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { $set: { ...(title !== undefined && { title }), ...(body !== undefined && { body }) } },
    { new: true }
  );
  if (!doc) return res.status(404).json({ error: "Content not found." });
  res.json(doc);
});

router.delete("/:id", async (req, res) => {
  await Content.deleteOne({ _id: req.params.id, user: req.userId });
  res.status(204).end();
});

export default router;
