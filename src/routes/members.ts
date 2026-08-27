import { Router, Request, Response } from 'express';
import db from '../db/database';
import { isValidEmail } from '../validators';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const members = db.prepare('SELECT * FROM members ORDER BY id ASC').all();
  res.json(members);
});

router.post('/', (req: Request, res: Response) => {
  const { name, email } = req.body as { name?: string; email?: string };
  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Invalid email format.' });
    return;
  }
  const result = db.prepare(
    'INSERT INTO members (name, email) VALUES (?, ?)'
  ).run(name, email);
  res.status(201).json({
    id: Number(result.lastInsertRowid),
    name,
    email
  });
});

export default router;
