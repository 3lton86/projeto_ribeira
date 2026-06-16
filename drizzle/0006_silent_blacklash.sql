CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`userRole` varchar(50) NOT NULL,
	`userOrgao` varchar(100),
	`eventType` enum('comment','document') NOT NULL,
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
