# Task 025 - Production Email Infrastructure

## Status

Planned

## Goal

Configure production-grade transactional email for Supabase Auth before Sadhana OS is offered to real customers.

## Scope

- Choose a transactional email provider.
- Verify the sending domain or subdomain.
- Configure SPF, DKIM, and DMARC.
- Configure Supabase Auth SMTP settings.
- Update Supabase Auth email templates.
- Validate deliverability for signup, password reset, and magic-link fallback.
- Monitor bounce, complaint, and failure rates.

## Recommendation

Use Postmark for production transactional auth email unless cost constraints dominate. Use Resend for a fast staging setup if needed. Consider AWS SES later when scale and cost optimization justify the extra operational burden.

## Out Of Scope

- Client-side auth UI changes.
- Database schema changes.
- Native mobile.
- Marketing email automation.

## Acceptance Criteria

- [ ] Sending domain is verified.
- [ ] SPF, DKIM, and DMARC pass.
- [ ] Supabase Auth SMTP uses the selected provider.
- [ ] Auth emails use Sadhana OS branding.
- [ ] Password reset and signup confirmation arrive reliably.
- [ ] Email failures are monitored.

## References

- `docs/13-auth-security-privacy.md`
