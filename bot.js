const { Client, GatewayIntentBits, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require("discord.js");
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require("@discordjs/voice");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const { spawn } = require("child_process");
const config = require("./config.json");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.once(Events.ClientReady, async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  client.user.setActivity("Creating AI collages 🎨", { type: "PLAYING" });

  // Launch web dashboard
  require("./web")(client); // Pass your bot client directly


  // 24/7 voice join
  try {
    const connection = joinVoiceChannel({
      channelId: "YOUR_VOICE_CHANNEL_ID",
      guildId: config.guildId,
      adapterCreator: client.guilds.cache.get(config.guildId).voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    console.log("🎧 Joined voice channel 24/7 successfully!");
  } catch (err) {
    console.error("❌ Failed to join voice channel:", err);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "imagine") {
    const prompt = interaction.options.getString("prompt");
    const quantity = interaction.options.getInteger("quantity") || 4;

    await interaction.reply(`⏳ Generating ${quantity} image(s)...`);

    const images = [];
    for (let i = 0; i < quantity; i++) {
      try {
        const res = await axios.get("https://www.ai4chat.co/api/image/generate", {
          params: { prompt, aspect_ratio: "1:1" },
        });
        if (res.data?.image_link) images.push(res.data.image_link);
      } catch (err) {
        console.error("Image gen error:", err);
      }
    }

    if (images.length === 0) {
      return interaction.editReply("❌ Failed to generate any images.");
    }

    const canvasSize = 512;
    const canvas = createCanvas(canvasSize * 2, canvasSize * 2);
    const ctx = canvas.getContext("2d");

    for (let i = 0; i < images.length; i++) {
      const img = await loadImage(images[i]);
      const x = (i % 2) * canvasSize;
      const y = Math.floor(i / 2) * canvasSize;
      ctx.drawImage(img, x, y, canvasSize, canvasSize);
    }

    const buffer = canvas.toBuffer("image/png");
    const attachment = new AttachmentBuilder(buffer, { name: "collage.png" });

    const row = new ActionRowBuilder();
    for (let i = 0; i < images.length; i++) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`img_${i}`)
          .setLabel(`${i + 1}`)
          .setStyle(ButtonStyle.Primary)
      );
    }

    const reply = await interaction.editReply({
      content: "✅ Here’s your collage:",
      files: [attachment],
      components: [row],
    });

    const collector = reply.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (i) => {
      if (!i.isButton()) return;
      const index = parseInt(i.customId.split("_")[1]);
      await i.reply({ content: `🖼 Image ${index + 1}: ${images[index]}`, ephemeral: true });
    });

    collector.on("end", () => {
      interaction.editReply({ components: [] });
    });
  }
});

client.login(config.token);
