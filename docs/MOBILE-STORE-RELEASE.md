# Botvio Android + iOS Store Release

## Native target
- App name: Botvio
- Bundle/Application ID: live.botvio.app
- Web runtime: Capacitor 8
- Android target: API 36
- iOS deployment target: iOS 15+ under Capacitor 8
- iOS build environment: Xcode 26+
- Web build: Vite

## Required secrets for CI
Add GitHub repository secrets: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
Never commit service-role keys, broker passwords, API Studio keys, signing keys, or Apple private keys.

## Android release
Google Play requires new apps and updates to target Android 16 / API 36.
1. Create the Android app in Play Console using package live.botvio.app.
2. Complete developer verification and choose the correct organization/business account type for the financial/trading service.
3. Configure Play App Signing.
4. Create an upload keystore and keep it outside the repository.
5. Sign the release AAB with the upload key.
6. Complete App content declarations, including the Financial features declaration.
7. Complete the Data safety form.
8. Complete account/data deletion and provide the external account-deletion URL: https://botvio.live/account/delete
9. Provide app-access instructions/demo credentials to reviewers if login is required.
10. Complete content rating and store listing.

## iOS release
1. Create an App Store Connect app record with bundle ID live.botvio.app.
2. Register the matching App ID in Apple Developer.
3. Configure signing certificates and provisioning profiles.
4. Open the generated ios/App project in Xcode.
5. Set the Team and signing configuration.
6. Set the production version/build number.
7. Archive for Any iOS Device.
8. Validate and upload to App Store Connect.
9. Complete Privacy Nutrition Labels and provide the privacy policy URL.
10. Complete the age-rating questionnaire.
11. Add support/contact information, review notes and a reviewer demo account.
12. Upload required screenshots and metadata.

## Authentication
Add botvio://auth/callback to the Supabase Auth redirect allow-list before production mobile OAuth/email-link testing.
Configure Google OAuth and Apple Sign In for the mobile bundle/application identifiers and provider credentials.

## Regulated-feature review
The current web BOTVIO product contains financial trading/copy-trading functionality, binary-options-related pages, and sports-betting functionality.
For mobile store builds, those features must not be exposed unless the required licensing, permissions, geographic restrictions and store-policy requirements have been completed.
Apple explicitly does not permit apps that facilitate binary-options trading and requires properly licensed financial-trading/derivatives services. Google Play prohibits binary-options trading and requires financial-feature declarations; real-money gambling/sports betting has separate licensing and distribution requirements.
The final store build should therefore be treated as a compliance-filtered mobile product rather than automatically as a 1:1 copy of every web route.

## Payments
The existing web billing flow must not simply be reused for mobile digital purchases.
Google Play generally requires Play Billing for digital in-app purchases/subscriptions. Apple requires App Store In-App Purchase when unlocking digital features, premium content or subscriptions, subject to applicable exceptions/entitlements.
If Botvio will sell premium signals, courses or digital functionality inside the mobile apps, native billing must be implemented before submission.

## Reviewer access
Because BOTVIO has account-based functionality, prepare a dedicated reviewer account or a fully featured demo mode. Never hard-code reviewer credentials into the application.

## Store assets
Prepare: 1024px App Store icon, Android adaptive icon, Android feature graphic, iPhone screenshots, iPad screenshots if enabled, Google Play screenshots, store descriptions, privacy policy, terms, risk disclaimer, support URL, account deletion URL, and review notes.
No temporary/mock text should remain in submitted builds.
