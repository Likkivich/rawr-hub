// api/logout.js
export default function handler(req, res) {
  // Удаляем cookie выставив Max-Age=0
  res.setHeader('Set-Cookie',
    'rawr_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  );
  res.redirect('/');
}
