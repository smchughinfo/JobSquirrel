import React, { useState, useEffect, useRef } from 'react'

function ClaudeAssistant({ claudeEvents }) {
  const [outputs, setOutputs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [expandedOutputs, setExpandedOutputs] = useState(new Set());
  const outputContainerRef = useRef(null);
  const maxOutputs = 20; // Keep last 20 outputs
  const maxDisplayLength = 200; // Characters before truncation

  // Scroll to top when new outputs arrive (since they're in reverse chronological order)
  const scrollToTop = () => {
    if (outputContainerRef.current) {
      outputContainerRef.current.scrollTop = 0;
    }
  };

  useEffect(() => {
    scrollToTop();
  }, [outputs]);

  // Handle Claude events from parent
  useEffect(() => {
    if (claudeEvents) {
      handleClaudeEvent(claudeEvents);
    }
  }, [claudeEvents]);

  const handleClaudeEvent = (event) => {
    const timestamp = new Date().toISOString();
    if (event.type === 'system') {
      if (event.session) {
        setCurrentSession(event.session);
        addOutput({
          type: 'system',
          content: `🔧 Claude session started (${event.session?.substring(0, 8)}...)`,
          timestamp,
          isStreaming: false
        });
        setIsProcessing(true);
      } else if (event.content) {
        // Filter out verbose system messages that clutter the UI
        const content = event.content;
        const shouldDisplay = !content.includes('Output file:') && 
                             !content.includes('Full WSL command:') && 
                             !content.includes('process started, PID:') &&
                             !content.includes('WSL working dir:') &&
                             !content.includes('WSL output file:') &&
                             !content.includes('Cleaned up output file');
        
        if (shouldDisplay) {
          addOutput({
            type: 'system',
            content: content,
            timestamp,
            isStreaming: false
          });
        }
      }
      
    } else if (event.type === 'response') {
      // Add or update the response output
      addOrUpdateResponse(event.content, timestamp, true);
      
    } else if (event.type === 'response-line') {
      // Add individual response line
      addOutput({
        type: 'response-line',
        content: event.content,
        timestamp,
        isStreaming: false
      });
      
    } else if (event.type === 'complete') {
      setIsProcessing(false);
      // Final update to response if needed
      if (event.result) {
        addOrUpdateResponse(event.result, timestamp, false);
      }
      
      // Add completion info
      addOutput({
        type: 'system',
        content: `✅ Completed in ${event.duration}ms - $${event.cost?.toFixed(6)}`,
        timestamp,
        isStreaming: false
      });
      
    } else if (event.type === 'error') {
      setIsProcessing(false);
      addOutput({
        type: 'error',
        content: event.message || event.content || 'Unknown error',
        timestamp,
        isStreaming: false
      });
    }
  };

  const addOutput = (output) => {
    setOutputs(prev => {
      const newOutputs = [{ ...output, id: Date.now() + Math.random() }, ...prev];
      return newOutputs.slice(0, maxOutputs);
    });
  };

  const addOrUpdateResponse = (content, timestamp, isStreaming) => {
    setOutputs(prev => {
      const firstOutput = prev[0];
      
      // If first output is a Claude response, update it (since we're showing newest first)
      if (firstOutput && firstOutput.type === 'assistant') {
        const updated = [...prev];
        updated[0] = {
          ...firstOutput,
          content,
          isStreaming,
          timestamp
        };
        return updated;
      } else {
        // Add new response output at the beginning
        const newOutput = {
          type: 'assistant',
          content,
          timestamp,
          isStreaming,
          id: Date.now() + Math.random()
        };
        const newOutputs = [newOutput, ...prev];
        return newOutputs.slice(0, maxOutputs);
      }
    });
  };

  const clearOutputs = () => {
    setOutputs([]);
    setCurrentSession(null);
    setExpandedOutputs(new Set());
  };

  const toggleExpanded = (outputId) => {
    setExpandedOutputs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(outputId)) {
        newSet.delete(outputId);
      } else {
        newSet.add(outputId);
      }
      return newSet;
    });
  };

  const shouldTruncate = (content) => {
    return content && content.length > maxDisplayLength;
  };

  const getDisplayContent = (output) => {
    const isExpanded = expandedOutputs.has(output.id);
    const content = output.content || '';
    
    if (!shouldTruncate(content) || isExpanded) {
      return content;
    }
    
    return content.substring(0, maxDisplayLength) + '...';
  };

  const getOutputIcon = (type) => {
    switch (type) {
      case 'assistant': return '🤖';
      case 'response-line': return '💬';
      case 'system': return '🔧';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  const getOutputStyle = (type, isStreaming) => {
    const baseStyle = {
      padding: '0.75rem',
      marginBottom: '0.5rem',
      borderRadius: '8px',
      wordWrap: 'break-word',
      position: 'relative'
    };

    switch (type) {
      case 'assistant':
        return {
          ...baseStyle,
          backgroundColor: isStreaming ? '#f0f7ff' : '#f5f5f5',
          borderLeft: '4px solid #4caf50',
          border: isStreaming ? '1px dashed #4caf50' : 'none'
        };
      case 'response-line':
        return {
          ...baseStyle,
          backgroundColor: '#f8f9fa',
          borderLeft: '4px solid #6c757d',
          fontSize: '0.85rem',
          padding: '0.5rem',
          marginBottom: '0.25rem'
        };
      case 'system':
        return {
          ...baseStyle,
          backgroundColor: '#fff3e0',
          borderLeft: '4px solid #ff9800',
          fontSize: '0.9rem',
          fontStyle: 'italic'
        };
      case 'error':
        return {
          ...baseStyle,
          backgroundColor: '#ffebee',
          borderLeft: '4px solid #f44336',
          color: '#c62828'
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div>
      <h2>🤖 Claude Output</h2>
      <div style={{ 
        background: 'white', 
        borderRadius: '10px', 
        padding: '1rem', 
        marginBottom: '2rem',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        height: '400px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header with session info and controls */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid #eee'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ 
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: isProcessing ? '#ff9800' : '#28a745',
              marginRight: '0.5rem'
            }}></span>
            <strong>
              {isProcessing ? 'Claude is working...' : 'Ready'}
            </strong>
            {currentSession && (
              <span style={{ 
                marginLeft: '0.5rem', 
                color: '#666', 
                fontSize: '0.8rem',
                fontFamily: 'monospace'
              }}>
                Session: {currentSession.substring(0, 8)}...
              </span>
            )}
          </div>
          <button 
            onClick={clearOutputs}
            style={{
              background: 'none',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '0.25rem 0.5rem',
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: '#666'
            }}
            title="Clear output"
          >
            🗑️ Clear
          </button>
        </div>

        {/* Output display area */}
        <div 
          ref={outputContainerRef}
          style={{ 
            flex: 1,
            overflowY: 'auto',
            padding: '0.5rem',
            backgroundColor: '#fafafa',
            borderRadius: '6px'
          }}>
          {outputs.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              fontStyle: 'italic',
              marginTop: '2rem'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤖</div>
              <p>Waiting for Claude output...</p>
              <p style={{ fontSize: '0.9rem', color: '#999' }}>
                Claude output will appear here during resume generation and processing.
              </p>
            </div>
          ) : (
            <>
              {outputs.map((output) => {
                const isExpanded = expandedOutputs.has(output.id);
                const shouldTruncateThis = shouldTruncate(output.content);
                const displayContent = getDisplayContent(output);
                
                return (
                  <div 
                    key={output.id}
                    style={{
                      ...getOutputStyle(output.type, output.isStreaming),
                      cursor: shouldTruncateThis ? 'pointer' : 'default'
                    }}
                    onClick={() => shouldTruncateThis && toggleExpanded(output.id)}
                    title={shouldTruncateThis ? (isExpanded ? 'Click to collapse' : 'Click to expand') : ''}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start',
                      gap: '0.5rem'
                    }}>
                      <span style={{ fontSize: '1.1rem', marginTop: '0.1rem' }}>
                        {getOutputIcon(output.type)}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.4'
                        }}>
                          {displayContent}
                          {output.isStreaming && (
                            <span style={{ 
                              marginLeft: '0.5rem',
                              color: '#4caf50',
                              animation: 'blink 1s infinite'
                            }}>
                              ●
                            </span>
                          )}
                          {shouldTruncateThis && (
                            <span style={{ 
                              marginLeft: '0.5rem',
                              color: '#007bff',
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}>
                              {isExpanded ? '▲ Less' : '▼ More'}
                            </span>
                          )}
                        </div>
                        <div style={{ 
                          fontSize: '0.7rem', 
                          color: '#999',
                          marginTop: '0.3rem'
                        }}>
                          {new Date(output.timestamp).toLocaleTimeString()}
                          {shouldTruncateThis && (
                            <span style={{ marginLeft: '0.5rem', color: '#666' }}>
                              ({output.content?.length || 0} chars)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default ClaudeAssistant