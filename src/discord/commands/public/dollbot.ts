import { Command } from "#base";
import { res } from "#functions";
import { settings } from "#settings";
import { brBuilder, createEmbed } from "@magicyan/discord";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";

new Command({
    name: "dollbot",
    description: "Comandos Gerais",
    dmPermission: false,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "bloodborne",
            description: "Bloodborne já foi anunciado para PC?",
            type: ApplicationCommandOptionType.Subcommand
        },
    ],
    async run(interaction){
        const { options, channel } = interaction;


        if (!channel){
            interaction.reply(res.danger("Não é possível utilizar este comando neste canal de texto."));
            return;
        }

        switch (options.getSubcommand(true)){
            case "bloodborne": {
                const embed = createEmbed({
                    color: settings.colors.danger,
                    title: "💻 Bloodborne",
                    description: brBuilder(`**Bloodborne ainda não foi anunciado para PC.**`,
                    `Amanhã com certeza!`
                    )})

                    interaction.reply({ embeds: [embed] });
            }
        }
        
    }
});
