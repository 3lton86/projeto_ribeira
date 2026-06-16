CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('item_change','comment_doc') NOT NULL,
	`title` varchar(300) NOT NULL,
	`body` text,
	`actionId` int,
	`actionCode` varchar(50),
	`orgao` varchar(100),
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
