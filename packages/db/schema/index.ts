import type { ChainId } from '@zodiac/chains'
import {
  addressSchema,
  AllowanceInterval,
  chainIdSchema,
  Hex,
  NonNullableProperties,
  NullProperties,
  waypointsSchema,
  type HexAddress,
  type MetaTransactionRequest,
  type Waypoints,
} from '@zodiac/schema'
import { type UUID } from 'crypto'
import randomBigInt from 'crypto-random-bigint'
import { relations } from 'drizzle-orm'
import {
  bigint,
  boolean,
  index,
  integer,
  json,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import { AccountBuilderCall, Account as SerAccount } from 'ser-kit'
import { z } from 'zod'
import { createRandomString } from './createRandomString'
import { enumToPgEnum } from './enumToPgEnum'

export { createRandomString } from './createRandomString'

const createdTimestamp = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}

const updatedTimestamp = {
  updatedAt: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}

const deletable = {
  deleted: boolean().default(false).notNull(),
  deletedById: uuid()
    .$type<UUID>()
    .references(() => UserTable.id, { onDelete: 'set null' }),
  deletedAt: timestamp({ withTimezone: true }),
}

export const TenantTable = pgTable(
  'Tenant',
  {
    id: uuid().notNull().$type<UUID>().defaultRandom().primaryKey(),
    name: text().notNull(),
    externalId: text(),
    createdById: uuid()
      .notNull()
      .$type<UUID>()
      .references(() => UserTable.id, { onDelete: 'cascade' }),
    defaultWorkspaceId: uuid()
      .$type<UUID>()
      .references((): AnyPgColumn => WorkspaceTable.id, {
        onDelete: 'set null',
      }),

    ...createdTimestamp,
    ...updatedTimestamp,
  },
  (table) => [
    index().on(table.externalId),
    index().on(table.createdById),
    index().on(table.defaultWorkspaceId),
  ],
)

const tenantReference = {
  tenantId: uuid()
    .notNull()
    .$type<UUID>()
    .references(() => TenantTable.id, { onDelete: 'cascade' }),
}

export type Tenant = Omit<
  typeof TenantTable.$inferSelect,
  'defaultWorkspaceId'
> & { defaultWorkspaceId: UUID }
export type TenantCreateInput = typeof TenantTable.$inferInsert

export const TenantRelations = relations(TenantTable, ({ many }) => ({
  activeFeatures: many(ActiveFeatureTable),
}))

export const UserTable = pgTable(
  'User',
  {
    id: uuid().notNull().$type<UUID>().defaultRandom().primaryKey(),
    fullName: text().notNull().default(''),
    externalId: text(),
    nonce: bigint({ mode: 'bigint' })
      .notNull()
      .$defaultFn(() => randomBigInt(63)),

    ...createdTimestamp,
    ...updatedTimestamp,
  },
  (table) => [index().on(table.externalId)],
)

const userReference = {
  userId: uuid()
    .notNull()
    .$type<UUID>()
    .references(() => UserTable.id, { onDelete: 'cascade' }),
}

const createdByReference = {
  createdById: uuid()
    .notNull()
    .$type<UUID>()
    .references(() => UserTable.id, { onDelete: 'cascade' }),
}

export type User = typeof UserTable.$inferSelect
export type UserCreateInput = typeof UserTable.$inferInsert

export const TenantMembershipTable = pgTable(
  'TenantMembership',
  {
    ...tenantReference,
    ...userReference,
    ...createdTimestamp,
  },
  (table) => [
    primaryKey({ columns: [table.tenantId, table.userId] }),
    index().on(table.tenantId),
    index().on(table.userId),
  ],
)

export const WorkspaceTable = pgTable(
  'Workspace',
  {
    id: uuid().notNull().$type<UUID>().defaultRandom().primaryKey(),
    label: text().notNull(),
    createdById: uuid()
      .notNull()
      .$type<UUID>()
      .references(() => UserTable.id, { onDelete: 'cascade' }),

    ...tenantReference,
    ...createdTimestamp,
    ...updatedTimestamp,
    ...deletable,
  },
  (table) => [
    index().on(table.tenantId),
    index().on(table.createdById),
    index().on(table.deletedById),
  ],
)

export type Workspace = typeof WorkspaceTable.$inferSelect
export type WorkspaceCreateInput = typeof WorkspaceTable.$inferInsert

