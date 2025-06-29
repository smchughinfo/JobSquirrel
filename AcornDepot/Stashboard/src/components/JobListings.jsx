import React, { useState, useEffect } from 'react'

function JobListings({ lastEvent }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedMarkdown, setExpandedMarkdown] = useState(new Set());
  const [resumeDialog, setResumeDialog] = useState({ open: false, html: '', jobTitle: '', company: '' });

  // Fetch jobs from the API
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hoard');
      const data = await response.json();
      
      if (data.success) {
        // Sort jobs by scrapeDate in reverse chronological order (newest first)
        const sortedJobs = data.jobs.sort((a, b) => {
          const dateA = new Date(a.scrapeDate);
          const dateB = new Date(b.scrapeDate);
          return dateB - dateA; // Newest first
        });
        setJobs(sortedJobs);
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

  // Listen for hoard-updated events and assistant completion
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'hoard-updated') {
      console.log('🥜 Hoard updated, refreshing job listings...');
      fetchJobs();
    }
    if (lastEvent && lastEvent.type === 'assistant-completed') {
      console.log('🤖 Assistant completed, refreshing job listings...');
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

  const toggleMarkdown = (jobIndex) => {
    setExpandedMarkdown(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobIndex)) {
        newSet.delete(jobIndex);
      } else {
        newSet.add(jobIndex);
      }
      return newSet;
    });
  };

  const toggleCollapse = async (job) => {
    try {
      const originalCollapsedState = job.collapsed;
      const newCollapsedState = !job.collapsed;
      
      // Create updated nut note object
      const updatedNutNote = {
        ...job,
        collapsed: newCollapsedState
      };
      
      // Update the job locally first for immediate UI feedback
      setJobs(prevJobs => 
        prevJobs.map(j => 
          j.company === job.company && j.jobTitle === job.jobTitle 
            ? updatedNutNote
            : j
        )
      );
      
      // Make API call to persist the entire updated nut note
      const response = await fetch('/api/nut-note', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNutNote)
      });
      
      if (!response.ok) {
        // If API call fails, revert the local change
        setJobs(prevJobs => 
          prevJobs.map(j => 
            j.company === job.company && j.jobTitle === job.jobTitle 
              ? { ...j, collapsed: originalCollapsedState }
              : j
          )
        );
        console.error('Failed to update nut note collapse state');
      }
    } catch (error) {
      console.error('Error toggling collapse:', error);
      // Revert local change on error
      setJobs(prevJobs => 
        prevJobs.map(j => 
          j.company === job.company && j.jobTitle === job.jobTitle 
            ? { ...j, collapsed: job.collapsed }
            : j
        )
      );
    }
  };

  const deleteJob = async (job) => {
    try {
      // Remove job locally first for immediate UI feedback
      setJobs(prevJobs => 
        prevJobs.filter(j => 
          !(j.company === job.company && j.jobTitle === job.jobTitle)
        )
      );
      
      // Make API call to delete from server
      const response = await fetch('/api/nut-note', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          company: job.company, 
          jobTitle: job.jobTitle 
        })
      });
      
      if (!response.ok) {
        // If API call fails, restore the job
        setJobs(prevJobs => [...prevJobs, job]);
        console.error('Failed to delete nut note');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      // Restore job on error
      setJobs(prevJobs => [...prevJobs, job]);
    }
  };

  const handleResumeClick = async (job) => {
    // If resume HTML exists, show it in dialog
    if (job.html && job.html.trim() !== '') {
      setResumeDialog({
        open: true,
        html: job.html,
        jobTitle: job.jobTitle || 'N/A',
        company: job.company || 'N/A'
      });
    } else {
      // Otherwise, generate a new resume
      await generateResume(job);
    }
  };

  const generateResume = async (job) => {
    try {
      console.log(`🐿️ Generating resume for: ${job.company} - ${job.jobTitle}`);
      
      const response = await fetch('/api/generate-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(job)
      });
      
      if (!response.ok) {
        console.error('Failed to generate resume');
      } else {
        console.log('✅ Resume generation started');
      }
    } catch (error) {
      console.error('Error generating resume:', error);
    }
  };

  const closeResumeDialog = () => {
    setResumeDialog({ open: false, html: '', jobTitle: '', company: '' });
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
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {jobs.map((job, index) => (
            <div key={`${job.company}-${job.jobTitle}-${index}`} style={{
              background: 'white',
              borderRadius: '10px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '1.5rem',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                
                {/* Main job info row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ flex: '1' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '1rem',
                      marginBottom: '0.25rem'
                    }}>
                      <h3 style={{
                        margin: '0',
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        color: '#2c3e50'
                      }}>
                        {job.jobTitle || 'N/A'}
                      </h3>
                      <span style={{
                        fontSize: '1.3rem',
                        fontWeight: '500',
                        color: '#8B4513'
                      }}>
                        {job.company || 'N/A'}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.5rem',
                      fontSize: '1.15rem',
                      color: '#666'
                    }}>
                      {job.salary && job.salary !== 'N/A' && (
                        <span style={{ color: '#28a745', fontWeight: '500' }}>
                          💰 {job.salary}
                        </span>
                      )}
                      {job.location && job.location !== 'N/A' && (
                        <span style={{ color: '#17a2b8' }}>
                          📍 {job.location}
                        </span>
                      )}
                      <span style={{ color: '#999' }}>
                        🕒 {job.scrapeDate ? new Date(job.scrapeDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center'
                  }}>
                    <button
                      onClick={() => toggleCollapse(job)}
                      style={{
                        background: 'transparent',
                        color: '#8B4513',
                        border: '1px solid #8B4513',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '5px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      {job.collapsed ? '▼' : '▲'}
                    </button>
                    <button
                      onClick={() => deleteJob(job)}
                      style={{
                        background: 'transparent',
                        color: '#8B4513',
                        border: '1px solid #8B4513',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '5px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                       ✕
                    </button>
                    <button
                      onClick={() => handleResumeClick(job)}
                      style={{
                        background: job.html && job.html.trim() !== '' ? '#17a2b8' : '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '5px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (job.html && job.html.trim() !== '') {
                          e.target.style.backgroundColor = '#138496';
                        } else {
                          e.target.style.backgroundColor = '#218838';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (job.html && job.html.trim() !== '') {
                          e.target.style.backgroundColor = '#17a2b8';
                        } else {
                          e.target.style.backgroundColor = '#28a745';
                        }
                      }}
                    >
                      {job.html && job.html.trim() !== '' ? '👁️ View Resume' : '📄 Generate Resume'}
                    </button>
                    {job.url && job.url !== 'N/A' && (
                      <a 
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#8B4513',
                          color: 'white',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '5px',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#6d3610'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#8B4513'}
                      >
                        View Job
                      </a>
                    )}
                    {job.markdown && (
                      <button
                        onClick={() => toggleMarkdown(index)}
                        style={{
                          background: expandedMarkdown.has(index) ? '#f8f9fa' : 'transparent',
                          color: '#8B4513',
                          border: '1px solid #8B4513',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '5px',
                          fontSize: '1rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!expandedMarkdown.has(index)) {
                            e.target.style.backgroundColor = '#f8f9fa';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!expandedMarkdown.has(index)) {
                            e.target.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {expandedMarkdown.has(index) ? 'Hide Details' : 'Show Details'}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Job summary - hidden when collapsed */}
                {!job.collapsed && job.jobSummary && job.jobSummary !== 'N/A' && (
                  <div style={{
                    marginTop: '.75rem',
                    marginBottom: '1.1rem',
                    fontSize: '1.3rem',
                    color: '#555',
                    lineHeight: '1.5'
                  }}>
                    {job.jobSummary}
                  </div>
                )}
                
                {/* Requirements - hidden when collapsed */}
                {!job.collapsed && job.requirements && job.requirements.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '1.1rem',
                      color: 'rgb(90, 90, 90);',
                      fontWeight: '500',
                      marginRight: '0.25rem'
                    }}>
                      Skills:
                    </span>
                    {job.requirements.slice(0,33).map((req, reqIndex) => {
                      const truncatedReq = req.length > 33 ? req.substring(0, 33) + '...' : req;
                      const isTruncated = req.length > 33;
                      return (
                        <span 
                          key={reqIndex} 
                          title={isTruncated ? req : undefined}
                          style={{
                            background: 'rgb(232, 232, 232)',
                            color: '#5f6368',
                            padding: '0.225rem 0.525rem',
                            borderRadius: '5px',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            cursor: 'default'
                          }}
                        >
                          {truncatedReq}
                        </span>
                      );
                    })}
                    {job.requirements.length > 33 && (
                      <span style={{
                        color: '#666',
                        fontSize: '0.9rem',
                        fontStyle: 'italic'
                      }}>
                        +{job.requirements.length - 33} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Expanded markdown content */}
              {expandedMarkdown.has(index) && job.markdown && (
                <div style={{
                  padding: '0 1.5rem 1.5rem 1.5rem',
                  background: '#f8f9fa'
                }}>
                  <div style={{
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '5px',
                    border: '1px solid #dee2e6',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    fontSize: '0.85rem',
                    lineHeight: '1.5'
                  }}>
                    <pre style={{
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                      margin: '0',
                      fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
                      color: '#333'
                    }}>
                      {job.markdown}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Resume Dialog */}
      {resumeDialog.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '1rem',
            maxWidth: '98vw',
            maxHeight: '98vh',
            width: '350mm',
            height: '297mm',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #dee2e6'
            }}>
              <h3 style={{
                margin: 0,
                color: '#2c3e50',
                fontSize: '1.5rem'
              }}>
                Resume: {resumeDialog.jobTitle} at {resumeDialog.company}
              </h3>
              <button
                onClick={closeResumeDialog}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ✕
              </button>
            </div>
            <iframe
              srcDoc={resumeDialog.html}
              style={{
                flex: 1,
                border: '1px solid #dee2e6',
                borderRadius: '5px',
                width: '100%'
              }}
              title={`Resume for ${resumeDialog.jobTitle} at ${resumeDialog.company}`}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default JobListings