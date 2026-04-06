const settings = require("../settings");

async function aliveCommand(sock, chatId, message) {
    try {
        const version = settings?.version ? settings.version : "3.0.7";
        const mode = settings?.commandMode ? settings.commandMode : "private";

        const message1 = `
╭─────❏ 𝚈𝚄𝙽𝙰
│ 📈 Alive!* ✅
│ .𖥔 𝚈𝚄𝙽𝙰
│
│ \`Version\` : v${version} 📉
│ \`Statut\` : En ligne 🟢
│ \`Mode\` : ${mode} 🌐
│
│ \`🖱️ Fonctions\`
│ • Gestion de groupes 👥
│ • Protection anti-lien 🔒
│ • Commandes admin ⚖️
│ • Commandes fun 🫟
│ • Et plus encore 📦
│
│ Tape *.menu* pour voir la liste des commandes disponibles.
╰──────❏
›  • \`N9uf_S\`
`.trim();

        await sock.sendMessage(chatId, {
            text: message1,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363403933773291@newsletter',
                    newsletterName: '𝚈𝚄𝙽𝙰',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });

    } catch (error) {
        console.error('Error in alive command:', error);
        await sock.sendMessage(chatId, { text: 'Le bot est en ligne ✅' }, { quoted: message });
        return;
    }
}

module.exports = aliveCommand;