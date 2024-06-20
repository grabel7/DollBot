import { createClient } from "#base"; 
import { setSongStatus } from "#functions";
import { Player } from "discord-player";
import "#tools"

// const client = createClient({
//     commands: {
//         guilds: ["955522068563234817", "994756585899442217", "589863469377912855", "346373759504220161"]
//     }
// });
// client.start();

const client = createClient(); // Remova a propriedade "commands.guilds" ou não passe nenhum parâmetro
client.start();

const player = new Player(client as never);
player.extractors.loadDefault();

setSongStatus