const WorkspaceRelations = relations(WorkspaceTable, ({ one }) => ({
  createdBy: one(UserTable, {
    fields: [WorkspaceTable.createdById],
    references: [UserTable.id],
  }),
}))

const workspaceReference = {
  workspaceId: uuid()
    .notNull()
    .$type<UUID>()
    .references(() => WorkspaceTable.id, { onDelete: 'cascade' }),
}

export const FeatureTable = pgTable(
  'Feature',
  {
    id: uuid().notNull().$type<UUID>().defaultRandom().primaryKey(),
    name: text().notNull(),
    ...createdTimestamp,
  },
  (table) => [unique().on(table.name)],
)

export type Feature = typeof FeatureTable.$inferSelect
export type FeatureCreateInput = typeof FeatureTable.$inferInsert

export const featureSchema = createSelectSchema(FeatureTable, {
  createdAt: z.coerce.date(),
})

export const FeatureRelations = relations(FeatureTable, ({ many }) => ({
  activeOnTenants: many(ActiveFeatureTable),
}))

export const ActiveFeatureTable = pgTable(
  'ActiveFeature',
  {
    featureId: uuid()
      .notNull()
      .$type<UUID>()
      .references(() => FeatureTable.id, { onDelete: 'cascade' }),
    ...tenantReference,
    ...createdTimestamp,
  },
  (table) => [
    primaryKey({ columns: [table.featureId, table.tenantId] }),
    index().on(table.featureId),
    index().on(table.tenantId),
  ],
)

export const ActiveFeatureRelations = relations(
  ActiveFeatureTable,
  ({ one }) => ({
    tenant: one(TenantTable, {
      fields: [ActiveFeatureTable.tenantId],
      references: [TenantTable.id],
    }),
    feature: one(FeatureTable, {
      fields: [ActiveFeatureTable.featureId],
      references: [FeatureTable.id],
    }),
  }),
)

export const SubscriptionPlanTable = pgTable(
  'SubscriptionPlan',
  {
    id: uuid().notNull().$type<UUID>().defaultRandom().primaryKey(),

    name: text().notNull(),
    isDefault: boolean().notNull().default(false),
    priority: integer().notNull().default(0),

    ...createdTimestamp,
    ...updatedTimestamp,
    ...deletable,
  },
  (table) => [index().on(table.deletedById)],
)

export type SubscriptionPlan = typeof SubscriptionPlanTable.$inferSelect
export type SubscriptionPlanCreateInput =
  typeof SubscriptionPlanTable.$inferInsert

export const ActiveSubscriptionTable = pgTable(
  'ActiveSubscription',
  {
    id: uuid().notNull().$type<UUID>().defaultRandom().primaryKey(),

    subscriptionPlanId: uuid()
      .notNull()
      .$type<UUID>()
      .references(() => SubscriptionPlanTable.id, { onDelete: 'cascade' }),

    validFrom: timestamp({ withTimezone: true }).notNull().defaultNow(),
    validThrough: timestamp({ withTimezone: true }),

    ...tenantReference,
    ...createdTimestamp,
    ...updatedTimestamp,
  },
  (table) => [index().on(table.subscriptionPlanId), index().on(table.tenantId)],
)

const ActiveSubscriptionRelations = relations(
  ActiveSubscriptionTable,
  ({ one }) => ({
    subscriptionPlan: one(SubscriptionPlanTable, {
      fields: [ActiveSubscriptionTable.subscriptionPlanId],
      references: [SubscriptionPlanTable.id],
    }),
  }),
)

const chainReference = {
  chainId: integer().$type<ChainId>().notNull(),
}

export const AccountTable = pgTable(
  'Account',
  {
    id: uuid().notNull().$type<UUID>().defaultRandom().primaryKey(),
    createdById: uuid()
      .notNull()
      .$type<UUID>()
      .references(() => UserTable.id, { onDelete: 'cascade' }),
    label: text(),
    address: text().$type<HexAddress>().notNull(),
    nonce: bigint({ mode: 'bigint' })
      .notNull()
      .$defaultFn(() => randomBigInt(63)),

    ...chainReference,
    ...tenantReference,
    ...workspaceReference,
    ...createdTimestamp,
    ...updatedTimestamp,
    ...deletable,
  },
  (table) => [
    index().on(table.tenantId),
    index().on(table.createdById),
    index().on(table.workspaceId),
    index().on(table.deletedById),
  ],
)

