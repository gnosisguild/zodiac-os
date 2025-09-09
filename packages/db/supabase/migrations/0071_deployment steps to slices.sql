ALTER TABLE "RoleDeploymentStep" RENAME TO "RoleDeploymentSlice";--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" DROP CONSTRAINT "RoleDeploymentStep_proposedTransactionId_ProposedTransaction_id_fk";
--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" DROP CONSTRAINT "RoleDeploymentStep_signedTransactionId_SignedTransaction_id_fk";
--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" DROP CONSTRAINT "RoleDeploymentStep_completedById_User_id_fk";
--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" DROP CONSTRAINT "RoleDeploymentStep_cancelledById_User_id_fk";
--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" DROP CONSTRAINT "RoleDeploymentStep_roleDeploymentId_RoleDeployment_id_fk";
--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" DROP CONSTRAINT "RoleDeploymentStep_tenantId_Tenant_id_fk";
--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" DROP CONSTRAINT "RoleDeploymentStep_workspaceId_Workspace_id_fk";
--> statement-breakpoint
DROP INDEX "RoleDeploymentStep_roleDeploymentId_index";--> statement-breakpoint
DROP INDEX "RoleDeploymentStep_proposedTransactionId_index";--> statement-breakpoint
DROP INDEX "RoleDeploymentStep_signedTransactionId_index";--> statement-breakpoint
DROP INDEX "RoleDeploymentStep_tenantId_index";--> statement-breakpoint
DROP INDEX "RoleDeploymentStep_workspaceId_index";--> statement-breakpoint
DROP INDEX "RoleDeploymentStep_completedById_index";--> statement-breakpoint
DROP INDEX "RoleDeploymentStep_cancelledById_index";--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" ADD COLUMN "steps" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" ADD CONSTRAINT "RoleDeploymentSlice_proposedTransactionId_ProposedTransaction_id_fk" FOREIGN KEY ("proposedTransactionId") REFERENCES "public"."ProposedTransaction"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" ADD CONSTRAINT "RoleDeploymentSlice_signedTransactionId_SignedTransaction_id_fk" FOREIGN KEY ("signedTransactionId") REFERENCES "public"."SignedTransaction"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" ADD CONSTRAINT "RoleDeploymentSlice_completedById_User_id_fk" FOREIGN KEY ("completedById") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" ADD CONSTRAINT "RoleDeploymentSlice_cancelledById_User_id_fk" FOREIGN KEY ("cancelledById") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" ADD CONSTRAINT "RoleDeploymentSlice_roleDeploymentId_RoleDeployment_id_fk" FOREIGN KEY ("roleDeploymentId") REFERENCES "public"."RoleDeployment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" ADD CONSTRAINT "RoleDeploymentSlice_tenantId_Tenant_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" ADD CONSTRAINT "RoleDeploymentSlice_workspaceId_Workspace_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "RoleDeploymentSlice_roleDeploymentId_index" ON "RoleDeploymentSlice" USING btree ("roleDeploymentId");--> statement-breakpoint
CREATE INDEX "RoleDeploymentSlice_proposedTransactionId_index" ON "RoleDeploymentSlice" USING btree ("proposedTransactionId");--> statement-breakpoint
CREATE INDEX "RoleDeploymentSlice_signedTransactionId_index" ON "RoleDeploymentSlice" USING btree ("signedTransactionId");--> statement-breakpoint
CREATE INDEX "RoleDeploymentSlice_tenantId_index" ON "RoleDeploymentSlice" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "RoleDeploymentSlice_workspaceId_index" ON "RoleDeploymentSlice" USING btree ("workspaceId");--> statement-breakpoint
CREATE INDEX "RoleDeploymentSlice_completedById_index" ON "RoleDeploymentSlice" USING btree ("completedById");--> statement-breakpoint
CREATE INDEX "RoleDeploymentSlice_cancelledById_index" ON "RoleDeploymentSlice" USING btree ("cancelledById");--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" DROP COLUMN "account";--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" DROP COLUMN "calls";--> statement-breakpoint
ALTER TABLE "RoleDeploymentSlice" DROP COLUMN "transactionBundle";