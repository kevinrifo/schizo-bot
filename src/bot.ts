import { Client, GatewayIntentBits } from "discord.js";
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!DISCORD_BOT_TOKEN || !OPENROUTER_API_KEY) {
  console.error("❌ Missing DISCORD_BOT_TOKEN or OPENROUTER_API_KEY in .env");
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

// Function to get AI response (handles long messages)
async function getAIResponse(prompt: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1-distill-llama-70b:free", // Free OpenRouter model
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let content = response.choices[0]?.message?.content || "Nuh nuh, could not say that srry.";

    // Split message if longer than 2000 characters
    const MAX_LENGTH = 2000;
    const chunks: string[] = [];

    while (content.length > 0) {
      chunks.push(content.substring(0, MAX_LENGTH));
      content = content.substring(MAX_LENGTH);
    }

    return chunks;
  } catch (error) {
    console.error("❌ Error fetching AI response:", error);
    return ["Error processing request."];
  }
}

// Event: Bot Ready
client.once("ready", () => {
  console.log(`✅ Schizo Bot is online as ${client.user?.tag}!`);
});

// Event: Message Received
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith("!ask")) return; // Ignore bot messages & unrelated messages

  const prompt = message.content.slice(4).trim();
  if (!prompt) {
    return message.reply("❓ Please provide a question after `!ask`.");
  }

  console.log(`📩 Received !ask: ${prompt}`);

  const responses = await getAIResponse(prompt);

  // Send each response separately
  for (const chunk of responses) {
    await message.reply(chunk);
  }
});

// Login to Discord
client.login(DISCORD_BOT_TOKEN);
