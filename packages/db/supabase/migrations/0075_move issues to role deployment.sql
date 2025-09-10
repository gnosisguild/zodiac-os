ALTER TYPE "public"."DeploymentIssue" RENAME TO "RoleDeploymentIssue";--> statement-breakpoint
ALTER TABLE "RoleDeployment" ADD COLUMN "issues" "RoleDeploymentIssue"[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "Deployment" DROP COLUMN "issues";