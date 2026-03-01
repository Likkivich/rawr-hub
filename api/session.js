// api/session.js
// Читает cookie и возвращает данные сессии как JSON

export default function handler(req, res) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );

  const raw = cookies['rawr_session'];

  if (!raw) {
    return res.status(401).json({ error: 'no_session' });
  }

  try {
    const data = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    res.status(200).json(data);
  } catch {
    res.status(400).json({ error: 'invalid_session' });
  }
}
