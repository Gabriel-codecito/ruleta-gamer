export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { game, cat } = req.body;
  if (!game) return res.status(400).json({ error: 'Falta el nombre del juego' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Eres un generador de retos para videojuegos. Genera UN reto para el juego EXACTO "${game}". Si el nombre es genérico (ej: "Pokemon" en vez de "Pokemon Scarlet"), elige la versión más popular y especifícala en el reto.
REGLAS IMPORTANTES:
- Usa nombres reales de habilidades, modos de juego, mecánicas o personajes que REALMENTE existen en el juego.
- NUNCA inventes items, objetos, habilidades o personajes. Si no estás 100% seguro de que algo existe, NO lo menciones.
- Para mencionar habilidades, usa términos generales reales: por ejemplo en LoL usa "la habilidad R (ultimate)" en vez de un item inventado.
- Enfoca el reto en mecánicas de gameplay claras: lograr X kills, ganar en Y tiempo, completar Z objetivo, etc.
- El reto debe ser entendible por cualquier persona. Máximo 2 condiciones.
- Tipo de reto: ${cat || 'cualquiera'}
Responde SOLO con JSON sin backticks ni texto extra: {"reto":"descripción clara y específica del reto","dificultad":"Fácil|Medio|Difícil"}`
        }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
