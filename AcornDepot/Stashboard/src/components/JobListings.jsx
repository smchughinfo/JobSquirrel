import React, { useState, useEffect } from 'react'

function JobListings({ lastEvent }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch jobs from the API
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hoard');
      const data = await response.json();
      
      if (data.success) {
        setJobs(data.jobs);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch jobs');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchJobs();
  }, []);

  // Listen for hoard-updated events
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'hoard-updated') {
      console.log('🥜 Hoard updated, refreshing job listings...');
      fetchJobs();
    }
  }, [lastEvent]);

  const formatSalary = (salary) => {
    if (!salary || salary === 'N/A') return 'Salary not specified';
    return salary;
  };

  const formatLocation = (location) => {
    if (!location || location === 'N/A') return 'Location not specified';
    return location;
  };

  const formatRequirements = (requirements) => {
    if (!Array.isArray(requirements) || requirements.length === 0) {
      return ['No specific requirements listed'];
    }
    return requirements;
  };

  if (loading) {
    return (
      <div>
        <h2>🥜 Job Hoard</h2>
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <p style={{ color: '#666', fontStyle: 'italic' }}>Loading job listings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2>🥜 Job Hoard</h2>
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <p style={{ color: '#dc3545' }}>Error loading jobs: {error}</p>
          <button 
            onClick={fetchJobs}
            style={{
              background: '#8B4513',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>🥜 Job Hoard ({jobs.length} listings)</h2>
      
      {jobs.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No job listings in the hoard yet. Start processing some jobs to see them here!
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))'
        }}>
          {jobs.map((job, index) => (
            <div key={`${job.company}-${job.jobTitle}-${index}`} style={{
              background: 'white',
              borderRadius: '10px',
              padding: '1.5rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
            }}>
              
              {/* Header with company and title */}
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: '#8B4513',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}>
                  {job.jobTitle}
                </h3>
                <p style={{ 
                  margin: '0', 
                  color: '#666',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}>
                  {job.company}
                </p>
              </div>

              {/* Job details */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  <span style={{ marginRight: '0.5rem' }}>💰</span>
                  <span style={{ color: '#28a745', fontWeight: '500' }}>
                    {formatSalary(job.salary)}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  <span style={{ marginRight: '0.5rem' }}>📍</span>
                  <span style={{ color: '#17a2b8' }}>
                    {formatLocation(job.location)}
                  </span>
                </div>
              </div>

              {/* Job summary */}
              {job.jobSummary && job.jobSummary !== 'N/A' && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ 
                    margin: '0',
                    fontSize: '0.9rem',
                    color: '#333',
                    lineHeight: '1.4'
                  }}>
                    {job.jobSummary}
                  </p>
                </div>
              )}

              {/* Requirements */}
              <div>
                <h4 style={{ 
                  margin: '0 0 0.5rem 0',
                  fontSize: '0.9rem',
                  color: '#8B4513',
                  fontWeight: '600'
                }}>
                  Key Requirements:
                </h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  {formatRequirements(job.requirements).slice(0, 6).map((requirement, reqIndex) => (
                    <span key={reqIndex} style={{
                      background: '#f8f9fa',
                      color: '#495057',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      border: '1px solid #dee2e6'
                    }}>
                      {requirement}
                    </span>
                  ))}
                  {formatRequirements(job.requirements).length > 6 && (
                    <span style={{
                      color: '#666',
                      fontSize: '0.8rem',
                      padding: '0.25rem 0.5rem'
                    }}>
                      +{formatRequirements(job.requirements).length - 6} more
                    </span>
                  )}
                </div>
              </div>

              {/* URL if available */}
              {job.url && job.url !== 'N/A' && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e9ecef' }}>
                  <a 
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#8B4513',
                      textDecoration: 'none',
                      fontSize: '0.8rem',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  >
                    🔗 View Original Posting
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default JobListings