import 'dotenv/config';
import { Client, GatewayIntentBits, Message } from 'discord.js';
import { OpenAI } from 'openai';

// Initialize Discord bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY as string,
});

// Bot Ready Event
client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user?.tag}`);
});

// Message Event
client.on('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.content.startsWith('!ask')) return;

    const prompt = message.content.replace('!ask', '').trim();
    if (!prompt) return message.reply('❌ Please provide a question.');

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // or 'gpt-3.5-turbo'
            messages: [{ role: 'user', content: prompt }],
        });

        const reply = response.choices[0]?.message?.content || '❌ Nuh uh, I could not say shit srry.';
        message.reply(reply);
    } catch (error) {
        console.error(error);
        message.reply('⚠️  Nuh uh, I could not say shit srry.');
    }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
