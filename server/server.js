import express from 'express';
import cors from 'cors';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// --- CONFIGURATION ---
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase Admin (Service Role - BYPASS RLS)
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Initialize Nodemailer (Outlook)
console.log("SMTP Config:", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    secure: process.env.SMTP_SECURE,
    passLength: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0
});

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true", // false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    },
    requireTLS: true
});

// Middleware
app.use(cors());
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// --- ROUTES ---

console.log("Registering routes...");

// 1. Create Subscription (Initiate AutoPay)
app.post('/api/create-subscription', bodyParser.json(), async (req, res) => {
    try {
        const { userId, planType, customerName, customerEmail, customerPhone } = req.body;
        console.log("Received create-subscription request:", JSON.stringify(req.body, null, 2));
        let { planId } = req.body;

        // Map planType to Plan ID if not explicitly provided
        if (!planId && planType) {
            if (planType === 'plus') planId = process.env.RAZORPAY_PLAN_ID_PLUS;
            else if (planType === 'teams') planId = process.env.RAZORPAY_PLAN_ID_TEAMS;
        }

        // A. Determine Amount and Period
        let totalAmountToCharge = 0;
        let period = 'yearly';
        let totalCount = 10; // 10 years by default for yearly

        if (planType === 'plus') {
            totalAmountToCharge = 499;
        } else if (planType === 'teams') {
            totalAmountToCharge = req.body.quantity || 1499;
        } else {
            return res.status(400).json({ error: "Invalid plan type" });
        }

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // B. Plan Selection/Creation
        // Use fixed Plan IDs for base amounts to avoid plan spam in Razorpay.
        const isBasePlus = (planType === 'plus' && totalAmountToCharge === 499);
        const isBaseTeams = (planType === 'teams' && totalAmountToCharge === 1499);

        if (isBasePlus && process.env.RAZORPAY_PLAN_ID_PLUS) {
            planId = process.env.RAZORPAY_PLAN_ID_PLUS;
            console.log(`Using base Plus plan: ${planId}`);
        } else if (isBaseTeams && process.env.RAZORPAY_PLAN_ID_TEAMS) {
            planId = process.env.RAZORPAY_PLAN_ID_TEAMS;
            console.log(`Using base Teams plan: ${planId}`);
        } else {
            // Dynamic Plan Creation for custom amounts (e.g. Teams with extra seats)
            const planName = `${planType.toUpperCase()} Annual ₹${totalAmountToCharge}`;
            console.log(`Creating dynamic plan: ${planName}`);

            try {
                const newPlan = await razorpay.plans.create({
                    period: period,
                    interval: 1,
                    item: {
                        name: planName,
                        amount: totalAmountToCharge * 100, // in paise
                        currency: "INR",
                        description: `Annual ${planType} plan`
                    }
                });
                planId = newPlan.id;
                console.log(`✅ Dynamic Plan Created: ${planId}`);
            } catch (planError) {
                console.error("❌ Plan Creation Failed:", planError);
                return res.status(500).json({ error: "Failed to initialize payment plan" });
            }
        }

        // C. Create or Get Customer
        let customerId;
        try {
            const customer = await razorpay.customers.create({
                name: customerName || 'User',
                contact: customerPhone,
                email: customerEmail,
                fail_existing: 0,
                notes: { userId_clerk: userId }
            });
            customerId = customer.id;
        } catch (custErr) {
            console.warn("Customer creation warning:", custErr);
        }

        // D. Create Subscription
        const subOptions = {
            plan_id: planId,
            customer_id: customerId,
            total_count: totalCount,
            quantity: 1,
            customer_notify: 1,
            notes: {
                userId: userId,
                planType: planType
            },
        };

        console.log("Creating Razorpay Subscription:", JSON.stringify(subOptions, null, 2));

        let subscription;
        try {
            subscription = await razorpay.subscriptions.create(subOptions);
            console.log("✅ Razorpay Subscription Created:", subscription.id);
        } catch (subErr) {
            console.error("❌ Razorpay Subscription Creation Error:", subErr);
            return res.status(400).json({
                success: false,
                error: subErr.description || subErr.message || "Failed to create Razorpay subscription"
            });
        }

        // C. Persist Initial State (Non-blocking for checkout)
        try {
            const { error: dbError } = await supabase.from('subscriptions').upsert({
                id: subscription.id,
                user_id: userId,
                plan_id: planId,
                status: 'created',
                created_at: new Date().toISOString()
            });

            if (dbError) {
                console.warn("⚠️ Supabase Upsert Warning (Subscriptions table may missing):", dbError.message);
            }
        } catch (dbErr) {
            console.error("⚠️ Database Error skipped to allow checkout:", dbErr.message);
        }

        res.json({
            subscriptionId: subscription.id,
            shortUrl: subscription.short_url,
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (err) {
        console.error("Create Subscription Error:", err);
        if (err.error) console.error("Razorpay Error Details:", JSON.stringify(err.error, null, 2));
        res.status(500).json({ error: "Failed to create subscription" });
    }
});


// 2. Poll Status (Frontend Fallback)
app.post('/api/check-subscription-status', bodyParser.json(), async (req, res) => {
    try {
        const { subscriptionId, userId } = req.body;
        if (!subscriptionId) return res.status(400).json({ error: "Missing ID" });

        // Fetch from Razorpay
        const sub = await razorpay.subscriptions.fetch(subscriptionId);

        // Sync to DB (Idempotent update)
        if (sub.status === 'active' || sub.status === 'authenticated') {
            await handleSubscriptionUpdate(sub);
        }

        res.json({ status: sub.status });
    } catch (err) {
        console.error("Check Status Error:", err);
        res.status(500).json({ error: "Failed to fetch status" });
    }
});


// 2.5 Verify Payment (Immediate Frontend Feedback)
app.post('/api/verify-payment', bodyParser.json(), async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

        if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: "Missing fields" });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_payment_id + "|" + razorpay_subscription_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            console.error("Signature mismatch in verify-payment");
            return res.json({ success: false, message: "Invalid Signature" });
        }

        // Fetch official status to be safe and sync DB
        const sub = await razorpay.subscriptions.fetch(razorpay_subscription_id);
        await handleSubscriptionUpdate(sub);

        res.json({ success: true });
    } catch (e) {
        console.error("Verify Error:", e);
        res.status(500).json({ success: false, message: "Verification Failed" });
    }
});


