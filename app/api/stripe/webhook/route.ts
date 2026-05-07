import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import db from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orgId = session.metadata?.orgId;

    if (orgId) {
      try {
        // Upgrade the organization to ACTIVE
        await db.execute(
          `UPDATE organizations 
           SET subscription_status = 'ACTIVE', 
               stripe_customer_id = ?,
               stripe_subscription_id = ?,
               updatedat = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            session.customer as string,
            session.subscription as string,
            orgId,
          ]
        );

        console.log(`✅ Organization ${orgId} upgraded to ACTIVE`);
      } catch (dbError) {
        console.error("Failed to update organization:", dbError);
        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 }
        );
      }
    }
  }

  // Handle subscription cancellation / payment failure
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    
    try {
      // Find org by stripe_subscription_id and revert to expired
      await db.execute(
        `UPDATE organizations 
         SET subscription_status = 'EXPIRED',
             updatedat = CURRENT_TIMESTAMP
         WHERE stripe_subscription_id = ?`,
        [subscription.id]
      );
      console.log(`⚠️ Subscription ${subscription.id} cancelled, org reverted to EXPIRED`);
    } catch (dbError) {
      console.error("Failed to update org on subscription cancel:", dbError);
    }
  }

  return NextResponse.json({ received: true });
}
