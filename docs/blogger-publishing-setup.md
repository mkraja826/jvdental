# JV Dental Blogger / Blogspot publishing setup

JV Dental Journal is the primary article source. Blogger is an external publication channel that receives only explicitly published educational content.

## Google Cloud configuration

1. Use the Google Cloud project selected for JV Dental integrations.
2. Enable **Blogger API v3**.
3. Configure the OAuth consent screen for the clinic's authorized users.
4. Use a **Web application** OAuth client.
5. Add this production redirect URI exactly:

```text
https://jvdental.com/clinic/integrations/blogger/callback
```

6. Configure these as Supabase Edge Function secrets:

```text
GOOGLE_CLIENT_ID=<oauth client id>
GOOGLE_CLIENT_SECRET=<oauth client secret>
GOOGLE_TOKEN_ENCRYPTION_KEY=<long random encryption secret>
GOOGLE_BLOGGER_REDIRECT_URI=https://jvdental.com/clinic/integrations/blogger/callback
SITE_URL=https://jvdental.com
```

The same Google OAuth client may contain both the Calendar and Blogger redirect URIs if the clinic intentionally uses one Google Cloud client. JV Dental still stores Calendar and Blogger as separate application connections, so the clinic may authorize different Google accounts for scheduling and publishing.

Never commit OAuth credentials or refresh tokens to GitHub.

## In-app connection

1. Sign in as JV Dental Owner/Admin.
2. Open `Clinic → Integrations`.
3. Choose **Connect Blogger**.
4. Authorize the Google account that owns/authors the target Blogger publication.
5. JV Dental requests the Blogger OAuth scope and lists blogs available to that account.
6. If exactly one blog is available, it becomes the target automatically.
7. If multiple blogs are available, select the intended publication explicitly in the Integrations screen.

No Journal article is posted simply by connecting Blogger.

## Publishing workflow

1. Create the article in the JV Dental Journal CMS.
2. Complete clinical review/approval.
3. Publish the article on JV Dental first.
4. Use **Publish to Blogger** from the article row.
5. JV Dental stores the returned Blogger post ID and URL.
6. If the JV Dental article later changes, use **Sync Blogger**.
7. JV Dental updates that same external Blogger post ID instead of creating another copy.

The Blogger copy includes a link to the current JV Dental Journal article so JV Dental remains the primary maintained source.

## Acceptance test

Use one non-sensitive test article.

1. Connect Blogger successfully.
2. If multiple blogs are present, select the correct target.
3. Publish the test article on JV Dental.
4. Publish it to Blogger.
5. Confirm `blog_publications` stores the expected target blog, external post ID, external URL, status and sync time.
6. Open the Blogger URL and confirm formatting and the return link to JV Dental.
7. Edit the JV Dental article.
8. Choose **Sync Blogger**.
9. Confirm the external Blogger post ID remains unchanged and the existing post content updates.
10. Disconnect Blogger and confirm further publish/sync attempts are blocked until reconnection.

## Content boundary

Only published Journal content is sent to Blogger. Patient records, case notes, radiographs, CBCT/DICOM data, payment information and secure patient messages are not part of this integration.
