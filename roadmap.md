# Roadmap

- [ ] Portal invoices settle real Stripe payments; balance updates automatically (fix embedded checkout "client secret" timeout)
- [x] Client project page in the portal: project details + proposal status
- [x] Publish site so clients sign in at theroyeffect.com/portal/login
- [ ] Blocked: VITE_FIREBASE_API_KEY still empty — need the key from Rory
- [ ] Live smoke test on theroyeffect.com: portal login -> book discovery -> pay $49 -> milestone updates
- [x] A2P 10DLC compliance: src/lib/legal-identity.ts, /privacy, /terms, SmsConsent component, wire into /audit /book /brief + endpoints + DB columns, footer links, sitemap, publish