const accountReference = {
  accountId: uuid()
    .notNull()
    .$type<UUID>()
    .references(() => AccountTable.id, { onDelete: 'cascade' }),
}

export type Account = typeof AccountTable.$inferSelect
export type AccountCreateInput = typeof AccountTable.$inferInsert

export const accountSchema = createSelectSchema(AccountTable, {
  chainId: chainIdSchema,
  address: addressSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
  deletedAt: z.coerce.date().optional().nullable(),
  nonce: z.coerce.bigint(),
})

export const WalletTable = pgTable(
  'Wallet',
  {
    id: uuid().notNull().$type<UUID>().defaultRandom().primaryKey(),
    belongsToId: uuid()
      .notNull()
      .$type<UUID>()
      .references(() => UserTable.id, { onDelete: 'cascade' }),
    label: text().notNull(),
    address: text().$type<HexAddress>().notNull(),

    ...createdTimestamp,
    ...updatedTimestamp,
    ...deletable,
  },
  (table) => [index().on(table.belongsToId), index().on(table.deletedById)],
)

const walletReference = {
  walletId: uuid()
    .notNull()
    .$type<UUID>()
    .references(() => WalletTable.id, { onDelete: 'cascade' }),
}

export type Wallet = typeof WalletTable.$inferSelect
export type WalletCreateInput = typeof WalletTable.$inferInsert

export const DefaultWalletTable = pgTable(
  'DefaultWallet',
  {
    ...chainReference,
    ...userReference,
    ...walletReference,
  },
  (table) => [
    primaryKey({ columns: [table.chainId, table.userId] }),
    index().on(table.userId),
    index().on(table.walletId),
  ],
)

const DefaultWalletRelations = relations(DefaultWalletTable, ({ one }) => ({
  wallet: one(WalletTable, {
    fields: [DefaultWalletTable.walletId],
    references: [WalletTable.id],
  }),
}))

export const RouteTable = pgTable(
  'Route',
  {
    id: uuid().notNull().$type<UUID>().defaultRandom().primaryKey(),
    label: text(),
    fromId: uuid()
      .notNull()
      .$type<UUID>()
      .references(() => WalletTable.id, { onDelete: 'set null' }),
    toId: uuid()
      .notNull()
      .$type<UUID>()
      .references(() => AccountTable.id, { onDelete: 'cascade' }),
    waypoints: json().$type<Waypoints>().notNull(),

    ...tenantReference,
    ...userReference,
    ...createdTimestamp,
    ...updatedTimestamp,
  },
  (table) => [
    index().on(table.fromId),
    index().on(table.toId),
    index().on(table.tenantId),
    index().on(table.userId),
  ],
)

const routeReference = {
  routeId: uuid()
    .notNull()
    .$type<UUID>()
    .references(() => RouteTable.id, { onDelete: 'cascade' }),
}

export type Route = typeof RouteTable.$inferSelect
export type RouteCreateInput = typeof RouteTable.$inferInsert

export const routeSchema = createSelectSchema(RouteTable, {
  waypoints: waypointsSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
})

const RouteRelations = relations(RouteTable, ({ one }) => ({
  wallet: one(WalletTable, {
    fields: [RouteTable.fromId],
    references: [WalletTable.id],
  }),
  account: one(AccountTable, {
    fields: [RouteTable.toId],
    references: [AccountTable.id],
  }),
}))

export const DefaultRouteTable = pgTable(
  'DefaultRoute',
  {
    ...userReference,
    ...accountReference,
    ...routeReference,
    ...tenantReference,
    ...createdTimestamp,
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.accountId, table.routeId] }),
    index().on(table.userId),
    index().on(table.accountId),
    index().on(table.routeId),
    index().on(table.tenantId),
  ],
)

const DefaultRouteRelations = relations(DefaultRouteTable, ({ one }) => ({
  route: one(RouteTable, {
    fields: [DefaultRouteTable.routeId],
    references: [RouteTable.id],
  }),

  account: one(AccountTable, {
    fields: [DefaultRouteTable.accountId],
    references: [AccountTable.id],
  }),
}))

