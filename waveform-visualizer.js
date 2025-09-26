/**
 * Waveform Visualizer - Advanced audio visualization with manual selection
 * Handles audio waveform rendering, zoom, navigation, and point selection
 */

class WaveformVisualizer {
    constructor(canvasId, timelineId, scrollTrackId, scrollThumbId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.timeline = document.getElementById(timelineId);
        this.scrollTrack = document.getElementById(scrollTrackId);
        this.scrollThumb = document.getElementById(scrollThumbId);
        
        // Waveform data
        this.audioData = [];
        this.bufferDurationMs = 20 * 60 * 1000; // 20 minutes default
        
        // View settings
        this.zoomLevel = 1;
        this.viewOffsetMs = 0;
        this.pixelsPerSecond = 4;
        
        // Selection points (in seconds from buffer start)
        this.startPoint = null; // Green line
        this.endPoint = null;   // Red line
        this.activeSelection = null; // 'start', 'end', or null
        
        // Event callbacks
        this.onPointSelect = null;
        this.onSelectionChange = null;
        
        // Interaction state
        this.isDragging = false;
        this.dragStartX = 0;
        this.isScrolling = false;
        
        this.setupEventListeners();
        this.setupCanvas();
    }
    
    /**
     * Set up canvas and resize handling
     */
    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    /**
     * Resize canvas to match display size
     */
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.render();
    }
    
    /**
     * Set up event listeners for interaction
     */
    setupEventListeners() {
        // Canvas interactions
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Scroll thumb dragging
        this.scrollThumb.addEventListener('mousedown', (e) => this.handleScrollStart(e));
        this.scrollTrack.addEventListener('click', (e) => this.handleScrollClick(e));
        
        document.addEventListener('mousemove', (e) => this.handleDocumentMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleDocumentMouseUp(e));
    }
    
    /**
     * Update audio data for visualization
     */
    updateAudioData(audioDataPoints) {
        this.audioData = audioDataPoints || [];
        
        // Force a render update
        requestAnimationFrame(() => {
            this.render();
            this.updateTimeline();
            this.updateScrollbar();
        });
    }
    
    /**
     * Set buffer duration in milliseconds
     */
    setBufferDuration(durationMs) {
        this.bufferDurationMs = durationMs;
        this.updateTimeline();
        this.render();
    }
    
    /**
     * Set active selection mode
     */
    setActiveSelection(mode) {
        this.activeSelection = mode; // 'start', 'end', or null
        this.canvas.style.cursor = mode ? 'crosshair' : 'default';
    }
    
    /**
     * Clear selection points
     */
    clearPoints(clearRed = true) {
        if (clearRed && this.endPoint !== null) {
            this.endPoint = null;
        } else if (this.startPoint !== null) {
            this.startPoint = null;
        }
        
        this.render();
        
        if (this.onSelectionChange) {
            this.onSelectionChange(this.startPoint, this.endPoint);
        }
    }
    
    /**
     * Get current selection in seconds
     */
    getSelection() {
        return {
            start: this.startPoint,
            end: this.endPoint
        };
    }
    
    /**
     * Zoom in/out
     */
    zoom(factor) {
        const oldZoom = this.zoomLevel;
        this.zoomLevel = Math.max(0.1, Math.min(10, this.zoomLevel * factor));
        
        // Adjust view offset to maintain center point
        const centerRatio = 0.5;
        const viewWidthMs = this.getViewWidthMs();
        this.viewOffsetMs = Math.max(0, Math.min(
            this.bufferDurationMs - viewWidthMs,
            this.viewOffsetMs + (viewWidthMs * centerRatio * (1 - factor))
        ));
        
        this.render();
        this.updateTimeline();
        this.updateScrollbar();
    }
    
    /**
     * Get view width in milliseconds
     */
    getViewWidthMs() {
        return (this.canvas.clientWidth / this.pixelsPerSecond / this.zoomLevel) * 1000;
    }
    
    /**
     * Convert canvas X coordinate to time in seconds
     */
    canvasXToTime(x) {
        const canvasWidth = this.canvas.clientWidth;
        const viewWidthMs = this.getViewWidthMs();
        const timeMs = this.viewOffsetMs + (x / canvasWidth) * viewWidthMs;
        return timeMs / 1000;
    }
    
    /**
     * Convert time in seconds to canvas X coordinate
     */
    timeToCanvasX(timeSeconds) {
        const timeMs = timeSeconds * 1000;
        const canvasWidth = this.canvas.clientWidth;
        const viewWidthMs = this.getViewWidthMs();
        return ((timeMs - this.viewOffsetMs) / viewWidthMs) * canvasWidth;
    }
    
    /**
     * Handle mouse down on canvas
     */
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        if (this.activeSelection) {
            // Set selection point
            const timeSeconds = this.canvasXToTime(x);
            
            if (this.activeSelection === 'start') {
                this.startPoint = Math.max(0, timeSeconds);
            } else if (this.activeSelection === 'end') {
                this.endPoint = Math.max(0, timeSeconds);
            }
            
            this.render();
            
            if (this.onSelectionChange) {
                this.onSelectionChange(this.startPoint, this.endPoint);
            }
        } else {
            // Start dragging for pan
            this.isDragging = true;
            this.dragStartX = x;
        }
    }
    
    /**
     * Handle mouse move on canvas
     */
    handleMouseMove(e) {
        if (this.isDragging) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const deltaX = x - this.dragStartX;
            
            // Pan view
            const viewWidthMs = this.getViewWidthMs();
            const deltaTimeMs = -(deltaX / this.canvas.clientWidth) * viewWidthMs;
            
            this.viewOffsetMs = Math.max(0, Math.min(
                this.bufferDurationMs - viewWidthMs,
                this.viewOffsetMs + deltaTimeMs
            ));
            
            this.dragStartX = x;
            this.render();
            this.updateTimeline();
            this.updateScrollbar();
        }
    }
    
    /**
     * Handle mouse up on canvas
     */
    handleMouseUp(e) {
        this.isDragging = false;
    }
    
    /**
     * Handle wheel for zooming
     */
    handleWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(zoomFactor);
    }
    
    /**
     * Handle touch events (mobile support)
     */
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1 && this.isDragging) {
            const touch = e.touches[0];
            this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.isDragging = false;
    }
    
    /**
     * Handle scroll thumb interactions
     */
    handleScrollStart(e) {
        e.preventDefault();
        this.isScrolling = true;
    }
    
    handleScrollClick(e) {
        const rect = this.scrollTrack.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = x / rect.width;
        
        const maxOffset = this.bufferDurationMs - this.getViewWidthMs();
        this.viewOffsetMs = Math.max(0, Math.min(maxOffset, ratio * this.bufferDurationMs));
        
        this.render();
        this.updateTimeline();
        this.updateScrollbar();
    }
    
    handleDocumentMouseMove(e) {
        if (this.isScrolling) {
            const rect = this.scrollTrack.getBoundingClientRect();
            const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
            const ratio = x / rect.width;
            
            const maxOffset = this.bufferDurationMs - this.getViewWidthMs();
            this.viewOffsetMs = Math.max(0, Math.min(maxOffset, ratio * this.bufferDurationMs));
            
            this.render();
            this.updateTimeline();
            this.updateScrollbar();
        }
    }
    
    handleDocumentMouseUp(e) {
        this.isScrolling = false;
        this.isDragging = false;
    }
    
    /**
     * Render the waveform
     */
    render() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);
        
        if (this.audioData.length === 0) {
            this.renderEmptyState(width, height);
            return;
        }
        
        this.renderWaveform(width, height);
        this.renderSelectionLines(width, height);
        this.renderSelectionArea(width, height);
    }
    
    /**
     * Render empty state
     */
    renderEmptyState(width, height) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Start recording to see waveform', width / 2, height / 2);
    }
    
    /**
     * Render waveform data
     */
    renderWaveform(width, height) {
        if (this.audioData.length === 0) return;
        
        // Use all available audio data for rendering
        const visibleData = [...this.audioData];
        
        if (visibleData.length === 0) return;
        
        // Clear and set up canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, width, height);
        
        // Calculate waveform bars
        const barWidth = Math.max(1, width / visibleData.length);
        
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.8)';
        
        visibleData.forEach((point, index) => {
            const x = (index / visibleData.length) * width;
            const amplitude = point.amplitude || 0;
            const barHeight = amplitude * (height - 10);
            const y = (height - barHeight) / 2;
            
            // Draw waveform bar
            this.ctx.fillRect(x, y, barWidth, barHeight);
        });
        
        // Add center line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, height / 2);
        this.ctx.lineTo(width, height / 2);
        this.ctx.stroke();
    }
    
    /**
     * Render selection lines (green start, red end)
     */
    renderSelectionLines(width, height) {
        // Green start line
        if (this.startPoint !== null) {
            const x = this.timeToCanvasX(this.startPoint);
            if (x >= 0 && x <= width) {
                this.ctx.strokeStyle = '#4CAF50';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([]);
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, height);
                this.ctx.stroke();
                
                // Add glow effect
                this.ctx.shadowColor = '#4CAF50';
                this.ctx.shadowBlur = 8;
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }
        }
        
        // Red end line
        if (this.endPoint !== null) {
            const x = this.timeToCanvasX(this.endPoint);
            if (x >= 0 && x <= width) {
                this.ctx.strokeStyle = '#f44336';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([]);
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, height);
                this.ctx.stroke();
                
                // Add glow effect
                this.ctx.shadowColor = '#f44336';
                this.ctx.shadowBlur = 8;
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }
        }
    }
    
    /**
     * Render selection area between start and end points
     */
    renderSelectionArea(width, height) {
        if (this.startPoint !== null && this.endPoint !== null) {
            const startX = this.timeToCanvasX(this.startPoint);
            const endX = this.timeToCanvasX(this.endPoint);
            
            if (startX < width && endX > 0) {
                const left = Math.max(0, Math.min(startX, endX));
                const right = Math.min(width, Math.max(startX, endX));
                
                this.ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
                this.ctx.fillRect(left, 0, right - left, height);
            }
        }
    }
    
    /**
     * Update timeline with time markers
     */
    updateTimeline() {
        this.timeline.innerHTML = '';
        
        const viewWidthMs = this.getViewWidthMs();
        const startTimeS = this.viewOffsetMs / 1000;
        const endTimeS = (this.viewOffsetMs + viewWidthMs) / 1000;
        
        // Create time markers
        const intervals = [1, 2, 5, 10, 15, 30, 60, 120, 300]; // seconds
        let interval = intervals.find(i => viewWidthMs / 1000 / i < 10) || 300;
        
        for (let time = Math.ceil(startTimeS / interval) * interval; time <= endTimeS; time += interval) {
            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
            marker.textContent = this.formatTime(time);
            
            const position = ((time - startTimeS) / (endTimeS - startTimeS)) * 100;
            marker.style.left = position + '%';
            
            this.timeline.appendChild(marker);
        }
    }
    
    /**
     * Update scrollbar position and size
     */
    updateScrollbar() {
        const viewWidthMs = this.getViewWidthMs();
        const scrollRatio = viewWidthMs / this.bufferDurationMs;
        const positionRatio = this.viewOffsetMs / this.bufferDurationMs;
        
        this.scrollThumb.style.width = (scrollRatio * 100) + '%';
        this.scrollThumb.style.left = (positionRatio * 100) + '%';
    }
    
    /**
     * Format time as MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}
