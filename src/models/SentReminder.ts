import mongoose, { Schema, Document, Model } from 'mongoose'

/**
 * SentReminder — deduplication layer for reminders.
 *
 * Both the client-side `/api/reminders/send` and the server-side cron
 * `/api/cron/check-reminders` INSERT a record here **after** successfully
 * sending an email.  Before sending, they check this collection to see if
 * the same reminder was already dispatched within the cooldown window.
 *
 * Key format:
 *   `${boardDocId}::${source}::${itemId}::${intervalLabel}::${recipientEmail}`
 *
 * This prevents:
 *   1. Client sends at 30-min mark → cron runs 5 min later → sees record → skips
 *   2. Cron fires while app is closed → user opens app later → client checks → skips
 */

export interface ISentReminder extends Document {
  /** Composite dedup key (see format above) */
  key: string
  /** Board owner / context — used for cleanup queries */
  boardDocId: string
  /** Source type: 'checklist' | 'kanban' | 'reminder' */
  source: string
  /** The specific item id that triggered this reminder */
  itemId: string
  /** Which interval fired: '30 minutes', '10 minutes', '5 minutes', 'overdue', 'manual' */
  intervalLabel: string
  /** Recipient email */
  recipientEmail: string
  /** When the email was sent */
  sentAt: Date
  /** Who sent it: 'client' or 'cron' */
  sentBy: 'client' | 'cron'
}

const SentReminderSchema = new Schema<ISentReminder>(
  {
    key:            { type: String, required: true, index: true },
    boardDocId:     { type: String, required: true, index: true },
    source:         { type: String, required: true },
    itemId:         { type: String, required: true },
    intervalLabel:  { type: String, required: true },
    recipientEmail: { type: String, required: true },
    sentAt:         { type: Date, required: true, default: Date.now },
    sentBy:         { type: String, enum: ['client', 'cron'], required: true },
  },
  { timestamps: true }
)

// Compound index for fast dedup lookups
SentReminderSchema.index({ key: 1, sentAt: -1 })

// TTL index: auto-delete records older than 48 hours (no need to keep forever)
SentReminderSchema.index({ sentAt: 1 }, { expireAfterSeconds: 48 * 60 * 60 })

const SentReminder: Model<ISentReminder> =
  mongoose.models.SentReminder || mongoose.model<ISentReminder>('SentReminder', SentReminderSchema)

export default SentReminder
