import { Telegraf } from "telegraf";
import express from "express";
import dotenv from "dotenv";
dotenv.config();
const expressApp = express();

const bot = new Telegraf(process.env.BOT_TOKEN);
expressApp.use(bot.webhookCallback("/secret-path"));
bot.telegram.setWebhook("https://server.tld:8443/secret-path");

expressApp.get("/", (req, res) => {
  res.send("Hello World!");
});

expressApp.listen(3000, () => {
  console.log("Example app listening on port 3000!");
});

bot.on("text", (ctx) => {
  ctx.reply(`Hello Express`);
});
