import csv
from jobspy import scrape_jobs

# Test script to verify JobSpy functionality
print("Testing JobSpy library...")

try:
    # Basic test with a few sites and small number of results
    jobs = scrape_jobs(
        site_name=["indeed", "linkedin"],  # Start with 2 sites to test
        search_term="software engineer",
        location="San Francisco, CA",
        results_wanted=5,  # Small number for testing
        hours_old=72,
        country_indeed='USA',
        verbose=2,  # Show all logs for debugging
    )
    
    print(f"✅ Success! Found {len(jobs)} jobs")
    
    if len(jobs) > 0:
        print("\nSample job data:")
        print(jobs.head())
        
        # Save to CSV
        jobs.to_csv("test_jobs.csv", quoting=csv.QUOTE_NONNUMERIC, escapechar="\\", index=False)
        print(f"\n💾 Results saved to test_jobs.csv")
        
        # Show column names
        print(f"\nColumns available: {list(jobs.columns)}")
    else:
        print("⚠️ No jobs found - this might be due to rate limiting or site restrictions")

except Exception as e:
    print(f"❌ Error occurred: {e}")
    print("\nThis might be due to:")
    print("- Rate limiting from job sites")
    print("- Network connectivity issues") 
    print("- Missing dependencies")
    print("- Site structure changes")