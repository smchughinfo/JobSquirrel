import React, { useState, useEffect } from 'react';

function ATSSkillsDialog({ isOpen, onClose, onSave }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSkills();
    }
  }, [isOpen]);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ats-skills');
      const data = await response.json();
      
      if (data.success) {
        // Sort skills: truly new ones first (those with isNew: true), then existing ones
        const sortedSkills = data.skills.sort((a, b) => {
          if (a.isNew === true && b.isNew !== true) return -1;
          if (a.isNew !== true && b.isNew === true) return 1;
          return a.name.localeCompare(b.name);
        });
        setSkills(sortedSkills);
      } else {
        console.error('Failed to fetch ATS skills:', data.error);
      }
    } catch (error) {
      console.error('Error fetching ATS skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillToggle = (skillName) => {
    setSkills(prevSkills => 
      prevSkills.map(skill => 
        skill.name === skillName 
          ? { ...skill, include: !skill.include }
          : skill
      )
    );
  };

  const handlePreferredSpellingChange = (skillName, newSpelling) => {
    setSkills(prevSkills => 
      prevSkills.map(skill => 
        skill.name === skillName 
          ? { ...skill, preferredSpelling: newSpelling }
          : skill
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Create skillUpdates object with both include status and preferred spelling
      const skillUpdates = {};
      const preferredSpellings = {};
      
      skills.forEach(skill => {
        skillUpdates[skill.name] = skill.include;
        preferredSpellings[skill.name] = skill.preferredSpelling || skill.name;
      });
      
      const response = await fetch('/api/ats-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skillUpdates, preferredSpellings })
      });
      
      const data = await response.json();
      
      if (data.success) {
        onSave();
        onClose();
      } else {
        console.error('Failed to save ATS skills:', data.error);
      }
    } catch (error) {
      console.error('Error saving ATS skills:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
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
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            margin: 0,
            color: '#2c3e50',
            fontSize: '1.4rem'
          }}>
            🎯 ATS Skills Review
          </h3>
          <button
            onClick={onClose}
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

        {/* Content */}
        <div style={{
          padding: '1.5rem',
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div>Loading skills...</div>
            </div>
          ) : (
            <>
              <p style={{
                margin: '0 0 1rem 0',
                color: '#666',
                fontSize: '0.9rem'
              }}>
                Review and select which skills to include in your resume templates. 
                New skills are highlighted and shown at the top.
              </p>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {skills.map((skill, index) => (
                  <div
                    key={skill.name}
                    style={{
                      padding: '1rem',
                      backgroundColor: skill.isNew === true ? '#fff3cd' : '#f8f9fa',
                      border: skill.isNew === true ? '1px solid #ffeaa7' : '1px solid #dee2e6',
                      borderRadius: '5px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <input
                        type="checkbox"
                        checked={skill.include}
                        onChange={() => handleSkillToggle(skill.name)}
                        style={{
                          marginRight: '0.5rem'
                        }}
                      />
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: skill.isNew === true ? '600' : '400',
                        flex: 1
                      }}>
                        {skill.name}
                      </span>
                      {skill.isNew === true && (
                        <span style={{
                          fontSize: '0.7rem',
                          color: '#856404',
                          backgroundColor: '#fff3cd',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '3px'
                        }}>
                          NEW
                        </span>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <label style={{
                        fontSize: '0.8rem',
                        color: '#666',
                        minWidth: '120px'
                      }}>
                        Preferred Spelling:
                      </label>
                      <input
                        type="text"
                        value={skill.preferredSpelling || skill.name}
                        onChange={(e) => handlePreferredSpellingChange(skill.name, e.target.value)}
                        style={{
                          flex: 1,
                          padding: '0.25rem 0.5rem',
                          border: '1px solid #ccc',
                          borderRadius: '3px',
                          fontSize: '0.8rem'
                        }}
                        placeholder={skill.name}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {skills.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#666'
                }}>
                  No skills found. Generate some resumes to start building your ATS skills library!
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem'
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '5px',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '5px',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ATSSkillsDialog;