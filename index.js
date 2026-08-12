require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    AuditLogEvent,
    ActivityType
} = require("discord.js");

const config = require("./config");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates
    ],

    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.GuildMember,
        Partials.User
    ]
});


/* =====================================================
                     LOG FUNCTION
===================================================== */

function sendLog(guild, channelId, embed) {

    if (!guild) return;

    if (!channelId) {
        console.log("[LOG] Channel ID is empty.");
        return;
    }

    const channel = guild.channels.cache.get(channelId);

    if (!channel) {
        console.log(
            `[LOG] Channel not found: ${channelId}`
        );
        return;
    }

    channel.send({
        embeds: [embed]
    }).catch(error => {

        console.log(
            "[LOG ERROR]",
            error.message
        );

    });
}


/* =====================================================
                    EMBED FUNCTION
===================================================== */

function createEmbed(title, description) {

    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description || "اطلاعاتی وجود ندارد")
        .setTimestamp()
        .setFooter({
            text: "LSPD Vanguard Logger"
        });
}


/* =====================================================
                   AUDIT LOG FUNCTION
===================================================== */

async function getAuditExecutor(
    guild,
    auditType,
    targetId
) {

    try {

        const auditLogs =
            await guild.fetchAuditLogs({
                type: auditType,
                limit: 10
            });

        const entry =
            auditLogs.entries.find(entry => {

                if (!entry.target) {
                    return false;
                }

                return (
                    entry.target.id === targetId &&
                    Date.now() - entry.createdTimestamp < 10000
                );
            });

        if (!entry) {
            return null;
        }

        if (!entry.executor) {
            return null;
        }

        return entry.executor;

    } catch (error) {

        console.log(
            "[AUDIT ERROR]",
            error.message
        );

        return null;
    }
}


/* =====================================================
                         READY
===================================================== */

client.once("ready", () => {

    console.log("");
    console.log("======================================");
    console.log("        LSPD VANGUARD LOGGER");
    console.log("======================================");

    console.log(
        `Bot: ${client.user.tag}`
    );

    console.log(
        `Servers: ${client.guilds.cache.size}`
    );

    console.log(
        "Status: ONLINE"
    );

    console.log("======================================");
    console.log("");

    client.user.setPresence({

        activities: [
            {
                name: "LSPD Vanguard Logs",
                type: ActivityType.Watching
            }
        ],

        status: "online"
    });
});


/* =====================================================
                    MEMBER JOIN
===================================================== */

client.on(
    "guildMemberAdd",
    member => {

        const embed = createEmbed(
            "🟢 MEMBER JOINED",

            `**Member:** ${member.user}\n` +
            `**Username:** \`${member.user.tag}\`\n` +
            `**ID:** \`${member.id}\`\n\n` +

            `**Account Created:** ` +
            `<t:${Math.floor(
                member.user.createdTimestamp / 1000
            )}:F>\n\n` +

            `**Server Members:** ` +
            `${member.guild.memberCount}`
        );

        embed.setThumbnail(
            member.user.displayAvatarURL({
                size: 256
            })
        );

        sendLog(
            member.guild,
            config.logs.member,
            embed
        );
    }
);


/* =====================================================
                    MEMBER LEAVE / KICK
===================================================== */

client.on(
    "guildMemberRemove",
    async member => {

        const executor =
            await getAuditExecutor(
                member.guild,
                AuditLogEvent.MemberKick,
                member.id
            );

        /*
         * اگر Executor پیدا شود،
         * یعنی احتمال زیاد Kick شده است.
         */

        if (executor) {

            const embed = createEmbed(
                "👢 MEMBER KICKED",

                `**Member:** ${member.user?.tag || "Unknown"}\n` +
                `**ID:** \`${member.id}\`\n\n` +

                `**Kicked By:** ` +
                `${executor}\n` +
                `\`${executor.id}\``
            );

            sendLog(
                member.guild,
                config.logs.kick,
                embed
            );

            return;
        }


        /*
         * اگر Audit Log چیزی پیدا نکرد،
         * Leave عادی در نظر گرفته می‌شود.
         */

        const embed = createEmbed(
            "🔴 MEMBER LEFT",

            `**Member:** ${member.user?.tag || "Unknown"}\n` +
            `**ID:** \`${member.id}\``
        );

        sendLog(
            member.guild,
            config.logs.member,
            embed
        );
    }
);


/* =====================================================
                         BAN
===================================================== */

client.on(
    "guildBanAdd",
    async ban => {

        const executor =
            await getAuditExecutor(
                ban.guild,
                AuditLogEvent.MemberBanAdd,
                ban.user.id
            );

        const embed = createEmbed(
            "🔨 MEMBER BANNED",

            `**User:** ${ban.user.tag}\n` +
            `**ID:** \`${ban.user.id}\``
        );

        if (executor) {

            embed.addFields({
                name: "Banned By",
                value:
                    `${executor}\n` +
                    `\`${executor.id}\``
            });
        }

        embed.setThumbnail(
            ban.user.displayAvatarURL({
                size: 256
            })
        );

        sendLog(
            ban.guild,
            config.logs.ban,
            embed
        );
    }
);


