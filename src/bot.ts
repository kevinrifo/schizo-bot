import { Client, GatewayIntentBits } from "discord.js";
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!DISCORD_BOT_TOKEN || !OPENROUTER_API_KEY) {
  console.error("Missing DISCORD_BOT_TOKEN or OPENROUTER_API_KEY in .env");
  process.exit(1);
}

// Initialize Discord bot
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Initialize OpenRouter API
const openai = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1", // OpenRouter API URL
});

// Function to get AI response
async function getAIResponse(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1-distill-llama-70b:free", // Change this to any available OpenRouter model
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "Nuh nuh, could not say that srry.";
  } catch (error) {
    console.error("Error fetching AI response:", error);
    return "Error processing request.";
  }
}

// Event: Bot Ready
client.once("ready", () => {
  console.log(`🤖 Schizo Bot is online as ${client.user?.tag}!`);
});

// Event: Message Received
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith("!ask")) return; // Ignore bot messages & messages without !ask

  const prompt = message.content.slice(4).trim(); // Remove "!ask" from the message
  if (!prompt) {
    return message.reply("Please provide a question after `!ask`.");
  }

  console.log(`📩 Received !ask: ${prompt}`);

  const response = await getAIResponse(prompt);
  message.reply(response);
});

// Login to Discord
client.login(DISCORD_BOT_TOKEN);