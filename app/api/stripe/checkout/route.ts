import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuth } from "@/lib/auth-utils";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const decoded = auth.user!;

    // Only creators can upgrade
    if (decoded.role !== "creator") {
      return NextResponse.json(
        { error: "Only the organization creator can upgrade the subscription." },
        { status: 403 }
      );
    }

    if (!decoded.orgId) {
      return NextResponse.json(
        { error: "No organization found for this user." },
        { status: 400 }
      );
    }

    // Check Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
      return NextResponse.json(
        { error: "Payment system is not configured. Please contact the administrator." },
        { status: 503 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
    });

    // Get the organization info
    const org: any = await db.getOne(
      `SELECT id, name, subscription_status FROM organizations WHERE id = ?`,
      [decoded.orgId]
    );

    if (!org) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    if (org.subscription_status === "ACTIVE") {
      return NextResponse.json({ error: "Organization already has an active subscription." }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        orgId: decoded.orgId,
        orgName: org.name,
        userId: decoded.id,
      },
      customer_email: decoded.email,
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
