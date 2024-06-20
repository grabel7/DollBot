import { getQueueMetadata, setSongStatus } from "#functions";
import { settings } from "#settings";
import { brBuilder, createEmbed } from "@magicyan/discord";
import { useMainPlayer } from "discord-player";

const player = useMainPlayer();

player.events.on("playerStart", (queue, track) => {
    const { client, channel, voiceChannel } = getQueueMetadata(queue);

    setSongStatus(client, track);
    console.log(track.queryType);

    const embed = createEmbed({
        color: settings.colors.fuchsia,
        title: "🎵 Tocando agora",
        thumbnail: track.thumbnail,
        url: track.url,
        description: brBuilder(`**Música**: ${track.title}`,
            `**Autor**: ${track.author}`,
            `**Canal de voz**: ${voiceChannel}`,
            `**Duração**: ${track.duration}`,
            `**Músicas restantes:**: ${queue?.size}`,
            `**Tipo**: ${track.queryType}`
        )
    });

    channel.send({ embeds: [embed]})
});