const settings = {
  packname: '𝚈𝚄𝙽𝙰',
  author: 'N9uf_S',
  botName: "𝚈𝚄𝙽𝙰",
  botOwner: 'N9uf_S', // ton nom
  ownerNumber: '2250160098804', //Saisissez votre numéro ici, sans le symbole +. Indiquez simplement l'indicatif du pays et le numéro, sans espace.
  giphyApiKey: 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode: "private",
  maxStoreMessages: 20, 
  storeWriteInterval: 10000,
  description: "Bot WhatsApp Multi-Device pour la gestion de groupes et l’automatisation.",
  version: "3.0.2",
  updateZipUrl: "https://github.com/N9uf_S/𝚈𝚄𝙽𝙰/archive/refs/heads/main.zip",
};

module.exports = settings;


// ajouté vautre prefix setting
module.exports.prefix = process.env.PREFIX || '.';

// Anti-mention de masse (suppression auto)
module.exports.antiMention = { enabled: false, threshold: 5, adminBypass: true };
//N9uf_S 💻