import { useEffect, useRef, useState } from 'react';

export function useEventStream(url = '/api/events') {
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState(null);
    const eventSourceRef = useRef(null);

    useEffect(() => {
        console.log('🔌 Connecting to event stream...');
        
        // Create EventSource connection
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            console.log('✅ Connected to event stream');
            setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log(`📡 Event received:`, data);
                setLastEvent(data);
                
                // Log different event types with appropriate emojis
                switch (data.type) {
                    case 'job-queued':
                        console.log(`🥜 ${data.message}`);
                        break;
                    case 'job-started':
                        console.log(`⚙️ ${data.message}`);
                        break;
                    case 'job-completed':
                        console.log(`✅ ${data.message}`);
                        break;
                    case 'job-failed':
                        console.log(`❌ ${data.message}`);
                        break;
                    case 'llm-processing-started':
                        console.log(`🧠 ${data.message}`);
                        break;
                    case 'llm-processing-completed':
                        console.log(`🧠✅ ${data.message}`);
                        if (data.preview) {
                            console.log(`    Preview: ${data.preview}`);
                        }
                        break;
                    case 'clipboard-changed':
                        console.log(`📋 ${data.message}`);
                        break;
                    case 'system-status':
                        console.log(`🐿️ ${data.message}`);
                        break;
                    case 'connected':
                        console.log(`🔌 ${data.message}`);
                        break;
                    default:
                        console.log(`📡 ${data.message || 'Unknown event'}`);
                }
            } catch (error) {
                console.error('❌ Failed to parse event data:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('❌ EventSource error:', error);
            setIsConnected(false);
        };

        // Cleanup on unmount
        return () => {
            console.log('🔌 Disconnecting from event stream...');
            eventSource.close();
            setIsConnected(false);
        };
    }, [url]);

    return {
        isConnected,
        lastEvent,
        disconnect: () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                setIsConnected(false);
            }
        }
    };
}