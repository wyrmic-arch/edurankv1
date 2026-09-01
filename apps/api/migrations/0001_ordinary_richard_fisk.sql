DROP INDEX IF EXISTS `idx_purchases_user_item`;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_purchases_user_item` ON `purchases` (`user_id`,`item_id`);