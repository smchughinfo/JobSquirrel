import React, { useState, useEffect } from 'react'

function JobListings({ lastEvent }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedMarkdown, setExpandedMarkdown] = useState(new Set());
  const [resumeDialog, setResumeDialog] = useState({ open: false, htmlArray: [], pdfPath: null, coverLetter: null, activeTab: 0, activeType: 'html', jobTitle: '', company: '', job: null });
  const [remixDialog, setRemixDialog] = useState({ open: false, changes: '', loading: false });
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({ open: false, resumeIndex: null });
  const [marginInches, setMarginInches] = useState(0);

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

  // Update resume dialog when jobs refresh and dialog is open
  useEffect(() => {
    if (resumeDialog.open && resumeDialog.job) {
      const updatedJob = jobs.find(j => 
        j.company === resumeDialog.job.company && 
        j.jobTitle === resumeDialog.job.jobTitle
      );
      if (updatedJob && updatedJob.html && Array.isArray(updatedJob.html)) {
        setResumeDialog(prev => ({
          ...prev,
          htmlArray: updatedJob.html,
          pdfPath: updatedJob.pdfPath || prev.pdfPath, // Update PDF path if available
          coverLetter: updatedJob.coverLetter || prev.coverLetter, // Update cover letter if available
          job: updatedJob,
          // If new resume was added, switch to it
          activeTab: updatedJob.html.length > prev.htmlArray.length ? updatedJob.html.length - 1 : prev.activeTab
        }));
      }
    }
  }, [jobs, resumeDialog.open, resumeDialog.job]);

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
    // Check if resume HTML exists (array format)
    if (job.html && Array.isArray(job.html) && job.html.length > 0) {
      setResumeDialog({
        open: true,
        htmlArray: job.html,
        pdfPath: job.pdfPath || null, // Load existing PDF path if available
        coverLetter: job.coverLetter || null, // Load existing cover letter if available
        activeTab: job.html.length - 1, // Default to newest resume
        activeType: job.pdfPath ? 'pdf' : 'html', // Default to PDF if available, otherwise HTML
        jobTitle: job.jobTitle || 'N/A',
        company: job.company || 'N/A',
        job: job
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
    setResumeDialog({ open: false, htmlArray: [], pdfPath: null, coverLetter: null, activeTab: 0, activeType: 'html', jobTitle: '', company: '', job: null });
    setMarginInches(0);
  };

  const handleRemixClick = () => {
    setRemixDialog({ open: true, changes: '', loading: false });
  };

  const closeRemixDialog = () => {
    setRemixDialog({ open: false, changes: '', loading: false });
  };

  const handleRemixSubmit = async () => {
    if (!remixDialog.changes.trim() || !resumeDialog.job) return;
    
    setRemixDialog(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await fetch('/api/remix-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nutNote: resumeDialog.job,
          activeResumeIndex: resumeDialog.activeTab,
          currentResumeHtml: resumeDialog.htmlArray[resumeDialog.activeTab],
          requestedChanges: remixDialog.changes
        })
      });
      
      if (response.ok) {
        console.log('✅ Resume remix started');
        closeRemixDialog();
        // Dialog will be updated when hoard refreshes with new resume version
      } else {
        console.error('Failed to start resume remix');
      }
    } catch (error) {
      console.error('Error starting resume remix:', error);
    } finally {
      setRemixDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRegenerateResume = async () => {
    if (resumeDialog.job) {
      await generateResume(resumeDialog.job);
      // Dialog will be updated when hoard refreshes
    }
  };

  const setActiveTab = (tabIndex, type = null) => {
    setResumeDialog(prev => ({ 
      ...prev, 
      activeTab: tabIndex, 
      activeType: type || prev.activeType 
    }));
  };

  const handleGeneratePDF = async () => {
    if (resumeDialog.job && resumeDialog.htmlArray[resumeDialog.activeTab]) {
      try {
        const response = await fetch('/api/generate-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nutNote: resumeDialog.job,
            resumeHtml: resumeDialog.htmlArray[resumeDialog.activeTab],
            marginInches: parseFloat(marginInches) || 0
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          // Set PDF path and switch to PDF tab
          setResumeDialog(prev => ({
            ...prev,
            pdfPath: result.pdfPath + '?t=' + Date.now(), // Add timestamp to force reload
            activeType: 'pdf'
          }));
          console.log('✅ PDF generated successfully:', result.pdfPath);
        } else {
          console.error('Failed to generate PDF');
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
      }
    }
  };

  const handleDeleteResumeClick = (resumeIndex) => {
    setDeleteConfirmDialog({ open: true, resumeIndex });
  };

  const closeDeleteConfirmDialog = () => {
    setDeleteConfirmDialog({ open: false, resumeIndex: null });
  };

  const handleDeleteResumeConfirm = async () => {
    if (deleteConfirmDialog.resumeIndex !== null && resumeDialog.job) {
      try {
        console.log(`🗑️ Deleting resume version ${deleteConfirmDialog.resumeIndex + 1} for ${resumeDialog.job.company} - ${resumeDialog.job.jobTitle}`);
        
        const response = await fetch('/api/resume-version', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nutNote: resumeDialog.job,
            resumeIndex: deleteConfirmDialog.resumeIndex
          })
        });
        
        if (response.ok) {
          console.log('✅ Resume version deleted successfully');
          
          // Update local state
          const newHtmlArray = [...resumeDialog.htmlArray];
          newHtmlArray.splice(deleteConfirmDialog.resumeIndex, 1);
          
          // Adjust active tab if necessary
          let newActiveTab = resumeDialog.activeTab;
          if (deleteConfirmDialog.resumeIndex <= resumeDialog.activeTab && resumeDialog.activeTab > 0) {
            newActiveTab = resumeDialog.activeTab - 1;
          } else if (deleteConfirmDialog.resumeIndex === resumeDialog.activeTab && newHtmlArray.length > 0) {
            newActiveTab = Math.min(resumeDialog.activeTab, newHtmlArray.length - 1);
          }
          
          // If no resumes left, close the dialog
          if (newHtmlArray.length === 0) {
            closeResumeDialog();
          } else {
            setResumeDialog(prev => ({
              ...prev,
              htmlArray: newHtmlArray,
              activeTab: newActiveTab
            }));
          }
          
          closeDeleteConfirmDialog();
        } else {
          const error = await response.json();
          console.error('Failed to delete resume version:', error.error);
        }
      } catch (error) {
        console.error('Error deleting resume version:', error);
      }
    }
  };

  const handleDoubleCheckClick = async () => {
    if (resumeDialog.job && resumeDialog.activeTab !== undefined) {
      try {
        console.log(`✅ Double-checking resume version ${resumeDialog.activeTab + 1} for ${resumeDialog.job.company} - ${resumeDialog.job.jobTitle}`);
        
        const response = await fetch('/api/double-check-resume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nutNote: resumeDialog.job,
            resumeIndex: resumeDialog.activeTab
          })
        });
        
        if (response.ok) {
          console.log('✅ Resume double-check completed successfully');
        } else {
          const error = await response.json();
          console.error('Failed to double-check resume:', error.error);
        }
      } catch (error) {
        console.error('Error double-checking resume:', error);
      }
    }
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
                        background: (job.html && Array.isArray(job.html) && job.html.length > 0) ? '#17a2b8' : '#28a745',
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
                        if (job.html && Array.isArray(job.html) && job.html.length > 0) {
                          e.target.style.backgroundColor = '#138496';
                        } else {
                          e.target.style.backgroundColor = '#218838';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (job.html && Array.isArray(job.html) && job.html.length > 0) {
                          e.target.style.backgroundColor = '#17a2b8';
                        } else {
                          e.target.style.backgroundColor = '#28a745';
                        }
                      }}
                    >
                      {(job.html && Array.isArray(job.html) && job.html.length > 0) ? `👁️ View Resume (${job.html.length})` : '📄 Generate Resume'}
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
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={handleRegenerateResume}
                  style={{
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '5px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                >
                  🔄 Generate
                </button>
                <button
                  onClick={handleRemixClick}
                  style={{
                    background: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '5px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#5a2d8c'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#6f42c1'}
                >
                  🎨 Remix
                </button>
                <button
                  onClick={handleDoubleCheckClick}
                  style={{
                    background: '#fd7e14',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '5px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e8690b'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#fd7e14'}
                >
                  ✅ Double Check
                </button>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  border: '1px solid #dee2e6',
                  borderRadius: '5px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <label style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: '500',
                    color: '#495057',
                    whiteSpace: 'nowrap'
                  }}>
                    Margin Inches:
                  </label>
                  <input
                    type="number"
                    value={marginInches}
                    onChange={(e) => setMarginInches(e.target.value)}
                    step="0.1"
                    min="0"
                    max="2"
                    style={{
                      width: '60px',
                      padding: '0.25rem',
                      border: '1px solid #ced4da',
                      borderRadius: '3px',
                      fontSize: '0.8rem'
                    }}
                  />
                  <button
                    onClick={handleGeneratePDF}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '3px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                  >
                    📄 PDF
                  </button>
                </div>
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
            </div>
            
            {/* Tab navigation */}
            {(resumeDialog.htmlArray.length > 1 || resumeDialog.pdfPath || resumeDialog.coverLetter) && (
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #dee2e6',
                marginBottom: '1rem',
                gap: '0.25rem'
              }}>
                {/* HTML Resume tabs */}
                {resumeDialog.htmlArray.map((_, index) => (
                  <div
                    key={`html-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: (resumeDialog.activeTab === index && resumeDialog.activeType === 'html') ? '#8B4513' : 'transparent',
                      border: '1px solid #8B4513',
                      borderBottom: (resumeDialog.activeTab === index && resumeDialog.activeType === 'html') ? '1px solid #8B4513' : '1px solid #dee2e6',
                      borderBottomLeftRadius: '0',
                      borderBottomRightRadius: '0',
                      borderTopLeftRadius: '5px',
                      borderTopRightRadius: '5px',
                      marginBottom: '-1px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!(resumeDialog.activeTab === index && resumeDialog.activeType === 'html')) {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!(resumeDialog.activeTab === index && resumeDialog.activeType === 'html')) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      } else {
                        // Ensure active tab maintains brown background
                        e.currentTarget.style.backgroundColor = '#8B4513';
                      }
                    }}
                  >
                    <button
                      onClick={() => setActiveTab(index, 'html')}
                      style={{
                        background: 'transparent',
                        color: (resumeDialog.activeTab === index && resumeDialog.activeType === 'html') ? 'white' : '#8B4513',
                        border: 'none',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        flex: 1
                      }}
                    >
                      Resume {index + 1}
                    </button>
                    {resumeDialog.htmlArray.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteResumeClick(index);
                        }}
                        style={{
                          background: 'transparent',
                          color: (resumeDialog.activeTab === index && resumeDialog.activeType === 'html') ? 'white' : '#8B4513',
                          border: 'none',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          borderRadius: '3px',
                          marginLeft: '0.25rem',
                          marginRight: '0.25rem',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = (resumeDialog.activeTab === index && resumeDialog.activeType === 'html') ? 'rgba(255,255,255,0.2)' : 'rgba(139,69,19,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                        }}
                        title="Delete this resume version"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                
                {/* PDF Resume tab (single PDF) */}
                {resumeDialog.pdfPath && (
                  <button
                    key="pdf"
                    onClick={() => setActiveTab(0, 'pdf')}
                    style={{
                      background: (resumeDialog.activeType === 'pdf') ? '#dc3545' : 'transparent',
                      color: (resumeDialog.activeType === 'pdf') ? 'white' : '#dc3545',
                      border: '1px solid #dc3545',
                      borderBottom: (resumeDialog.activeType === 'pdf') ? '1px solid #dc3545' : '1px solid #dee2e6',
                      borderBottomLeftRadius: '0',
                      borderBottomRightRadius: '0',
                      borderTopLeftRadius: '5px',
                      borderTopRightRadius: '5px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginBottom: '-1px'
                    }}
                    onMouseEnter={(e) => {
                      if (resumeDialog.activeType !== 'pdf') {
                        e.target.style.backgroundColor = '#f8f9fa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (resumeDialog.activeType !== 'pdf') {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    📄 PDF Resume
                  </button>
                )}
                
                {/* Cover Letter tab */}
                {resumeDialog.coverLetter && (
                  <button
                    key="coverLetter"
                    onClick={() => setActiveTab(0, 'coverLetter')}
                    style={{
                      background: (resumeDialog.activeType === 'coverLetter') ? '#28a745' : 'transparent',
                      color: (resumeDialog.activeType === 'coverLetter') ? 'white' : '#28a745',
                      border: '1px solid #28a745',
                      borderBottom: (resumeDialog.activeType === 'coverLetter') ? '1px solid #28a745' : '1px solid #dee2e6',
                      borderBottomLeftRadius: '0',
                      borderBottomRightRadius: '0',
                      borderTopLeftRadius: '5px',
                      borderTopRightRadius: '5px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginBottom: '-1px'
                    }}
                    onMouseEnter={(e) => {
                      if (resumeDialog.activeType !== 'coverLetter') {
                        e.target.style.backgroundColor = '#f8f9fa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (resumeDialog.activeType !== 'coverLetter') {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    💌 Cover Letter
                  </button>
                )}
              </div>
            )}
            {resumeDialog.activeType === 'html' ? (
              <iframe
                srcDoc={resumeDialog.htmlArray[resumeDialog.activeTab] || ''}
                style={{
                  flex: 1,
                  border: '1px solid #dee2e6',
                  borderRadius: '5px',
                  width: '100%'
                }}
                title={`Resume ${resumeDialog.activeTab + 1} for ${resumeDialog.jobTitle} at ${resumeDialog.company}`}
              />
            ) : resumeDialog.activeType === 'pdf' ? (
              <embed
                src={resumeDialog.pdfPath || ''}
                type="application/pdf"
                style={{
                  flex: 1,
                  border: '1px solid #dee2e6',
                  borderRadius: '5px',
                  width: '100%'
                }}
                title={`PDF Resume for ${resumeDialog.jobTitle} at ${resumeDialog.company}`}
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  border: '1px solid #dee2e6',
                  borderRadius: '5px',
                  padding: '2rem',
                  backgroundColor: '#fff',
                  overflow: 'auto'
                }}
              >
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    margin: '0',
                    fontFamily: "'Georgia', serif",
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#333'
                  }}
                >
                  {resumeDialog.coverLetter || 'No cover letter available'}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Remix Dialog */}
      {remixDialog.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '2rem',
            width: '500px',
            maxWidth: '90vw',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #dee2e6'
            }}>
              <h3 style={{
                margin: 0,
                color: '#2c3e50',
                fontSize: '1.3rem'
              }}>
                🎨 Remix Resume
              </h3>
              <button
                onClick={closeRemixDialog}
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
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#495057'
              }}>
                What changes would you like to make to this resume?
              </label>
              <textarea
                value={remixDialog.changes}
                onChange={(e) => setRemixDialog(prev => ({ ...prev, changes: e.target.value }))}
                placeholder="Describe the changes you want to make to the resume..."
                style={{
                  width: '100%',
                  height: '120px',
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '5px',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                disabled={remixDialog.loading}
              />
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                onClick={closeRemixDialog}
                disabled={remixDialog.loading}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '5px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: remixDialog.loading ? 'not-allowed' : 'pointer',
                  opacity: remixDialog.loading ? 0.6 : 1,
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!remixDialog.loading) {
                    e.target.style.backgroundColor = '#5a6268';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!remixDialog.loading) {
                    e.target.style.backgroundColor = '#6c757d';
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRemixSubmit}
                disabled={remixDialog.loading || !remixDialog.changes.trim()}
                style={{
                  background: remixDialog.loading || !remixDialog.changes.trim() ? '#ccc' : '#6f42c1',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '5px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: (remixDialog.loading || !remixDialog.changes.trim()) ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!remixDialog.loading && remixDialog.changes.trim()) {
                    e.target.style.backgroundColor = '#5a2d8c';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!remixDialog.loading && remixDialog.changes.trim()) {
                    e.target.style.backgroundColor = '#6f42c1';
                  }
                }}
              >
                {remixDialog.loading ? '🔄 Processing...' : '🎨 Submit Remix'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      {deleteConfirmDialog.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '2rem',
            width: '400px',
            maxWidth: '90vw',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              color: '#2c3e50',
              fontSize: '1.3rem'
            }}>
              🗑️ Delete Resume Version
            </h3>
            
            <p style={{
              margin: '0 0 2rem 0',
              color: '#666',
              fontSize: '1rem',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete Resume {deleteConfirmDialog.resumeIndex + 1}? This action cannot be undone.
            </p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <button
                onClick={closeDeleteConfirmDialog}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '5px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteResumeConfirm}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '5px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobListings