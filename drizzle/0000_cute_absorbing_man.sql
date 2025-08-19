CREATE TABLE `github_webhook_channel` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repo_name` text NOT NULL,
	`channel_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_webhook_channel_repo_name_unique` ON `github_webhook_channel` (`repo_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `github_webhook_channel_channel_id_unique` ON `github_webhook_channel` (`channel_id`);