# Independent project checklist (de-daimon your fork)

Use this to make your fork fully independent from the original operator setup.

## Critical security audit result

- `preflight.js` is **not present** in this repository.
- No direct `curl|bash` bootstrap script was found in tracked source files in this repo.
- The biggest in-repo risk was unrestricted shell command execution via `run_command`; this repo now blocks common exfiltration / RCE chains (e.g. `curl|bash`, `gh auth token`, env-to-network pipes).

## Required changes to own the project

1. Set your own repo secrets in GitHub Actions:
   - `GH_TOKEN`
   - `DAIMON_WALLET_KEY`
   - `VENICE_API_KEY` or `OPENROUTER_API_KEY`
   - optional `BASE_RPC`, `GPG_PRIVATE_KEY`, `GPG_KEY_ID`

2. Replace identity references:
   - update `memory/self.md` with your agent name, values, and wallet
   - update media/branding files and token metadata scripts

3. Confirm workflows are owner/repo-agnostic:
   - `daimon.yml`, `gate.yml`, `setup-gpg.yml` now use `${{ github.repository }}` and `${{ github.repository_owner }}`

4. Run one manual cycle from Actions, verify:
   - proof file creation under `proofs/`
   - commit pushed by workflow
   - no missing-secret errors

5. Optional hardening:
   - protect `main` and require PRs for operator changes
   - keep a dedicated bot branch for autonomous commits if you want human review gates

## Additional manual de-branding checklist

- search for `daimon111`, `DAIMON`, and old addresses across docs/media and replace with your own project identity.
- rotate all secrets if you ever ran unknown bootstrap code locally.
