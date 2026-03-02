// api/refresh.js
// Перепроверяет членство пользователя на сервере через Bot API
// и обновляет cookie если статус изменился

const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

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

  try {
    // Проверяем членство через Bot API — быстро и не требует токена юзера
    const memberRes = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_SERVER_ID}/members/${data.id}`,
      { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
    );

    const isMember = memberRes.status === 200;
    const oldMember = data.member === '1';

    // Получаем роли если участник
    let roles = [];
    if (isMember) {
      const memberData = await memberRes.json();
      roles = memberData.roles || [];
    }

    // Если что-то изменилось — обновляем cookie
    const rolesChanged = JSON.stringify(roles) !== JSON.stringify(data.roles || []);
    if (isMember !== oldMember || rolesChanged) {
      data.member = isMember ? '1' : '0';
      data.roles = roles;
      const encoded = Buffer.from(JSON.stringify(data)).toString('base64');
      res.setHeader('Set-Cookie',
        `rawr_session=${encoded}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
      );
    }

    res.status(200).json({ member: isMember ? '1' : '0', roles, updated: isMember !== oldMember || rolesChanged });

  } catch (err) {
    console.error(err);
    // Если Discord недоступен — возвращаем текущий статус без изменений
    res.status(200).json({ member: data.member, updated: false });
  }
}
