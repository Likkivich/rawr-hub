// api/lfg-delete.js — удалить свою заявку
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const cookieHeader = req.headers.cookie || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );
  const raw = cookies['rawr_session'];
  if (!raw) return res.status(401).json({ error: 'unauthorized' });

  let user;
  try {
    user = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'invalid_session' });
  }

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'missing_id' });

  // Получаем все посты, удаляем нужный
  const posts = await kv.lrange('lfg:posts', 0, -1);
  for (const raw of posts) {
    const post = JSON.parse(raw);
    if (post.id === id && post.userId === user.id) {
      await kv.lrem('lfg:posts', 1, raw);
      return res.status(200).json({ ok: true });
    }
  }

  res.status(404).json({ error: 'not_found' });
}
