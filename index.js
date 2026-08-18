require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Partials
} = require("discord.js");

const config = require("./config");
const setupLogger = require("./handlers/logger");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration
    ],

    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.GuildMember,
        Partials.User
    ]
});

client.once("ready", () => {
    console.log("========================================");
    console.log("        VANGUARD LSPD LOGGER");
    console.log("========================================");
    console.log(`Bot      : ${client.user.tag}`);
    console.log(`Bot ID   : ${client.user.id}`);
    console.log(`Guild ID : ${config.GUILD_ID}`);
    console.log(`Guilds   : ${client.guilds.cache.size}`);
    console.log("Status   : ONLINE");
    console.log("========================================");
});

setupLogger(client);

client.login(process.env.DISCORD_TOKEN)
    .catch((error) => {
        console.error("❌ Discord login failed:");
        console.error(error);
    });
