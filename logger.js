const {
    EmbedBuilder
} = require("discord.js");

const config = require("../config");

function getLogChannel(guild, channelId) {
    if (!guild || !channelId) return null;

    return guild.channels.cache.get(channelId) || null;
}

async function sendLog(guild, channelId, embed) {
    try {
        const channel = getLogChannel(guild, channelId);

        if (!channel) {
            console.log(`[LOGGER] Channel not found: ${channelId}`);
            return;
        }

        await channel.send({
            embeds: [embed]
        });

    } catch (error) {
        console.error("[LOGGER] Send error:");
        console.error(error);
    }
}

function createEmbed(title, color) {
    return new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .setTimestamp()
        .setFooter({
            text: "Vanguard LSPD Logger"
        });
}

module.exports = function setupLogger(client) {

    /*
    ========================================
    MEMBER JOIN
    ========================================
    */

    client.on("guildMemberAdd", async (member) => {

        const embed = createEmbed(
            "🟢 Member Joined",
            config.COLORS.SUCCESS
        );

        embed.setThumbnail(
            member.user.displayAvatarURL({
                size: 256
            })
        );

        embed.addFields(
            {
                name: "👤 User",
                value: `${member.user}`,
                inline: true
            },
            {
                name: "🏷️ Username",
                value: member.user.tag,
                inline: true
            },
            {
                name: "🆔 User ID",
                value: member.id,
                inline: true
            },
            {
                name: "📅 Account Created",
                value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`,
                inline: false
            }
        );

        await sendLog(
            member.guild,
            config.LOG_CHANNELS.MEMBER,
            embed
        );
    });


    /*
    ========================================
    MEMBER LEAVE
    ========================================
    */

    client.on("guildMemberRemove", async (member) => {

        const embed = createEmbed(
            "🔴 Member Left",
            config.COLORS.ERROR
        );

        embed.addFields(
            {
                name: "👤 User",
                value: member.user
                    ? `${member.user}`
                    : "Unknown",
                inline: true
            },
            {
                name: "🏷️ Username",
                value: member.user?.tag || "Unknown",
                inline: true
            },
            {
                name: "🆔 User ID",
                value: member.id,
                inline: true
            }
        );

        await sendLog(
            member.guild,
            config.LOG_CHANNELS.MEMBER,
            embed
        );
    });


    /*
    ========================================
    MESSAGE DELETE
    ========================================
    */

    client.on("messageDelete", async (message) => {

        if (!message.guild) return;
        if (message.author?.bot) return;

        const embed = createEmbed(
            "🗑️ Message Deleted",
            config.COLORS.ERROR
        );

        embed.addFields(
            {
                name: "👤 Author",
                value: message.author
                    ? `${message.author}`
                    : "Unknown",
                inline: true
            },
            {
                name: "📍 Channel",
                value: `${message.channel}`,
                inline: true
            },
            {
                name: "🆔 Message ID",
                value: message.id,
                inline: true
            },
            {
                name: "📝 Content",
                value: message.content
                    ? message.content.substring(0, 1024)
                    : "Content unavailable",
                inline: false
            }
        );

        await sendLog(
            message.guild,
            config.LOG_CHANNELS.MESSAGE,
            embed
        );
    });


    /*
    ========================================
    MESSAGE EDIT
    ========================================
    */

    client.on("messageUpdate", async (oldMessage, newMessage) => {

        if (!newMessage.guild) return;
        if (newMessage.author?.bot) return;

        if (
            oldMessage.content === newMessage.content
        ) {
            return;
        }

        const embed = createEmbed(
            "✏️ Message Edited",
            config.COLORS.WARNING
        );

        embed.addFields(
            {
                name: "👤 Author",
                value: `${newMessage.author}`,
                inline: true
            },
            {
                name: "📍 Channel",
                value: `${newMessage.channel}`,
                inline: true
            },
            {
                name: "🆔 Message ID",
                value: newMessage.id,
                inline: true
            },
            {
                name: "⬅️ Before",
                value: oldMessage.content
                    ? oldMessage.content.substring(0, 1024)
                    : "Unavailable",
                inline: false
            },
            {
                name: "➡️ After",
                value: newMessage.content
                    ? newMessage.content.substring(0, 1024)
                    : "Unavailable",
                inline: false
            }
        );

        await sendLog(
            newMessage.guild,
            config.LOG_CHANNELS.MESSAGE,
            embed
        );
    });


    /*
    ========================================
    ROLE CREATE
    ========================================
    */

    client.on("roleCreate", async (role) => {

        const embed = createEmbed(
            "🟢 Role Created",
            config.COLORS.SUCCESS
        );

        embed.addFields(
            {
                name: "🎭 Role",
                value: role.name,
                inline: true
            },
            {
                name: "🆔 Role ID",
                value: role.id,
                inline: true
            }
        );

        await sendLog(
            role.guild,
            config.LOG_CHANNELS.ROLE,
            embed
        );
    });


    /*
    ========================================
    ROLE DELETE
    ========================================
    */

    client.on("roleDelete", async (role) => {

        const embed = createEmbed(
            "🔴 Role Deleted",
            config.COLORS.ERROR
        );

        embed.addFields(
            {
                name: "🎭 Role",
                value: role.name,
                inline: true
            },
            {
                name: "🆔 Role ID",
                value: role.id,
                inline: true
            }
        );

        await sendLog(
            role.guild,
            config.LOG_CHANNELS.ROLE,
            embed
        );
    });


    /*
    ========================================
    CHANNEL CREATE
    ========================================
    */

    client.on("channelCreate", async (channel) => {

        if (!channel.guild) return;

        const embed = createEmbed(
            "🟢 Channel Created",
            config.COLORS.SUCCESS
        );

        embed.addFields(
            {
                name: "📁 Channel",
                value: `${channel}`,
                inline: true
            },
            {
                name: "📛 Name",
                value: channel.name,
                inline: true
            },
            {
                name: "🆔 Channel ID",
                value: channel.id,
                inline: true
            }
        );

        await sendLog(
            channel.guild,
            config.LOG_CHANNELS.CHANNEL,
            embed
        );
    });


    /*
    ========================================
    CHANNEL DELETE
    ========================================
    */

    client.on("channelDelete", async (channel) => {

        if (!channel.guild) return;

        const embed = createEmbed(
            "🔴 Channel Deleted",
            config.COLORS.ERROR
        );

        embed.addFields(
            {
                name: "📁 Channel",
                value: channel.name || "Unknown",
                inline: true
            },
            {
                name: "🆔 Channel ID",
                value: channel.id,
                inline: true
            }
        );

        await sendLog(
            channel.guild,
            config.LOG_CHANNELS.CHANNEL,
            embed
        );
    });


    /*
    ========================================
    VOICE UPDATE
    ========================================
    */

    client.on("voiceStateUpdate", async (oldState, newState) => {

        if (
            oldState.channelId === newState.channelId
        ) {
            return;
        }

        const member =
            newState.member ||
            oldState.member;

        if (!member) return;

        let title;
        let description;
        let color;

        /*
        JOIN
        */

        if (
            !oldState.channelId &&
            newState.channelId
        ) {

            title = "🎙️ Voice Joined";
            description =
                `${member} joined **${newState.channel?.name || "Unknown"}**`;

            color = config.COLORS.SUCCESS;
        }

        /*
        LEAVE
        */

        else if (
            oldState.channelId &&
            !newState.channelId
        ) {

            title = "🔇 Voice Left";
            description =
                `${member} left **${oldState.channel?.name || "Unknown"}**`;

            color = config.COLORS.ERROR;
        }

        /*
        MOVE
        */

        else {

            title = "🔄 Voice Channel Changed";

            description =
                `${member} moved from **${oldState.channel?.name || "Unknown"}** to **${newState.channel?.name || "Unknown"}**`;

            color = config.COLORS.INFO;
        }

        const embed = createEmbed(
            title,
            color
        );

        embed.setDescription(description);

        embed.addFields({
            name: "🆔 User ID",
            value: member.id,
            inline: true
        });

        await sendLog(
            member.guild,
            config.LOG_CHANNELS.VOICE,
            embed
        );
    });


    /*
    ========================================
    BOT START LOG
    ========================================
    */

    client.once("ready", async () => {

        const embed = createEmbed(
            "🤖 Logger Started",
            config.COLORS.SUCCESS
        );

        embed.setDescription(
            "Vanguard LSPD Logger is now online."
        );

        embed.addFields(
            {
                name: "🤖 Bot",
                value: `${client.user}`,
                inline: true
            },
            {
                name: "🆔 Bot ID",
                value: client.user.id,
                inline: true
            }
        );

        const guild =
            client.guilds.cache.get(
                config.GUILD_ID
            );

        if (!guild) {
            console.log(
                "[LOGGER] Configured guild not found."
            );
            return;
        }

        await sendLog(
            guild,
            config.LOG_CHANNELS.BOT,
            embed
        );
    });


    console.log("[LOGGER] All handlers loaded.");
};