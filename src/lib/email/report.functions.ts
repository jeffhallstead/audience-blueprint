import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

const REPORT_BUCKET = "report-pdfs";
const SIGNED_URL_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface SendReportPdfInput {
  pdfBase64: string;
  filename: string;
}

export const sendReportPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: SendReportPdfInput) => {
    if (!input?.pdfBase64 || typeof input.pdfBase64 !== "string") {
      throw new Error("PDF data is required");
    }
    if (!input?.filename || typeof input.filename !== "string") {
      throw new Error("Filename is required");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const email = (context.claims.email as string | undefined) ?? null;
    if (!email) {
      throw new Error("No email address found for this account");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Normalize filename and store under user-scoped path.
    const safeFilename = data.filename.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^-+|-+$/g, "");
    const path = `${userId}/${Date.now()}-${safeFilename}`;

    // Decode base64 PDF to Uint8Array.
    const base64 = data.pdfBase64.split(",")[1] ?? data.pdfBase64;
    const binary = Buffer.from(base64, "base64");

    // Upload to private storage bucket.
    const { error: uploadError } = await supabaseAdmin.storage
      .from(REPORT_BUCKET)
      .upload(path, binary, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("[sendReportPdf] upload failed:", uploadError);
      throw new Error("Could not upload the report. Please try again.");
    }

    // Create a signed download URL.
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(REPORT_BUCKET)
      .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("[sendReportPdf] signed URL failed:", signedUrlError);
      throw new Error("Could not create a download link for the report.");
    }

    // Send the email.
    const result = await sendTemplateEmail("report-delivered", email, {
      templateData: {
        downloadUrl: signedUrlData.signedUrl,
        reportName: safeFilename.replace(/\.pdf$/i, ""),
      },
      idempotencyKey: `report-${userId}-${path}`,
    });

    return {
      sent: result.sent,
      reason: result.sent ? null : (result as { reason: string }).reason,
      downloadUrl: signedUrlData.signedUrl,
    };
  });
