const axios = require('axios');
const { channelInfo } = require('../lib/messageConfig');

// ===============================
// CONFIG OPENROUTER
// ===============================
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';

// IA gratuite via OpenRouter
const FREE_ROUTER_MODEL = 'openrouter/free';

const MODELS = {
  gpt: FREE_ROUTER_MODEL,
  gemini: FREE_ROUTER_MODEL,
};

// Récupère le texte brut (message normal / reply / caption)
function getText(message) {
  return (
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    message.message?.imageMessage?.caption ||
    message.message?.videoMessage?.caption ||
    ''
  );
}

// Récupère la réponse OpenRouter
function pickAnswer(data) {
  if (!data) return null;

  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === 'string' && content.trim()) {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const text = content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.text) return item.text;
        return '';
      })
      .join('\n')
      .trim();

    if (text) return text;
  }

  return null;
}

// Appel OpenRouter
async function askAI(prompt, model) {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'METS_TA_CLE_ICI') {
    throw new Error('Clé OpenRouter manquante');
  }

  const res = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model,
      messages: [
        {
          role: 'system',
          content:
            "Tu es un assistant intelligent. Réponds toujours en français avec un style propre, clair et utile.",
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 45000,
      validateStatus: () => true,
    }
  );

  if (res.status < 200 || res.status >= 300) {
    const err =
      res.data?.error?.message ||
      res.data?.message ||
      `HTTP ${res.status}`;
    throw new Error(err);
  }

  const answer = pickAnswer(res.data);
  if (!answer) {
    throw new Error('Réponse vide');
  }

  return answer;
}

async function aiCommand(sock, chatId, message) {
  try {
    const text = getText(message).trim();
    const parts = text.split(/\s+/);
    const cmd = (parts[0] || '').toLowerCase();
    const query = parts.slice(1).join(' ').trim();

    if (!query) {
      return await sock.sendMessage(
        chatId,
        {
          text:
            "❌ Donne un texte à demander.\n\n✅ Exemples :\n• *.gpt c'est quoi un VPN ?*\n• *.gemini écris une bio WhatsApp stylée*",
          ...channelInfo,
        },
        { quoted: message }
      );
    }

    try {
      await sock.sendMessage(chatId, {
        react: { text: '⏳', key: message.key },
      });
    } catch {}

    await sock.sendMessage(
      chatId,
      { text: '🧠 Réflexion en cours...', ...channelInfo },
      { quoted: message }
    );

    const model = cmd === '.gemini' ? MODELS.gemini : MODELS.gpt;
    let answer = null;

    try {
      answer = await askAI(query, model);
    } catch (e) {
      console.error('Erreur OpenRouter:', e?.response?.data || e.message);

      try {
        await sock.sendMessage(chatId, {
          react: { text: '❌', key: message.key },
        });
      } catch {}

      return await sock.sendMessage(
        chatId,
        {
          text:
            `❌ Erreur OpenRouter.\n` +
            `📝 Détail: ${e.message}\n\n` +
            `✅ Vérifie la clé API et réessaie.`,
          ...channelInfo,
        },
        { quoted: message }
      );
    }

    if (answer.length > 3500) {
      answer = answer.slice(0, 3500) + '…';
    }

    const header = cmd === '.gemini' ? '✨ GEMINI' : '🤖 GPT';
    const question = query.length > 350 ? query.slice(0, 350) + '…' : query;

    const styled =
      `╭━━━〔 ${header} 〕━━━╮\n` +
      `┃ 🗣️ Question :\n` +
      `┃ ${question}\n` +
      `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
      `${answer}\n\n` +
      `♠️ 𝚈𝚄𝙽𝙰\n` +
      `> 𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙽𝟿𝚞𝚏_𝚂`;

    await sock.sendMessage(
      chatId,
      { text: styled, ...channelInfo },
      { quoted: message }
    );

    try {
      await sock.sendMessage(chatId, {
        react: { text: '✅', key: message.key },
      });
    } catch {}
  } catch (error) {
    console.error('Error in AI command:', error);

    try {
      await sock.sendMessage(chatId, {
        react: { text: '❌', key: message.key },
      });
    } catch {}

    await sock.sendMessage(
      chatId,
      { text: '❌ Erreur AI. Réessaie plus tard.', ...channelInfo },
      { quoted: message }
    );
  }
}

module.exports = aiCommand;