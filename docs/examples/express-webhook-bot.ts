/* eslint-disable @typescript-eslint/no-floating-promises */

// @ts-expect-error `npm install express && npm install --save-dev @types/express`
import express = require('express');
import { Request, Response } from "express";
import { Telegraf } from "telegraf";

const token = process.env.BOT_TOKEN;
if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);

bot.on("text", (ctx) => ctx.replyWithHTML("<b>Hello</b>"));

const app = express();
app.get("/", (req: Request, res: Response) => res.send("Hello World!"));


app.use(bot.webhookCallback('/secret-path'))
bot.telegram.setWebhook('https://server.tld:8443/secret-path')

app.listen(3000, () => {
  console.log("Example app listening on port 3000!");
});

// No need to call bot.launch()
