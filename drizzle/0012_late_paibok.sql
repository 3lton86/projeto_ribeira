CREATE TABLE `orgao_responsaveis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgao` varchar(100) NOT NULL,
	`nome` varchar(200) NOT NULL,
	`cargo` varchar(200),
	`telefone` varchar(50),
	`email` varchar(320),
	`localUserId` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orgao_responsaveis_id` PRIMARY KEY(`id`)
);
