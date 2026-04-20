const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const { channelInfo } = require('../lib/messageConfig');

// Fichier de stockage des services
const servicesFilePath = path.join(__dirname, '..', 'data', 'services.json');

// Charger les services depuis le fichier JSON
function loadServices() {
    try {
        if (fs.existsSync(servicesFilePath)) {
            const data = fs.readFileSync(servicesFilePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des services:', error);
    }
    return {
        services: [
            { id: 1, name: 'Création de logo', price: 5000, description: 'Design professionnel de logo pour votre entreprise', category: 'design' },
            { id: 2, name: 'Gestion réseaux sociaux', price: 15000, description: 'Gestion complète de vos comptes sociaux pendant 1 mois', category: 'marketing' },
            { id: 3, name: 'Développement site web', price: 50000, description: 'Création d\'un site web vitrine professionnel', category: 'development' },
            { id: 4, name: 'Montage vidéo', price: 10000, description: 'Montage professionnel de vidéos (jusqu\'à 5 min)', category: 'video' },
            { id: 5, name: 'Rédaction de contenu', price: 7500, description: 'Rédaction d\'articles optimisés SEO (500 mots)', category: 'redaction' },
            { id: 6, name: 'Consulting business', price: 20000, description: 'Session de consulting d\'1 heure pour votre projet', category: 'consulting' }
        ],
        orders: [],
        clients: {}
    };
}

// Sauvegarder les services dans le fichier JSON
function saveServices(data) {
    try {
        fs.writeFileSync(servicesFilePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des services:', error);
        return false;
    }
}

// Formater le prix en FCFA
function formatPrice(price) {
    return `${price.toLocaleString()} FCFA`;
}

// Commande principale pour afficher les services
async function servicesCommand(sock, chatId, message, args, channelLink) {
    const userName = message?.pushName || 'Client';
    const userJid = message?.key?.remoteJid || message?.key?.participant;
    const prefix = settings.prefix || '.';
    
    const servicesData = loadServices();
    
    // Sous-commandes
    if (args.length > 0) {
        const subCommand = args[0].toLowerCase();
        
        // Afficher un service spécifique
        if (subCommand === 'info' && args[1]) {
            const serviceId = parseInt(args[1]);
            const service = servicesData.services.find(s => s.id === serviceId);
            
            if (!service) {
                await sock.sendMessage(chatId, {
                    text: `❌ Service n°${serviceId} introuvable.\n\nUtilisez *${prefix}services* pour voir la liste complète.`,
                    ...channelInfo
                }, { quoted: message });
                return;
            }
            
            const serviceMessage = `╭━━━〔 📋 DÉTAILS DU SERVICE 〕━━━╮\n┃\n┃ 🔖 *Nom:* ${service.name}\n┃ 💰 *Prix:* ${formatPrice(service.price)}\n┃ 📁 *Catégorie:* ${service.category.toUpperCase()}\n┃\n┃ 📝 *Description:*\n┃ ${service.description}\n┃\n┃ ━━━━━━━━━━━━━━━━━━━━━\n┃ 💡 Pour commander:\n┃ *${prefix}commander ${service.id}*\n╰━━━〔 ✨ YUNA SERVICES 〕━━━╯`;
            
            await sock.sendMessage(chatId, {
                text: serviceMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363403933773291@newsletter',
                        newsletterName: 'YUNA SERVICES',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
            return;
        }
        
        // Commander un service
        if (subCommand === 'commander' && args[1]) {
            const serviceId = parseInt(args[1]);
            const service = servicesData.services.find(s => s.id === serviceId);
            
            if (!service) {
                await sock.sendMessage(chatId, {
                    text: `❌ Service n°${serviceId} introuvable.`,
                    ...channelInfo
                }, { quoted: message });
                return;
            }
            
            // Créer ou mettre à jour le client
            if (!servicesData.clients[userJid]) {
                servicesData.clients[userJid] = {
                    jid: userJid,
                    name: userName,
                    joinDate: new Date().toISOString(),
                    totalOrders: 0,
                    totalSpent: 0
                };
            }
            
            // Créer une nouvelle commande
            const orderId = `CMD-${Date.now()}`;
            const order = {
                orderId,
                clientId: userJid,
                clientName: userName,
                serviceId: service.id,
                serviceName: service.name,
                price: service.price,
                status: 'en_attente',
                date: new Date().toISOString(),
                chatId
            };
            
            servicesData.orders.push(order);
            servicesData.clients[userJid].totalOrders++;
            saveServices(servicesData);
            
            const orderMessage = `╭━━━〔 ✅ COMMANDE CRÉÉE 〕━━━╮\n┃\n┃ 🎉 Merci ${userName}!\n┃\n┃ 📦 *Détails de la commande:*\n┃ ━━━━━━━━━━━━━━━━━━━━━\n┃ 🔢 *ID:* ${orderId}\n┃ 🏷️ *Service:* ${service.name}\n┃ 💰 *Prix:* ${formatPrice(service.price)}\n┃ 📊 *Statut:* EN ATTENTE\n┃\n┃ ━━━━━━━━━━━━━━━━━━━━━\n┃ 📞 *Prochaines étapes:*\n┃ Un membre de notre équipe\n┃ vous contactera bientôt\n┃ pour finaliser votre commande.\n┃\n┃ 💳 Paiement à la livraison\n┃ ou par mobile money.\n╰━━━〔 🚀 YUNA SERVICES 〕━━━╯`;
            
            await sock.sendMessage(chatId, {
                text: orderMessage,
                ...channelInfo
            }, { quoted: message });
            
            // Notification au propriétaire
            const ownerNotification = `🔔 *NOUVELLE COMMANDE!*\n\n👤 Client: ${userName}\n📦 Service: ${service.name}\n💰 Prix: ${formatPrice(service.price)}\n🔢 ID: ${orderId}\n\nConnectez-vous pour gérer la commande.`;
            
            try {
                await sock.sendMessage(settings.ownerNumber + '@s.whatsapp.net', {
                    text: ownerNotification
                });
            } catch (e) {
                console.log('Impossible d\'envoyer la notification au propriétaire');
            }
            
            return;
        }
        
        // Voir mes commandes
        if (subCommand === 'mescommandes' || subCommand === 'commandes') {
            const clientOrders = servicesData.orders.filter(o => o.clientId === userJid);
            
            if (clientOrders.length === 0) {
                await sock.sendMessage(chatId, {
                    text: `📭 Vous n'avez aucune commande pour le moment.\n\nUtilisez *${prefix}services* pour découvrir nos offres!`,
                    ...channelInfo
                }, { quoted: message });
                return;
            }
            
            let ordersList = `╭━━━〔 📦 MES COMMANDES 〕━━━╮\n┃\n┃ 👤 ${userName}\n┃ ━━━━━━━━━━━━━━━━━━━━━\n\n`;
            
            clientOrders.slice(-5).reverse().forEach((order, index) => {
                const statusEmoji = {
                    'en_attente': '⏳',
                    'en_cours': '🔄',
                    'terminée': '✅',
                    'annulée': '❌'
                }[order.status] || '📦';
                
                ordersList += `${index + 1}. ${statusEmoji} *${order.serviceName}*\n   └─ 💰 ${formatPrice(order.price)} | ${order.status}\n   └─ 🔢 ${order.orderId}\n\n`;
            });
            
            ordersList += `╰━━━〔 💎 YUNA SERVICES 〕━━━╯`;
            
            await sock.sendMessage(chatId, {
                text: ordersList,
                ...channelInfo
            }, { quoted: message });
            return;
        }
        
        // Voir le profil client
        if (subCommand === 'profil' || subCommand === 'profile') {
            const client = servicesData.clients[userJid];
            
            if (!client) {
                await sock.sendMessage(chatId, {
                    text: `👤 *Profil Client*\n\nVous n'avez pas encore de profil.\nPassez une commande pour commencer!`,
                    ...channelInfo
                }, { quoted: message });
                return;
            }
            
            const profileMessage = `╭━━━〔 👤 PROFIL CLIENT 〕━━━╮\n┃\n┃ 🏷️ *Nom:* ${client.name}\n┃ 📅 *Membre depuis:* ${new Date(client.joinDate).toLocaleDateString('fr-FR')}\n┃\n┃ ━━━━━━━━━━━━━━━━━━━━━\n┃\n┃ 📊 *STATISTIQUES:*\n┃ ━━━━━━━━━━━━━━━━━━━━━\n┃ 🛒 Commandes: ${client.totalOrders}\n┃ 💰 Total dépensé: ${formatPrice(client.totalSpent)}\n┃\n┃ ━━━━━━━━━━━━━━━━━━━━━\n┃ 🎁 Fidélité: ${client.totalOrders >= 5 ? '⭐⭐⭐ OR' : client.totalOrders >= 3 ? '⭐⭐ ARGENT' : client.totalOrders >= 1 ? '⭐ BRONZE' : 'Nouveau'}\n╰━━━〔 💎 YUNA SERVICES 〕━━━╯`;
            
            await sock.sendMessage(chatId, {
                text: profileMessage,
                ...channelInfo
            }, { quoted: message });
            return;
        }
        
        // Recherche de services par catégorie
        if (subCommand === 'categorie' || subCommand === 'category') {
            const category = args[2] ? args[2].toLowerCase() : '';
            const categories = [...new Set(servicesData.services.map(s => s.category))];
            
            if (!category) {
                let catList = `╭━━━〔 📁 CATÉGORIES 〕━━━╮\n┃\n`;
                categories.forEach(cat => {
                    const count = servicesData.services.filter(s => s.category === cat).length;
                    catList += `┃ • ${cat.toUpperCase()} (${count})\n`;
                });
                catList += `\n┃ ━━━━━━━━━━━━━━━━━━━━━\n┃ Utilisez:\n┃ ${prefix}services categorie <nom>\n╰━━━〔 🔍 YUNA SERVICES 〕━━━╯`;
                
                await sock.sendMessage(chatId, { text: catList, ...channelInfo }, { quoted: message });
                return;
            }
            
            const filteredServices = servicesData.services.filter(s => s.category === category);
            
            if (filteredServices.length === 0) {
                await sock.sendMessage(chatId, {
                    text: `❌ Aucune service trouvé dans la catégorie "${category}".\n\nCatégories disponibles: ${categories.join(', ')}`,
                    ...channelInfo
                }, { quoted: message });
                return;
            }
            
            let catServices = `╭━━━〔 📁 ${category.toUpperCase()} 〕━━━╮\n┃\n`;
            filteredServices.forEach(service => {
                catServices += `┃ ${service.id}. ${service.name}\n┃   └─ 💰 ${formatPrice(service.price)}\n┃\n`;
            });
            catServices += `╰━━━〔 🛒 YUNA SERVICES 〕━━━╯`;
            
            await sock.sendMessage(chatId, { text: catServices, ...channelInfo }, { quoted: message });
            return;
        }
    }
    
    // Affichage principal de tous les services
    let servicesMessage = `╭━━━〔 🛍️ YUNA SERVICES 〕━━━╮\n┃\n┃ 👋 Bonjour ${userName}!\n┃ Bienvenue dans notre boutique\n┃\n┃ ━━━━━━━━━━━━━━━━━━━━━\n┃\n┃ 📋 *LISTE DES SERVICES:*\n┃ ━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Grouper par catégorie
    const categories = {};
    servicesData.services.forEach(service => {
        if (!categories[service.category]) {
            categories[service.category] = [];
        }
        categories[service.category].push(service);
    });
    
    for (const [category, services] of Object.entries(categories)) {
        const categoryEmoji = {
            'design': '🎨',
            'marketing': '📱',
            'development': '💻',
            'video': '🎬',
            'redaction': '✍️',
            'consulting': '💼'
        }[category] || '📦';
        
        servicesMessage += `┃ ${categoryEmoji} *${category.toUpperCase()}*\n┃ ─────────────────────\n`;
        
        services.forEach(service => {
            servicesMessage += `┃ ${service.id}. ${service.name}\n┃   └─ 💰 ${formatPrice(service.price)}\n`;
        });
        
        servicesMessage += '\n';
    }
    
    servicesMessage += `┃ ━━━━━━━━━━━━━━━━━━━━━\n┃\n┃ 💡 *COMMANDES:*\n┃ ${prefix}services info <id>\n┃ ${prefix}services commander <id>\n┃ ${prefix}services mescommandes\n┃ ${prefix}services profil\n┃ ${prefix}services categorie <nom>\n┃\n┃ ━━━━━━━━━━━━━━━━━━━━━\n┃ 📞 Contact: ${settings.botOwner}\n╰━━━〔 ✨ YUNA BOT 〕━━━╯`;
    
    try {
        const imgPath = path.join(__dirname, '..', 'assets', 'bot_image.jpg');
        const img = fs.existsSync(imgPath) ? fs.readFileSync(imgPath) : null;
        
        if (img) {
            await sock.sendMessage(chatId, {
                image: img,
                caption: servicesMessage,
                ...channelInfo
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: servicesMessage,
                ...channelInfo
            }, { quoted: message });
        }
    } catch (e) {
        await sock.sendMessage(chatId, {
            text: servicesMessage,
            ...channelInfo
        }, { quoted: message });
    }
}

// Commande admin pour gérer les services (ajout, modification, suppression)
async function manageServicesCommand(sock, chatId, message, args, senderJid) {
    const settings = require('../settings');
    const { isOwner } = require('../lib/isOwner');
    
    // Vérifier si c'est le propriétaire
    if (!isOwner(senderJid, settings.ownerNumber)) {
        await sock.sendMessage(chatId, {
            text: '❌ Cette commande est réservée au propriétaire uniquement.'
        }, { quoted: message });
        return;
    }
    
    const servicesData = loadServices();
    
    if (args.length === 0) {
        const helpMessage = `╭━━━〔 🔧 GESTION SERVICES 〕━━━╮\n┃\n┃ *COMMANDES ADMIN:*\n┃ ━━━━━━━━━━━━━━━━━━━━━\n┃ ${settings.prefix}addservice <nom> <prix> <desc> <cat>\n┃ ${settings.prefix}removeservice <id>\n┃ ${settings.prefix}updateservice <id> <champ> <valeur>\n┃ ${settings.prefix}listorders [all|pending|done]\n┃ ${settings.prefix}updateorder <id> <statut>\n┃\n┃ ━━━━━━━━━━━━━━━━━━━━━\n┃ Statuts: en_attente, en_cours,\n┃          terminée, annulée\n╰━━━〔 ⚙️ YUNA ADMIN 〕━━━╯`;
        
        await sock.sendMessage(chatId, { text: helpMessage }, { quoted: message });
        return;
    }
    
    const action = args[0].toLowerCase();
    
    // Ajouter un service
    if (action === 'addservice') {
        if (args.length < 5) {
            await sock.sendMessage(chatId, {
                text: `❌ Usage: ${settings.prefix}addservice <nom> <prix> <description> <categorie>`
            }, { quoted: message });
            return;
        }
        
        const name = args[1];
        const price = parseInt(args[2]);
        const description = args.slice(3, -1).join(' ');
        const category = args[args.length - 1].toLowerCase();
        
        const newId = servicesData.services.length > 0 
            ? Math.max(...servicesData.services.map(s => s.id)) + 1 
            : 1;
        
        servicesData.services.push({
            id: newId,
            name,
            price,
            description,
            category
        });
        
        saveServices(servicesData);
        
        await sock.sendMessage(chatId, {
            text: `✅ Service ajouté avec succès!\n\n🏷️ ${name}\n💰 ${formatPrice(price)}\n📁 ${category}`
        }, { quoted: message });
        return;
    }
    
    // Supprimer un service
    if (action === 'removeservice') {
        const serviceId = parseInt(args[1]);
        const index = servicesData.services.findIndex(s => s.id === serviceId);
        
        if (index === -1) {
            await sock.sendMessage(chatId, {
                text: `❌ Service n°${serviceId} introuvable.`
            }, { quoted: message });
            return;
        }
        
        const removed = servicesData.services.splice(index, 1)[0];
        saveServices(servicesData);
        
        await sock.sendMessage(chatId, {
            text: `🗑️ Service supprimé:\n${removed.name}`
        }, { quoted: message });
        return;
    }
    
    // Lister les commandes
    if (action === 'listorders') {
        const filter = args[1] || 'all';
        let filteredOrders = servicesData.orders;
        
        if (filter === 'pending') {
            filteredOrders = servicesData.orders.filter(o => o.status === 'en_attente');
        } else if (filter === 'done') {
            filteredOrders = servicesData.orders.filter(o => o.status === 'terminée');
        }
        
        if (filteredOrders.length === 0) {
            await sock.sendMessage(chatId, {
                text: '📭 Aucune commande trouvée.'
            }, { quoted: message });
            return;
        }
        
        let ordersList = `╭━━━〔 📦 COMMANDES (${filter}) 〕━━━╮\n\n`;
        filteredOrders.slice(-10).reverse().forEach((order, i) => {
            ordersList += `${i + 1}. ${order.orderId}\n   👤 ${order.clientName}\n   📦 ${order.serviceName}\n   💰 ${formatPrice(order.price)}\n   📊 ${order.status}\n\n`;
        });
        
        await sock.sendMessage(chatId, { text: ordersList }, { quoted: message });
        return;
    }
    
    // Mettre à jour le statut d'une commande
    if (action === 'updateorder') {
        const orderId = args[1];
        const newStatus = args.slice(2).join(' ').toLowerCase();
        
        const order = servicesData.orders.find(o => o.orderId === orderId);
        
        if (!order) {
            await sock.sendMessage(chatId, {
                text: `❌ Commande ${orderId} introuvable.`
            }, { quoted: message });
            return;
        }
        
        const validStatuses = ['en_attente', 'en_cours', 'terminée', 'annulée'];
        if (!validStatuses.includes(newStatus)) {
            await sock.sendMessage(chatId, {
                text: `❌ Statut invalide.\nStatuts valides: ${validStatuses.join(', ')}`
            }, { quoted: message });
            return;
        }
        
        order.status = newStatus;
        saveServices(servicesData);
        
        // Mettre à jour le total dépensé du client si la commande est terminée
        if (newStatus === 'terminée' && servicesData.clients[order.clientId]) {
            servicesData.clients[order.clientId].totalSpent += order.price;
            saveServices(servicesData);
        }
        
        await sock.sendMessage(chatId, {
            text: `✅ Commande ${orderId} mise à jour:\n📊 Nouveau statut: ${newStatus}`
        }, { quoted: message });
        
        //Notifier le client
        try {
            const statusEmoji = {
                'en_attente': '⏳',
                'en_cours': '🔄',
                'terminée': '✅',
                'annulée': '❌'
            }[newStatus];
            
            await sock.sendMessage(order.chatId, {
                text: `📦 *Mise à jour de votre commande*\n\n${statusEmoji} Votre commande ${orderId} est maintenant: *${newStatus.toUpperCase()}*\n\nMerci de votre confiance!`
            });
        } catch (e) {
            console.log('Impossible de notifier le client');
        }
        
        return;
    }
    
    await sock.sendMessage(chatId, {
        text: `❌ Commande inconnue. Utilisez ${settings.prefix}manageservices pour voir l'aide.`
    }, { quoted: message });
}

module.exports = { servicesCommand, manageServicesCommand };
