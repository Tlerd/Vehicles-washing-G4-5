# Codebase-memory MCP connection

## Task

Install, configure, and index the repository with the codebase-memory MCP
server for structural code discovery.

## Changes

- Installed `codebase-memory-mcp` v0.9.0 for Windows x64 under the local Codex
  binary directory.
- Verified the downloaded release archive against its official SHA-256 entry
  before extraction.
- Added the workspace MCP entry in `.codex/config.toml`.

## Evidence

- `codex mcp list` reports the `codebase-memory` server as enabled.
- `index_repository` completed for
  `D:/demoSWP/demomain/Vehicles-washing-G4-5`.
- `index_status` reported `ready` with 5,817 nodes and 13,612 edges.

## Notes

The current conversation tool list is created before the server connection, so
new codebase-memory MCP tools become available to agents after starting a new
Codex session. The local CLI can use the completed index immediately.
