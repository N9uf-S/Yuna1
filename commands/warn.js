const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');

// Define paths
const databaseDir = path.join(process.cwd(), 'data');
const warningsPath = path.join(databaseDir, 'warnings.json');

// Initialize warnings file if it doesn't exist
function initializeWarningsFile() {
    if (!fs.existsSync(databaseDir)) {
        fs.mkdirSync(databaseDir, { recursive: true });
    }

    if (!fs.existsSync(warningsPath)) {
        fs.writeFileSync(warningsPath, JSON.stringify({}), 'utf8');
    }
}

async function warnCommand(sock, chatId, senderId, mentionedJids, message) {
    try {
        // Initialize files
        initializeWarningsFile();

        // Check group
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, {
                text: '❌ Cette commande fonctionne uniquement dans les groupes.'
            });
            return;
        }

        // Check admin status
        try {
            const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

            if (!isBotAdmin) {
                await sock.sendMessage(chatId, {
                    text: '❌ Je dois être admin pour utiliser `.warn`.'
                });
                return;
            }

            if (!isSenderAdmin) {
                await sock.sendMessage(chatId, {
                    text: '❌ Seuls les admins peuvent utiliser `.warn`.'
                });
                return;
            }

        } catch (adminError) {
            console.error('Error checking admin status:', adminError);
            await sock.sendMessage(chatId, {
                text: '❌ Vérifie que le bot est bien admin.'
            });
            return;
        }

        let userToWarn;

        // Mention
        if (mentionedJids && mentionedJids.length > 0) {
            userToWarn = mentionedJids[0];
        }
        // Reply
        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToWarn = message.message.extendedTextMessage.contextInfo.participant;
        }

        if (!userToWarn) {
            await sock.sendMessage(chatId, {
                text:
`╭────❏ 𝚈𝚄𝙽𝙰
│ ⚠️ Utilisateur non détecté
│ ➥ Utilise :
│ • .warn @user
│ • Ou réponds à un message + .warn
╰────❏
› • Ahhh 🤧`
            });
            return;
        }

        // Delay anti-spam
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            // Read warnings
            let warnings = {};
            try {
                warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
            } catch {
                warnings = {};
            }

            if (!warnings[chatId]) warnings[chatId] = {};
            if (!warnings[chatId][userToWarn]) warnings[chatId][userToWarn] = 0;

            warnings[chatId][userToWarn]++;
            fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));

            const warnCount = warnings[chatId][userToWarn];

            const warningMessage =
`╭───❏ 𝚈𝚄𝙽𝙰
│ ⚠️ AVERTISSEMENT
│ 👤 Utilisateur : @${userToWarn.split('@')[0]}
│ 📊 Warnings : ${warnCount}/3
│ 👮 Admin : @${senderId.split('@')[0]}
│ 🕒 Heure : ${new Date().toLocaleString()}
╰────❏
› • Ahhh 🤧`;

            await sock.sendMessage(chatId, {
                text: warningMessage,
                mentions: [userToWarn, senderId]
            });

            // Auto-kick after 3
            if (warnCount >= 3) {

                await new Promise(resolve => setTimeout(resolve, 1000));

                await sock.groupParticipantsUpdate(chatId, [userToWarn], "remove");

                delete warnings[chatId][userToWarn];
                fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));

                const kickMessage =
`╭────❏ 𝚈𝚄𝙽𝙰
│ 🚫 AUTO-KICK
│ @${userToWarn.split('@')[0]}
│ a été retiré après 3 avertissements.
╰────❏
› • Ahhh 🤧`;

                await sock.sendMessage(chatId, {
                    text: kickMessage,
                    mentions: [userToWarn]
                });
            }

        } catch (error) {
            console.error('Error in warn command:', error);

            await sock.sendMessage(chatId, {
                text: '❌ Impossible d’avertir cet utilisateur.'
            });
        }

    } catch (error) {
        console.error('Error in warn command:', error);

        if (error.data === 429) {

            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                await sock.sendMessage(chatId, {
                    text: '⏳ Trop de requêtes. Réessaie dans quelques secondes.'
                });
            } catch {}

        } else {

            try {
                await sock.sendMessage(chatId, {
                    text: '❌ Erreur. Vérifie que le bot est admin.'
                });
            } catch {}
        }
    }
}

module.exports = warnCommand;