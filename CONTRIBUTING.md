# Contributing to Schema Lens

Thank you for your interest in contributing. Schema Lens welcomes community involvement — bug reports, ideas, and code contributions all help make the extension better for everyone.

Before you invest significant time, please read this document carefully. It explains how the project is governed and what to expect from the contribution process.

---

## Project Governance

Schema Lens is a **maintainer-approved project**. This means:

- All pull requests require explicit approval from the project maintainer before merging
- No PR is merged automatically, regardless of test results
- The maintainer reserves the right to decline any contribution without obligation to provide a detailed reason
- The roadmap and design direction are set by the maintainer

This is not a bureaucratic hurdle — it is how the project stays coherent and avoids scope creep. If you are unsure whether a contribution would be accepted, **open an issue first** and ask before writing any code.

---

## Licensing of Contributions

By submitting a pull request or any other contribution to this repository, you agree that:

1. Your contribution is your original work and you have the right to license it
2. Your contribution is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**, the same license as the rest of the project
3. The maintainer may use, modify, and distribute your contribution under the terms of AGPL-3.0
4. You grant no rights beyond what AGPL-3.0 provides — in particular, you do not grant a separate commercial license to the maintainer or anyone else

If you are contributing on behalf of an employer, you are responsible for ensuring your employer permits you to make the contribution and agrees to the above terms.

---

## What Makes a Good Contribution

### Things most likely to be accepted

- **Bug fixes** with a clear reproduction case and a test that covers the fix
- **Parser improvements** for edge cases in SQL, Prisma, Drizzle, or Knex that are well-documented with a fixture file
- **Typo or documentation corrections**
- **Security fixes** — please see [Reporting Security Issues](#reporting-security-issues) below before opening a public PR

### Things that require prior discussion

- New features or capabilities — open an issue first and wait for a response before writing code
- Changes to the rendering or visual design of the ERD panel
- New parser formats beyond the four already supported
- Changes to dependencies (adding, removing, or upgrading)
- Refactors that touch multiple files

### Things unlikely to be accepted

- PRs submitted without a prior issue or discussion for non-trivial changes
- PRs that change the project's license, governance, or contribution terms
- Code that introduces new runtime dependencies without a compelling reason
- Changes that degrade performance on large schemas
- Style-only changes (formatting, whitespace) unaccompanied by functional improvements

---

## How to Contribute

### 1. Open an issue first (for anything non-trivial)

Before writing code, open a GitHub issue describing:

- What you want to change and why
- How you plan to implement it (briefly)
- Any alternatives you considered

Wait for a response from the maintainer before proceeding. Issues are typically reviewed within a week. If you do not hear back, a follow-up comment on the issue is fine.

### 2. Fork and branch

Fork the repository and create a branch from `main`:

```bash
git checkout -b fix/your-description
# or
git checkout -b feat/your-description
```

Use a descriptive branch name. Avoid branch names like `patch-1` or `update`.

### 3. Make your changes

- Keep changes focused and minimal — one logical change per PR
- Add or update tests for any changed behaviour
- Ensure all existing tests pass: `npm test`
- Follow the existing code style (TypeScript strict mode, no unused variables)
- Do not introduce new `any` types without justification

### 4. Add a fixture if you are fixing a parser bug

If your fix addresses a parser edge case, add a `.sql` (or equivalent) fixture file to `test_sqls/` that demonstrates the problem, and add a test case in `tests/sql-fixtures.test.ts` that covers it.

### 5. Open the pull request

- Write a clear PR title and description
- Reference the issue number: `Closes #123`
- Describe what changed, why, and how you tested it
- Do not mark the PR as draft unless you are explicitly seeking early feedback

### 6. Review process

The maintainer will review your PR. Expect:

- Comments requesting changes or clarification
- Possible requests to split or narrow the scope
- Possibly a decision not to merge, with an explanation

Please do not take review feedback personally. The goal is a high-quality, coherent codebase.

---

## Reporting Security Issues

**Do not open a public GitHub issue for security vulnerabilities.**

If you have found a security issue, please report it privately:

- Email: *sangeeth.kainikkara@protonmail.com*
- Or use GitHub's private vulnerability reporting if enabled for this repository

Please include a description of the vulnerability, steps to reproduce it, and your assessment of its impact. You will receive a response within 72 hours. Please allow reasonable time for a fix to be developed before any public disclosure.

---

## Code of Conduct

This project expects contributors to behave professionally and respectfully. Specifically:

- Critique code and ideas, not people
- Accept that the maintainer has final say on what gets merged
- Do not harass maintainers over PR review timelines or declined contributions
- Contributions made in bad faith (spam, malicious code, license violations) will result in permanent bans from the project

There is no formal Code of Conduct document beyond the above. Use common sense.

---

## Questions

If you have a question that is not answered here, open a GitHub Discussion (if enabled) or a GitHub Issue tagged `question`.
