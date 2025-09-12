CREATE TABLE "SetupSafe" (
	"userId" uuid NOT NULL,
	"chainId" integer NOT NULL,
	"address" text NOT NULL,
	CONSTRAINT "SetupSafe_userId_chainId_pk" PRIMARY KEY("userId","chainId")
);
--> statement-breakpoint
ALTER TABLE "SetupSafe" ADD CONSTRAINT "SetupSafe_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;