import { AIService } from "@/service/ai.service";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("aistatus")
  .setDescription("사용중인 Gemini의 정보를 출력합니다.");

export async function execute(interaction: ChatInputCommandInteraction) {
  const aiService = AIService.getInstance();
  const createAt = aiService.getCreateAt();
  const result = createAt ? createAt.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '정보 없음';
  return interaction.reply(`Gemini Chat 생성 시간: ${result}`);
}