// api/lfg-get.js — получить все активные заявки LFG
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    const keys = await kv.lrange('lfg:posts', 0, 49); // последние 50
    res.status(200).json(keys || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
}
