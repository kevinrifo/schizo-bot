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
  baseURL: "https://openrouter.ai/api/v1",
});

// Store the conversation context for each user
const userConversations: Record<string, string[]> = {};

// Function to get AI response (with conversation context)
async function getAIResponse(userId: string, prompt: string): Promise<string[]> {
  
  try {
    // Retrieve the conversation history for the user (if any)
    const conversationHistory = userConversations[userId] || [];

    // Add the new user prompt to the conversation history
    conversationHistory.push(`User: ${prompt}`);

    // Limit the conversation context to avoid excessive length
    const context = conversationHistory.slice(-5).join("\n"); // Limit to last 5 messages

    // Send the entire conversation context to the model
    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1-distill-llama-70b:free",
      messages: [{ role: "user", content: context }],
      temperature: 0.1,
      max_tokens: 1000, // Allow longer responses
    });

    let content = response.choices[0]?.message?.content || "Sorry, I couldn't process that.";

    // Save the AI response to the conversation history
    conversationHistory.push(`AI: ${content}`);
    userConversations[userId] = conversationHistory;

    // Ensure message fits within Discord limits without cutting words
    return splitMessage(content, 2000);
  } catch (error) {
    console.error("❌ Error fetching AI response:", error);
    return ["Error processing request."];
  }
}

// Splits long text into chunks at natural breakpoints
function splitMessage(text: string, maxLength: number): string[] {
  const messages: string[] = [];
  
  while (text.length > maxLength) {
    let breakpoint = text.lastIndexOf("\n", maxLength); // Prefer breaking at a newline
    if (breakpoint === -1) breakpoint = text.lastIndexOf(". ", maxLength); // Try after a period
    if (breakpoint === -1) breakpoint = text.lastIndexOf(", ", maxLength); // Try after a comma
    if (breakpoint === -1) breakpoint = maxLength; // If no good breakpoint, split at maxLength

    messages.push(text.substring(0, breakpoint + 1).trim());
    text = text.substring(breakpoint + 1).trim();
  }

  if (text.length > 0) {
    messages.push(text); // Add the remaining text
  }

  return messages;
}


// Event: Bot Ready
client.once("ready", () => {
  console.log(`✅ Schizo Bot is online as ${client.user?.tag}!`);
});

// Event: Message Received
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!forget")) {
    userConversations[message.author.id] = []; //Clear history
    await message.reply("🧹 Ok, I dont remember anything you said before now, AMA!");
    return;
  }

  if (message.author.bot || !message.content.startsWith("!ask")) return;

  const prompt = message.content.slice(4).trim();
  if (!prompt) {
    return message.reply("❓ Please provide a question after `!ask`.");
  }

  console.log(`📩 Received !ask: ${prompt}`);

  const responses = await getAIResponse(message.author.id, prompt);

  // Send each response separately
  for (const chunk of responses) {
    await message.reply(chunk);
  }
});

// Login to Discord
client.login(DISCORD_BOT_TOKEN);