// app/actions/student-links.tsx

// ─────────────────────────────────────────────────────────
// RESEND INVITATION (for cases where email delivery failed)
// ─────────────────────────────────────────────────────────
export async function resendInvitation(email: string, relationship: "parent" | "counselor"): Promise<InviteResult> {
  const user = await getCurrentUser()
  if (!user || user.role !== "student") {
    return { success: false, error: "Only students can resend invitations" }
  }

  const supabase = await createClient()

  try {
    // Get the pending invitation (still valid, not used)
    const { data: invitation, error } = await supabase
      .from("invitation_tokens")
      .select("*")
      .eq("email", email)
      .eq("student_id", user.id)
      .eq("used", false)
      .single()

    if (error || !invitation) {
      return { success: false, error: "No pending invitation found for this email" }
    }

    // Does the recipient already have an account?
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single()

    // Send again via Supabase’s built-in email / notification flow
    const sendResult = await sendInvitationViaSupabase({
      studentName: user.full_name,
      studentEmail: user.email,
      relationship,
      invitationToken: invitation.token,
      recipientEmail: email,
      isExistingUser: !!existingUser,
    })

    return {
      success: sendResult.success,
      error: sendResult.error,
      invitationId: invitation.id,
      emailSent: sendResult.success,
    }
  } catch (err: any) {
    console.error("Resend invitation error:", err)
    return { success: false, error: err.message || "Failed to resend invitation" }
  }
}
