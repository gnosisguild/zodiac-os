CREATE TABLE "RoleDeployment" (
	"issues" "RoleDeploymentIssue"[] DEFAULT '{}' NOT NULL,
	"deploymentId" uuid NOT NULL,
	"roleId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "RoleDeployment" ADD CONSTRAINT "RoleDeployment_deploymentId_Deployment_id_fk" FOREIGN KEY ("deploymentId") REFERENCES "public"."Deployment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RoleDeployment" ADD CONSTRAINT "RoleDeployment_roleId_Role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "RoleDeployment_roleId_index" ON "RoleDeployment" USING btree ("roleId");--> statement-breakpoint
CREATE INDEX "RoleDeployment_deploymentId_index" ON "RoleDeployment" USING btree ("deploymentId");