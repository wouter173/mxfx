# Architecture

Modules:

`mxfx`

- `api`: Client-Server API type definitions and endpoints.

  - `endpoints`
  - `http-client`: base, api, auth clients
  - `schema`

- `vault`: Secure Store module for secrets (and encryption) management.

  - `in-memory-vault`: In-memory vault implementation, for testing and development purposes.
  - `local-file-vault`

- `config`: Managing global client configuration including discovery information and server configuration.

- `branded`: Branded types for domain-specific values.

- `store`: Local storage management, including caching and persistence.

- `client`: High-level client API, built on top of the `api` module and using the `config`, `store`, and `vault` modules for persistence, configuration, and secrets management.
