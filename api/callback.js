// api/callback.js
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID;
const REDIRECT_URI = process.env.REDIRECT_URI;

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    // 1. Меняем code на access_token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.redirect('/?error=token_failed');
    }

    // 2. Получаем данные пользователя
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json();

    // 3. Проверяем членство на сервере
    const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const guilds = await guildsRes.json();
    const isMember = guilds.some(g => g.id === DISCORD_SERVER_ID);

    // 4. Сохраняем сессию в cookie (живёт 7 дней)
    const sessionData = JSON.stringify({
      username: user.username,
      discriminator: user.discriminator || '0',
      avatar: user.avatar || '',
      id: user.id,
      member: isMember ? '1' : '0',
    });

    const encoded = Buffer.from(sessionData).toString('base64');

    res.setHeader('Set-Cookie',
      `rawr_session=${encoded}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
    );

    // 5. Редиректим на hub — без данных в URL
    res.redirect('/hub.html');

  } catch (err) {
    console.error(err);
    res.redirect('/?error=server_error');
  }
}
