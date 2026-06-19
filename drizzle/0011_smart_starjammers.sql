CREATE TABLE `action_orgaos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionId` int NOT NULL,
	`orgao` varchar(100) NOT NULL,
	`responsavelNome` varchar(200),
	`responsavelCargo` varchar(200),
	`responsavelTel` varchar(50),
	`responsavelEmail` varchar(320),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `action_orgaos_id` PRIMARY KEY(`id`)
);
