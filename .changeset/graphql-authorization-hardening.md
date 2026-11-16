---
"@omnidotdev/manifold-api": patch
---

Security: tightened GraphQL authorization. Workspace checks now apply however a mutation's input is supplied, a repository, artifact, tag or namespace can no longer be moved into a workspace you are not a member of, registry trust settings (OIDC issuers, trusted publishers) and the plugin and federation catalogs are no longer exposed over GraphQL, and private artifact metadata lists are limited to your workspaces.
