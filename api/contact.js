const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const getRawBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', reject);
  });
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, apikey, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    let bodyData = {};

    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      const raw = await getRawBody(req);
      bodyData = raw ? JSON.parse(raw) : {};
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const raw = await getRawBody(req);
      const params = new URLSearchParams(raw);
      for (const [key, value] of params) {
        bodyData[key] = value;
      }
    } else {
      const raw = await getRawBody(req);
      bodyData = raw ? JSON.parse(raw) : {};
    }

    const { nombre, telefono, email } = bodyData;

    if (!nombre || !telefono || !email) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: 'Supabase no configurado' });
    }

    const payload = {
      nombre,
      telefono,
      email,
      created_at: new Date().toISOString()
    };

    const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/contactos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!supabaseRes.ok) {
      const errText = await supabaseRes.text();
      console.error('Supabase error:', errText);
      return res.status(500).json({ error: 'Error guardando en Supabase' });
    }

    return res.status(200).json({ ok: true, message: 'Inserción guardada en Supabase' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
