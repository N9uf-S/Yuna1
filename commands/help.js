const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const { channelInfo } = require('../lib/messageConfig');

async function helpCommand(sock, chatId, message, channelLink) {
    // Dynamic USER
    const userName =
        message?.pushName ||
        message?.key?.participant?.split('@')?.[0] ||
        message?.key?.remoteJid?.split('@')?.[0] ||
        'User';

    // Dynamic MODE (PUBLIC / PRIVATE)
    const rawMode = (settings?.mode ?? settings?.MODE ?? '').toString().trim().toLowerCase();
    const mode = rawMode === 'private' ? 'PRIVATE' : 'PUBLIC';

    // Dynamic PREFIX
    const prefix = (settings?.prefix ?? settings?.PREFIX ?? settings?.handler ?? settings?.HANDLER ?? '.').toString();

    // RAM + Uptime
    const formatBytes = (bytes) => {
        if (!Number.isFinite(bytes) || bytes < 0) return '0 MB';
        const mb = bytes / (1024 * 1024);
        if (mb < 1024) return `${mb.toFixed(1)} MB`;
        return `${(mb / 1024).toFixed(2)} GB`;
    };

    const formatUptime = (seconds) => {
        seconds = Math.max(0, Math.floor(Number(seconds) || 0));
        const d = Math.floor(seconds / 86400);
        seconds %= 86400;
        const h = Math.floor(seconds / 3600);
        seconds %= 3600;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        const parts = [];
        if (d) parts.push(`${d}d`);
        if (h) parts.push(`${h}h`);
        if (m) parts.push(`${m}m`);
        parts.push(`${s}s`);
        return parts.join(' ');
    };

    const ram = formatBytes(process.memoryUsage()?.rss || 0);
    const uptime = formatUptime(process.uptime());

    // Dynamic DATE & TIME
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(':', 'h') + 's';

    // Count total commands
    const commandCount = 101;

    // Get owner from settings
    const ownerName = (settings?.owner ?? settings?.OWNER ?? 'N9uf_S').toString();
    const channelLinkDisplay = channelLink || 'https://whatsapp.com/channel/0029VbD9z1YJf05TqVGLNo3c';

    const helpMessage = `╔═〔 *${ownerName} BOT MENU* 〕
║ ✦ *YUNA Bot*
║ ❐ *Owner* ${ownerName}   ❐ *Préfixe* ${prefix}
║ ❐ *Mode* ${mode.toLowerCase()}   ❐ *Commandes* ${commandCount}
║ ❐ *Uptime* ${uptime}   ❐ *Vitesse* ${process.uptime().toFixed(0)}ms
║ ❐ *Date* ${dateFormatted}   ❐ *Heure* ${timeFormatted}
║ ❐ *Librairie* Baileys ^6.6.0
║ 
║ ┈┈┈┈┈┈┈┈┈┈✧
║ ✦ *GÉNÉRAL*
║ ❐ ${prefix}menu           * ouvrir le menu
║ ❐ ${prefix}ping           * tester la latence
║ ❐ ${prefix}alive          * voir le statut du bot
║ ❐ ${prefix}infos          * voir les infos
║ ❐ ${prefix}owner          * voir le propriétaire
║ ❐ ${prefix}fact           * fait aléatoire
║ ❐ ${prefix}jid            * voir les identifiants
║ 
║ ┈┈┈┈┈┈┈┈┈┈✧
║ 🛡️ *GROUPE*
║ ❐ ${prefix}promote        * promouvoir
║ ❐ ${prefix}demote         * rétrograder
║ ❐ ${prefix}kick           * retirer
║ ❐ ${prefix}ban            * bannir et expulser
║ ❐ ${prefix}unban          * retirer le ban
║ ❐ ${prefix}admins         * voir les admins
║ ❐ ${prefix}tagall         * mentionner tout le monde
║ ❐ ${prefix}tag            * annoncer avec mention
║ ❐ ${prefix}hidetag        * mention discrète
║ ❐ ${prefix}warn           * avertir
║ ❐ ${prefix}warns          * voir les warns
║ ❐ ${prefix}clearwarns     * effacer les warns
║ ❐ ${prefix}antilink       * bloquer les liens
║ ❐ ${prefix}antimarabout   * filtrer les marabouts
║ ❐ ${prefix}antibadwords   * filtrer les insultes
║ ❐ ${prefix}welcome        * message d'arrivée
║ ❐ ${prefix}goodbye        * message de départ
║ ❐ ${prefix}mute           * fermer le groupe
║ ❐ ${prefix}unmute         * rouvrir le groupe
║ ❐ ${prefix}delete         * supprimer un message
║ 
║ ┈┈┈┈┈┈┈┈┈┈✧
║ ⚙️ *UTILITAIRES*
║ ❐ ${prefix}sticker        * créer un sticker
║ ❐ ${prefix}take           * renommer un sticker
║ ❐ ${prefix}play           * audio YouTube
║ ❐ ${prefix}meteo          * météo
║ ❐ ${prefix}translate      * traduire du texte
║ ❐ ${prefix}lyrics         * chercher des paroles
║ ❐ ${prefix}url            * extraire les liens
║ ❐ ${prefix}pinterest      * images Pinterest
║ 
║ ┈┈┈┈┈┈┈┈┈┈✧
║ 🎉 *FUN*
║ ❐ ${prefix}joke           * blague
║ ❐ ${prefix}quote          * citation
║ ❐ ${prefix}meme           * meme
║ ❐ ${prefix}8ball          * réponse aléatoire
║ ❐ ${prefix}truth          * question vérité
║ ❐ ${prefix}dare           * défi aléatoire
║ ❐ ${prefix}compliment     * compliment
║ ❐ ${prefix}flirt          * phrase de flirt
║ ❐ ${prefix}insult         * insulte légère
║ ❐ ${prefix}ship           * compatibilité
║ ❐ ${prefix}simp           * niveau simp
║ ❐ ${prefix}stupid         * commande fun
║ ❐ ${prefix}goodnight      * souhaiter bonne nuit
║ ❐ ${prefix}roseday        * message rose
║ ❐ ${prefix}shayari        * texte poétique
║ 
║ ┈┈┈┈┈┈┈┈┈┈✧
║ 🎌 *ANIME & MANGA*
║ ❐ ${prefix}anime          * recommandations
║ ❐ ${prefix}anime quote    * citation anime
║ 
║ ┈┈┈┈┈┈┈┈┈┈✧
║ 🛍️ *SERVICES*
║ ❐ ${prefix}services       * voir tous les services
║ ❐ ${prefix}services info <id>   * détails d'un service
║ ❐ ${prefix}services commander <id> * commander un service
║ ❐ ${prefix}services mescommandes * historique des commandes
║ ❐ ${prefix}services profil * voir son profil client
║ ❐ ${prefix}services categorie <nom> * filtrer par catégorie
║ 
║ ┈┈┈┈┈┈┈┈┈┈✧
║ 🤖 *BOT*
║ ❐ ${prefix}mode           * public ou private
║ ❐ ${prefix}setprefix      * changer le préfixe
╚════════════
┈┈┈┈┈┈┈┈┈┈✧
♛ *Owner* : ${ownerName}
🎵 *Chaîne* : ${channelLinkDisplay}

> 𝙽𝟿𝚞𝚏_𝚂 𝚋𝚢 𝚈𝚄𝙽𝙰`;

    try {
        const imgPath = path.join(__dirname, '..', 'assets', 'bot_image.jpg');
        const img = fs.existsSync(imgPath) ? fs.readFileSync(imgPath) : null;

        if (img) {
            await sock.sendMessage(
                chatId,
                { image: img, caption: helpMessage, ...channelInfo },
                { quoted: message }
            );
        } else {
            await sock.sendMessage(
                chatId,
                { text: helpMessage, ...channelInfo },
                { quoted: message }
            );
        }
    } catch (e) {
        await sock.sendMessage(
            chatId,
            { text: helpMessage, ...channelInfo },
            { quoted: message }
        );
    }
}

module.exports = helpCommand;
