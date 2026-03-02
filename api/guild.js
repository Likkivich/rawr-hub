// api/guild.js
// Возвращает реальные данные сервера через Bot API

export default async function handler(req, res) {
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  const SERVER_ID = process.env.DISCORD_SERVER_ID;

  if (!BOT_TOKEN || !SERVER_ID) {
    return res.status(500).json({ error: 'missing_env' });
  }

  try {
    const r = await fetch(
      `https://discord.com/api/v10/guilds/${SERVER_ID}?with_counts=true`,
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
    );

    if (!r.ok) {
      return res.status(r.status).json({ error: 'discord_error' });
    }

    const guild = await r.json();

    res.setHeader('Cache-Control', 's-maxage=60'); // кешируем на 60 сек
    res.status(200).json({
      name: guild.name,
      icon: guild.icon,
      member_count: guild.approximate_member_count,
      online_count: guild.approximate_presence_count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
}
