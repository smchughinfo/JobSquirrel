# JobSpy - Claude Code Configuration

This is a Python job scraping library that supports multiple job sites including Indeed, LinkedIn, Glassdoor, Google Jobs, ZipRecruiter, Bayt, and Naukri.

## Repository Structure
- `jobspy/` - Main package directory
  - `__init__.py` - Main entry point with `scrape_jobs` function
  - Site-specific modules: `indeed/`, `linkedin/`, `glassdoor/`, `google/`, `ziprecruiter/`, `bayt/`, `naukri/`
  - `model.py` - Data models and types
  - `util.py` - Common utilities
  - `exception.py` - Custom exceptions

## Development Setup
This project uses Poetry for dependency management (pyproject.toml present).

## Testing Commands
To test the functionality, run:
```bash
python test_jobspy.py
```

## Key Dependencies
- pandas - Data manipulation
- requests - HTTP requests  
- beautifulsoup4 - HTML parsing
- pydantic - Data validation
- tls-client - TLS client for web scraping

## Installation
```bash
pip install python-jobspy
```

## Basic Usage
```python
from jobspy import scrape_jobs

jobs = scrape_jobs(
    site_name=["indeed", "linkedin"],
    search_term="software engineer", 
    location="San Francisco, CA",
    results_wanted=10
)
```