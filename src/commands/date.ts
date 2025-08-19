import { ChatInputCommandInteraction, CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("date")
  .setDescription("디버그: 구동중인 환경의 현재 시간을 출력합니다.");

export async function execute(interaction: ChatInputCommandInteraction) {
  const now = new Date();
  return interaction.reply(`${now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (${now.getHours()})`);
}