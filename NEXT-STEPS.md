# Next Steps

## Before real tenant testing

1. **Backup and inspect demo tenants.** In Supabase SQL Editor, follow the preflight query in [`docs/tenant-testing-cleanup.md`](docs/tenant-testing-cleanup.md). Verify the only selected slugs are `matebele-fc` and `township-rollers`.
2. **Remove the two approved demo tenants safely.** Run the documented, child-first SQL transaction as a database administrator. It is intentionally manual and transactional; do not use blanket `DELETE ... CASCADE`.
3. **Rotate Super Admin access.** Use **Supabase → Authentication → Users → Send password recovery** for the verified Super Admin. The legacy seed password is not safe for tenant testing. Confirm the user retains an active platform-scoped `PLATFORM_OWNER` or `SUPER_ADMIN` membership.
4. **Create a fresh test tenant in the app.** Sign in at `/admin` → **Organizations**, create the organisation, then configure its plan and entitlements.
5. **Create the test club administrator.** In `/admin/users`, create a staff user, select the new organisation, and select `CLUB_ADMIN`. Deliver the temporary password securely.
6. **Verify independent tenant operation.** Sign out, open `/<new-organisation-slug>`, log in as the club admin, and test dashboard, squad, matches, website workflow, settings, permitted analytics, and public club route.
7. **Review audit activity.** As Super Admin, confirm organization, membership, team, content, and match events in `/admin/audit`.

## Operational hardening

- Confirm Supabase password-recovery email templates and redirect URLs are configured before inviting external tenant staff.
- Do not re-run historical seed migrations manually. In particular, `20260803000019_seed_admin_superuser.sql` is legacy bootstrap material with a known password.
- Rotate any Supabase database credentials that may have been previously shared.
- Establish a backup/export retention policy before onboarding production tenants.

## Product follow-up

- Add a dedicated, audited Super Admin “send reset link” action backed by a server-side service role only if a product-level reset experience is required; do not expose a service-role key to the browser.
- Add tenant deactivation/archive workflow and an approval-gated deletion workflow before allowing organisation deletion in the Admin UI.
- Connect analytics widgets to live tenant data and persist dashboard layouts.
