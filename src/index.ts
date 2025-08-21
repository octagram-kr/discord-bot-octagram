import { Client, GatewayIntentBits, Events, GuildMember, ActivityType, ChatInputCommandInteraction } from "discord.js";
import { commands } from "@/commands";
import { AIService } from "@/service/ai.service";
import { WebhookService } from "@/service/webhook.service";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN!

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const aiService = AIService.getInstance();
const webhookService = new WebhookService(client);

client.once(Events.ClientReady, (client) => {
  botStatusChange();
  setInterval(botStatusChange, 5 * 60 * 1000);
  console.log(`Discord bot ready! Logged in as ${client.user?.tag}`);
});

client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot) return;
  if (msg.guildId !== process.env.DISCORD_GUILD_ID!) return;
  const displayName = getDisplayName(msg.member!)
  if (msg.content.includes('잼민')) {
    try {
      msg.channel.sendTyping();
      const query = `${displayName}(${msg.author.username}): ${msg.content}`
      const response = await aiService.sendMessage(query);
      if (response) msg.channel.send(response);
    } catch (error: any) {
      console.error(error);
      if (error.status) msg.channel.send(`⚠️ AI 응답 중 오류가 발생했어요. 잠시 후 다시 시도해주세요. (code: ${error.status})`)
      else msg.channel.send(`⚠️ 알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해주세요.`)
    }
  }
})

client.on(Events.InteractionCreate, async (interaction) => {
  if (!(interaction instanceof ChatInputCommandInteraction)) return;
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;
  const command = commands[commandName as keyof typeof commands];
  if (command) {
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '⚠️ 명령어 실행 중 오류가 발생했습니다.', ephemeral: true });
      } else {
        await interaction.reply({ content: '⚠️ 명령어 실행 중 오류가 발생했습니다.', ephemeral: true });
      }
    }
  } else {
    console.warn(`Unknown command: ${commandName}`);
  }
});

function getDisplayName(member: GuildMember) {
  return member.nickname || member.displayName || member.user.username
}

function botStatusChange() {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 0 && hour <= 7) {
    client.user?.setPresence({
      status: 'idle',
      activities: [{
        name: '자는 중... 💤',
        type: ActivityType.Custom,
      }]
    })
  } else {
    client.user?.setPresence({
      status: 'online',
      activities: [{
        name: '활동 중! 🔥',
        type: ActivityType.Custom,
      }]
    })
  }
}

client.login(DISCORD_TOKEN);
webhookService.start();