import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const githubWebhookChannelTable = sqliteTable('github_webhook_channel', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  repoName: text('repo_name').notNull().unique(),
  channelId: text('channel_id').notNull(),
});

export type GithubWebhookChannel = typeof githubWebhookChannelTable.$inferSelect;
export type NewGithubWebhookChannel = typeof githubWebhookChannelTable.$inferInsert;