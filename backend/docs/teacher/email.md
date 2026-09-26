# Teacher Email & AI Assistant Documentation

## Overview

The Teacher Email System located at `/teacher/[username]/email` provides school teachers and administrators with an inbox (`@blazeneuro.com`), message creation, folder management, responsive table interactions, and an embedded AI Assistant.

---

## 1. Key Features & Interface Layout

### Folder Navigation & Badges
- **Inbox**: Displays received emails along with a dynamic badge indicating unread message count.
- **Sent**: Stores sent emails dispatched via the Resend API.
- **Starred**: Quick access to starred emails.
- **Trash**: Contains soft-deleted emails with options for permanent deletion.

### Table Controls & Responsive Layout
- **Shadcn ScrollArea**: Smooth horizontal scrolling for table rows on smaller viewports (`ScrollBar orientation="horizontal"`).
- **Search Filter**: Real-time email filter (`Filter emails...`) matching sender, subject, or message body.
- **Customize Columns**: Dropdown menu allowing teachers to show or hide specific columns dynamically.
- **Pagination**: Rows-per-page selector (10, 20, 30, 40, 50) and page navigation controls.

### Email Detail Drawer (`TableCellViewer`)
- Clicking an email subject line opens a slide-out detail drawer (right pane on desktop, bottom sheet on mobile).
- Displays full HTML/plain text content, sender avatar, recipient/CC info, received date, and quick action buttons (**Reply**, **Star**, **Delete**, **Close**).

---

## 2. Custom Right-Click Context Menu

Right-clicking anywhere on the email page opens a floating context menu at mouse coordinates with the following options:

1. **Reload**:
   - Refreshes the email list dynamically without a full browser reload.
2. **Copy text**:
   - Instantly copies any highlighted text on screen or selected email text directly to the clipboard.
3. **Get Help With AI**:
   - Opens the AI Assistant modal pre-loaded with the highlighted text or email context.

---

## 3. How to Use the App AI Agent

The AI Assistant is designed to assist teachers with email management and communication tasks.

### Accessing AI Help
- Select any text in an email or right-click anywhere on the page and click **Get Help With AI**.
- The AI Assistant modal will open with your selected text in context.

### Quick AI Actions
- **Summarize**: Generates a concise summary of the selected email or text.
- **Draft Reply**: Automatically drafts a polite and professional response based on the email context.
- **Improve Tone**: Refines grammar, clarity, and tone for outgoing messages.

### Custom Prompts
- Enter custom queries in the AI prompt input (e.g., *"Translate this message to Spanish"* or *"Draft an event reminder for parents"*).
- Click **Ask AI** or press **Enter** to generate responses.
- Click **Copy** to copy the AI response directly into your email reply or clipboard.

---

## 4. Backend & Webhook Integration

- **Sending Email**: Dispatched via Resend API using the domain format `<username>@blazeneuro.com`.
- **Inbound Emails**: Webhook received at `/api/teacher/email/inbound`.
- **Body Fetching**: Inbound webhooks query `https://api.resend.com/emails/receiving/{email_id}` to retrieve complete HTML and plain text bodies.

---

## 5. Mail Turn-off & External Redirection (Forwarding)

Teachers can turn off their school email inbox and redirect all incoming mail to an external email address (e.g. Gmail, Outlook).

### Workflow:
1. **Toggle Mail Status**:
   - The user toggles the Mail switch on `/teacher/[username]/email`.
   - If turning off, a modal dialog appears asking for the target email address where mail should be redirected.
2. **OTP Verification**:
   - Once submitted, a 6-digit verification code is generated with a 10-minute expiry and sent to the target email via Resend (`POST /api/teacher/email/forwarding/send-otp`).
   - The user enters the code in the verification step (`POST /api/teacher/email/forwarding/verify-otp`).
3. **Redirection Active**:
   - `user_profile.is_mail_enabled` is set to `False` and `user_profile.mail_redirect_email` is set to the verified email.
   - Any inbound webhook message received at `/api/teacher/email/inbound` is automatically forwarded via Resend to the verified external email with a forwarding banner and original reply-to header preserved.
   - In the frontend, an alert banner displays the active forwarding address with options to turn the school inbox back on or update the destination email.

