import db from "@/lib/db"
import { sendTrialReminderEmail, sendTrialExpiredEmail } from "@/lib/email"

export async function processTrialCheck(orgId: string) {
  if (!orgId) return

  try {
    const org = await db.getOne(`
      SELECT id, name, trial_ends_at, subscription_status, status 
      FROM organizations 
      WHERE id = ?
    `, [orgId])

    if (!org) return

    const now = new Date()
    const trialEnd = new Date(org.trial_ends_at)
    
    // 1. If already suspended/expired, do nothing (handled by auth check)
    if (org.subscription_status === 'EXPIRED' || org.status === 'SUSPENDED') return

    // 2. Check for Expiration
    if (now > trialEnd) {
      console.log(`Trial expired for organization: ${org.name}`)
      
      // Update DB
      await db.execute(`
        UPDATE organizations 
        SET subscription_status = 'EXPIRED', status = 'SUSPENDED', updatedat = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [orgId])

      // Get Creator/Admin email to notify
      const creator = await db.getOne(`
        SELECT name, email FROM users WHERE orgid = ? AND role = 'creator' LIMIT 1
      `, [orgId])

      if (creator) {
        await sendTrialExpiredEmail({
          to: creator.email,
          recipientName: creator.name,
          organizationName: org.name
        }).catch(e => console.error("Failed to send trial expired email", e))
      }
      return
    }

    // 3. Check for Reminders (3 days before)
    const diffTime = trialEnd.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // Simple check: Only send reminder if subscription_status isn't 'REMINDED'
    if (diffDays <= 3 && diffDays > 0 && org.subscription_status !== 'REMINDED') {
      const creator = await db.getOne(`
        SELECT name, email FROM users WHERE orgid = ? AND role = 'creator' LIMIT 1
      `, [orgId])

      if (creator) {
        await sendTrialReminderEmail({
          to: creator.email,
          recipientName: creator.name,
          organizationName: org.name,
          daysLeft: diffDays
        }).catch(e => console.error("Failed to send trial reminder email", e))

        // Mark as reminded to avoid spam
        await db.execute(`
          UPDATE organizations SET subscription_status = 'REMINDED' WHERE id = ?
        `, [orgId])
      }
    }
  } catch (error) {
    console.error("Trial check error:", error)
  }
}
