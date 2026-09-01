CREATE TABLE `badges` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`icon` text DEFAULT 'Award' NOT NULL,
	`tier` integer DEFAULT 1 NOT NULL,
	`criteria_type` text NOT NULL,
	`threshold` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `challenge_completions` (
	`user_id` text NOT NULL,
	`date_key` text NOT NULL,
	`challenge_key` text NOT NULL,
	`points_awarded` integer DEFAULT 0 NOT NULL,
	`claimed_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `date_key`, `challenge_key`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `note_unlocks` (
	`note_id` text NOT NULL,
	`user_id` text NOT NULL,
	`price_paid` integer DEFAULT 0 NOT NULL,
	`uploader_cut` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`note_id`, `user_id`),
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `note_upvotes` (
	`note_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`note_id`, `user_id`),
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`uploader_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`grade` integer NOT NULL,
	`topic` text DEFAULT '' NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`file_key` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer DEFAULT 0 NOT NULL,
	`mime_type` text DEFAULT 'application/octet-stream' NOT NULL,
	`cover_key` text,
	`is_free` integer DEFAULT 1 NOT NULL,
	`price_points` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`review_note` text,
	`reviewed_by` text,
	`reviewed_at` integer,
	`download_count` integer DEFAULT 0 NOT NULL,
	`upvote_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `points_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`delta` integer NOT NULL,
	`reason` text NOT NULL,
	`note_id` text,
	`subject_id` text,
	`description` text NOT NULL,
	`balance_after` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`price_paid` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `shop_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`province` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shop_items` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`price_points` integer DEFAULT 0 NOT NULL,
	`config_json` text DEFAULT '{}' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`blurb` text DEFAULT '' NOT NULL,
	`color` text DEFAULT '#A6FF3F' NOT NULL,
	`icon` text DEFAULT 'BookOpen' NOT NULL,
	`unsplash_query` text DEFAULT 'study' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`user_id` text NOT NULL,
	`badge_id` text NOT NULL,
	`awarded_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `badge_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`bio` text DEFAULT '' NOT NULL,
	`grade` integer,
	`school_id` text,
	`role` text DEFAULT 'user' NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`total_earned` integer DEFAULT 0 NOT NULL,
	`total_spent` integer DEFAULT 0 NOT NULL,
	`streak_count` integer DEFAULT 0 NOT NULL,
	`best_streak` integer DEFAULT 0 NOT NULL,
	`last_streak_date` text,
	`referral_code` text NOT NULL,
	`referred_by` text,
	`profile_completed_at` integer,
	`equipped_frame_id` text,
	`equipped_skin_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_unlocks_user` ON `note_unlocks` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_upvotes_user` ON `note_upvotes` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_notes_uploader` ON `notes` (`uploader_id`);--> statement-breakpoint
CREATE INDEX `idx_notes_subject` ON `notes` (`subject_id`);--> statement-breakpoint
CREATE INDEX `idx_notes_status` ON `notes` (`status`);--> statement-breakpoint
CREATE INDEX `idx_notes_created` ON `notes` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_ledger_user_created` ON `points_ledger` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_ledger_user_reason` ON `points_ledger` (`user_id`,`reason`);--> statement-breakpoint
CREATE INDEX `idx_purchases_user_item` ON `purchases` (`user_id`,`item_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `schools_name_unique` ON `schools` (`name`);--> statement-breakpoint
CREATE INDEX `idx_sessions_user` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_referral_code_unique` ON `users` (`referral_code`);--> statement-breakpoint
CREATE INDEX `idx_users_total_earned` ON `users` (`total_earned`);--> statement-breakpoint
CREATE INDEX `idx_users_school` ON `users` (`school_id`);