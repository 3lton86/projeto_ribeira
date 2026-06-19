ALTER TABLE `action_documents` ADD `docStatus` varchar(30);--> statement-breakpoint
ALTER TABLE `action_documents` ADD `statusUpdatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `action_documents` ADD `statusUpdatedBy` varchar(200);