import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { sendTemplateEmail } from '@/lib/email-templates/send-email'

const OWNER_EMAIL = 'rory@theroyeffect.com'

const schema = z.object({
  sessionId: z.string().trim().max(255).optional().default(''),
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Enter a valid email').max(255),
  company: z.string().trim().max(120).optional().default(''),
  projectType: z.string().trim().min(1, 'Pick a project type').max(60),
  goals: z.string().trim().min(10, 'Tell me a bit more about your goals').max(2000),
  audience: z.string().trim().max(1000).optional().default(''),
  deliverables: z.string().trim().max(1000).optional().default(''),
  referencesLinks: z.string().trim().max(1000).optional().default(''),
  budget: z.string().trim().max(60).optional().default(''),
  timeline: z.string().trim().max(60).optional().default(''),
  extra: z.string().trim().max(2000).optional().default(''),
})

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const Route = createFileRoute('/api/public/brief-intake')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown
        try {
          payload = await request.json()
        } catch {
          return json({ error: 'Invalid request body' }, 400)
        }

        const parsed = schema.safeParse(payload)
        if (!parsed.success) {
          return json({ error: parsed.error.issues[0]?.message ?? 'Invalid submission' }, 400)
        }

        const d = parsed.data
        const briefId = crypto.randomUUID()

        try {
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
          const { error } = await supabaseAdmin.from('project_briefs').insert({
            id: briefId,
            stripe_session_id: d.sessionId || null,
            name: d.name,
            email: d.email,
            company: d.company || null,
            project_type: d.projectType,
            goals: d.goals,
            audience: d.audience || null,
            deliverables: d.deliverables || null,
            references_links: d.referencesLinks || null,
            budget: d.budget || null,
            timeline: d.timeline || null,
            extra: d.extra || null,
          })
          if (error) console.error('Brief insert failed:', error.message)
        } catch (dbError) {
          console.error('Brief insert threw:', dbError)
        }

        try {
          await sendTemplateEmail('project-brief-notification', OWNER_EMAIL, {
            templateData: { ...d, sessionId: d.sessionId },
            idempotencyKey: `project-brief-notification-${briefId}`,
            replyTo: d.email,
          })

          await sendTemplateEmail('brief-confirmation', d.email, {
            templateData: {
              name: d.name,
              projectType: d.projectType,
              message: d.goals,
            },
            idempotencyKey: `project-brief-confirmation-${briefId}`,
            replyTo: OWNER_EMAIL,
          })
        } catch (mailError) {
          console.error('Brief emails failed:', mailError)
          return json({ error: 'Saved, but the confirmation email failed to send.' }, 502)
        }

        return json({ ok: true })
      },
    },
  },
})
