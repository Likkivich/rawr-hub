// api/roles.js — получает все роли сервера (id + название + цвет)
// кешируется на 10 минут, роли меняются редко

const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

export default async function handler(req, res) {
  try {
    const r = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_SERVER_ID}/roles`,
      { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
    );
    if (!r.ok) return res.status(r.status).json({ error: 'discord_error' });

    const roles = await r.json();

    // Возвращаем только нужное, убираем @everyone
    const filtered = roles
      .filter(r => r.name !== '@everyone')
      .map(r => ({ id: r.id, name: r.name, color: r.color }));

    res.setHeader('Cache-Control', 's-maxage=600');
    res.status(200).json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
}