/* =====================================================
                        UNBAN
===================================================== */

client.on(
    "guildBanRemove",
    async ban => {

        const executor =
            await getAuditExecutor(
                ban.guild,
                AuditLogEvent.MemberBanRemove,
                ban.user.id
            );

        const embed = createEmbed(
            "🔓 MEMBER UNBANNED",

            `**User:** ${ban.user.tag}\n` +
            `**ID:** \`${ban.user.id}\``
        );

        if (executor) {

            embed.addFields({
                name: "Unbanned By",
                value:
                    `${executor}\n` +
                    `\`${executor.id}\``
            });
        }

        sendLog(
            ban.guild,
            config.logs.ban,
            embed
        );
    }
);


/* =====================================================
                       TIMEOUT
===================================================== */

client.on(
    "guildMemberUpdate",
    async (oldMember, newMember) => {

        /*
         * فقط وقتی Timeout تغییر کرده باشد
         */

        if (
            oldMember.communicationDisabledUntilTimestamp !==
            newMember.communicationDisabledUntilTimestamp
        ) {

            const timeoutActive =
                newMember.communicationDisabledUntilTimestamp &&
                newMember.communicationDisabledUntilTimestamp >
                Date.now();

            const executor =
                await getAuditExecutor(
                    newMember.guild,
                    AuditLogEvent.MemberUpdate,
                    newMember.id
                );

            const embed = createEmbed(

                timeoutActive
                    ? "⏱️ MEMBER TIMEOUT"
                    : "✅ TIMEOUT REMOVED",

                `**Member:** ${newMember.user}\n` +
                `**ID:** \`${newMember.id}\``
            );

            if (timeoutActive) {

                embed.addFields({
                    name: "Timeout Until",

                    value:
                        `<t:${Math.floor(
                            newMember.communicationDisabledUntilTimestamp /
                            1000
                        )}:F>`
                });
            }

            if (executor) {

                embed.addFields({
                    name: "Executor",
                    value:
                        `${executor}\n` +
                        `\`${executor.id}\``
                });
            }

            sendLog(
                newMember.guild,
                config.logs.timeout,
                embed
            );
        }


        /* =================================================
                         ROLE UPDATE
        ================================================= */

        const oldRoles =
            oldMember.roles.cache;

        const newRoles =
            newMember.roles.cache;

        const addedRoles =
            newRoles.filter(
                role =>
                    !oldRoles.has(role.id)
            );

        const removedRoles =
            oldRoles.filter(
                role =>
                    !newRoles.has(role.id)
            );

        if (
            addedRoles.size > 0 ||
            removedRoles.size > 0
        ) {

            const embed = createEmbed(
                "🎭 MEMBER ROLE UPDATE",

                `**Member:** ${newMember.user}\n` +
                `**ID:** \`${newMember.id}\``
            );

            if (addedRoles.size > 0) {

                embed.addFields({
                    name: "➕ Added Roles",

                    value:
                        addedRoles
                            .map(
                                role =>
                                    role.toString()
                            )
                            .join(", ")
                });
            }

            if (removedRoles.size > 0) {

                embed.addFields({
                    name: "➖ Removed Roles",

                    value:
                        removedRoles
                            .map(
                                role =>
                                    role.toString()
                            )
                            .join(", ")
                });
            }

            sendLog(
                newMember.guild,
                config.logs.role,
                embed
            );
        }


        /* =================================================
                       NICKNAME UPDATE
        ================================================= */

        if (
            oldMember.nickname !==
            newMember.nickname
        ) {

            const executor =
                await getAuditExecutor(
                    newMember.guild,
                    AuditLogEvent.MemberUpdate,
                    newMember.id
                );

            const embed = createEmbed(
                "✏️ NICKNAME CHANGED",

                `**Member:** ${newMember.user}\n` +
                `**ID:** \`${newMember.id}\``
            );

            embed.addFields(

                {
                    name: "Before",

                    value:
                        oldMember.nickname ||
                        "None",

                    inline: true
                },

                {
                    name: "After",

                    value:
                        newMember.nickname ||
                        "None",

                    inline: true
                }
            );

            if (executor) {

                embed.addFields({
                    name: "Changed By",
                    value:
                        `${executor}\n` +
                        `\`${executor.id}\``
                });
            }

            sendLog(
                newMember.guild,
                config.logs.nickname,
                embed
            );
        }
    }
);


/* =====================================================
                    MESSAGE DELETE
===================================================== */

client.on(
    "messageDelete",
    message => {

        if (!message.guild) return;

        if (message.author?.bot) return;

        const content =
            message.content?.slice(0, 1000) ||
            "No text content";

        const embed = createEmbed(
            "🗑️ MESSAGE DELETED",

            `**Author:** ${message.author || "Unknown"}\n` +
            `**User ID:** \`${message.author?.id || "Unknown"}\`\n` +
            `**Channel:** ${message.channel}`
        );

        embed.addFields({
            name: "Message Content",
            value: content
        });

        if (
            message.attachments &&
            message.attachments.size > 0
        ) {

            embed.addFields({
                name: "Attachments",
                value:
                    `${message.attachments.size}`
            });
        }

        sendLog(
            message.guild,
            config.logs.message,
            embed
        );
    }
);


