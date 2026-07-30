# Security policy

## Reporting a vulnerability

Do not disclose suspected vulnerabilities in a public issue. Use the repository's private
GitHub security advisory flow and include:

- the affected endpoint or component;
- reproduction steps and required configuration;
- expected and observed behavior;
- likely impact and any suggested mitigation.

Never include real credentials, session cookies, private monitoring targets, or production
data in a report.

## Supported version

Security fixes currently target the latest commit on `main`. PulseGuard has not published
versioned releases or a long-term-support branch.

## Security boundaries

PulseGuard performs server-side requests to user-configured targets. Its URL validation,
DNS result validation, redirect policy, monitor ownership checks, HttpOnly session cookies,
and rate limits are security-sensitive. Changes in these areas require regression tests and
review before deployment.
