import { settings } from "#settings";
import { createEmbed } from "@magicyan/discord";

type SettingsColors = typeof settings.colors;
type InteractionRes = Record<keyof SettingsColors, (text: string, options?: object) => object>;

export const res: InteractionRes = Object.create({}, Object.entries(settings.colors)
  .reduce((obj, [name, color]) => ({ ...obj,
    [name]: {
      enumerable: true, writable: false,
      value(description: string, options?: object) {
        const embed = createEmbed({ color, description });
        
        if (options && "embeds" in options && Array.isArray(options.embeds)) {
          options.embeds.unshift(embed);
        }
        
        const defaults = { fetchReply: true, ephemeral: true, embeds: [embed] };
        return Object.assign(defaults, options);
      }
    }
  }), {} as PropertyDescriptorMap)
);
