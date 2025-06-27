import React, { useState, useEffect } from 'react'

function EventMonitor({ isConnected, lastEvent }) {
  const [events, setEvents] = useState([]);
  const maxEvents = 10; // Keep last 10 events

  useEffect(() => {
    if (lastEvent) {
      setEvents(prev => {
        const newEvents = [lastEvent, ...prev].slice(0, maxEvents);
        return newEvents;
      });
    }
  }, [lastEvent]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'job-queued': return '🥜';
      case 'job-started': return '⚙️';
      case 'job-completed': return '✅';
      case 'job-failed': return '❌';
      case 'llm-processing-started': return '🧠';
      case 'llm-processing-completed': return '🧠✅';
      case 'clipboard-changed': return '📋';
      case 'system-status': return '🐿️';
      case 'connected': return '🔌';
      default: return '📡';
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'job-completed': return '#28a745';
      case 'job-failed': return '#dc3545';
      case 'job-started': return '#ffc107';
      case 'job-queued': return '#17a2b8';
      case 'llm-processing-started': return '#6f42c1';
      case 'llm-processing-completed': return '#28a745';
      case 'connected': return '#28a745';
      default: return '#6c757d';
    }
  };

  return (
    <div>
      <h2>📡 Real-time Events</h2>
      <div id="event-monitor" style={{ 
        background: 'white', 
        borderRadius: '10px', 
        padding: '1rem', 
        marginBottom: '2rem',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid #eee'
        }}>
          <span style={{ 
            display: 'inline-block',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#28a745' : '#dc3545',
            marginRight: '0.5rem'
          }}></span>
          <strong>
            {isConnected ? 'Connected to event stream' : 'Disconnected'}
          </strong>
        </div>

        {events.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No events yet... waiting for activity
          </p>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {events.map((event, index) => (
              <div 
                key={`${event.timestamp}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  backgroundColor: index === 0 ? '#f8f9fa' : 'transparent',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${getEventColor(event.type)}`
                }}
              >
                <span style={{ 
                  fontSize: '1.2rem', 
                  marginRight: '0.5rem',
                  minWidth: '24px'
                }}>
                  {getEventIcon(event.type)}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: index === 0 ? 'bold' : 'normal',
                    color: '#333'
                  }}>
                    {event.message}
                  </div>
                  {event.preview && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#555',
                      backgroundColor: '#f8f9fa',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '3px',
                      marginTop: '0.3rem',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {event.preview}
                    </div>
                  )}
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#666',
                    marginTop: '0.2rem'
                  }}>
                    {new Date(event.timestamp).toLocaleTimeString()}
                    {event.resultLength && (
                      <span style={{ marginLeft: '0.5rem', color: '#999' }}>
                        ({event.resultLength} chars)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EventMonitor