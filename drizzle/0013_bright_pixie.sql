CREATE TABLE `contact_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionId` int NOT NULL,
	`channel` enum('email','whatsapp') NOT NULL,
	`recipientName` varchar(200),
	`recipientContact` varchar(320),
	`message` text,
	`sentBy` varchar(200),
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_history_id` PRIMARY KEY(`id`)
);
