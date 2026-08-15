import type { ComponentType } from 'react'
import { template as briefConfirmation } from './brief-confirmation'
import { template as briefNotification } from './brief-notification'
import { template as orderConfirmation } from './order-confirmation'
import { template as orderNotification } from './order-notification'
import { template as subscriptionNotification } from './subscription-notification'


export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'brief-confirmation': briefConfirmation,
  'brief-notification': briefNotification,
}