export const ActiveAccountTable = pgTable(
  'ActiveAccount',
  {
    ...userReference,
    ...accountReference,
    ...tenantReference,
    ...createdTimestamp,
  },
  (table) => [
    primaryKey({ columns: [table.accountId, table.tenantId, table.userId] }),
    index().on(table.accountId),
    index().on(table.tenantId),
    index().on(table.userId),
  ],
)

export const ProposedTransactionTable = pgTable(
  'ProposedTransaction',
  {
    id: uuid().notNull().$type<UUID>().defaultRandom().primaryKey(),

    transaction: json().$type<MetaTransactionRequest[]>().notNull(),

    signedTransactionId: uuid()
      .$type<UUID>()
      .references(() => SignedTransactionTable.id, {
        onDelete: 'cascade',
      }),

    callbackUrl: text(),
    callbackState: text(),

    ...userReference,
    ...tenantReference,
    ...accountReference,
    ...workspaceReference,
    ...createdTimestamp,
  },
  (table) => [
    index().on(table.tenantId),
    index().on(table.userId),
    index().on(table.signedTransactionId),
    index().on(table.workspaceId),
    index().on(table.accountId),
  ],
)

export type ProposedTransaction = typeof ProposedTransactionTable.$inferSelect
export type ProposedTransactionCreateInput =
  typeof ProposedTransactionTable.$inferInsert

export const SignedTransactionTable = pgTable(
  'SignedTransaction',
  {
    id: uuid().notNull().$type<UUID>().defaultRandom().primaryKey(),

    transaction: json().$type<MetaTransactionRequest[]>().notNull(),
    explorerUrl: text(),
    safeWalletUrl: text(),

    routeLabel: text(),
    waypoints: json().$type<Waypoints>().notNull(),

    ...walletReference,
    ...accountReference,
    ...workspaceReference,
    ...userReference,
    ...tenantReference,
    ...createdTimestamp,
  },
  (table) => [
    index().on(table.accountId),
    index().on(table.tenantId),
    index().on(table.userId),
    index().on(table.walletId),
    index().on(table.workspaceId),
  ],
)

export type SignedTransaction = typeof SignedTransactionTable.$inferSelect
export type SignedTransactionCreateInput =
  typeof SignedTransactionTable.$inferInsert

const SignedTransactionRelations = relations(
  SignedTransactionTable,
  ({ one }) => ({
    signer: one(UserTable, {
      fields: [SignedTransactionTable.userId],
      references: [UserTable.id],
    }),
  }),
)

export const RoleTable = pgTable(
  'Role',
  {
    id: uuid().notNull().$type<UUID>().defaultRandom().primaryKey(),

    label: text().notNull(),
    key: varchar({ length: 32 }).notNull(),

    ...createdTimestamp,
    ...updatedTimestamp,
    ...tenantReference,
    ...workspaceReference,
    ...createdByReference,
  },
  (table) => [
    unique().on(table.workspaceId, table.key),
    index().on(table.tenantId),
    index().on(table.workspaceId),
    index().on(table.createdById),
  ],
)

export type Role = typeof RoleTable.$inferSelect
export type RoleCreateInput = typeof RoleTable.$inferInsert

const roleReference = {
  roleId: uuid()
    .notNull()
    .$type<UUID>()
    .references(() => RoleTable.id, { onDelete: 'cascade' }),
}

const RoleRelations = relations(RoleTable, ({ one }) => ({
  createBy: one(UserTable, {
    fields: [RoleTable.createdById],
    references: [UserTable.id],
  }),
}))

export const RoleMembershipTable = pgTable(
  'RoleMembership',
  {
    ...userReference,
    ...roleReference,
    ...createdTimestamp,
    ...tenantReference,
    ...workspaceReference,
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.userId] }),
    index().on(table.roleId),
    index().on(table.tenantId),
    index().on(table.userId),
    index().on(table.workspaceId),
  ],
)

const RoleMembershipRelations = relations(RoleMembershipTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [RoleMembershipTable.userId],
    references: [UserTable.id],
  }),
}))

export const ActivatedRoleTable = pgTable(
  'ActivatedRole',
  {
    ...roleReference,
    ...accountReference,
    ...createdTimestamp,
    ...tenantReference,
    ...workspaceReference,
  },
  (table) => [
    primaryKey({ columns: [table.accountId, table.roleId] }),
    index().on(table.accountId),
    index().on(table.roleId),
    index().on(table.tenantId),
    index().on(table.workspaceId),
  ],
)

