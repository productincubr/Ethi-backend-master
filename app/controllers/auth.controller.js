// app/controllers/auth.controller.js

const crypto = require("crypto");
const db = require("../models"); // make sure this is correct path in your project

const ethi_admin = db.ethi_admin;
const ethi_super_admin = db.ethi_super_admin;
const ethi_access_request = db.ethi_access_request;

// ----- SendGrid Setup -----
const sgMail = require("@sendgrid/mail");

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const FROM_NAME = process.env.SENDGRID_FROM_NAME || "ETHI App";
const OWNER_EMAIL = process.env.ETHI_OWNER_EMAIL || FROM_EMAIL;

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:8080";
const FRONTEND_LOGIN_URL = process.env.FRONTEND_LOGIN_URL || "http://localhost:3000/admin-login";

// Set API key (safe to call once)
if (process.env.SENDGRID_API_KEY) {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  } catch (e) {
    console.error("SENDGRID setup error:", e.message);
  }
} else {
  console.warn("SENDGRID_API_KEY is NOT set. Emails will NOT be sent.");
}

// ---------- Small helpers ----------
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function make_password(raw) {
  return crypto.createHash("md5").update(raw).digest("hex");
}

// Wrapper to send email via SendGrid, ensures non-empty text/html
async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("sendEmail(): no SENDGRID_API_KEY configured. Skipping mail.");
    throw new Error("SendGrid not configured");
  }
  if (!FROM_EMAIL) {
    console.warn("sendEmail(): FROM_EMAIL is not configured in .env");
    throw new Error("From email not configured");
  }

  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: subject || "ETHI Notification",
    text: (text && text.toString()) || " ",   // ensure non-empty string
    html: (html && html.toString()) || "<p></p>",
  };

  try {
    const result = await sgMail.send(msg);
    // send returns array of responses; log the status
    console.log("sendEmail(): sent to", to, "subject:", subject);
    return result;
  } catch (err) {
    // log full error for debugging (SendGrid returns useful body)
    console.error("SendGrid sendEmail error:", err.response?.body || err);
    throw err;
  }
}

