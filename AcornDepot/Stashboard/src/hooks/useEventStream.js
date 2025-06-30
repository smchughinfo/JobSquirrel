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

        // Somewhere outside the handler (module-level or component scope)
        const eventQueue = [];
        let processing = false;

        function processQueue() {
            if (processing || eventQueue.length === 0) return;
            processing = true;

            const nextEvent = eventQueue.shift();
            setLastEvent(nextEvent); // Replace this if you use setEvents([...prev, nextEvent])

            // Small delay between processing each event (tune this if needed)
            setTimeout(() => {
                processing = false;
                processQueue();
            }, 10); // 10ms delay; adjust if needed
        }

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                data.id = crypto.randomUUID();
                data.timestamp = new Date().toISOString();

                console.log(`📡 Event received:`, data);
                eventQueue.push(data);
                processQueue();

                // Logging switch block unchanged
                switch (data.type) {
                    case 'job-queued':
                        console.log(`🥜 ${data.message}`); break;
                    case 'job-started':
                        console.log(`⚙️ ${data.message}`); break;
                    case 'job-completed':
                        console.log(`✅ ${data.message}`); break;
                    case 'job-failed':
                        console.log(`❌ ${data.message}`); break;
                    case 'llm-processing-started':
                        console.log(`🧠 ${data.message}`); break;
                    case 'llm-processing-completed':
                        console.log(`🧠✅ ${data.message}`);
                        if (data.preview) console.log(`    Preview: ${data.preview}`);
                        break;
                    case 'clipboard-changed':
                        console.log(`📋 ${data.message}`); break;
                    case 'system-status':
                        console.log(`🐿️ ${data.message}`); break;
                    case 'connected':
                        console.log(`🔌 ${data.message}`); break;
                    case 'system':
                        console.log(`🔧 Claude: ${data.content || data.message || 'System event'}`); break;
                    case 'response':
                        console.log(`🤖 Claude: ${(data.content || '').substring(0, 100)}...`); break;
                    case 'response-line':
                        console.log(`💬 Claude: ${data.content || 'Response line'}`); break;
                    case 'complete':
                        console.log(`✅ Claude completed in ${data.duration}ms - $${data.cost?.toFixed(6)}`); break;
                    case 'error':
                        console.log(`❌ Claude error: ${data.content || data.message}`); break;
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