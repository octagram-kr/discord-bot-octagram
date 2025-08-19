import { REST, Routes } from "discord.js";
import { commands } from "./commands";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN!
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID!

const commandsData = Object.values(commands).map((command) => command.data);

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

try {
  console.log("Started refreshing application (/) commands.");
  await rest.put(
    Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID), { body: commandsData }
  );
  console.log("Successfully reloaded application (/) commands.");
} catch (error) {
  console.error(error);
}