import { Command } from "#base";
import { res } from "#functions";
import { settings } from "#settings";
import { brBuilder, createEmbed } from "@magicyan/discord";
import { ApplicationCommandType } from "discord.js";

new Command({
    name: "help",
    description: "Ajudo você a encontrar os comandos que desejar",
    dmPermission: false,
    type: ApplicationCommandType.ChatInput,
    async run(interaction) {
        const { channel } = interaction;
    
        if (!channel) {
            interaction.reply(res.danger("Não é possível utilizar este comando neste canal de texto."));
            return;
        }
    
        const embed = createEmbed({
            color: settings.colors.info,
            title: "⚙️ Comandos",
            description: brBuilder(
                "/musica...",
                "**tocar**: Toca a música que você escolher, você pode especificar em 'engine' de onde ela vem (ex: Spotify, YouTube...)",
                "**fila**: Exibe a fila atual",
                "**pesquisar**: Pesquisa por uma música na plataforma escolhida, para usar o bot já deve estar em uma fila de reprodução",
                "**pular**: Pula para a próxima música. É possível pular mais de uma música passando o argumento quantidade.",
                "**parar**: Interrompe a fila e sai do canal de voz",
                "**embaralhar**: Embaralha a fila atual",
                "**selecionar**: Pula para a música escolhida na fila",
                "**loop**: Repete a última música infinitamente ",
                "**bloodborne**: Descubra se Bloodborne já foi anunciado para PC.",
                "**-----------------------------------------------------**",
                "**d!**",
                "t, tocar: Toca a música que você escolher, você pode especificar em 'engine' de onde ela vem (ex: Spotify, YouTube...)"
            )
        });
    
        interaction.reply({ embeds: [embed] }); // Usar interaction.reply() para enviar a resposta
    }
    
});
