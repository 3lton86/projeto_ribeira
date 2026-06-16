CREATE TABLE `user_orgaos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`orgao` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_orgaos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `local_users` MODIFY COLUMN `role` enum('super_admin','admin','setorial','viewer') NOT NULL DEFAULT 'viewer';