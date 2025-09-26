/**
 * Modoru App - Main application logic
 * Mobile-first audio recording app with rolling buffer
 */

class ModoruApp {
    constructor() {
        this.audioEngine = new AudioEngine();
        this.isRecording = false;
        this.isPaused = false;
        
        // DOM elements
        this.elements = {};
        this.initializeElements();
        
        // Waveform visualizer
        this.waveformVisualizer = null;
        
        // Manual selection state
        this.activeSelectionMode = null; // 'start', 'end', or null
        this.customStartTime = null;
        this.customEndTime = null;
        
        // Initialize the app
        this.initialize();
    }
    
    /**
     * Get and store references to DOM elements
     */
    initializeElements() {
        const elementIds = [
            'recordBtn', 'recordIcon', 'recordText', 'pauseBtn', 'pauseIcon', 'pauseText',
            'resumeBtn', 'resetBtn', 'pausedControls', 'refreshMemory',
            'statusIndicator', 'statusText', 'timeDisplay', 'bufferInfo', 'quickSaveSection',
            'settingsBtn', 'settingsPage', 'mainInterface', 'backBtn', 'modalOverlay',
            'modalMessage', 'filename', 'confirmSave', 'cancelSave', 'toast', 'bufferTime',
            'preset1_min', 'preset1_sec', 'preset2_min', 'preset2_sec', 'preset3_min', 'preset3_sec',
            'preset4_min', 'preset4_sec', 'preset5_min', 'preset5_sec', 'saveSettings',
            'resetSettings', 'audioVisualization', 'startPointBtn', 'endPointBtn',
            'clearPointsBtn', 'zoomInBtn', 'zoomOutBtn', 'manualSaveBtn', 'formatCheckbox', 'memoryUsage'
        ];
        
        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
        
        // Get save buttons
        this.elements.saveButtons = document.querySelectorAll('.save-btn:not(.manual-save)');
        this.elements.allSaveButtons = document.querySelectorAll('.save-btn');
    }
    
