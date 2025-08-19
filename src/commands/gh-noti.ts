import { db } from "@/db";
import { githubWebhookChannelTable } from "@/db/schema";
import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { eq } from "drizzle-orm";

export const data = new SlashCommandBuilder()
  .setName("ghnoti")
  .setDescription("GitHub 웹훅 채널을 관리합니다.")
  .addStringOption(option => option.setName('command').setDescription('명령어 (set, unset, list)').setRequired(true))
  .addStringOption(option => option.setName('repo').setDescription('레포지토리 이름').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
  const command = interaction.options.getString('command');
  const channelId = interaction.channelId;
  if (!channelId) {
    return interaction.reply({ content: '현재 채널 ID를 가져올 수 없습니다.', flags: MessageFlags.Ephemeral })
  }
  if (command === 'set') {
    const repoName = interaction.options.getString('repo');
    if (!repoName) {
      return interaction.reply({ content: '레포지토리 이름을 입력해주세요.', flags: MessageFlags.Ephemeral })
    }
    try {
      await db.insert(githubWebhookChannelTable).values({ repoName, channelId });
      return interaction.reply(`\`${repoName}\` 레포지토리에 대해 알림이 설정되었습니다.`);
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: '알림 설정에 실패했습니다. 이미 알림이 설정된 레포지토리일 수 있습니다.', flags: MessageFlags.Ephemeral })
    }
  } else if (command === 'unset') {
    const repoName = interaction.options.getString('repo');
    if (!repoName) {
      return interaction.reply({ content: '레포지토리 이름을 입력해주세요.', flags: MessageFlags.Ephemeral })
    }
    try {
      const result = await db.delete(githubWebhookChannelTable).where(eq(githubWebhookChannelTable.repoName, repoName)).returning();
      if (result.length === 0) {
        return interaction.reply({ content: `\`${repoName}\` 레포지토리에 대해 알림이 설정되어 있지 않습니다.`, flags: MessageFlags.Ephemeral })
      } else {
        return interaction.reply(`\`${repoName}\` 레포지토리에 대한 알림이 해제되었습니다.`);
      }
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: '알림 해제에 실패했습니다.', flags: MessageFlags.Ephemeral })
    }
  } else if (command === 'list') {
    try {
      const repos = await db.select().from(githubWebhookChannelTable).where(eq(githubWebhookChannelTable.channelId, channelId));
      if (repos.length === 0) {
        return interaction.reply({ content: '알림이 설정된 레포지토리가 없습니다.', flags: MessageFlags.Ephemeral })
      }
      const repoNames = repos.map((v, idx) => `${idx + 1}. \`${v.repoName}\``).join('\n');
      return interaction.reply(`현재 채널로 알림을 보내고 있는 레포지토리\n${repoNames}`);
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: '레포지토리 목록 조회에 실패했습니다.', flags: MessageFlags.Ephemeral })
    }
  } else {
    return interaction.reply({ content: '올바르지 않은 명령어입니다.', flags: MessageFlags.Ephemeral })
  }
}