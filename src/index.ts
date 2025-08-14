import dotenv from "dotenv";
dotenv.config();
import { Bot } from 'grammy';

// --- ENV ---
const BOT_TOKEN = process.env.BOT_TOKEN!;
const CHAT_ID = process.env.CHAT_ID; // peut être vide au 1er run
const POLL_MIN = Math.max(Number(process.env.POLL_INTERVAL_MINUTES ?? 10), 2);

// --- Bot ---
const bot = new Bot(BOT_TOKEN);

// Commande utilitaire pour récupérer ton CHAT_ID
bot.command('me', async (ctx) => {
    const id = ctx.chat?.id;
    await ctx.reply(`Ton CHAT_ID: ${id}`);
});

// Ping de test
bot.command('ping', (ctx) => ctx.reply('pong ✅'));

// ----- Types de réponse des gifts (Bot API) -----
type Gift = {
    id: string; // Bot API: string
    star_count: number;
    upgrade_star_count?: number;
    total_count?: number;
    remaining_count?: number;
    // sticker?: any; // dispo si besoin plus tard
};

// Récupère la liste complète des gifts
async function fetchGifts(): Promise<Gift[]> {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getAvailableGifts`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json.ok) {
        console.error('getAvailableGifts failed:', json);
        return [];
    }
    const gifts = (json.result?.gifts ?? json.result ?? []) as Gift[];
    return Array.isArray(gifts) ? gifts : [];
}

// Mise en forme d'une ligne lisible
function formatGiftLine(g: Gift): string {
    const limited =
        g.total_count && g.remaining_count != null
            ? ` (limited ${g.remaining_count}/${g.total_count})`
            : '';
    const upgrade =
        typeof g.upgrade_star_count === 'number' ? `, upgrade: ${g.upgrade_star_count} ⭐` : '';
    return `• ${g.star_count} ⭐ — id: ${g.id}${limited}${upgrade}`;
}

// Cache en mémoire des IDs connus
let cachedGiftIds = new Set<string>();

async function checkGiftsAndNotify() {
    try {
        const gifts = await fetchGifts();
        if (!gifts.length) return;

        // 1er run : on remplit le cache sans notifier pour éviter un spam initial
        if (cachedGiftIds.size === 0) {
            cachedGiftIds = new Set(gifts.map((g) => g.id));
            return;
        }

        // Nouveautés
        const newOnes = gifts.filter((g) => !cachedGiftIds.has(g.id));
        if (newOnes.length && CHAT_ID) {
            newOnes.sort((a, b) => a.star_count - b.star_count);
            const lines = newOnes.map(formatGiftLine).join('\n');
            await bot.api.sendMessage(
                CHAT_ID,
                `🆕 Nouveaux gifts Stars:\n${lines}`
            );
        }

        // Met à jour le cache
        cachedGiftIds = new Set(gifts.map((g) => g.id));
    } catch (e) {
        console.error('checkGiftsAndNotify error:', e);
    }
}

// Planifie le check périodique
setInterval(checkGiftsAndNotify, POLL_MIN * 60 * 1000);

// Envoie un message de démarrage si CHAT_ID connu
(async () => {
    try {
        if (CHAT_ID) {
            await bot.api.sendMessage(CHAT_ID, 'Bot démarré ✅ Je te notifierai pour les nouveaux gifts.');
        }
    } catch (e) {
        console.warn("Impossible d'envoyer le message de démarrage:", e);
    }
})();

// Lance le polling des updates (long-polling, pratique sur Railway)
bot.start();

// Lance une 1ère vérification au boot
checkGiftsAndNotify();
