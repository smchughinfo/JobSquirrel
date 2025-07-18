import { useEffect, useRef, useState } from 'react';

export function useEventStream(url = '/api/events') {
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState(null);
    const eventSourceRef = useRef(null);
    const isConnectingRef = useRef(false);

    useEffect(() => {
        console.log('🔌 EventSource #1 enabled for testing');

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
                data.id = crypto.randomUUID();
                data.timestamp = new Date().toISOString();
                console.log(`📡 Event received:`, data);
                setLastEvent(data);
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