/* =====================================================
                    MESSAGE EDIT
===================================================== */

client.on(
    "messageUpdate",
    (oldMessage, newMessage) => {

        if (!oldMessage.guild) return;

        if (oldMessage.author?.bot) return;

        if (
            oldMessage.content ===
            newMessage.content
        ) {
            return;
        }

        const oldContent =
            oldMessage.content?.slice(0, 900) ||
            "Empty";

        const newContent =
            newMessage.content?.slice(0, 900) ||
            "Empty";

        const embed = createEmbed(
            "✏️ MESSAGE EDITED",

            `**Author:** ${oldMessage.author || "Unknown"}\n` +
            `**Channel:** ${oldMessage.channel}`
        );

        embed.addFields(

            {
                name: "Before",
                value: oldContent
            },

            {
                name: "After",
                value: newContent
            }
        );

        embed.setURL(
            newMessage.url
        );

        sendLog(
            oldMessage.guild,
            config.logs.message,
            embed
        );
    }
);


/* =====================================================
                     VOICE LOGS
===================================================== */

client.on(
    "voiceStateUpdate",
    (oldState, newState) => {

        const member =
            newState.member ||
            oldState.member;

        if (!member) return;

        let title;
        let description;


        /* JOIN */

        if (
            !oldState.channelId &&
            newState.channelId
        ) {

            title =
                "🔊 VOICE CHANNEL JOINED";

            description =
                `**Member:** ${member.user}\n` +
                `**Channel:** ${newState.channel}`;
        }


        /* LEAVE */

        else if (
            oldState.channelId &&
            !newState.channelId
        ) {

            title =
                "🔇 VOICE CHANNEL LEFT";

            description =
                `**Member:** ${member.user}\n` +
                `**Channel:** ${oldState.channel}`;
        }


        /* MOVE */

        else if (
            oldState.channelId &&
            newState.channelId &&
            oldState.channelId !==
            newState.channelId
        ) {

            title =
                "🔄 VOICE CHANNEL MOVED";

            description =
                `**Member:** ${member.user}\n` +
                `**From:** ${oldState.channel}\n` +
                `**To:** ${newState.channel}`;
        }

        else {

            return;
        }

        const embed =
            createEmbed(
                title,
                description
            );

        sendLog(
            member.guild,
            config.logs.voice,
            embed
        );
    }
);


/* =====================================================
                    CHANNEL CREATE
===================================================== */

client.on(
    "channelCreate",
    channel => {

        if (!channel.guild) return;

        const embed = createEmbed(
            "📁 CHANNEL CREATED",

            `**Channel:** ${channel}\n` +
            `**Name:** \`${channel.name}\`\n` +
            `**ID:** \`${channel.id}\``
        );

        sendLog(
            channel.guild,
            config.logs.channel,
            embed
        );
    }
);


/* =====================================================
                    CHANNEL DELETE
===================================================== */

client.on(
    "channelDelete",
    channel => {

        if (!channel.guild) return;

        const embed = createEmbed(
            "🗑️ CHANNEL DELETED",

            `**Name:** \`${channel.name}\`\n` +
            `**ID:** \`${channel.id}\``
        );

        sendLog(
            channel.guild,
            config.logs.channel,
            embed
        );
    }
);


/* =====================================================
                    CHANNEL UPDATE
===================================================== */

client.on(
    "channelUpdate",
    (oldChannel, newChannel) => {

        if (!newChannel.guild) return;

        const changes = [];

        if (
            oldChannel.name !==
            newChannel.name
        ) {

            changes.push(
                `**Name:** \`${oldChannel.name}\` → \`${newChannel.name}\``
            );
        }

        if (
            oldChannel.parentId !==
            newChannel.parentId
        ) {

            changes.push(
                `**Category:** Changed`
            );
        }

        if (
            oldChannel.permissionOverwrites.cache.size !==
            newChannel.permissionOverwrites.cache.size
        ) {

            changes.push(
                `**Permissions:** Changed`
            );
        }

        if (changes.length === 0) {
            return;
        }

        const embed = createEmbed(
            "⚙️ CHANNEL UPDATED",

            `**Channel:** ${newChannel}\n\n` +
            changes.join("\n")
        );

        sendLog(
            newChannel.guild,
            config.logs.channel,
            embed
        );
    }
);


/* =====================================================
                      ROLE CREATE
===================================================== */

client.on(
    "roleCreate",
    role => {

        const embed = createEmbed(
            "🎭 ROLE CREATED",

            `**Role:** ${role}\n` +
            `**Name:** \`${role.name}\`\n` +
            `**ID:** \`${role.id}\``
        );

        sendLog(
            role.guild,
            config.logs.role,
            embed
        );
    }
);


/* =====================================================
                      ROLE DELETE
===================================================== */

client.on(
    "roleDe
