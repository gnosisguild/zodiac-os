import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from '@react-router/dev/routes'

export default [
  index('routes/load-default-workspace.ts'),

  route('/robots.txt', 'routes/robots.ts'),

  route('/callback', 'routes/auth/callback.ts'),

  // BEGIN LEGACY REDIRECTS

  route('/tokens/send', 'routes/tokens/redirects/send-redirect.ts'),
  route('/tokens/balances', 'routes/tokens/redirects/balances-redirect.ts'),

  route(
    '/edit/:routeId/:data',
    'routes/local-accounts/redirects/edit-redirect.ts',
  ),
  route('/edit', 'routes/local-accounts/redirects/list-redirect.ts'),
  route('/create', 'routes/local-accounts/redirects/create-redirect.ts'),

  route('/account/:accountId', 'routes/accounts/redirects/account-redirect.ts'),

  route(
    '/submit/proposal/:proposalId/:routeId?',
    'routes/sign/redirects/sign-proposal-redirect.ts',
  ),
  route(
    '/submit/:route/:transactions',
    'routes/sign/redirects/offline-sign-transaction.ts',
  ),

  // BEGIN LEGACY REDIRECTS

  route('/offline', 'routes/offline-layout.tsx', [
    layout('routes/errorBoundary.tsx', { id: 'offline-error-boundary' }, [
      index('routes/welcome.tsx', { id: 'offline-welcome' }),

      route(
        'launch/:prefixedAvatarAddress/:accountLabel',
        'routes/launch/$prefixedAvatarAddress.$accountLabel/launch.tsx',
      ),

      ...prefix('sign-up', [
        index('routes/auth/sign-up.tsx'),
        route('success', 'routes/auth/sign-up.success.tsx'),
      ]),

      layout('routes/tokens/index.tsx', { id: 'offline-token-index' }, [
        ...prefix('tokens', [
          layout(
            'routes/tokens/balances/layout.tsx',
            { id: 'offline-balances-layout' },
            [
              route('balances', 'routes/tokens/balances/balances.tsx', {
                id: 'offline-balances',
              }),
            ],
          ),
          layout(
            'routes/tokens/send/layout.tsx',
            { id: 'offline-send-layout' },
            [
              route('send/:chain?/:token?', 'routes/tokens/send/send.tsx', {
                id: 'offline-send',
              }),
            ],
          ),
          layout(
            'routes/tokens/swap/layout.tsx',
            { id: 'offline-swap-layout' },
            [
              route('swap', 'routes/tokens/swap/swap.tsx', {
                id: 'offline-swap',
              }),
            ],
          ),
        ]),
      ]),

      layout('routes/walletProvider.tsx', { id: 'offline-wallet-provider' }, [
        route(
          'accounts',
          'routes/local-accounts/list.tsx',
          { id: 'offline-list-accounts' },
          [
            route(
              'delete/:accountId',
              'routes/local-accounts/delete-account.tsx',
              { id: 'offline-delete-account' },
            ),
          ],
        ),

        ...prefix('accounts', [
          route('create', 'routes/local-accounts/create.tsx', {
            id: 'offline-create-account',
          }),

          ...prefix(':accountId', [
            index('routes/local-accounts/load-account.tsx', {
              id: 'offline-load-account',
            }),
            route(':data', 'routes/local-accounts/edit.tsx', {
              id: 'offline-account-edit',
            }),
          ]),
        ]),

        ...prefix('submit', [
          layout('routes/sign/layout.tsx', { id: 'offline-sign-layout' }, [
            index('routes/sign/index.tsx', { id: 'offline-sign-index' }),

            route(
              ':route/:transactions',
              'routes/sign/$route.$transactions/sign.tsx',
            ),
          ]),
        ]),
      ]),
    ]),
  ]),

  route('/workspace/:workspaceId', 'routes/workspace-layout.tsx', [
    layout('routes/errorBoundary.tsx', [
      index('routes/welcome.tsx'),

      route('admin', 'routes/admin/layout.tsx', [
        index('routes/admin/users.tsx'),
        route('workspaces', 'routes/admin/workspaces/list.tsx', [
          route('add', 'routes/admin/workspaces/add-workspace.tsx'),
          route('edit/:id', 'routes/admin/workspaces/edit-workspace.tsx'),
          route('remove/:id', 'routes/admin/workspaces/remove-workspace.tsx'),
        ]),
      ]),

      layout('routes/tokens/index.tsx', [
        ...prefix('tokens', [
          layout('routes/tokens/balances/layout.tsx', [
            route('balances', 'routes/tokens/balances/balances.tsx'),
          ]),
          layout('routes/tokens/send/layout.tsx', [
            route('send/:chain?/:token?', 'routes/tokens/send/send.tsx'),
          ]),
          layout('routes/tokens/swap/layout.tsx', [
            route('swap', 'routes/tokens/swap/swap.tsx'),
          ]),
        ]),
      ]),

      layout('routes/walletProvider.tsx', [
        route('profile', 'routes/auth/profile.tsx', [
          route('add-wallet', 'routes/auth/add-wallet.tsx'),
          route('delete-wallet/:walletId', 'routes/auth/delete-wallet.tsx'),
        ]),

        route('roles', 'routes/roles/list-layout.tsx', [
          index('routes/roles/managed.tsx'),

          route('on-chain', 'routes/roles/on-chain.tsx'),
        ]),

        ...prefix('roles/:roleId/deployment/:deploymentId', [
          index('routes/roles/deploy-role.tsx'),
        ]),

        ...prefix('roles', [
          route('create', 'routes/roles/create.tsx'),
          route(':roleId', 'routes/roles/edit.tsx', [
            route('add-action', 'routes/roles/add-action.tsx'),

            ...prefix('action/:actionId', [
              index('routes/roles/edit-action.tsx'),
              route('add-asset', 'routes/roles/add-asset.tsx'),

              ...prefix('asset/:assetId', [
                index('routes/roles/edit-asset.tsx'),
              ]),
            ]),
          ]),
        ]),

        route('accounts', 'routes/accounts/list.tsx', [
          ...prefix(':accountId', [
            route('delete', 'routes/accounts/delete-account.tsx'),
            route('move', 'routes/accounts/move-account.tsx'),
          ]),
        ]),

        ...prefix('accounts', [
          route('create/:prefixedAddress?', 'routes/accounts/create.tsx'),

          route(':accountId', 'routes/accounts/edit.tsx', [
            index('routes/accounts/load-default-route.ts'),

            layout('routes/accounts/routes-layout.tsx', [
              route('no-routes', 'routes/accounts/no-routes.tsx', [
                route('add', 'routes/accounts/add-route.tsx', {
                  id: 'add-first-route',
                }),
              ]),
              route('route/:routeId', 'routes/accounts/routes.tsx', [
                route('edit', 'routes/accounts/edit-route.tsx'),
                route('remove', 'routes/accounts/remove-route.tsx'),
                route('add', 'routes/accounts/add-route.tsx'),
              ]),
            ]),
          ]),
        ]),

        route('local-accounts', 'routes/local-accounts/list.tsx', [
          route(
            'delete/:accountId',
            'routes/local-accounts/delete-account.tsx',
          ),
        ]),

        ...prefix('local-accounts', [
          route('create', 'routes/local-accounts/create.tsx'),

          ...prefix(':accountId', [
            index('routes/local-accounts/load-account.tsx'),
            route(':data', 'routes/local-accounts/edit.tsx'),
          ]),

          ...prefix('submit', [
            layout(
              'routes/sign/layout.tsx',
              { id: 'local-account-sign-layout' },
              [
                route(
                  ':route/:transactions',
                  'routes/sign/$route.$transactions/sign.tsx',
                  { id: 'local-account-sign' },
                ),
              ],
            ),
          ]),
        ]),

        ...prefix('submit', [
          layout('routes/sign/layout.tsx', [
            index('routes/sign/index.tsx'),

            route(
              'account/:accountId/:transactions',
              'routes/sign/account.$accountId.$transactions/sign.tsx',
            ),

            ...prefix('proposal/:proposalId', [
              index('routes/sign/proposal/load-default-route.tsx'),
              route(':routeId', 'routes/sign/proposal/sign.tsx'),
            ]),
          ]),
        ]),
      ]),
    ]),
  ]),

  route(
    '/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId/slice/:deploymentSliceId/sign-callback',
    'routes/roles/sign-callback.ts',
  ),

  layout('routes/system-admin/layout.tsx', [
    ...prefix('/system-admin', [
      index('routes/system-admin/_index.ts'),

      route('tenants', 'routes/system-admin/tenants/tenants.tsx'),
      route('tenant/:tenantId', 'routes/system-admin/tenants/tenant.tsx', [
        route('add-plan', 'routes/system-admin/tenants/add-plan.tsx'),
      ]),

      route('users', 'routes/system-admin/users/users.tsx', [
        route('remove/:workOsUserId', 'routes/system-admin/users/remove.tsx'),
      ]),

      route('/features', 'routes/system-admin/features/features.tsx', [
        route('create', 'routes/system-admin/features/create.tsx'),
        route('remove/:featureId', 'routes/system-admin/features/remove.tsx'),
      ]),

      route(
        'subscriptionPlans',
        'routes/system-admin/subscriptionPlans/subscriptionPlans.tsx',
        [route('create', 'routes/system-admin/subscriptionPlans/create.tsx')],
      ),
    ]),
  ]),

  ...prefix('/:address/:chainId', [
    route('available-safes', 'routes/$address.$chainId/available-safes.ts'),
    route('initiators', 'routes/$address.$chainId/initiators.ts'),
    route('balances', 'routes/$address.$chainId/balances.ts'),
  ]),

  route('/db/health', 'routes/db/health.ts'),

  ...prefix('/extension', [
    route('sign-in', 'routes/extension/sign-in.ts'),
    route('callback', 'routes/extension/callback.ts'),
    route('heartbeat', 'routes/extension/heartbeat.ts'),
    route('features', 'routes/extension/features.ts'),
    route('accounts', 'routes/extension/accounts.ts'),
    route('active-account', 'routes/extension/activeAccount.ts'),
    route('remove-active-account', 'routes/extension/removeActiveAccount.ts'),

    ...prefix('account/:accountId', [
      index('routes/extension/account.ts'),
      route('default-route', 'routes/extension/defaultRoute.ts'),
      route('propose-transaction', 'routes/extension/propose-transaction.ts'),
      route('routes', 'routes/extension/routes.ts'),
    ]),

    ...prefix('route/:routeId', [index('routes/extension/route.ts')]),

    route(
      'active-route/:accountId',
      'routes/extension/redirects/activeRoute.ts',
    ),
    route(
      'propose-transaction/:accountId',
      'routes/extension/redirects/proposeTransaction.ts',
    ),
  ]),

  ...prefix('/system', [
    route('get-plan/:prefixedAddress', 'routes/system/get-plan.ts'),
    route('token-icon/:prefixedAddress', 'routes/system/token-icon.ts'),
    route('chain-icon/:chainId', 'routes/system/chain-icon.ts'),
  ]),

  ...prefix('/vnet', [index('routes/vnet.ts')]),

  ...prefix('/dev', [
    route('decode/:data', 'routes/dev/decode.tsx'),

    ...prefix('errors', [
      route('loader', 'routes/dev/errors/loader-error.ts'),
      route('action', 'routes/dev/errors/action-error.tsx'),
      route('component', 'routes/dev/errors/component-error.tsx'),
    ]),
  ]),
] satisfies RouteConfig
