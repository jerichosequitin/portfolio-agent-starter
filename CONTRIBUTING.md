# Contributing

Thank you for improving Portfolio Agent Starter.

This repository maintains the reusable starter itself. Personal portfolio content,
branding, domains, provider credentials, and deployment settings belong in your own
copy and are not suitable for an upstream contribution.

## Before opening a pull request

1. Read `AGENTS.md` and the relevant document in `docs/`.
2. Discuss large contract, dependency, or architecture changes in an issue first.
3. Keep the change focused and avoid including private data or generated secrets.
4. Add or update tests for changed behavior.
5. Run `bun run check` and `bun run test:e2e` from the repository root.

Use Bun 1.4 or newer. Do not replace the package manager or commit an npm, Yarn, or
pnpm lockfile.

Pull requests should explain the concrete problem, the resulting behavior, and the
checks run. Include desktop and mobile screenshots when a visible interface changes.
By contributing, you agree that your contribution is licensed under the MIT License.
