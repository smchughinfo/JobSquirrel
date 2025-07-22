import React, { useState, useEffect } from 'react'

function ResumeProfilesDialog({ isOpen, onClose }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [showAddProfile, setShowAddProfile] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
    }
  }, [isOpen]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/resume-profiles');
      const result = await response.json();
      if (result.success) {
        setProfiles(result.profiles);
      } else {
        console.error('Failed to load resume profiles:', result.error);
      }
    } catch (error) {
      console.error('Error loading resume profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (profileId) => {
    try {
      const response = await fetch('/api/resume-profiles/set-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId })
      });
      const result = await response.json();
      if (result.success) {
        setProfiles(prev => prev.map(p => ({ ...p, active: p.id === profileId })));
      } else {
        console.error('Failed to set active profile:', result.error);
      }
    } catch (error) {
      console.error('Error setting active profile:', error);
    }
  };

  const [editingProfile, setEditingProfile] = useState(null);
  const [editingPath, setEditingPath] = useState('');

  const handleStartEditPath = (profile) => {
    setEditingProfile(profile.id);
    setEditingPath(profile.filePath || '');
  };

  const handleSavePath = async (profileId) => {
    if (!editingPath.trim()) {
      alert('Please enter a valid file path');
      return;
    }
    
    try {
      const response = await fetch('/api/resume-profiles/update-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profileId, 
          filePath: editingPath.trim()
        })
      });
      const result = await response.json();
      if (result.success) {
        setEditingProfile(null);
        setEditingPath('');
        loadProfiles(); // Reload to show updated path
      } else {
        console.error('Failed to update profile path:', result.error);
        alert('Failed to update path: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating profile path:', error);
      alert('Error updating path: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingProfile(null);
    setEditingPath('');
  };

  const handleAddProfile = async () => {
    if (!newProfileName.trim()) return;
    
    try {
      const response = await fetch('/api/resume-profiles/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProfileName.trim() })
      });
      const result = await response.json();
      if (result.success) {
        setNewProfileName('');
        setShowAddProfile(false);
        loadProfiles();
      } else {
        console.error('Failed to add profile:', result.error);
      }
    } catch (error) {
      console.error('Error adding profile:', error);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (confirm('Are you sure you want to delete this profile?')) {
      try {
        const response = await fetch(`/api/resume-profiles/${profileId}`, {
          method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
          loadProfiles();
        } else {
          console.error('Failed to delete profile:', result.error);
        }
      } catch (error) {
        console.error('Error deleting profile:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="config-dialog-overlay" onClick={onClose}>
      <div className="config-dialog resume-profiles-dialog" onClick={e => e.stopPropagation()}>
        <div className="config-dialog-header">
          <h3>🗂️ Resume Profiles</h3>
          <button className="config-dialog-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="config-dialog-content">
          {loading ? (
            <div className="loading">Loading profiles...</div>
          ) : (
            <>
              <div className="profile-list">
                {profiles.map(profile => (
                  <div key={profile.id} className={`profile-item ${profile.active ? 'active' : ''}`}>
                    <div className="profile-info">
                      <div className="profile-header">
                        <span className="profile-name">{profile.name}</span>
                        {profile.active && <span className="active-badge">ACTIVE</span>}
                      </div>
                      <div className="profile-path">
                        {editingProfile === profile.id ? (
                          <div className="path-edit-form">
                            <input
                              type="text"
                              className="path-input"
                              value={editingPath}
                              onChange={(e) => setEditingPath(e.target.value)}
                              placeholder="Enter full path to resume.json (e.g., C:/Users/name/Documents/resume.json)"
                              onKeyPress={(e) => e.key === 'Enter' && handleSavePath(profile.id)}
                            />
                            <div className="path-edit-actions">
                              <button 
                                className="profile-button cancel-button"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </button>
                              <button 
                                className="profile-button add-button"
                                onClick={() => handleSavePath(profile.id)}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {profile.filePath ? (
                              <span className="file-path">{profile.filePath}</span>
                            ) : (
                              <span className="no-file">No file selected</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="profile-actions">
                      {editingProfile !== profile.id && (
                        <button 
                          className="profile-button select-file-button"
                          onClick={() => handleStartEditPath(profile)}
                          title="Set path to resume.json file"
                        >
                          📝 Set Path
                        </button>
                      )}
                      {editingProfile !== profile.id && (
                        <>
                          <button 
                            className={`profile-button set-active-button ${profile.active ? 'disabled' : ''}`}
                            onClick={() => handleSetActive(profile.id)}
                            disabled={profile.active || !profile.filePath}
                            title="Set as active profile"
                          >
                            ✅ Set Active
                          </button>
                          <button 
                            className="profile-button delete-button"
                            onClick={() => handleDeleteProfile(profile.id)}
                            title="Delete profile"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {showAddProfile ? (
                <div className="add-profile-form">
                  <input
                    type="text"
                    className="profile-name-input"
                    placeholder="Profile name (e.g., Senior Developer)"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddProfile()}
                  />
                  <div className="add-profile-actions">
                    <button className="profile-button cancel-button" onClick={() => {
                      setShowAddProfile(false);
                      setNewProfileName('');
                    }}>
                      Cancel
                    </button>
                    <button className="profile-button add-button" onClick={handleAddProfile}>
                      Add Profile
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  className="add-profile-trigger"
                  onClick={() => setShowAddProfile(true)}
                >
                  ➕ Add New Profile
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResumeProfilesDialog