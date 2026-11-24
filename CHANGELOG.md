# @omnidotdev/manifold-api

## 0.0.1

### Patch Changes

- [#59](https://github.com/omnidotdev/manifold-api/pull/59) [`ad36a7a`](https://github.com/omnidotdev/manifold-api/commit/ad36a7a823de7ff2743e6b465ec75492ab3bb4ab) Thanks [@coopbri](https://github.com/coopbri)! - Security: tightened GraphQL authorization. Workspace checks now apply however a mutation's input is supplied, a repository, artifact, tag or namespace can no longer be moved into a workspace you are not a member of, registry trust settings (OIDC issuers, trusted publishers) and the plugin and federation catalogs are no longer exposed over GraphQL, and private artifact metadata lists are limited to your workspaces.

- [#62](https://github.com/omnidotdev/manifold-api/pull/62) [`20334c5`](https://github.com/omnidotdev/manifold-api/commit/20334c5d6e96407f0390000514e218a6e2c07c90) Thanks [@coopbri](https://github.com/coopbri)! - The GraphQL API now runs in production mode in production, instead of development mode with its extra checks and slower responses

- [#60](https://github.com/omnidotdev/manifold-api/pull/60) [`644759c`](https://github.com/omnidotdev/manifold-api/commit/644759c3e0e0a1df199f7d2cdd02b24086c6d4f0) Thanks [@coopbri](https://github.com/coopbri)! - Move to the `@omnidotdev/providers` v0.2.0 release.
