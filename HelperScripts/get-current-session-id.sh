#!/bin/bash

# Reliable Claude Code session ID detection
# Handles multiple Claude windows by using context matching

CLAUDE_DIR="$HOME/.claude/todos"
DEBUG=${DEBUG:-false}

debug() {
    if [ "$DEBUG" = "true" ]; then
        echo "[DEBUG] $1" >&2
    fi
}

if [ ! -d "$CLAUDE_DIR" ]; then
    echo "ERROR: Claude todos directory not found" >&2
    exit 1
fi

debug "Analyzing Claude session files..."

# If a specific todo content is provided as argument, use it for matching
MATCH_CONTENT="$1"

BEST_SESSION=""
BEST_SCORE=0

for file in "$CLAUDE_DIR"/*.json; do
    if [ ! -f "$file" ]; then
        continue
    fi
    
    session_id=$(basename "$file" | cut -c1-36)
    size=$(stat -c%s "$file" 2>/dev/null || echo "0")
    mod_time=$(stat -c%Y "$file" 2>/dev/null || echo "0")
    now=$(date +%s)
    age=$((now - mod_time))
    
    debug "Session $session_id: ${size}b, ${age}s old"
    
    # Skip empty or minimal files
    if [ "$size" -le 10 ]; then
        debug "  Skipping: too small"
        continue
    fi
    
    # Calculate score based on multiple factors
    score=0
    
    # Factor 1: Recent activity (within last 30 minutes gets points)
    if [ "$age" -lt 1800 ]; then
        recent_score=$((1800 - age))
        score=$((score + recent_score / 60))  # Convert to minutes
        debug "  Recent activity: +$((recent_score / 60)) points"
    fi
    
    # Factor 2: File size (more content = more likely to be active)
    size_score=$((size / 10))
    if [ "$size_score" -gt 100 ]; then
        size_score=100  # Cap it
    fi
    score=$((score + size_score))
    debug "  Content size: +${size_score} points"
    
    # Factor 3: Content matching (if provided)
    if [ -n "$MATCH_CONTENT" ]; then
        content=$(cat "$file" 2>/dev/null || echo "")
        if echo "$content" | grep -q "$MATCH_CONTENT"; then
            score=$((score + 1000))  # Big bonus for content match
            debug "  Content match: +1000 points"
        fi
    fi
    
    debug "  Total score: $score"
    
    if [ "$score" -gt "$BEST_SCORE" ]; then
        BEST_SCORE="$score"
        BEST_SESSION="$session_id"
        debug "  New best session: $session_id (score: $score)"
    fi
done

if [ -z "$BEST_SESSION" ]; then
    echo "ERROR: No active session found" >&2
    exit 1
fi

# Validate UUID format
if [[ $BEST_SESSION =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
    debug "Selected session: $BEST_SESSION (score: $BEST_SCORE)"
    echo "$BEST_SESSION"
else
    echo "ERROR: Invalid session ID format: $BEST_SESSION" >&2
    exit 1
fi