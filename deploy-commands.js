const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const config = require("./config.json");

const commands = [
  new SlashCommandBuilder()
    .setName("imagine")
    .setDescription("Generate AI images in a 2x2 collage.")
    .addStringOption(option =>
      option.setName("prompt")
        .setDescription("Describe the image you want.")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("quantity")
        .setDescription("How many images (1–4)")
        .setMinValue(1)
        .setMaxValue(4)
    )
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(config.token);

(async () => {
  try {
    console.log("Deploying commands...");
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands },
    );
    console.log("✅ Slash commands deployed successfully!");
  } catch (error) {
    console.error("❌ Error deploying commands:", error);
  }
})();
