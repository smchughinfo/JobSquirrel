# JobSquirrel Project

## Application Concept
JobSquirrel is a personalized resume and cover letter generator that tailors career information to specific job applications.

## File Structure
- `/ResumeData/` - Contains all career data (resumes, cover letters, certifications, career info, etc.)
- `/GeneratedResumes/[Company Name - Job Title]/` - Output folder for generated applications
  - `job-listing.md` - Job descriptions saved in markdown format
  - Generated resume and cover letter files

## Workflow
1. Place career data in `/ResumeData/`
2. Input job description
3. JobSquirrel processes data to create tailored resume and cover letter
4. Output saved in company-specific folder

## Code Theme
All code uses squirrel-themed language:
- `forage()` instead of get/retrieve
- `stash()` instead of save/store
- `SquirrelManager` for main controllers
- `AcornProcessor` for data handlers
- `NutCache` for storage
- `winterStash` for saved state
- `scamper()` for navigation/iteration
- `chatter()` for logging