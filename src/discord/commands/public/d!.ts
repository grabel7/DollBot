import { Client, GatewayIntentBits, Message, TextChannel, VoiceChannel } from "discord.js";
import { createQueueMetadata } from "#functions";
import { brBuilder, createEmbed } from "@magicyan/discord";
import { QueryType, SearchQueryType, useMainPlayer } from "discord-player";
import { settings } from "#settings";
import { res } from "#functions";

// Inicialização do cliente Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Função para tocar música
const playMusic = async (message: Message, query: string, searchEngine: SearchQueryType = QueryType.AUTO) => {
    const { member, guild, channel, client } = message;
    if (!guild) {
        message.reply(res.danger("Este comando só pode ser usado em guildas."));
        return;
    }

    const voiceChannel = member?.voice.channel as VoiceChannel;
    if (!voiceChannel) {
        message.reply(res.danger("Você precisa estar em um canal de voz para usar esse comando."));
        return;
    }

    // Verifica se o canal é um TextChannel
    if (!channel || !(channel instanceof TextChannel)) {
        message.reply(res.danger("Este comando só pode ser usado em canais de texto de guilda."));
        return;
    }

    const metadata = createQueueMetadata({ channel, client, guild, voiceChannel });
    const player = useMainPlayer();
    const queue = player.queues.cache.get(guild.id);

    try {
        const { track, searchResult } = await player.play(voiceChannel as never, query, {
            searchEngine,
            nodeOptions: { metadata }
        });

        const display: string[] = [];

        if (searchResult.playlist) {
            const { tracks, title, url } = searchResult.playlist;
            display.push(
                `Adicionadas ${tracks.length} músicas da playlist [${title}](${url})`,
                ...tracks.map(track => `${track.title}`).slice(0, 8),
                "..."
            );
        } else {
            const playing: boolean = queue?.size ? false : true;
            display.push(`${queue?.size ? "Adicionado à fila" : "Tocando agora"} ${track.title} `);
            const embed = createEmbed({
                color: settings.colors.primary,
                title: "🎵 Adicionado à fila",
                thumbnail: track.thumbnail,
                url: track.url,
                description: brBuilder(`**Música**: ${track.title}`,
                    `**Autor**: ${track.author}`,
                    `**Canal de voz**: ${voiceChannel}`,
                    `**Duração**: ${track.duration}`,
                    `**Posição na fila**: ${queue?.size}`,
                    `**Adicionado à fila por**: ${message.author.username}`,
                    `**Tipo**: ${track.queryType}`
                )
            });
            if (!playing) {
                channel.send({ embeds: [embed] });
            }
        }
        message.reply(res.success(brBuilder(display)));

    } catch (_) {
        message.reply(res.danger(`Não foi possível tocar a música.`));
    }
};

// Listener para comandos de mensagens de texto
client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return;

    const prefix = "d!";
    if (!message.content.startsWith(prefix)) return;

    const [cmd, ...args] = message.content.slice(prefix.length).trim().split(/ +/g);
    const query = args.join(" ");

    if (cmd === "t" || cmd === "tocar") {
        await playMusic(message, query);
    }

    // Adicione mais alias conforme necessário
});

// Login no bot
client.login(process.env.BOT_TOKEN);