// 2.7 Update Subscription Quantity (Upgrade Seats)
app.post('/api/update-subscription-seats', bodyParser.json(), async (req, res) => {
    try {
        const { subscriptionId, quantity } = req.body;

        if (!subscriptionId || !quantity) {
            return res.status(400).json({ error: "Missing subscriptionId or quantity" });
        }

        console.log(`Updating Sub ${subscriptionId} Quantity to ${quantity}`);

        // Update Razorpay Subscription
        const updatedSub = await razorpay.subscriptions.update(subscriptionId, {
            quantity: quantity,
            schedule_change_at: 'now' // Or 'cycle_end'
        });

        res.json({ success: true, status: updatedSub.status, quantity: updatedSub.quantity });

    } catch (err) {
        console.error("Update Subscription Error:", err);
        res.status(500).json({ error: "Failed to update subscription" });
    }
});

// 2.8 Create One-Time Order (For Physical Products)
app.post('/api/create-order', bodyParser.json(), async (req, res) => {
    try {
        const { amount, currency = "INR", receipt } = req.body;

        if (!amount) {
            return res.status(400).json({ error: "Amount is required" });
        }

        const options = {
            amount: amount, // Amount in smallest currency unit (paise)
            currency: currency,
            receipt: receipt || `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json(order);

    } catch (error) {
        console.error("Create Order Error Details:", JSON.stringify(error, null, 2));
        res.status(500).json({
            error: "Failed to create order",
            details: error.message || error.description || error
        });
    }
});

// 2.9 Send Team Invite (Email)
app.post('/api/send-invite', bodyParser.json(), async (req, res) => {
    try {
        const { to, teamName, inviteLink } = req.body;

        if (!to || !teamName || !inviteLink) {
            return res.status(400).json({ error: "Missing required fields (to, teamName, inviteLink)" });
        }

        console.log(`Sending invite to ${to} for team ${teamName}`);

        // Configure Transporter (Use environment variables)
        // If no SMTP setup, log warning and return success (simulation mode)
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
            console.warn("⚠️ SMTP credentials missing. Email not sent. Check server logs for invite details.");
            console.log(`>> MOCK EMAIL TO: ${to}`);
            console.log(`>> SUBJECT: You've been invited to join ${teamName} on SimplifyTap`);
            console.log(`>> LINK: ${inviteLink}`);
            return res.json({ success: true, mock: true });
        }

        // Transporter is now global


        const info = await transporter.sendMail({
            from: process.env.SENDER_EMAIL || '"SimplifyTap" <noreply@simplifytap.com>',
            to: to,
            subject: `You've been invited to join ${teamName} on SimplifyTap`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-bottom: 1px solid #e2e8f0;">
                       <h2 style="color: #0f172a; margin: 0;">You're Invited!</h2>
                    </div>
                    <div style="padding: 32px; background-color: #ffffff;">
                        <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
                            Hello,
                        </p>
                        <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 32px;">
                            You have been invited to join the team <strong>${teamName}</strong> on SimplifyTap. 
                            Collaborate, manage your digital cards, and share your professional presence.
                        </p>
                        <div style="text-align: center; margin-bottom: 32px;">
                            <a href="${inviteLink}" style="display: inline-block; padding: 14px 28px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Accept Invitation</a>
                        </div>
                        <p style="font-size: 14px; color: #64748b; text-align: center;">
                            If the button doesn't work, verify your account at <a href="${inviteLink}" style="color: #0f172a;">${inviteLink}</a>
                        </p>
                    </div>
                     <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                            &copy; ${new Date().getFullYear()} SimplifyTap. All rights reserved.
                        </p>
                    </div>
                </div>
            `,
        });

        console.log("Message sent: %s", info.messageId);
        res.json({ success: true, messageId: info.messageId });

    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "Failed to send email", details: error.message });
    }
});

// 3. WEBHOOK (The Source of Truth)
app.post('/api/webhook', bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf } }), async (req, res) => {
    const secret = process.env.WEBHOOK_SECRET;
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(req.rawBody);
    const digest = shasum.digest('hex');

    // A. Verify Signature
    if (digest !== req.headers['x-razorpay-signature']) {
        console.error("❌ Invalid Webhook Signature");
        return res.status(400).json({ status: 'failure' });
    }

    const event = req.body;
    const payload = event.payload;

    console.log(`🔔 Webhook Received: ${event.event}`);

    try {
        // B. Handle Subscription Events
        if (event.event.startsWith('subscription.')) {
            const sub = payload.subscription.entity;
            await handleSubscriptionUpdate(sub, event.event);
        }

        // C. Handle Payments (Log them)
        if (event.event === 'subscription.charged') {
            const payment = payload.payment.entity;
            const sub = payload.subscription.entity;

            // Log Payment
            await supabase.from('payments').insert({
                payment_id: payment.id,
                subscription_id: sub.id,
                user_id: sub.notes.userId, // Stored in notes during create
                amount: payment.amount / 100, // convert paise
                status: payment.status,
                method: payment.method,
                event_id: event.payload.payment.entity.order_id || event.headers?.['x-request-id'], // approximate unique ID
                created_at: new Date().toISOString()
            });
        }

    } catch (err) {
        console.error("Webhook Logic Error:", err);
        // We still return 200 to Razorpay to prevent retry storms, but log critical error
    }

    res.json({ status: 'ok' });
});

// --- HELPER TO SYNC STATE ---
async function handleSubscriptionUpdate(subRazorpay, eventType = null) {
    const userId = subRazorpay.notes.userId;
    if (!userId) {
        console.error("No UserId in Subscription Notes! Cannot sync DB.");
        return;
    }

    const isPremium = (subRazorpay.status === 'active' || subRazorpay.status === 'authenticated');
    const isTeam = (subRazorpay.plan_id === process.env.RAZORPAY_PLAN_ID_TEAMS);

    // 1. Update Subscriptions Table
    await supabase.from('subscriptions').upsert({
        id: subRazorpay.id,
        user_id: userId,
        plan_id: subRazorpay.plan_id,
        status: subRazorpay.status,
        current_period_start: subRazorpay.current_start ? new Date(subRazorpay.current_start * 1000) : null,
        current_period_end: subRazorpay.current_end ? new Date(subRazorpay.current_end * 1000) : null,
        updated_at: new Date().toISOString()
    });

    // 2. Update Profile State (The "Toggle")
    // If Authenticated/Active -> Premium = True
    // If Cancelled/Expired/Halted -> Premium = False

    // NOTE: Only downgrade if this was the ACTIVE subscription. 
    // Ideally we assume 1 active sub per user.

    let profileUpdates = {};

    if (subRazorpay.status === 'active' || subRazorpay.status === 'authenticated') {
        profileUpdates = {
            is_premium: true,
            plan_type: isTeam ? 'teams' : 'plus',
            razorpay_subscription_id: subRazorpay.id,
            subscription_status: subRazorpay.status
        };
    } else if (['halted', 'expired', 'cancelled'].includes(subRazorpay.status)) {
        // Only downgrade if the DB still points to THIS subscription
        // (Prevents race condition where user buys new sub, old one cancels)
        const { data: currentProfile } = await supabase.from('profiles').select('razorpay_subscription_id').eq('clerk_user_id', userId).single();

        if (currentProfile?.razorpay_subscription_id === subRazorpay.id) {
            profileUpdates = {
                is_premium: false,
                plan_type: 'free',
                subscription_status: subRazorpay.status
            };
        }
    }

    if (Object.keys(profileUpdates).length > 0) {
        await supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('clerk_user_id', userId);

        console.log(`✅ Updated User ${userId} : Premium=${profileUpdates.is_premium}`);
    }
}

app.get("/test-email", async (req, res) => {
    try {
        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: "kakkirenivishwas@gmail.com",
            subject: "AutoTap SMTP Test",
            text: "testr tested",
        });

        res.json({ ok: true, message: "Email sent successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// 3. AI Business Card Scanner
app.post("/api/scan-card", async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: "No image provided" });
        }

        console.log("STEP 1: OCR extraction...");

        // ===============================
        // STEP 1 — RAW OCR EXTRACTION
        // ===============================
        const ocrResponse = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    temperature: 0,
                    max_tokens: 1500,
                    messages: [
                        {
                            role: "system",
                            content: `
You are an OCR engine.
Extract ALL visible text exactly as printed.
Preserve line breaks.
Do NOT interpret.
Do NOT categorize.
Do NOT fix spelling.
Return ONLY raw text.
              `,
                        },
                        {
                            role: "user",
                            content: [
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:image/jpeg;base64,${image}`,
                                    },
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        const ocrData = await ocrResponse.json();

        if (ocrData.error) {
            console.error("OCR Error:", ocrData.error);
            return res.status(500).json({ error: ocrData.error.message });
        }

        const rawText = ocrData.choices?.[0]?.message?.content;

        if (!rawText || rawText.trim() === "") {
            return res.status(400).json({ error: "No text detected on card" });
        }

        console.log("STEP 2: Structured parsing...");

        // ===============================
        // STEP 2 — STRUCTURED PARSING
        // ===============================
        const parseResponse = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    temperature: 0.4,
                    response_format: {
                        type: "json_schema",
                        json_schema: {
                            name: "business_card_schema",
                            schema: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    business_name: { type: "string" },
                                    job_title: { type: "string" },
                                    phone_1: { type: "string" },
                                    phone_2: { type: "string" },
                                    email_1: { type: "string" },
                                    email_2: { type: "string" },
                                    website: { type: "string" },
                                    address: { type: "string" },
                                    confidence_score: { type: "number" },
                                    detected_language: { type: "string" }
                                },
                                required: [
                                    "name",
                                    "business_name",
                                    "job_title",
                                    "phone_1",
                                    "phone_2",
                                    "email_1",
                                    "email_2",
                                    "website",
                                    "address",
                                    "confidence_score",
                                    "detected_language"
                                ],
                                additionalProperties: false
                            }
                        }
                    },
                    messages: [
                        {
                            role: "system",
                            content: `
You are a deterministic business card information extractor.

You will receive RAW OCR text extracted from a business card.
Use ONLY that text. Do NOT invent information.

FIELD EXTRACTION RULES:

1. NAME:
- Must be a person’s name.
- Usually appears prominently.
- May include title prefixes (Dr., Mr., Ms.).
- Must not be company name or slogan.
- 2–4 words typical.

2. JOB TITLE:
- Must be a professional designation (President, CEO, Associate Professor, Manager, etc.).
- If multiple roles exist:
   → Prefer the main professional designation over internal roles.
- Do NOT include company name in job_title.

3. BUSINESS NAME:
- The main organization or company the person represents.
- If company name appears multiple times, use the full proper version.
- Ignore slogans (e.g., “Learn to Earn”).
- Ignore marketing text (e.g., “Trusted by 1200+ learners”).
- Do NOT use website URL as business_name unless that is the official brand text.

4. PHONE:
- Remove spaces.
- Preserve +.
- If one number only → phone_2 = "-".

5. EMAIL:
- Must contain "@"
- First valid email → email_1
- Second → email_2
- If one only → email_2 = "-"

6. WEBSITE:
- Extract only if explicitly written.
- Must contain ".".
- Do not derive from email.

7. ADDRESS:
- Merge all address lines.
- Remove marketing text.
- Keep full street, city, postal code.
- Return as single comma-separated string.

8. CONFIDENCE:
- 95+ if very clear.
- 80–94 if moderate ambiguity.
- Below 80 only if text unclear.

9. LANGUAGE:
- Detect primary language.

STRICT MODE:
- Do not fabricate.
- If missing, return "-".
- Do not expand abbreviations.
              `
                        },
                        {
                            role: "user",
                            content: rawText
                        }
                    ]
                })
            }
        );

        const parseData = await parseResponse.json();

        if (parseData.error) {
            console.error("Parse Error:", parseData.error);
            return res.status(500).json({ error: parseData.error.message });
        }

        const structuredData = JSON.parse(parseData.choices?.[0]?.message?.content || "{}");

        if (!structuredData || Object.keys(structuredData).length === 0) {
            return res.status(500).json({ error: "Failed to parse structured output" });
        }

        console.log(`✅ Card scan successful. Confidence: ${structuredData.confidence_score}%`);

        return res.json({
            success: true,
            raw_text: rawText,
            data: structuredData
        });

    } catch (err) {
        console.error("Scan Error:", err);
        return res.status(500).json({ error: err.message });
    }
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
