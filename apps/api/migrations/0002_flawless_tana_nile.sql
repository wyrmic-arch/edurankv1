CREATE TABLE `streak_claims` (
	`user_id` text NOT NULL,
	`date_key` text NOT NULL,
	`streak_count` integer NOT NULL,
	`reward` integer DEFAULT 0 NOT NULL,
	`claimed_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `date_key`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
