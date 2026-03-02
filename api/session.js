// api/session.js
// Читает cookie, возвращает данные сессии
// Если передан access_token — перепроверяет членство на сервере

export default async function handler(req, res) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k.trim(), v.join('=')];
    })
  );

  const raw = cookies['rawr_session'];
  if (!raw) return res.status(401).json({ error: 'no_session' });

  let data;
  try {
    data = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'invalid_session' });
  }

  res.status(200).json(data);
}
