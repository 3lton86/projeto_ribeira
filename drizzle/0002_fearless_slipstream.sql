CREATE TABLE `action_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionId` int NOT NULL,
	`label` varchar(300) NOT NULL,
	`url` text NOT NULL,
	`uploadedBy` int NOT NULL,
	`uploaderName` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `action_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `local_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`username` varchar(100) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`role` enum('super_admin','admin','viewer') NOT NULL DEFAULT 'viewer',
	`position` varchar(200),
	`organization` varchar(200),
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `local_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `local_users_username_unique` UNIQUE(`username`)
);
