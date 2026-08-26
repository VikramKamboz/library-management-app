import { Router, Request, Response } from 'express';
import db from '../db/database';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const books = db.prepare('SELECT * FROM books ORDER BY id ASC').all();
  res.json(books);
});

router.post('/', (req: Request, res: Response) => {
  const { title, author, isbn } = req.body as { title?: string; author?: string; isbn?: string };
  if (!title || !author || !isbn) {
    res.status(400).json({ error: 'Title, author, and ISBN are required' });
    return;
  }
  const result = db.prepare(
    'INSERT INTO books (title, author, isbn) VALUES (?, ?, ?)'
  ).run(title, author, isbn);
  res.status(201).json({
    id: Number(result.lastInsertRowid),
    title,
    author,
    isbn,
    is_available: 1
  });
});

export default router;
