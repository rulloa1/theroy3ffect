# Roadmap

- [ ] Portal invoices settle real Stripe payments; balance updates automatically (fix embedded checkout "client secret" timeout)
- [x] Client project page in the portal: project details + proposal status
- [x] Publish site so clients sign in at theroyeffect.com/portal/login
- [ ] Blocked: VITE_FIREBASE_API_KEY still empty — need the key from Rory
- [ ] Live smoke test on theroyeffect.com: portal login -> book discovery -> pay $49 -> milestone updates
- [x] A2P 10DLC compliance: src/lib/legal-identity.ts, /privacy, /terms, SmsConsent component, wire into /audit /book /brief + endpoints + DB columns, footer links, sitemap, publish
- [x] Portal proposal signing page (/proposals/:id) — signs, saves signed copy, updates status
- [ ] Register business address as Stripe tax origin (live + sandbox) for automatic tax
- [ ] Real client payment end to end on live, then refund
- [ ] Add LeadConnector chat widget script sitewide

- [x] Website chat widget wired to leads: /api/public/leadconnector webhook -> chat_conversations/chat_messages + voice_leads, WEBSITE CHAT tab in admin
- [ ] Rory: add the webhook action in LeadConnector workflow (URL + token) so live chats flow in
- [ ] Live $1 test invoice payment + refund (pending)