export enum RoleActionType {
  Swapper = 'swapper',
  Stake = 'stake',
  Bridge = 'bridge',
  Transfer = 'transfer',
  Custom = 'custom',
}

export const RoleActionTypeEnum = pgEnum(
  'RoleActionType',
  enumToPgEnum(RoleActionType),
)

export const RoleActionTable = pgTable(
  'RoleAction',
  {
    id: uuid().notNull().$type<UUID>().defaultRandom().primaryKey(),

    label: text().notNull(),
    type: RoleActionTypeEnum().notNull(),

    ...roleReference,
    ...workspaceReference,
    ...tenantReference,
    ...createdByReference,
    ...createdTimestamp,
    ...updatedTimestamp,
  },
  (table) => [
    index().on(table.createdById),
    index().on(table.roleId),
    index().on(table.tenantId),
    index().on(table.workspaceId),
  ],
)

export type RoleAction = typeof RoleActionTable.$inferSelect
export type RoleActionCreateInput = typeof RoleActionTable.$inferInsert

const RoleActionRelations = relations(RoleActionTable, ({ one, many }) => ({
  createdBy: one(UserTable, {
    fields: [RoleActionTable.createdById],
    references: [UserTable.id],
  }),
  assets: many(ActionAssetTable),
}))

export const AllowanceIntervalEnum = pgEnum(
  'AllowanceInterval',
  enumToPgEnum(AllowanceInterval),
)

export const ActionAssetTable = pgTable(
  'ActionAsset',
  {
    id: uuid().notNull().$type<UUID>().defaultRandom().primaryKey(),

    roleActionId: uuid()
      .notNull()
      .$type<UUID>()
      .references(() => RoleActionTable.id, { onDelete: 'cascade' }),

    address: text().$type<HexAddress>().notNull(),
    symbol: text().notNull(),

    allowance: bigint({ mode: 'bigint' }),
    interval: AllowanceIntervalEnum(),
    allowanceKey: varchar({ length: 32 })
      .notNull()
      .$defaultFn(() => createRandomString(31)),

    allowBuy: boolean().notNull(),
    allowSell: boolean().notNull(),

    ...roleReference,
    ...chainReference,
    ...createdTimestamp,
    ...updatedTimestamp,
    ...tenantReference,
    ...workspaceReference,
  },
  (table) => [
    index().on(table.roleActionId),
    index().on(table.roleId),
    index().on(table.workspaceId),
    index().on(table.tenantId),
  ],
)

export type RoleActionAsset = typeof ActionAssetTable.$inferSelect
export type RoleActionAssetCreateInput = typeof ActionAssetTable.$inferInsert

const ActionAssetRelations = relations(ActionAssetTable, ({ one }) => ({
  roleAction: one(RoleActionTable, {
    fields: [ActionAssetTable.roleActionId],
    references: [RoleActionTable.id],
  }),
}))

export enum RoleDeploymentIssue {
  NoActiveAccounts = 'NoActiveAccounts',
  NoActiveMembers = 'NoActiveMembers',
  MissingDefaultWallet = 'MissingDefaultWallet',
}

export const RoleDeploymentIssueEnum = pgEnum(
  'RoleDeploymentIssue',
  enumToPgEnum(RoleDeploymentIssue),
)

export const RoleDeploymentTable = pgTable(
  'RoleDeployment',
  {
    id: uuid().notNull().$type<UUID>().defaultRandom().primaryKey(),

    completedAt: timestamp({ withTimezone: true }),

    cancelledAt: timestamp({ withTimezone: true }),
    cancelledById: uuid()
      .$type<UUID>()
      .references(() => UserTable.id, {
        onDelete: 'set null',
      }),

    issues: RoleDeploymentIssueEnum().array().notNull().default([]),

    ...roleReference,
    ...createdByReference,
    ...createdTimestamp,
    ...updatedTimestamp,
    ...tenantReference,
    ...workspaceReference,
  },
  (table) => [
    index().on(table.roleId),
    index().on(table.createdById),
    index().on(table.tenantId),
    index().on(table.workspaceId),
  ],
)

