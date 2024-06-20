import { Command } from "#base";
import { createQueueMetadata } from "#functions";
import { brBuilder, createEmbed, limitText } from "@magicyan/discord";
import { GuildQueue, GuildQueueEvent, QueryType, SearchQueryType, useMainPlayer } from "discord-player";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";
import { settings } from "#settings";
import { res } from "#functions";
import { multimenu } from "@magicyan/discord-ui";


const loopStates = new Map<string, boolean>();


new Command({
    name: "música",
    description: "Comando de música",
    dmPermission: false,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "tocar",
            description: "Tocar uma música",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "busca",
                    description: "Nome da música ou url",
                    type: ApplicationCommandOptionType.String,
                    required
                },
                {
                    name: "engine",
                    description: "Engine de busca",
                    type: ApplicationCommandOptionType.String,
                    choices: Object.values(QueryType).map(type => ({
                        name: type, value: type
                    }))
                }
            ]
        },
        {
            name: "pausar",
            description: "Pausa a música atual",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "retomar",
            description: "Retoma a música atual",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "parar",
            description: "Interrompe a música atual",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "pular",
            description: "Pula a quantia definida de músicas",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "quantidade",
                    description: "Quantidade de músicas para pular",
                    type: ApplicationCommandOptionType.Integer,
                    minValue: 1,
                }
            ]
        },
        {
            name: "fila",
            description: "Exibe a fila atual",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "embaralhar",
            description: "Embaralha a fila atual",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "selecionar",
            description: "Pula para uma música específica da fila",
            type: ApplicationCommandOptionType.Subcommand,
            options: [{
                name: "música",
                description: "Selecione a música",
                type: ApplicationCommandOptionType.String,
                required, autocomplete:true
            }]
        },
        {
            name: "pesquisar",
            description: "Pesquisa uma música",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "engine",
                    description: "Engine de busca",
                    type: ApplicationCommandOptionType.String,
                    choices: Object.values(QueryType).map(type => ({
                        name: type, value: type
                    })),
                    required
                },
                {
                    name: "busca",
                    description: "Nome da música ou url",
                    type: ApplicationCommandOptionType.String,
                    required, autocomplete: true
                }
            ]
        },
        {
            name: "loop",
            description: "Repete a última música infinitamente",
            type: ApplicationCommandOptionType.Subcommand,
        },
    ]
    ,
    

    async autocomplete(interaction) {
        const { options, guild } = interaction;
    
        const player = useMainPlayer();
        const queue = player.queues.cache.get(guild.id);
    
        switch(options.getSubcommand(true)) {
            case "pesquisar": {
                const searchEngine = options.getString("engine", true);
                const focused = options.getFocused();

                try {
                    const results = await player.search(focused, {
                        searchEngine: searchEngine as SearchQueryType
                    });
                    if (!results.hasTracks()) return;

                    interaction.respond(results.tracks.map(track => ({
                        name: limitText(`${track.duration} - ${track.title}`, 100),
                        value: track.url
                    })).slice(0, 25))

                } catch(_) {

                }
            }
            case "selecionar": {
                if (!queue || queue.size < 1) 
                    return;

                const choices = queue.tracks.map((track, index) => ({
                    name: limitText(`${index} - ${track.title}`, 100),
                    value: track.id
                }));

                interaction.respond(choices.slice(0, 25))
                return;
            }
        }
    },

    async run(interaction){
        const { options, member, guild, channel, client } = interaction;

        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            interaction.reply(res.danger("Você precisa estar em um canal de voz para usar esse comando."));
            return;
        }
        if (!channel){
            interaction.reply(res.danger("Não é possível utilizar este comando neste canal de texto."));
            return;
        }

        const metadata = createQueueMetadata({  channel, client, guild, voiceChannel });
        const player = useMainPlayer();
        const queue = player.queues.cache.get(guild.id);

        await interaction.deferReply({ ephemeral })

        player.events.on(GuildQueueEvent.playerFinish, async (queue: GuildQueue<unknown>) => {
            const isLooping = loopStates.get(queue.guild.id) || false;
            if (isLooping && queue.tracks.size === 0) {
                const lastTrack = queue.history.previousTrack;
                if (lastTrack) {
                    queue.addTrack(lastTrack);
                    await queue.node.play(lastTrack);
                }
            }
        })

        switch(options.getSubcommand(true)){
            case "tocar":{
                const query = options.getString("busca", true)
                const searchEngine = options.getString("engine") ?? QueryType.AUTO;
                const user = interaction.user; // Obtém o usuário que executou o comando

                try {
                    const { track, searchResult } = await player.play(voiceChannel as never, query, {
                        searchEngine: searchEngine as SearchQueryType,
                        nodeOptions: { metadata }
                    });

                    const display: string[] = [];

                    if(searchResult.playlist){
                        const { tracks, title, url } = searchResult.playlist;
                        display.push(
                            `Adicionadas ${tracks.length} da playlist [${title}](${url})`,
                            ...tracks.map(track => `${track.title}`).slice(0, 8),
                            "..."
                        )
                    } else {
                        let playing: boolean = queue?.size ? false : true
                        display.push(`${queue?.size ? "Adicionado à fila" : "Tocando agora"} ${track.title} `)
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
                                `**Adicionado à fila por**: ${user.username}`,
                                `**Tipo**: ${track.queryType}`
                            )
                        });
                        if(!playing){
                            channel.send({ embeds: [embed]})
                        }
                    }
                    interaction.editReply(res.success(brBuilder(display)))

                } catch(_){
                    interaction.editReply(res.danger(`Não foi possível tocar a música.`))

                }
                return
            }
            case "loop": {
                if (!queue) {
                    interaction.editReply(res.danger("Não há uma fila de reprodução ativa."));
                    return;
                }
            
                const isLooping = loopStates.get(guild.id) || false;
                loopStates.set(guild.id, !isLooping);
            
                const embed = createEmbed({
                    color: settings.colors.primary,
                    title: !isLooping ? "🔁 Loop Ativado" : "🔁 Loop Desativado",
                    description: brBuilder(`**O modo de loop foi**: ${!isLooping ? "ativado" : "desativado"}`)
                });

                interaction.editReply(res.success(!isLooping ? "Loop ativado para a fila." : "Loop desativado."));
                channel.send({ embeds: [embed] });

                return;
            }
            
        }

        if (!queue){
            interaction.editReply(res.danger(`Não há uma fila de reprodução ativa.`));
            return
        }

        switch (options.getSubcommand(true)){
            case "pausar": {
                const user = interaction.user; // Obtém o usuário que executou o comando
                if (queue.node.isPaused()){
                    interaction.editReply(res.danger(`A música atual já está pausada.`));
                    return;
                }
                queue.node.pause();
                interaction.editReply(res.danger(`A música atual foi pausada.`));
                const embed = createEmbed({
                    color: settings.colors.danger,
                    title: "⏸️ A Música foi Pausada",
                    description: brBuilder(`**A música atual foi pausada por**: ${user.username}`)})

                    channel.send({ embeds: [embed]})
                return;
            }
            case "retomar": {
                const user = interaction.user; // Obtém o usuário que executou o comando
                if (!queue.node.isPaused()){
                    interaction.editReply(res.danger(`A música atual não está pausada.`));
                    return;
                }
                queue.node.resume();
                interaction.editReply(res.danger(`A música atual foi retomada.`));
                const embed = createEmbed({
                    color: settings.colors.danger,
                    title: "▶️ A Música foi Retomada",
                    description: brBuilder(`**A música atual foi retomada por**: ${user.username}`)})

                    channel.send({ embeds: [embed]})
                return;
            }
            case "parar": {
                const user = interaction.user; // Obtém o usuário que executou o comando
                queue.node.stop();
                loopStates.delete(guild.id); // Desliga o Loop se estiver ativo
                interaction.editReply(res.danger(`A música atual foi parada.`));
                const embed = createEmbed({
                    color: settings.colors.danger,
                    title: "❌ A Música foi parada!",
                    description: brBuilder(`**A música atual foi parada por**: ${user.username}`)})

                    channel.send({ embeds: [embed]})
                return;
            }
            case "pular": {
                const amount = options.getInteger("quantidade") ?? 1;
                const skipAmount = Math.min(queue.size, amount)
                const user = interaction.user; // Obtém o usuário que executou o comando
                for (let i = 0; i < skipAmount; i++){
                    queue.node.skip()
                }
                if (skipAmount > 1) {
                    const embed = createEmbed({
                        color: settings.colors.danger,
                        title: `⏩ ${skipAmount} músicas foram puladas!`,
                        description: brBuilder(`**As músicas foram puladas por**: ${user.username}`)})
    
                        channel.send({ embeds: [embed]})
                } else {
                    const embed = createEmbed({
                        color: settings.colors.danger,
                        title: "⏩ A Música foi pulada!",
                        description: brBuilder(`**A música foi pulada por**: ${user.username}`)})
    
                        channel.send({ embeds: [embed]})
                }
                
                return
            }
            case "fila": {
                multimenu({
                    embed: createEmbed({
                        color: settings.colors.fuchsia,
                        description: brBuilder(
                            "Fila atual",
                            `Músicas: ${queue.tracks.size}`,
                            "",
                            `Música atual: ${queue.currentTrack?.title ?? "Nenhuma"}`
                        )
                    }),
                    items: queue.tracks.map((track, index) => ({
                        color: settings.colors.green,
                        description: brBuilder(
                            `**Música**: [${track.title}(${track.url})]`,
                            `**Autor**: ${track.author}`,
                            `**Duração**: ${track.duration}`,
                            `**Posição na fila**: ${index + 1}`
                        ),
                        thumbnail: track.thumbnail
                    })),
                    render: (embeds, components) => interaction.editReply({ embeds, components })
                })
                return;
            }
            case "embaralhar": {
                const user = interaction.user; // Obtém o usuário que executou o comando
                queue.tracks.shuffle();
                const embed = createEmbed({
                    color: settings.colors.bravery,
                    title: "🔀 A Fila foi Embaralhada!",
                    description: brBuilder(`**${user.username}** embaralhou a fila!`)})

                    channel.send({ embeds: [embed]})
                return;
            }
            case "selecionar": {
                const trackId = options.getString("música", true);
                const user = interaction.user; // Obtém o usuário que executou o comando

                try {
                    const skipped = queue.node.skipTo(trackId);
                    const embed = createEmbed({
                        color: settings.colors.danger,
                        title: "⏩ Músicas puladas!",
                        description: brBuilder(skipped ? `**Músicas puladas por**: ${user.username}` : `Nenhuma música foi pulada, ${user.username}`)})
    
                        channel.send({ embeds: [embed]})
                    
                    interaction.editReply
                } catch (_) {
                    interaction.editReply(res.danger(`Não foi possível pular para a música selecionada.`))
                }
                return;
            }
            case "pesquisar": {
                const trackUrl = options.getString("busca", true);
                const searchEngine = options.getString("engine", true) as SearchQueryType;
                const voiceChannel = member.voice.channel;
                const user = interaction.user; // Obtém o usuário que executou o comando
            
                try {
                    let queue = player.queues.cache.get(guild.id);

                    // Conecte ao canal de voz se não estiver conectado
                    if (!queue) {
                        queue = await player.queues.create(guild.id, {
                            metadata: {
                                channel: interaction.channel
                            }
                        });
                    } 
                    const { track } = await player.play(voiceChannel as never, trackUrl, {
                        searchEngine, nodeOptions: { metadata }
                    });
            
                    const text = queue?.size ? "Adicionado à fila" : "Tocando agora";
                    interaction.editReply(res.success(`${text} ${track.title}`));

                    const embed = createEmbed({
                        color: settings.colors.danger,
                        title: "▶️ Música nova na Fila!",
                        description: brBuilder(`**Música**: ${track.title}`,
                        `**Autor**: ${track.author}`,
                        `**Canal de voz**: ${voiceChannel}`,
                        `**Duração**: ${track.duration}`,
                        `**Adicionado à fila por**: ${user.username}`,
                        `**Posição na fila**: ${queue?.size}`,
                    )
                });
    
                    channel.send({ embeds: [embed]})
                } catch (_) {
                    interaction.editReply(res.danger(`Não foi possível tocar a música`));
                }
                return;
            }
            

        }
    }
});