CREATE TYPE "public"."area" AS ENUM('Governança', 'Técnico', 'Jurídico', 'Eco-Fin');--> statement-breakpoint
CREATE TYPE "public"."audit_event_type" AS ENUM('comment', 'document');--> statement-breakpoint
CREATE TYPE "public"."contact_channel" AS ENUM('email', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."governance_node_type" AS ENUM('root', 'committee', 'board', 'focal', 'entity');--> statement-breakpoint
CREATE TYPE "public"."local_user_role" AS ENUM('super_admin', 'admin', 'setorial', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('item_change', 'comment_doc');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('Alta', 'Média', 'Baixa');--> statement-breakpoint
CREATE TYPE "public"."project" AS ENUM('ribeira', 'sanea');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('Pendente', 'Em Andamento', 'Concluído', 'Cancelado');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "action_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"actionId" integer NOT NULL,
	"label" varchar(300) NOT NULL,
	"url" text NOT NULL,
	"uploadedBy" integer NOT NULL,
	"uploaderName" varchar(200),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"docStatus" varchar(30),
	"statusUpdatedAt" timestamp,
	"statusUpdatedBy" varchar(200)
);
--> statement-breakpoint
CREATE TABLE "action_orgaos" (
	"id" serial PRIMARY KEY NOT NULL,
	"actionId" integer NOT NULL,
	"orgao" varchar(100) NOT NULL,
	"responsavelNome" varchar(200),
	"responsavelCargo" varchar(200),
	"responsavelTel" varchar(50),
	"responsavelEmail" varchar(320),
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"area" "area" NOT NULL,
	"itemCode" varchar(20) NOT NULL,
	"parentCode" varchar(20),
	"isGroup" integer DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"priority" "priority",
	"status" "status" DEFAULT 'Pendente' NOT NULL,
	"dueDate" timestamp,
	"requestDate" timestamp,
	"receiptDate" timestamp,
	"documentBase" text,
	"observacoes" text,
	"orgao" varchar(50),
	"responsavelNome" varchar(200),
	"responsavelCargo" varchar(200),
	"responsavelTel" varchar(50),
	"responsavelEmail" varchar(320),
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"project" "project" DEFAULT 'ribeira' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"actionId" integer NOT NULL,
	"userId" integer NOT NULL,
	"userName" varchar(200) NOT NULL,
	"userRole" varchar(50) NOT NULL,
	"userOrgao" varchar(100),
	"eventType" "audit_event_type" NOT NULL,
	"detail" text,
	"project" "project",
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"actionId" integer NOT NULL,
	"userId" integer NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"actionId" integer NOT NULL,
	"channel" "contact_channel" NOT NULL,
	"recipientName" varchar(200),
	"recipientContact" varchar(320),
	"message" text,
	"sentBy" varchar(200),
	"sentAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance_nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"parentId" integer,
	"title" varchar(200) NOT NULL,
	"subtitle" text,
	"type" "governance_node_type" NOT NULL,
	"theme" varchar(50),
	"sortOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "history" (
	"id" serial PRIMARY KEY NOT NULL,
	"actionId" integer NOT NULL,
	"userId" integer NOT NULL,
	"fieldChanged" varchar(100) NOT NULL,
	"oldValue" text,
	"newValue" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "local_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"username" varchar(100) NOT NULL,
	"passwordHash" varchar(255) NOT NULL,
	"role" "local_user_role" DEFAULT 'viewer' NOT NULL,
	"position" varchar(200),
	"organization" varchar(200),
	"telefone" varchar(50),
	"email" varchar(320),
	"active" integer DEFAULT 1 NOT NULL,
	"pendingApproval" integer DEFAULT 0 NOT NULL,
	"allowedProjects" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastAccessAt" bigint,
	CONSTRAINT "local_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(300) NOT NULL,
	"body" text,
	"actionId" integer,
	"actionCode" varchar(50),
	"orgao" varchar(100),
	"isRead" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orgao_responsaveis" (
	"id" serial PRIMARY KEY NOT NULL,
	"orgao" varchar(100) NOT NULL,
	"nome" varchar(200) NOT NULL,
	"cargo" varchar(200),
	"telefone" varchar(50),
	"email" varchar(320),
	"localUserId" integer,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_orgaos" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"orgao" varchar(100) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