const roleDeploymentReference = {
  roleDeploymentId: uuid()
    .notNull()
    .$type<UUID>()
    .references(() => RoleDeploymentTable.id, { onDelete: 'cascade' }),
}

export type BaseRoleDeployment = typeof RoleDeploymentTable.$inferSelect
export type RoleDeploymentCreateInput = typeof RoleDeploymentTable.$inferInsert

export type ActiveRoleDeployment = NullProperties<
  BaseRoleDeployment,
  'cancelledAt' | 'cancelledById' | 'completedAt'
>

export type CompletedRoleDeployment = NonNullableProperties<
  NullProperties<BaseRoleDeployment, 'cancelledAt' | 'cancelledById'>,
  'completedAt'
>

export type CancelledRoleDeployment = NonNullableProperties<
  NullProperties<BaseRoleDeployment, 'completedAt'>,
  'cancelledAt' | 'cancelledById'
>

export type RoleDeployment =
  | ActiveRoleDeployment
  | CompletedRoleDeployment
  | CancelledRoleDeployment

export const RoleDeploymentStepTable = pgTable(
  'RoleDeploymentStep',
  {
    id: uuid().notNull().$type<UUID>().defaultRandom().primaryKey(),
    index: integer().notNull(),

    proposedTransactionId: uuid().references(
      () => ProposedTransactionTable.id,
      {
        onDelete: 'set null',
      },
    ),
    signedTransactionId: uuid().references(() => SignedTransactionTable.id, {
      onDelete: 'set null',
    }),

    ...chainReference,

    account: jsonb().notNull().$type<SerAccount>(),
    calls: jsonb().notNull().$type<AccountBuilderCall[]>(),
    transactionBundle: jsonb().notNull().$type<MetaTransactionRequest[]>(),
    from: text().$type<HexAddress>(),

    transactionHash: text().$type<Hex>(),

    completedAt: timestamp({ withTimezone: true }),
    completedById: uuid()
      .$type<UUID>()
      .references(() => UserTable.id, {
        onDelete: 'set null',
      }),

    cancelledAt: timestamp({ withTimezone: true }),
    cancelledById: uuid()
      .$type<UUID>()
      .references(() => UserTable.id, {
        onDelete: 'set null',
      }),

    ...roleDeploymentReference,
    ...createdTimestamp,
    ...updatedTimestamp,
    ...tenantReference,
    ...workspaceReference,
  },
  (table) => [
    index().on(table.roleDeploymentId),
    index().on(table.proposedTransactionId),
    index().on(table.signedTransactionId),
    index().on(table.tenantId),
    index().on(table.workspaceId),
    index().on(table.completedById),
    index().on(table.cancelledById),
  ],
)

export type RoleDeploymentStep = typeof RoleDeploymentStepTable.$inferSelect
export type RoleDeploymentStepCreateInput =
  typeof RoleDeploymentStepTable.$inferInsert

export const schema = {
  tenant: TenantTable,
  user: UserTable,
  tenantMembership: TenantMembershipTable,
  feature: FeatureTable,
  activeFeature: ActiveFeatureTable,
  account: AccountTable,
  wallet: WalletTable,
  route: RouteTable,
  defaultRoute: DefaultRouteTable,
  activeAccount: ActiveAccountTable,
  signedTransaction: SignedTransactionTable,
  subscriptionPlans: SubscriptionPlanTable,
  activeSubscriptionPlans: ActiveSubscriptionTable,
  proposedTransactions: ProposedTransactionTable,
  workspace: WorkspaceTable,
  role: RoleTable,
  roleMembership: RoleMembershipTable,
  activatedRole: ActivatedRoleTable,
  roleAction: RoleActionTable,
  roleActionAsset: ActionAssetTable,
  defaultWallet: DefaultWalletTable,
  roleDeployment: RoleDeploymentTable,
  roleDeploymentStep: RoleDeploymentStepTable,

  TenantRelations,
  FeatureRelations,
  RouteRelations,
  ActiveFeatureRelations,
  DefaultRouteRelations,
  ActiveSubscriptionRelations,
  SignedTransactionRelations,
  WorkspaceRelations,
  RoleMembershipRelations,
  RoleRelations,
  RoleActionRelations,
  ActionAssetRelations,
  DefaultWalletRelations,
  RoleDeploymentIssueEnum,
}
