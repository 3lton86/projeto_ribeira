CREATE TABLE `actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`area` enum('Governança','Técnico','Jurídico','Eco-Fin') NOT NULL,
	`itemCode` varchar(20) NOT NULL,
	`parentCode` varchar(20),
	`isGroup` int NOT NULL DEFAULT 0,
	`description` text NOT NULL,
	`priority` enum('Alta','Média','Baixa'),
	`status` enum('Pendente','Em Andamento','Concluído','Cancelado') NOT NULL DEFAULT 'Pendente',
	`responsible` text,
	`requestDate` timestamp,
	`receiptDate` timestamp,
	`documentBase` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `governance_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentId` int,
	`title` varchar(200) NOT NULL,
	`subtitle` text,
	`type` enum('root','committee','board','focal','entity') NOT NULL,
	`theme` varchar(50),
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `governance_nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionId` int NOT NULL,
	`userId` int NOT NULL,
	`fieldChanged` varchar(100) NOT NULL,
	`oldValue` text,
	`newValue` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `history_id` PRIMARY KEY(`id`)
);
