// web.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const si = require("systeminformation");
const os = require("os");

module.exports = (bot) => {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  app.use(express.static("public"));

  io.on("connection", (socket) => {
    console.log("🟢 Dashboard connected");

    const sendStats = async () => {
      const cpuLoad = await si.currentLoad();
      const mem = await si.mem();

      // Get first connected voice channel
      let voiceChannel = null;
      bot.guilds.cache.forEach(guild => {
        const vc = guild.members.me?.voice.channel;
        if (vc && !voiceChannel) voiceChannel = `${vc.name} (${guild.name})`;
      });

      socket.emit("stats", {
        cpu: cpuLoad.currentLoad.toFixed(2),
        ram: ((mem.active / mem.total) * 100).toFixed(2),
        uptime: process.uptime().toFixed(0),
        osUptime: os.uptime().toFixed(0),
        totalMem: (mem.total / 1073741824).toFixed(1),
        usedMem: (mem.active / 1073741824).toFixed(1),

        username: bot.user?.username || "Unknown",
        ping: bot.ws?.ping || 0,
        guilds: bot.guilds.cache.size || 0,
        voiceChannel: voiceChannel || "Not connected"
      });
    };

    const interval = setInterval(sendStats, 2000);
    socket.on("disconnect", () => clearInterval(interval));
  });

  server.listen(3000, () => console.log("🌐 Dashboard live at http://localhost:3000"));
};
