ALTER TYPE "public"."RoleDeploymentIssue" RENAME TO "DeploymentIssue";--> statement-breakpoint
CREATE TABLE "DeploymentSlice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"index" integer NOT NULL,
	"proposedTransactionId" uuid,
	"signedTransactionId" uuid,
	"chainId" integer NOT NULL,
	"steps" jsonb NOT NULL,
	"from" text NOT NULL,
	"transactionHash" text,
	"completedAt" timestamp with time zone,
	"completedById" uuid,
	"cancelledAt" timestamp with time zone,
	"cancelledById" uuid,
	"deploymentId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone,
	"tenantId" uuid NOT NULL,
	"workspaceId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Deployment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(255),
	"completedAt" timestamp with time zone,
	"cancelledAt" timestamp with time zone,
	"cancelledById" uuid,
	"issues" "DeploymentIssue"[] DEFAULT '{}' NOT NULL,
	"createdById" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone,
	"tenantId" uuid NOT NULL,
	"workspaceId" uuid NOT NULL
);
--> statement-breakpoint
DROP TABLE "RoleDeploymentSlice" CASCADE;--> statement-breakpoint
DROP TABLE "RoleDeployment" CASCADE;--> statement-breakpoint
ALTER TABLE "DeploymentSlice" ADD CONSTRAINT "DeploymentSlice_proposedTransactionId_ProposedTransaction_id_fk" FOREIGN KEY ("proposedTransactionId") REFERENCES "public"."ProposedTransaction"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DeploymentSlice" ADD CONSTRAINT "DeploymentSlice_signedTransactionId_SignedTransaction_id_fk" FOREIGN KEY ("signedTransactionId") REFERENCES "public"."SignedTransaction"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DeploymentSlice" ADD CONSTRAINT "DeploymentSlice_completedById_User_id_fk" FOREIGN KEY ("completedById") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DeploymentSlice" ADD CONSTRAINT "DeploymentSlice_cancelledById_User_id_fk" FOREIGN KEY ("cancelledById") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DeploymentSlice" ADD CONSTRAINT "DeploymentSlice_deploymentId_Deployment_id_fk" FOREIGN KEY ("deploymentId") REFERENCES "public"."Deployment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DeploymentSlice" ADD CONSTRAINT "DeploymentSlice_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DeploymentSlice" ADD CONSTRAINT "DeploymentSlice_workspaceId_Workspace_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_cancelledById_User_id_fk" FOREIGN KEY ("cancelledById") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_createdById_User_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_workspaceId_Workspace_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "DeploymentSlice_deploymentId_index" ON "DeploymentSlice" USING btree ("deploymentId");--> statement-breakpoint
CREATE INDEX "DeploymentSlice_proposedTransactionId_index" ON "DeploymentSlice" USING btree ("proposedTransactionId");--> statement-breakpoint
CREATE INDEX "DeploymentSlice_signedTransactionId_index" ON "DeploymentSlice" USING btree ("signedTransactionId");--> statement-breakpoint
CREATE INDEX "DeploymentSlice_tenantId_index" ON "DeploymentSlice" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "DeploymentSlice_workspaceId_index" ON "DeploymentSlice" USING btree ("workspaceId");--> statement-breakpoint
CREATE INDEX "DeploymentSlice_completedById_index" ON "DeploymentSlice" USING btree ("completedById");--> statement-breakpoint
CREATE INDEX "DeploymentSlice_cancelledById_index" ON "DeploymentSlice" USING btree ("cancelledById");--> statement-breakpoint
CREATE INDEX "Deployment_reference_index" ON "Deployment" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "Deployment_createdById_index" ON "Deployment" USING btree ("createdById");--> statement-breakpoint
CREATE INDEX "Deployment_tenantId_index" ON "Deployment" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "Deployment_workspaceId_index" ON "Deployment" USING btree ("workspaceId");