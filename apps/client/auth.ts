import { createAuthClient } from 'better-auth/react';
import { passkeyClient } from '@better-auth/passkey/client';
import {
  twoFactorClient,
  multiSessionClient,
  oneTimeTokenClient,
  lastLoginMethodClient,
  adminClient,
  organizationClient,
} from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  plugins: [
    twoFactorClient(),
    passkeyClient(),
    multiSessionClient(),
    oneTimeTokenClient(),
    lastLoginMethodClient(),
    adminClient(),
    organizationClient(),
  ],
});