    /**
     * Initialize the application
     */
    async initialize() {
        // Initialize audio engine
        const audioInitialized = await this.audioEngine.initialize();
        if (!audioInitialized) {
            this.showToast('Failed to initialize audio. Please check your browser compatibility.', 'error');
            return;
        }
        
        // INITIAL STATE: Show only Record button (center-aligned)
        this.setInitialButtonState();
        
        // Set up audio engine callbacks
        this.audioEngine.onStatusChange = (status, message) => {
            this.updateRecordingStatus(status, message);
        };
        
        this.audioEngine.onTimeUpdate = (seconds) => {
            this.updateTimeDisplay(seconds);
        };
        
        this.audioEngine.onBufferUpdate = (current, max) => {
            this.updateBufferInfo(current, max);
        };
        
        this.audioEngine.onError = (message) => {
            this.showToast(message, 'error');
        };
        
        this.audioEngine.onAudioData = (audioData) => {
            if (this.waveformVisualizer) {
                this.waveformVisualizer.updateAudioData(audioData);
            }
        };
        
        // Initialize waveform visualizer
        this.waveformVisualizer = new WaveformVisualizer(
            'waveformCanvas', 'timeline', 'scrollTrack', 'scrollThumb'
        );
        
        // Initialize format toggle state (default to MP3)
        this.selectedFormat = 'mp3';
        this.elements.formatCheckbox.checked = true; // MP3 is default (checked)
        
        this.waveformVisualizer.onSelectionChange = (startTime, endTime) => {
            this.customStartTime = startTime;
            this.customEndTime = endTime;
            this.updateManualSaveButton();
        };
        
        // Main control buttons
        this.elements.recordBtn.addEventListener('click', () => {
            this.startRecording();
        });
        
        this.elements.pauseBtn.addEventListener('click', () => {
            this.pauseRecording();
        });
        
        this.elements.resumeBtn.addEventListener('click', () => {
            this.resumeRecording();
        });
        
        this.elements.resetBtn.addEventListener('click', () => {
            this.showResetConfirmation();
        });
        
        this.elements.refreshMemory.addEventListener('click', () => {
            this.refreshMemoryDisplay();
        });
        
        this.elements.settingsBtn.addEventListener('click', () => {
            this.showSettings();
        });
        
        this.elements.backBtn.addEventListener('click', () => {
            this.hideSettings();
        });
        
        // Save buttons
        this.elements.saveButtons.forEach(button => {
            button.addEventListener('click', () => {
                const duration = parseInt(button.dataset.duration, 10);
                if (!isNaN(duration)) {
                    this.showSaveConfirmation(duration);
                }
            });
        });
        
        // Manual save button
        this.elements.manualSaveBtn.addEventListener('click', () => {
            this.showManualSaveConfirmation();
        });
        // Set up audio visualization controls
        this.elements.startPointBtn.addEventListener('click', () => this.setSelectionMode('start'));
        this.elements.endPointBtn.addEventListener('click', () => this.setSelectionMode('end'));
        this.elements.clearPointsBtn.addEventListener('click', () => this.clearSelectionPoints());
        this.elements.zoomInBtn.addEventListener('click', () => this.waveformVisualizer.zoomIn());
        this.elements.zoomOutBtn.addEventListener('click', () => this.waveformVisualizer.zoomOut());
        this.elements.manualSaveBtn.addEventListener('click', () => this.showManualSaveConfirmation());
        
        // Set up format toggle
        this.elements.formatCheckbox.addEventListener('change', () => this.handleFormatToggle());
        
        // Settings save/reset
        this.elements.saveSettings.addEventListener('click', () => {
            this.saveSettings();
        });
        
        this.elements.resetSettings.addEventListener('click', () => {
            this.resetSettings();
        });
        
        // Modal actions
        this.elements.confirmSave.addEventListener('click', () => {
            this.confirmSave();
        });
        
        this.elements.cancelSave.addEventListener('click', () => {
            this.hideModal();
        });
        
        // Modal overlay click to close
        this.elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.modalOverlay) {
                this.hideModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return; // Don't interfere with input fields
            
            switch (e.key) {
                case ' ': // Spacebar to toggle recording
                    e.preventDefault();
                    if (this.isRecording) {
                        if (this.isPaused) {
                            this.resumeRecording();
                        } else {
                            this.pauseRecording();
                        }
                    } else {
                        this.startRecording();
                    }
                    break;
                case 'p': // P for pause/resume
                case 'P':
                    if (this.isRecording) {
                        if (this.isPaused) {
                            this.resumeRecording();
                        } else {
                            this.pauseRecording();
                        }
                    }
                    break;
                case 'Escape':
                    if (this.elements.modalOverlay.style.display !== 'none') {
                        this.hideModal();
                    } else if (this.elements.settingsPage.style.display !== 'none') {
                        this.hideSettings();
                    } else if (this.activeSelectionMode) {
                        this.setSelectionMode(null);
                    }
                    break;
            }
        });
        
        // Handle page visibility changes (important for mobile)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRecording) {
                // App is backgrounded while recording - this is fine, keep recording
                console.log('App backgrounded while recording - continuing...');
            }
        });
        
        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.audioEngine.cleanup();
        });
    }
    
    /**
     * Set initial button state (only Record button visible)
     */
    setInitialButtonState() {
        // INITIAL STATE: Only Record button visible and centered
        this.elements.recordBtn.style.display = 'block';
        this.elements.pauseBtn.style.display = 'none';
        this.elements.pausedControls.style.display = 'none';
        
        // Ensure clean state
        this.elements.pauseBtn.classList.remove('pulsating-red');
        
        // Hide recording-specific sections initially
        this.elements.quickSaveSection.style.display = 'none';
        this.elements.audioVisualization.style.display = 'none';
    }
    
    /**
     * Start audio recording
     */
    async startRecording() {
        try {
            await this.audioEngine.startRecording();
            this.isRecording = true;
            
            // RECORDING STATE: Show only Pause button (center-aligned)
            this.elements.recordBtn.style.display = 'none';
            this.elements.pauseBtn.style.display = 'block';
            this.elements.pausedControls.style.display = 'none';
            this.elements.pauseBtn.classList.add('pulsating-red');
            
            this.elements.quickSaveSection.style.display = 'block';
            this.elements.audioVisualization.style.display = 'block';
            
            // Reset waveform visualizer for fresh start
            this.waveformVisualizer.setBufferDuration(this.audioEngine.bufferTimeLimitMs);
            this.waveformVisualizer.updateAudioData([]); // Clear previous visualization
            
            // Clear any previous manual selections
            this.clearSelectionPoints();
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    }
    /**
     * Pause audio recording
     */
    pauseRecording() {
        this.audioEngine.pauseRecording();
        this.isPaused = true;
        
        // PAUSED STATE: Show only Resume and Reset buttons (horizontal)
        this.elements.pauseBtn.classList.remove('pulsating-red');
        this.elements.pauseBtn.style.display = 'none';
        this.elements.recordBtn.style.display = 'none';
        this.elements.pausedControls.style.display = 'block';
        
        this.showToast('Recording paused', 'info');
    }
    
    /**
     * Resume audio recording
     */
    resumeRecording() {
        this.audioEngine.resumeRecording();
        this.isPaused = false;
        
        // RESUMED STATE: Show only Pause button (center-aligned) 
        this.elements.pausedControls.style.display = 'none';
        this.elements.recordBtn.style.display = 'none';
        this.elements.pauseBtn.style.display = 'block';
        this.elements.pauseBtn.classList.add('pulsating-red');
        
        this.showToast('Recording resumed', 'success');
    }
    
    /**
     * Stop audio recording
     */
    stopRecording() {
        this.audioEngine.stopRecording();
        this.isRecording = false;
        this.isPaused = false;
        this.updateRecordButton();
        this.updatePauseButton();
        this.elements.audioVisualization.style.display = 'none';
    }
    
    /**
     * Update record button appearance
     */
    updateRecordButton() {
        this.elements.recordBtn.classList.remove('recording', 'paused');
        
        if (this.isRecording && !this.isPaused) {
            this.elements.recordBtn.classList.add('recording');
            this.elements.recordIcon.textContent = '⏹️';
            this.elements.recordText.textContent = 'Stop Recording';
            this.elements.pauseBtn.style.display = 'flex';
        } else if (this.isRecording && this.isPaused) {
            this.elements.recordBtn.classList.add('paused');
            this.elements.recordIcon.textContent = '⏹️';
            this.elements.recordText.textContent = 'Stop Recording';
            this.elements.pauseBtn.style.display = 'flex';
        } else {
            this.elements.recordIcon.textContent = '🕐↶';
            this.elements.recordText.textContent = 'Start Recording';
            this.elements.pauseBtn.style.display = 'none';
        }
    }
    
    /**
     * Update pause button appearance
     */
    updatePauseButton() {
        if (this.isPaused) {
            this.elements.pauseBtn.classList.add('active');
            this.elements.pauseIcon.textContent = '▶️';
            this.elements.pauseText.textContent = 'Resume';
        } else {
            this.elements.pauseBtn.classList.remove('active');
            this.elements.pauseIcon.textContent = '⏸️';
            this.elements.pauseText.textContent = 'Pause';
        }
    }
    
    /**
     * Update recording status display
     */
    updateRecordingStatus(status, message) {
        this.elements.statusText.textContent = message;
        
        if (status === 'recording') {
            this.elements.statusIndicator.classList.add('recording');
        } else {
            this.elements.statusIndicator.classList.remove('recording');
        }
    }
    
    /**
     * Update time display
     */
    updateTimeDisplay(seconds) {
        this.elements.timeDisplay.textContent = this.audioEngine.formatTime(seconds);
    }
    
    /**
     * Update buffer information display
     */
    updateBufferInfo(currentMinutes, maxMinutes) {
        const currentFormatted = this.audioEngine.formatBufferTime(currentMinutes);
        const maxFormatted = this.audioEngine.formatBufferTime(maxMinutes);
        this.elements.bufferInfo.textContent = `Buffer: ${currentFormatted} / ${maxFormatted}`;
        
        // Update save button states
        this.updateSaveButtonStates();
    }
    
    /**
     * Update save button states - keep all buttons enabled
     */
    updateSaveButtonStates() {
        // Always enable all save buttons - they will download whatever audio is available
        this.elements.saveButtons.forEach(button => {
            button.disabled = false;
        });
        
        this.updateManualSaveButton();
    }
    
    /**
     * Update manual save button state
     */
    updateManualSaveButton() {
        const hasSelection = this.customStartTime !== null && this.customEndTime !== null;
        if (this.elements.manualSaveBtn) {
            this.elements.manualSaveBtn.disabled = !hasSelection;
        }
    }
    
    /**
     * Show manual save confirmation
     */
    showManualSaveConfirmation() {
        if (this.customStartTime === null || this.customEndTime === null) {
            this.showToast('Please select start and end points first', 'error');
            return;
        }
        
        const duration = this.customEndTime - this.customStartTime;
        this.showSaveConfirmation(duration, true);
    }
    
    /**
     * Show save confirmation modal
     */
    showSaveConfirmation(duration, isManual = false) {
        const filename = this.audioEngine.generateFilename();
        this.elements.filename.value = filename;
        
        // Store duration and type for later use
        this.elements.modalOverlay.dataset.duration = duration.toString();
        this.elements.modalOverlay.dataset.isManual = isManual.toString();
        
        // Calculate actual export duration and estimated file size
        const availableDuration = this.audioEngine.getAvailableAudioDuration();
        const actualExportDuration = Math.min(duration, availableDuration);
        const estimatedSize = this.estimateFileSize(actualExportDuration, this.selectedFormat);
        
        // Show appropriate message with file size
        if (isManual) {
            this.elements.modalMessage.textContent = `Save selected audio (${this.formatTime(duration)}) as ${this.selectedFormat.toUpperCase()}?\n\nEstimated file size: ${estimatedSize}`;
        } else {
            const availableDuration = this.audioEngine.getAvailableAudioDuration();
            const actualDuration = Math.min(duration, availableDuration);
            
            if (actualExportDuration < duration) {
                this.elements.modalMessage.textContent = `Save last ${this.formatTime(actualExportDuration)} of audio as ${this.selectedFormat.toUpperCase()}? (${this.formatTime(duration)} requested, but only ${this.formatTime(actualExportDuration)} available)\n\nEstimated file size: ${estimatedSize}`;
            } else {
                this.elements.modalMessage.textContent = `Save last ${this.formatTime(duration)} of audio as ${this.selectedFormat.toUpperCase()}?\n\nEstimated file size: ${estimatedSize}`;
            }
        }
        
        this.showModal();
    }
    
    /**
     * Confirm save action
     */
    async confirmSave() {
        const filename = this.elements.filename.value || this.audioEngine.generateFilename();
        const duration = parseInt(this.elements.modalOverlay.dataset.duration, 10);
        const isManual = this.elements.modalOverlay.dataset.isManual === 'true';
        
        let success = false;
        
        if (isManual) {
            success = await this.audioEngine.saveCustomRangeAudio(
                this.customStartTime, 
                this.customEndTime, 
                filename
            );
        } else {
            // Pass the selected format to the audio engine
            success = await this.audioEngine.saveBufferAudio(duration, filename, this.selectedFormat);
        }
        
        if (success) {
            this.showToast('Audio saved successfully!', 'success');
        }
        
        this.hideModal();
    }
    
    /**
     * Show settings page
     */
    showSettings() {
        this.elements.settingsPage.style.display = 'block';
        this.elements.mainInterface.style.display = 'none';
    }
    
    /**
     * Hide settings page
     */
    hideSettings() {
        this.elements.settingsPage.style.display = 'none';
        this.elements.mainInterface.style.display = 'flex';
    }
    
    /**
     * Show modal
     */
    showModal() {
        this.elements.modalOverlay.style.display = 'flex';
        // Focus on filename input for easy editing
        setTimeout(() => this.elements.filename.select(), 100);
    }
    
    /**
     * Hide modal
     */
    hideModal() {
        this.elements.modalOverlay.style.display = 'none';
    }
    
    /**
     * Update settings UI with current values
     */
    updateSettingsUI() {
        this.elements.bufferTime.value = this.audioEngine.bufferTimeMinutes;
        
        const presets = this.audioEngine.getPresets();
        
        // Convert seconds to minutes and seconds for each preset
        for (let i = 0; i < 5; i++) {
            const totalSeconds = presets[i] || [30, 60, 120, 300, 600][i];
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            
            this.elements[`preset${i + 1}_min`].value = minutes;
            this.elements[`preset${i + 1}_sec`].value = seconds;
        }
    }
    
    /**
     * Update quick save buttons with current presets
     */
    updateQuickSaveButtons() {
        const presets = this.audioEngine.getPresets();
        
        this.elements.saveButtons.forEach((button, index) => {
            if (index < presets.length) {
                const duration = presets[index];
                button.dataset.duration = duration.toString();
                button.textContent = this.formatDuration(duration);
            }
        });
    }
    
    /**
     * Save settings
     */
    saveSettings() {
        try {
            // Validate and update buffer time
            const bufferTime = parseInt(this.elements.bufferTime.value);
            if (bufferTime < 5 || bufferTime > 120) {
                this.showToast('Buffer time must be between 5 and 120 minutes', 'error');
                return;
            }
            
            // Validate and collect presets (convert from minutes:seconds to total seconds)
            const presets = [];
            for (let i = 1; i <= 5; i++) {
                const minutes = parseInt(this.elements[`preset${i}_min`].value) || 0;
                const seconds = parseInt(this.elements[`preset${i}_sec`].value) || 0;
                const totalSeconds = (minutes * 60) + seconds;
                
                if (totalSeconds < 5 || totalSeconds > 3600) {
                    this.showToast(`Preset ${i} must be between 5 seconds and 60 minutes`, 'error');
                    return;
                }
                
                presets.push(totalSeconds);
            }
            
            // Save to audio engine
            this.audioEngine.updateBufferTime(bufferTime);
            
            // Load settings from localStorage
            this.loadSettings();
        
            // Update settings UI
            this.updateSettingsUI();
        
            // Initial update of save button states
            this.updateSaveButtonStates();
        
            // Start memory monitoring with simple interval
            setInterval(() => {
                if (this.audioEngine && this.elements.memoryUsage) {
                    const memoryMB = this.audioEngine.getBufferMemoryUsage();
                    const memoryText = this.elements.memoryUsage.querySelector('.memory-text');
                    if (memoryText) {
                        memoryText.textContent = `Buffer: ${memoryMB.toFixed(2)} MB`;
                    }
                }
            }, 500);
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }
    
    /**
     * Save settings and apply changes
     */
    saveSettings() {
        try {
            const bufferTime = parseInt(this.elements.bufferTime.value);
            if (bufferTime < 5 || bufferTime > 120) {
                this.showToast('Buffer time must be between 5 and 120 minutes', 'error');
                return;
            }
            
            // Update audio engine
            this.audioEngine.updateBufferTime(bufferTime);
            
            // Update waveform visualizer buffer duration
            if (this.waveformVisualizer) {
                this.waveformVisualizer.setBufferDuration(this.audioEngine.bufferTimeLimitMs);
            }
            
            this.hideSettings();
            this.showToast('Settings saved!', 'success');
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showToast('Failed to save settings', 'error');
        }
    }
    
    /**
     * Reset settings to default
     */
    resetSettings() {
        const defaultPresets = [30, 60, 120, 300, 600];
        
        this.elements.bufferTime.value = 20;
        
        // Reset to default values in minutes and seconds format
        const defaults = [
            { min: 0, sec: 30 },  // 30s
            { min: 1, sec: 0 },   // 1m
            { min: 2, sec: 0 },   // 2m
            { min: 5, sec: 0 },   // 5m
            { min: 10, sec: 0 }   // 10m
        ];
        
        for (let i = 0; i < 5; i++) {
            this.elements[`preset${i + 1}_min`].value = defaults[i].min;
            this.elements[`preset${i + 1}_sec`].value = defaults[i].sec;
        }
        
        this.showToast('Settings reset to default values', 'success');
    }
    
    /**
     * Show manual save confirmation modal
     */
    showManualSaveConfirmation() {
        if (!this.customStartTime) {
            this.showToast('Please set a start point first', 'error');
            return;
        }
        
        const startTime = Math.floor(this.customStartTime);
        const endTime = this.customEndTime ? Math.floor(this.customEndTime) : 'now';
        
        let message;
        if (this.customEndTime) {
            const duration = Math.abs(this.customEndTime - this.customStartTime);
            message = `Save audio from ${this.formatTime(startTime)} to ${this.formatTime(endTime)} (${this.formatDuration(duration)})?`;
        } else {
            message = `Save audio from ${this.formatTime(startTime)} to now?`;
        }
        
        this.elements.modalMessage.textContent = message;
        
        // Generate default filename
        const defaultFilename = this.audioEngine.generateFilename();
        this.elements.filename.value = defaultFilename;
        
        // Mark as manual save
        this.elements.modalOverlay.dataset.isManual = 'true';
        
        this.showModal();
    }
    
    /**
     * Toggle selection mode for visualization
     */
    toggleSelectionMode(mode) {
        if (this.activeSelectionMode === mode) {
            // Turn off current mode
            this.setSelectionMode(null);
        } else {
            // Switch to new mode
            this.setSelectionMode(mode);
        }
    }
    
    /**
     * Set selection mode
     */
    setSelectionMode(mode) {
        this.activeSelectionMode = mode;
        
        // Update button states
        this.elements.startPointBtn.classList.toggle('active', mode === 'start');
        this.elements.endPointBtn.classList.toggle('active', mode === 'end');
        
        // Update visualizer
        this.waveformVisualizer.setActiveSelection(mode);
    }
    
    /**
     * Clear selection points
     */
    clearSelectionPoints() {
        this.waveformVisualizer.clearPoints();
        this.customStartTime = null;
        this.customEndTime = null;
        this.updateManualSaveButton();
        
        // Deselect any active selection mode
        this.setSelectionMode(null);
    }
    
    /**
     * Handle format toggle switch
     */
    handleFormatToggle() {
        this.selectedFormat = this.elements.formatCheckbox.checked ? 'mp3' : 'wav';
        console.log(`Audio format switched to: ${this.selectedFormat.toUpperCase()}`);
        
        // Show user feedback
        this.showToast(`Audio format: ${this.selectedFormat.toUpperCase()}`, 'success');
    }
    
    /**
     * Format time in seconds as MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * Format duration in seconds to human readable string for display
     */
    formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            if (remainingSeconds === 0) {
                return `${minutes}m`;
            } else {
                return `${minutes}m${remainingSeconds}s`;
            }
        } else {
            const hours = Math.floor(seconds / 3600);
            const remainingMinutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${remainingMinutes}m`;
        }
    }
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        this.elements.toast.textContent = message;
        this.elements.toast.className = `toast ${type}`;
        this.elements.toast.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            this.elements.toast.classList.remove('show');
        }, 3000);
    }
    
    /**
     * Refresh memory display manually
     */
    refreshMemoryDisplay() {
        const memoryMB = this.audioEngine.getBufferMemoryUsage();
        const memoryText = this.elements.memoryUsage.querySelector('.memory-text');
        if (memoryText) {
            memoryText.textContent = `Buffer: ${memoryMB.toFixed(2)} MB`;
        }
        this.showToast('Memory refreshed', 'success');
    }
    
    /**
     * Show reset confirmation dialog
     */
    showResetConfirmation() {
        if (confirm('Are you sure you want to reset the recording? This will clear all recorded audio and cannot be undone.')) {
            this.resetRecording();
        }
    }
    
    /**
     * Reset recording completely and start fresh
     */
    async resetRecording() {
        // First stop and reset the audio engine
        this.audioEngine.resetBuffer();
        
        // Reset state
        this.isRecording = false;
        this.isPaused = false;
        
        // Reset UI displays immediately
        this.elements.timeDisplay.textContent = '00:00:00';
        this.elements.bufferInfo.textContent = 'Buffer: 0s / 20m 0s';
        this.elements.statusText.textContent = 'Recording';
        this.elements.statusIndicator.className = 'status-indicator recording';
        
        // RESET STATE: Return to initial state with only Record button
        this.elements.pausedControls.style.display = 'none';
        this.elements.pauseBtn.style.display = 'none';
        this.elements.pauseBtn.classList.remove('pulsating-red');
        this.elements.recordBtn.style.display = 'block';
        
        // Reset status to initial state
        this.elements.statusText.textContent = 'Ready to Record';
        this.elements.statusIndicator.className = 'status-indicator';
        
        // Hide sections that should only show during recording
        this.elements.quickSaveSection.style.display = 'none';
        this.elements.audioVisualization.style.display = 'none';
        
        this.showToast('Recording reset - ready to record', 'success');
    }
    
    /**
     * Update memory usage display in header
     */
    updateMemoryDisplay() {
        const memoryUsageMB = this.audioEngine.getBufferMemoryUsage();
        const memoryText = this.elements.memoryUsage.querySelector('.memory-text');
        if (memoryText) {
            memoryText.textContent = `Buffer: ${memoryUsageMB.toFixed(2)} MB`;
        }
    }
    
    /**
     * Estimate file size for confirmation dialog
     */
    estimateFileSize(durationSeconds, format) {
        if (format === 'wav') {
            // WAV: ~1.4MB per minute (mono, 44.1kHz, 16-bit)
            const sizeBytes = durationSeconds * 44100 * 2; // 44.1kHz * 2 bytes per sample
            return this.formatFileSize(sizeBytes);
        } else if (format === 'mp3') {
            // MP3: ~1MB per minute at 128kbps
            const sizeBytes = (durationSeconds * 128 * 1000) / 8; // 128 kbps
            return this.formatFileSize(sizeBytes);
        }
        return 'Unknown';
    }
    
    /**
     * Format file size in human-readable format
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.modoru = new ModoruApp();
});

// Service Worker registration for PWA capabilities (future app conversion)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(error => {
                console.log('ServiceWorker registration failed');
            });
    });
}
