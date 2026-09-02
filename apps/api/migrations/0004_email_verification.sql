ALTER TABLE `users` ADD COLUMN `email_verified_at` integer;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `verify_token` text;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `verify_token_at` integer;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `reset_token` text;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `reset_token_at` integer;