// Compose owner approval email (non-empty text/html)
async function sendApprovalEmail({ ownerEmail, requesterEmail, requesterName, requesterMobile, role, token }) {
  const appBaseUrl = process.env.APP_BASE_URL || FRONTEND_LOGIN_URL;
  const approveUrl = `${BACKEND_BASE_URL}/api/auth/owner-approve/${token}`;
  const rejectUrl = `${BACKEND_BASE_URL}/api/auth/owner-reject/${token}`;

  const subject = `🔔 New Access Request: ${requesterName} (${role})`;
  const textBody =
    `Hello ${process.env.OWNER_NAME || "Owner"},\n\n` +
    `${requesterName} (${requesterEmail}) has requested ${role} access to the ETHI admin panel.\n\n` +
    `User Details:\n` +
    `Name: ${requesterName}\n` +
    `Email: ${requesterEmail}\n` +
    `Mobile: ${requesterMobile}\n` +
    `Role: ${role}\n\n` +
    `Approve: ${approveUrl}\n` +
    `Reject: ${rejectUrl}\n\n` +
    `Reference token: ${token}\n\n` +
    `If you did not expect this request, ignore this message.\n`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0da568 0%, #0b8d56 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; }
        .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
        .info-box { background: #f9fafb; border-left: 4px solid #0da568; padding: 20px; margin: 20px 0; border-radius: 6px; }
        .info-box h3 { margin: 0 0 15px 0; color: #0da568; font-size: 16px; }
        .info-row { display: flex; margin-bottom: 10px; }
        .info-label { font-weight: 600; color: #555; min-width: 100px; }
        .info-value { color: #333; }
        .button-container { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 14px 40px; margin: 0 10px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.3s ease; }
        .btn-approve { background: #0da568; color: white; }
        .btn-approve:hover { background: #0b8d56; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(13, 165, 104, 0.4); }
        .btn-reject { background: #ef4444; color: white; }
        .btn-reject:hover { background: #dc2626; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4); }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { margin: 5px 0; font-size: 12px; color: #9ca3af; }
        .token-box { background: #fff; border: 1px solid #e5e7eb; padding: 10px; border-radius: 6px; margin-top: 20px; font-family: monospace; font-size: 12px; color: #666; word-break: break-all; }
        @media only screen and (max-width: 600px) {
          .btn { display: block; margin: 10px auto !important; width: 80%; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 New Access Request</h1>
        </div>
        <div class="content">
          <p class="greeting">Hello <strong>${process.env.OWNER_NAME || "Owner"}</strong>,</p>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            A new user has requested access to the ETHI admin panel. Please review the details below and take action.
          </p>
          
          <div class="info-box">
            <h3>👤 User Details</h3>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${requesterName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${requesterEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Mobile:</span>
              <span class="info-value">${requesterMobile}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Requested Role:</span>
              <span class="info-value"><strong>${role.toUpperCase()}</strong></span>
            </div>
          </div>

          <div class="button-container">
            <a href="${approveUrl}" class="btn btn-approve">✅ APPROVE ACCESS</a>
            <a href="${rejectUrl}" class="btn btn-reject">❌ REJECT REQUEST</a>
          </div>

          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">
            Click the button above to approve or reject this request. The user will be notified of your decision via email.
          </p>

          <div class="token-box">
            <strong>Reference Token:</strong><br/>
            ${token}
          </div>
        </div>
        <div class="footer">
          <p>If you did not expect this request, you can safely ignore this email.</p>
          <p>This is an automated email from ETHI Healthcare System</p>
          <p style="margin-top: 10px;">© ${new Date().getFullYear()} ETHI - All Rights Reserved</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: ownerEmail,
    subject,
    text: textBody,
    html: htmlBody,
  });
}

// -------------------------------------------------------
// Controller: request_email_access
// POST /api/auth/request_email_access
// body: { email: string, role: string }
// -------------------------------------------------------
exports.request_email_access = async (req, res) => {
  try {
    const { email, role, admin_name, admin_mobile, admin_password } = req.body;

    if (!email || !role) {
      return res.status(400).send({ error: true, message: "Email and role are required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).send({ error: true, message: "Invalid email" });
    }
    if (!admin_name || !admin_mobile || !admin_password) {
      return res.status(400).send({ error: true, message: "Name, mobile, and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already has a pending request
    const existingRequest = await ethi_access_request.findOne({ email: cleanEmail, status: "PENDING" });
    if (existingRequest) {
      return res.status(400).send({ error: true, message: "You already have a pending access request. Please wait for owner approval." });
    }

    // Check if already registered and approved (in both collections)
    const existingAdmin = await ethi_admin.findOne({ admin_email: cleanEmail });
    const existingSuperAdmin = await ethi_super_admin.findOne({ admin_email: cleanEmail });
    
    if ((existingAdmin && existingAdmin.allow_access === "1") || existingSuperAdmin) {
      return res.status(400).send({ error: true, message: "You are already registered. Please login." });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");

    // Hash password
    const hashedPassword = make_password(admin_password);

    // Save access request with complete user data
    let accessReq = null;
    try {
      accessReq = await ethi_access_request.create({
        email: cleanEmail,
        admin_name: admin_name,
        admin_mobile: admin_mobile,
        admin_password: hashedPassword,
        role: role,
        status: "PENDING",
        ownerApprovalToken: token,
      });
    } catch (dbErr) {
      console.error("DB error saving access request:", dbErr);
      return res.status(500).send({ error: true, message: "Database error saving access request" });
    }

    console.log("REQUEST_ACCESS BODY:", { email: cleanEmail, role, name: admin_name });

    // Send email to owner
    try {
      await sendApprovalEmail({
        ownerEmail: OWNER_EMAIL,
        requesterEmail: cleanEmail,
        requesterName: admin_name,
        requesterMobile: admin_mobile,
        role,
        token,
      });
    } catch (mailErr) {
      console.error("Failed to send approval email:", mailErr.response?.body || mailErr);
      // If mail fails, keep DB record but return a failure to frontend
      return res.status(500).send({
        error: true,
        message: "Access request saved but failed to send email",
      });
    }

    return res.send({
      error: false,
      message: "Access request submitted. Owner will review and enable your account.",
      status: accessReq.status,
      adminId: accessReq._id,
    });
  } catch (err) {
    console.error("REQUEST_EMAIL_ACCESS_ERROR:", err);
    return res.status(500).send({ error: true, message: "Something went wrong while requesting access" });
  }
};

// -------------------------------------------------------
// Owner approves via link: GET /api/auth/owner-approve/:token
// This creates/activates admin and emails them login details
// -------------------------------------------------------
exports.owner_approve = async (req, res) => {
  try {
    const token = req.params.token;
    if (!token) {
      return res.send("<h3>Invalid link</h3>");
    }

    const requestDoc = await ethi_access_request.findOne({ ownerApprovalToken: token, status: "PENDING" });
    if (!requestDoc) {
      return res.send("<h3>Link invalid or already used.</h3><p>This access request is not pending anymore.</p>");
    }

    const email = requestDoc.email;
    const admin_name = requestDoc.admin_name;
    const admin_mobile = requestDoc.admin_mobile;
    const admin_password_hash = requestDoc.admin_password;
    const role = requestDoc.role;

    // Mark as approved
    requestDoc.status = "APPROVED";
    requestDoc.approvedAt = new Date();
    await requestDoc.save();

    // Check if this is first admin (super admin)
    const existingSuperAdmin = await ethi_super_admin.findOne();
    const isFirstAdmin = !existingSuperAdmin;

    let admin;

    if (isFirstAdmin) {
      // First user = Super Admin (Owner) - Store in ethi_super_admin collection
      admin = await ethi_super_admin.create({
        admin_name: admin_name,
        admin_email: email,
        admin_mobile_no: admin_mobile,
        admin_type: "super_admin",
        role: "super_admin",
        is_super_admin: true,
        admin_passowrd_enq: admin_password_hash,
        allow_access: "1",
        flag: "c",
        admin_image: requestDoc.admin_image || "user_image.png",
      });
      console.log("✅ Super Admin (Owner) created in ethi_super_admin:", admin._id, email);
    } else {
      // Subsequent users = Regular Admin/Team Member - Store in ethi_admin collection
      const existingRegularAdmin = await ethi_admin.findOne({ admin_email: email });
      
      if (!existingRegularAdmin) {
        admin = await ethi_admin.create({
          admin_name: admin_name,
          admin_email: email,
          admin_mobile_no: admin_mobile,
          admin_type: role,
          role: role,
          is_super_admin: false,
          admin_passowrd_enq: admin_password_hash,
          allow_access: "1",
          flag: "c",
          admin_image: requestDoc.admin_image || "user_image.png",
        });
        console.log("✅ Regular Admin created in ethi_admin:", admin._id, email);
      } else {
        // Activate existing admin
        existingRegularAdmin.allow_access = "1";
        existingRegularAdmin.admin_passowrd_enq = admin_password_hash;
        await existingRegularAdmin.save();
        admin = existingRegularAdmin;
        console.log("✅ Existing admin activated:", email);
      }
    }

    // Send approval email to the user
    const loginLink = FRONTEND_LOGIN_URL;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="background-color: #0da568; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🎉 Access Approved!</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">Hi <strong>${admin_name}</strong>,</p>
          <p style="font-size: 16px; color: #333;">Great news! Your request for ETHI admin access has been <strong style="color: #0da568;">APPROVED</strong> ✅</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-left: 4px solid #0da568; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0da568;">📧 Your Login Credentials:</h3>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 10px 0;"><strong>Password:</strong> The password you set during registration</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginLink}" style="display: inline-block; background-color: #0da568; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">Login to ETHI Admin Panel</a>
          </div>

          <p style="font-size: 14px; color: #666;">If you didn't request this access, please contact the system administrator immediately.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">This is an automated email from ETHI Healthcare System</p>
        </div>
      </div>
    `;

    const textBody = `Hi ${admin_name},\n\nYour request for ETHI admin access has been APPROVED!\n\nLogin Details:\nEmail: ${email}\nPassword: The password you set during registration\n\nLogin here: ${loginLink}\n\nIf you didn't request this, please contact the administrator.`;

    await sendEmail({ to: email, subject: "Your ETHI admin access is approved", html, text: "Your admin access has been approved. Please check the sent email for details." });

    return res.send("<h3>Access Approved ✅</h3><p>The user has been notified by email with login instructions.</p>");
  } catch (err) {
    console.error("owner_approve ERROR:", err);
    return res.send("<h3>Something went wrong while approving this request.</h3>");
  }
};

// -------------------------------------------------------
// Owner rejects via link: GET /api/auth/owner-reject/:token
// -------------------------------------------------------
exports.owner_reject = async (req, res) => {
  try {
    const token = req.params.token;
    if (!token) {
      return res.send("<h3>Invalid link</h3>");
    }

    const requestDoc = await ethi_access_request.findOne({ ownerApprovalToken: token, status: "PENDING" });
    if (!requestDoc) {
      return res.send("<h3>Link invalid or already used.</h3><p>This access request is not pending anymore.</p>");
    }

    requestDoc.status = "REJECTED";
    requestDoc.rejectedAt = new Date();
    await requestDoc.save();

    const email = requestDoc.email;
    const admin_name = requestDoc.admin_name;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="background-color: #ef4444; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">❌ Access Request Rejected</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">Hi <strong>${admin_name}</strong>,</p>
          <p style="font-size: 16px; color: #333;">We regret to inform you that your request for ETHI admin access has been <strong style="color: #ef4444;">REJECTED</strong> by the system administrator.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ef4444;">What can you do?</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Contact your organization administrator for more details</li>
              <li>Verify that you used the correct email address</li>
              <li>Check if you meet the eligibility criteria</li>
              <li>You can reapply after resolving any issues</li>
            </ul>
          </div>

          <p style="font-size: 14px; color: #666;">If you believe this is a mistake, please contact <a href="mailto:${OWNER_EMAIL}" style="color: #0da568;">${OWNER_EMAIL}</a></p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">This is an automated email from ETHI Healthcare System</p>
        </div>
      </div>
    `;

    const textBody = `Hi ${admin_name},\n\nYour request for ETHI admin access has been REJECTED by the administrator.\n\nIf you believe this is a mistake, please contact ${OWNER_EMAIL}\n\nYou can reapply after resolving any issues.`;

    await sendEmail({ to: email, subject: "Your ETHI admin access request was rejected", html, text: textBody });

    return res.send("<h3>Request Rejected ❌</h3><p>The user has been notified about the rejection.</p>");
  } catch (err) {
    console.error("owner_reject ERROR:", err);
    return res.send("<h3>Something went wrong while rejecting this request.</h3>");
  }
};
