# AcornDepot - Job Scraper System

## Architecture Decision: Authentication Strategy

### The Chrome Profile Problem
Job sites like Indeed.com heavily protect against automation detection. When using Selenium with Chrome, there's a conflict between:
1. **Default Profile**: Contains all login sessions and browsing history, making automation less detectable - BUT Chrome requires a "non-default data directory" for automation, causing conflicts
2. **Separate Profile**: Avoids directory conflicts - BUT appears as a fresh browser to job sites, triggering aggressive "are you human" challenges

### Solution: Separate Profile + Google OAuth
- **Use separate Chrome profile** (`ScamperChrome` directory) to avoid conflicts
- **Authenticate via Google OAuth instead of email/password login**
  - Google's OAuth flow is designed to be automation-friendly for legitimate use cases
  - Email/password forms are heavily protected against bots
  - Google login bypasses most "are you human" challenges

### Implementation Notes
- `ChaseAwayRivals()` kills Chrome and ChromeDriver processes before starting
- Stealth options hide automation markers from detection systems
- First-time setup requires manual Google authentication, then sessions persist

This hybrid approach balances automation reliability with human-like behavior patterns.