# 🎁 Gift Check Bot (Telegram)

Un bot Telegram en **TypeScript** qui surveille les **gifts achetables en Stars** et t'envoie une **notification** dès qu'un **nouveau gift** apparaît.

## ✨ Fonctionnalités
- Commandes utilitaires : `/me` (pour récupérer ton CHAT_ID), `/ping`
- Polling périodique du catalogue des gifts via Bot API
- Détection des **nouveaux gifts** et envoi d'un message détaillé :
    - `star_count` (prix en Stars)
    - `upgrade_star_count` (si dispo)
    - `limited remaining/total` (si limité)

---

## 🚀 Démarrage rapide

### 1) Prérequis
- Node.js **>= 18**
- Un bot Telegram (crée-le via **@BotFather**) → `BOT_TOKEN`

### 2) Installation
```bash
npm install
cp .env.example .env
