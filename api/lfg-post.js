// api/lfg-post.js — создать заявку LFG
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Проверяем сессию
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

  const { game, mode, slots, comment } = req.body;
  if (!game || !mode || !slots) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  const post = {
    id: Date.now().toString(),
    username: user.username,
    avatar: user.avatar,
    userId: user.id,
    game,
    mode,
    slots: parseInt(slots),
    comment: comment?.slice(0, 100) || '',
    createdAt: new Date().toISOString(),
  };

  // Добавляем в начало списка
  await kv.lpush('lfg:posts', JSON.stringify(post));
  // Обрезаем до 50 записей
  await kv.ltrim('lfg:posts', 0, 49);

  res.status(200).json(post);
}
