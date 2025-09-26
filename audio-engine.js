/**
 * AudioEngine - Handles all audio recording, buffering, and saving functionality
 * Designed for easy conversion to mobile app later
 */

class AudioEngine {
    constructor() {
        this.mediaRecorder = null;
        this.audioStream = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.startTime = null;
        
        // Buffer settings - loaded from localStorage or defaults
        this.bufferTimeMinutes = parseInt(localStorage.getItem('bufferTime')) || 20;
        this.bufferTimeLimitMs = this.bufferTimeMinutes * 60 * 1000;
        
        // Rolling buffer to store audio chunks with timestamps
        this.audioBuffer = [];
        this.bufferStartTime = null;
        
        // Settings
        this.presets = this.loadPresets();
        
        // Timer
        this.timerInterval = null;
        this.elapsedTime = 0;
        this.isPaused = false;
        
        // Audio analysis for waveform
        this.audioContext = null;
        this.analyser = null;
        this.audioData = [];
        
        // Events
        this.onStatusChange = null;
        this.onTimeUpdate = null;
        this.onBufferUpdate = null;
        this.onError = null;
        this.onAudioData = null;
    }
    
    /**
     * Initialize audio permissions and setup
     */
    async initialize() {
        try {
            // Check if browser supports required APIs
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Audio recording not supported in this browser');
            }
            
            if (!window.MediaRecorder) {
                throw new Error('MediaRecorder not supported in this browser');
            }
            
            return true;
        } catch (error) {
            console.error('Audio Engine initialization failed:', error);
            if (this.onError) this.onError(error.message);
            return false;
        }
    }
    
    /**
     * Start recording audio
     */
    async startRecording() {
        try {
            if (this.isRecording) return;
            
            // Reset audio buffer and data for fresh start
            this.audioBuffer = [];
            this.audioData = [];
            this.bufferStartTime = null;
            
            // Request microphone permission
            this.audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            // Set up audio context for waveform analysis
            this.setupAudioAnalysis();
            
            // Configure MediaRecorder with optimal settings
            const options = {
                mimeType: this.getSupportedMimeType(),
                audioBitsPerSecond: 128000
            };
            
            this.mediaRecorder = new MediaRecorder(this.audioStream, options);
            this.audioChunks = [];
            
            // Setup recording event handlers
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    const chunk = {
                        data: event.data,
                        timestamp: Date.now()
                    };
                    this.audioChunks.push(chunk);
                    this.addToBuffer(chunk);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.stopTimer();
                this.cleanupStream();
            };
            
            this.mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                if (this.onError) this.onError('Recording error occurred');
                this.stopRecording();
            };
            
            // Start recording with timeslices for rolling buffer approach
            this.mediaRecorder.start(1000); // 1-second timeslices for better muxing
            this.isRecording = true;
            this.startTime = Date.now();
            this.bufferStartTime = this.startTime;
            
            this.startTimer();
            
            if (this.onStatusChange) {
                this.onStatusChange('recording', 'Recording...');
            }
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            if (this.onError) {
                if (error.name === 'NotAllowedError') {
                    this.onError('Microphone permission denied. Please enable microphone access.');
                } else if (error.name === 'NotFoundError') {
                    this.onError('No microphone found. Please connect a microphone.');
                } else {
                    this.onError('Failed to start recording: ' + error.message);
                }
            }
            this.cleanupStream();
        }
    }
    
    /**
     * Pause recording audio
     */
    pauseRecording() {
        if (!this.isRecording || this.isPaused || !this.mediaRecorder) return;
        
        this.mediaRecorder.pause();
        this.isPaused = true;
        this.stopTimer();
        
        if (this.onStatusChange) {
            this.onStatusChange('paused', 'Recording paused');
        }
    }
    
    /**
     * Resume recording audio
     */
    resumeRecording() {
        if (!this.isRecording || !this.isPaused || !this.mediaRecorder) return;
        
        this.mediaRecorder.resume();
        this.isPaused = false;
        this.resumeTimer();
        
        if (this.onStatusChange) {
            this.onStatusChange('recording', 'Recording...');
        }
    }
    
    /**
     * Stop recording audio
     */
    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;
        
        this.isRecording = false;
        this.isPaused = false;
        this.mediaRecorder.stop();
        
        // Keep buffer and audio data intact for potential saves
        // (They will be reset on next startRecording call)
        
        if (this.onStatusChange) {
            this.onStatusChange('stopped', 'Recording stopped');
        }
    }
    
    /**
     * Add audio chunk to rolling timeslice buffer
     */
    addToBuffer(chunk) {
        // Add duration tracking for timeslice management
        const timestampedChunk = {
            data: chunk.data,
            timestamp: chunk.timestamp,
            duration: 1.0 // 1-second timeslices
        };
        
        this.audioBuffer.push(timestampedChunk);
        
        // Rolling buffer: remove old chunks beyond buffer limit
        const cutoffTime = Date.now() - this.bufferTimeLimitMs;
        this.audioBuffer = this.audioBuffer.filter(chunk => chunk.timestamp >= cutoffTime);
        
        console.log(`Rolling buffer: ${this.audioBuffer.length} chunks, ${this.getAvailableAudioDuration()}s`);
        
        // Update buffer info
        if (this.onBufferUpdate) {
            const bufferDurationMs = this.audioBuffer.length > 0 
                ? Date.now() - this.audioBuffer[0].timestamp 
                : 0;
            const bufferMinutes = Math.min(bufferDurationMs / (1000 * 60), this.bufferTimeMinutes);
            this.onBufferUpdate(bufferMinutes, this.bufferTimeMinutes);
        }
    }
    
    /**
     * Get audio from buffer with proper header handling
     */
    getBufferAudioSimple(durationSeconds) {
        if (this.audioBuffer.length === 0) {
            throw new Error('No audio in buffer');
        }
        
        const totalRecordedDuration = this.getAvailableAudioDuration();
        const requestedDuration = Math.min(durationSeconds, totalRecordedDuration);
        
        console.log(`Requested: ${requestedDuration}s from total: ${totalRecordedDuration}s, chunks: ${this.audioBuffer.length}`);
        
        // If requesting more or equal time than available, return all chunks
        if (requestedDuration >= totalRecordedDuration) {
            console.log('Returning all chunks (full duration)');
            return this.audioBuffer.map(chunk => chunk.data);
        }
        
        // For partial audio: ALWAYS include first chunk (headers) + selected recent chunks
        // This ensures we have a valid media container
        const chunksNeeded = Math.ceil(requestedDuration * 2); // 0.5s per chunk
        const recentStartIndex = Math.max(1, this.audioBuffer.length - chunksNeeded);
        
        const selectedChunks = [];
        
        // Always add the first chunk (contains essential headers)
        if (this.audioBuffer.length > 0) {
            selectedChunks.push(this.audioBuffer[0]);
            console.log('Added header chunk (index 0)');
        }
        
        // Add recent chunks for the actual content we want
        if (this.audioBuffer.length > 1) {
            const recentChunks = this.audioBuffer.slice(recentStartIndex);
            selectedChunks.push(...recentChunks);
            console.log(`Added ${recentChunks.length} recent chunks (from index ${recentStartIndex})`);
        }
        
        console.log(`Total selected chunks: ${selectedChunks.length}`);
        return selectedChunks.map(chunk => chunk.data);
    }
    
    /**
     * Save audio from buffer using format-specific approach
     */
    async saveBufferAudio(durationSeconds, filename, format = 'wav') {
        try {
            const totalRecordedDuration = this.getAvailableAudioDuration();
            const requestedDuration = Math.min(durationSeconds, totalRecordedDuration);
            
            console.log(`\n=== AUDIO SAVE (${format.toUpperCase()}) ===`);
            console.log(`Requested: ${durationSeconds}s, Available: ${totalRecordedDuration}s`);
            console.log(`Will save: ${requestedDuration}s in ${format.toUpperCase()} format`);
            
            if (format === 'wav') {
                return await this.saveAsWAV(requestedDuration, filename);
            } else if (format === 'mp3') {
                return await this.saveAsMP3(requestedDuration, filename);
            } else {
                throw new Error(`Unsupported format: ${format}`);
            }
            
        } catch (error) {
            console.error(`${format.toUpperCase()} save failed:`, error);
            if (this.onError) this.onError(error.message);
            return false;
        }
    }
    
    /**
     * Save as MP3 by creating WAV first then converting
     * Uses our reliable WAV approach as foundation
     */
    async saveAsMP3(durationSeconds, filename) {
        try {
            console.log(`MP3 Export: Creating from WAV (${durationSeconds}s)`);
            
            // Step 1: Create WAV data using our working method
            const wavBlob = await this.createWAVBlobFromBuffer(durationSeconds);
            
            console.log(`Created WAV blob: ${wavBlob.size} bytes`);
            
            // Step 2: Convert WAV to MP3 using Web Audio API + MediaRecorder
            const mp3Blob = await this.convertWAVToMP3(wavBlob);
            
            console.log(`Converted to MP3: ${mp3Blob.size} bytes`);
            
            // Step 3: Download the MP3 file
            this.downloadBlob(mp3Blob, filename, '.mp3');
            
            return true;
            
        } catch (error) {
            console.error('MP3 conversion failed:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            // Fallback: download as WAV if MP3 conversion fails
            console.log('MP3 failed, falling back to WAV...');
            return await this.saveAsWAV(durationSeconds, filename);
        }
    }
    
    /**
     * Advanced M4A remux approach (for WebM -> M4A conversion)
     */
    async saveAsM4ARemux(durationSeconds, filename) {
        try {
            console.log(`M4A Remux: Converting WebM to M4A for ${durationSeconds}s`);
            
            // Step 1: Collect chunks for duration
            const chunksForDuration = this.collectChunksForDuration(durationSeconds);
            if (chunksForDuration.length === 0) {
                throw new Error('No audio chunks available');
            }
            
            console.log(`Collected ${chunksForDuration.length} chunks for M4A remux`);
            
            // Step 2: Create full audio blob from collected chunks
            const audioChunks = chunksForDuration.map(chunk => chunk.data);
            const fullAudioBlob = new Blob(audioChunks, { type: this.getSupportedMimeType() });
            
            console.log(`Created combined blob: ${fullAudioBlob.size} bytes`);
            
            // Step 3: Decode to PCM using Web Audio API
            const arrayBuffer = await fullAudioBlob.arrayBuffer();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            console.log(`Decoded audio: ${audioBuffer.duration}s, ${audioBuffer.sampleRate}Hz`);
            
            // Step 4: Extract the last X seconds of PCM data
            const totalDuration = audioBuffer.duration;
            const requestedDuration = Math.min(durationSeconds, totalDuration);
            const samplesToTake = Math.floor((requestedDuration / totalDuration) * audioBuffer.length);
            const startSample = audioBuffer.length - samplesToTake;
            
            console.log(`Extracting last ${requestedDuration}s (${samplesToTake} samples from ${startSample})`);
            
            // Step 5: Re-encode to M4A using MediaRecorder
            const m4aBlob = await this.reencodeToM4A(audioBuffer, startSample, samplesToTake);
            
            console.log(`M4A remux complete: ${m4aBlob.size} bytes`);
            this.downloadBlob(m4aBlob, filename, '.m4a');
            
            audioContext.close();
            return true;
            
        } catch (error) {
            console.error('M4A remux failed:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                error: error
            });
            
            // Ultimate fallback: use simple approach even for WebM
            console.log('Remux failed, falling back to simple approach...');
            return await this.saveAsM4ASimple(durationSeconds, filename);
        }
    }
    
    /**
     * Re-encode PCM audio data to M4A format using MediaRecorder
     * This creates a fresh M4A container with proper indices
     */
    async reencodeToM4A(audioBuffer, startSample, sampleCount) {
        return new Promise((resolve, reject) => {
            try {
                // Create offline audio context for processing
                const offlineContext = new OfflineAudioContext(
                    1, // mono
                    sampleCount,
                    audioBuffer.sampleRate
                );
                
                // Create audio buffer source with extracted data
                const source = offlineContext.createBufferSource();
                const extractedBuffer = offlineContext.createBuffer(
                    1,
                    sampleCount,
                    audioBuffer.sampleRate
                );
                
                // Copy the specific sample range
                const sourceData = audioBuffer.getChannelData(0);
                const extractedData = extractedBuffer.getChannelData(0);
                for (let i = 0; i < sampleCount; i++) {
                    extractedData[i] = sourceData[startSample + i];
                }
                
                source.buffer = extractedBuffer;
                
                // Create MediaStreamDestination for re-encoding
                const destination = offlineContext.createMediaStreamDestination();
                source.connect(destination);
                
                // Set up MediaRecorder for M4A encoding
                const mimeType = 'audio/mp4;codecs=mp4a.40.2'; // Prefer M4A
                const recorder = new MediaRecorder(destination.stream, {
                    mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : this.getSupportedMimeType()
                });
                
                const chunks = [];
                recorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };
                
                recorder.onstop = () => {
                    const finalBlob = new Blob(chunks, { 
                        type: recorder.mimeType || 'audio/mp4' 
                    });
                    console.log(`Re-encoded to ${recorder.mimeType}: ${finalBlob.size} bytes`);
                    resolve(finalBlob);
                };
                
                recorder.onerror = (error) => {
                    console.error('Re-encoding failed:', error);
                    reject(error);
                };
                
                // Start recording and playback
                recorder.start();
                source.start(0);
                
                // Stop recording when audio finishes
                setTimeout(() => {
                    recorder.stop();
                }, (sampleCount / audioBuffer.sampleRate) * 1000 + 100); // Add 100ms buffer
                
            } catch (error) {
                console.error('Re-encoding setup failed:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
                reject(error);
            }
        });
    }
    
    /**
     * Collect audio chunks that cover the specified duration from the end
     */
    collectChunksForDuration(durationSeconds) {
        if (this.audioBuffer.length === 0) return [];
        
        // Start from the most recent chunk and work backwards
        let collectedDuration = 0;
        const selectedChunks = [];
        
        for (let i = this.audioBuffer.length - 1; i >= 0; i--) {
            const chunk = this.audioBuffer[i];
            selectedChunks.unshift(chunk); // Add to beginning to maintain order
            collectedDuration += chunk.duration;
            
            if (collectedDuration >= durationSeconds) {
                break;
            }
        }
        
        console.log(`Collected chunks spanning ${collectedDuration}s for ${durationSeconds}s request`);
        return selectedChunks;
    }
    
    /**
     * Create WAV blob from buffer (extracted from saveAsWAV for reuse)
     */
    async createWAVBlobFromBuffer(durationSeconds) {
        console.log('Creating WAV from rolling buffer...');
        
        // Create full audio blob from all chunks
        const allChunks = this.audioBuffer.map(chunk => chunk.data);
        const fullAudioBlob = new Blob(allChunks, { type: this.getSupportedMimeType() });
        
        // Convert to audio buffer for WAV processing
        const arrayBuffer = await fullAudioBlob.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Calculate sample range for requested duration
        const totalSamples = audioBuffer.length;
        const totalDuration = audioBuffer.duration;
        const requestedDuration = Math.min(durationSeconds, totalDuration);
        
        const samplesToTake = Math.floor((requestedDuration / totalDuration) * totalSamples);
        const startSample = totalSamples - samplesToTake;
        
        // Extract PCM data
        const channelData = audioBuffer.getChannelData(0); // Mono
        const extractedData = channelData.slice(startSample, startSample + samplesToTake);
        
        // Create WAV file
        const wavBlob = this.createWAVBlob(extractedData, audioBuffer.sampleRate);
        
        audioContext.close();
        return wavBlob;
    }
    
    /**
     * Convert WAV blob to MP3 using lamejs (proper MP3 encoding)
     */
    async convertWAVToMP3(wavBlob) {
        try {
            console.log('Converting WAV to MP3 using lamejs...');
            
            // Check if lamejs is available
            if (typeof lamejs === 'undefined') {
                throw new Error('lamejs MP3 encoder not loaded');
            }
            
            // Decode WAV to get PCM data
            const arrayBuffer = await wavBlob.arrayBuffer();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            console.log(`Encoding ${audioBuffer.duration}s audio to MP3...`);
            
            // Get PCM data (convert to 16-bit integers)
            const channelData = audioBuffer.getChannelData(0); // Mono
            const samples = new Int16Array(channelData.length);
            
            // Convert float32 samples to int16
            for (let i = 0; i < channelData.length; i++) {
                const sample = Math.max(-1, Math.min(1, channelData[i]));
                samples[i] = sample * 0x7FFF;
            }
            
            // Initialize MP3 encoder
            const mp3encoder = new lamejs.Mp3Encoder(
                1,                          // channels (mono)
                audioBuffer.sampleRate,     // sample rate
                128                         // bitrate (kbps)
            );
            
            console.log(`MP3 encoder initialized: ${audioBuffer.sampleRate}Hz, 128kbps`);
            
            // Encode to MP3 in chunks
            const mp3Data = [];
            const blockSize = 1152; // MP3 frame size
            
            for (let i = 0; i < samples.length; i += blockSize) {
                const sampleChunk = samples.subarray(i, i + blockSize);
                const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
                if (mp3buf.length > 0) {
                    mp3Data.push(mp3buf);
                }
            }
            
            // Finalize MP3 encoding
            const mp3buf = mp3encoder.flush();
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
            
            console.log(`MP3 encoding complete: ${mp3Data.length} chunks`);
            
            // Create MP3 blob
            const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
            
            console.log(`Created MP3 blob: ${mp3Blob.size} bytes`);
            audioContext.close();
            
            return mp3Blob;
            
        } catch (error) {
            console.error('MP3 conversion failed:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
    
    /**
     * Simple M4A approach - fallback method (DEPRECATED)
     * Uses same logic as WAV but outputs the native format
     */
    async saveAsM4ASimple(durationSeconds, filename) {
        try {
            console.log('Using simple M4A approach (fallback)');
            
            // Collect chunks for duration
            const chunksForDuration = this.collectChunksForDuration(durationSeconds);
            if (chunksForDuration.length === 0) {
                throw new Error('No audio chunks available');
            }
            
            console.log(`Simple M4A: Using ${chunksForDuration.length} chunks`);
            
            // Create blob with collected chunks and original MIME type
            const audioChunks = chunksForDuration.map(chunk => chunk.data);
            const mimeType = this.getSupportedMimeType();
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            
            console.log(`Simple M4A blob: ${audioBlob.size} bytes, type: ${mimeType}`);
            
            // Force M4A extension even if it's WebM content
            this.downloadBlob(audioBlob, filename, '.m4a');
            
            return true;
            
        } catch (error) {
            console.error('Simple M4A failed:', error);
            throw error;
        }
    }
    
    /**
     * Save as WAV (PCM) - emergency fallback format
     */
    async saveAsWAV(durationSeconds, filename) {
        try {
            console.log('Creating WAV from audio buffer...');
            
            // Create full audio blob first
            const allChunks = this.audioBuffer.map(chunk => chunk.data);
            const fullAudioBlob = new Blob(allChunks, { type: this.getSupportedMimeType() });
            
            // Convert to audio buffer for WAV processing
            const arrayBuffer = await fullAudioBlob.arrayBuffer();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Calculate sample range for requested duration
            const totalSamples = audioBuffer.length;
            const totalDuration = audioBuffer.duration;
            const requestedDuration = Math.min(durationSeconds, totalDuration);
            
            const samplesToTake = Math.floor((requestedDuration / totalDuration) * totalSamples);
            const startSample = totalSamples - samplesToTake;
            
            // Extract PCM data
            const channelData = audioBuffer.getChannelData(0); // Mono for simplicity
            const extractedData = channelData.slice(startSample, startSample + samplesToTake);
            
            // Create WAV file
            const wavBlob = this.createWAVBlob(extractedData, audioBuffer.sampleRate);
            
            console.log(`WAV created: ${wavBlob.size} bytes, ${requestedDuration}s`);
            this.downloadBlob(wavBlob, filename, '.wav');
            
            audioContext.close();
            return true;
            
        } catch (error) {
            console.error('WAV creation failed:', error);
            // Fallback to M4A if WAV fails
            console.log('Falling back to M4A format...');
            return await this.saveAsM4A(durationSeconds, filename);
        }
    }
    
    /**
     * Create WAV blob from PCM data
     */
    createWAVBlob(audioData, sampleRate) {
        const buffer = new ArrayBuffer(44 + audioData.length * 2);
        const view = new DataView(buffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + audioData.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, audioData.length * 2, true);
        
        // Convert float samples to 16-bit PCM
        let offset = 44;
        for (let i = 0; i < audioData.length; i++) {
            const sample = Math.max(-1, Math.min(1, audioData[i]));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }
        
        return new Blob([buffer], { type: 'audio/wav' });
    }
    
    
    /**
     * Download blob as file with specified extension
     */
    downloadBlob(blob, filename, extension = null) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename + (extension || this.getFileExtension());
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
    
    /**
     * Check if audio is available for the given duration
     */
    isAudioAvailable(durationSeconds) {
        return this.getAvailableAudioDuration() >= durationSeconds;
    }
    
    /**
     * Get current buffer memory usage in MB
     */
    getBufferMemoryUsage() {
        let totalBytes = 0;
        
        console.log(`Calculating memory usage for ${this.audioBuffer.length} chunks...`);
        
        // Calculate total size of all audio chunks in buffer
        this.audioBuffer.forEach((chunk, index) => {
            console.log(`Chunk ${index}:`, chunk);
            if (chunk && chunk.data) {
                const chunkSize = chunk.data.size || 0;
                totalBytes += chunkSize;
                console.log(`  - Chunk ${index} size: ${chunkSize} bytes`);
            }
        });
        
        // Also check audioChunks array if it exists
        if (this.audioChunks && this.audioChunks.length > 0) {
            console.log(`Also checking ${this.audioChunks.length} audioChunks...`);
            this.audioChunks.forEach((chunk, index) => {
                if (chunk && chunk.size) {
                    totalBytes += chunk.size;
                    console.log(`  - AudioChunk ${index} size: ${chunk.size} bytes`);
                }
            });
        }
        
        // Convert to MB and return
        const memoryMB = totalBytes / (1024 * 1024);
        console.log(`=== TOTAL BUFFER MEMORY: ${totalBytes} bytes = ${memoryMB.toFixed(2)} MB ===`);
        return memoryMB;
    }
    
    /**
     * Get available audio duration in seconds
     */
    getAvailableAudioDuration() {
        if (this.audioBuffer.length === 0) return 0;
        return (Date.now() - this.audioBuffer[0].timestamp) / 1000;
    }
    
    /**
     * Reset audio buffer completely
     */
    resetBuffer() {
        this.audioBuffer = [];
        this.elapsedTime = 0;
        this.bufferStartTime = null;
        
        // Stop recording if active
        if (this.recorder && this.recorder.state !== 'inactive') {
            this.recorder.stop();
        }
        
        // Reset timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        console.log('Audio buffer reset');
    }
    
    /**
     * Get supported MIME type for recording - debug all available types
     */
    getSupportedMimeType() {
        const types = [
            'audio/mp4;codecs=mp4a.40.2', // Try M4A first
            'audio/mp4',
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mpeg'
        ];
        
        console.log('Checking MediaRecorder MIME type support:');
        types.forEach(type => {
            const supported = MediaRecorder.isTypeSupported(type);
            console.log(`  ${type}: ${supported ? 'SUPPORTED' : 'not supported'}`);
        });
        
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                console.log(`Selected MIME type: ${type}`);
                return type;
            }
        }
        
        console.warn('No supported MIME types found, using fallback');
        return 'audio/webm';
    }
    
    /**
     * Get appropriate file extension based on actual MIME type
     */
    getFileExtension() {
        const mimeType = this.getSupportedMimeType();
        if (mimeType.includes('mp4')) {
            console.log('Using native M4A format');
            return '.m4a';
        }
        if (mimeType.includes('webm')) {
            console.log('Using WebM format (will attempt M4A conversion)');
            return '.webm'; // Use proper extension for now
        }
        if (mimeType.includes('ogg')) return '.ogg';
        if (mimeType.includes('mpeg')) return '.mp3';
        return '.webm';
    }
    
    /**
     * Generate filename with timestamp
     */
    generateFilename(prefix = 'Modoru_Recording') {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `${prefix}_${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    }
    
    /**
     * Start timer for recording duration
     */
    startTimer() {
        this.elapsedTime = 0;
        this.timerInterval = setInterval(() => {
            this.elapsedTime++;
            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.elapsedTime);
            }
        }, 1000);
    }
    
    /**
     * Resume timer without resetting elapsed time
     */
    resumeTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.timerInterval = setInterval(() => {
            this.elapsedTime++;
            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.elapsedTime);
            }
        }, 1000);
    }
    
    /**
     * Stop timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    /**
     * Format time in HH:MM:SS
     */
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * Cleanup audio stream
     */
    cleanupStream() {
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }
    }
    
    /**
     * Update buffer time setting
     */
    updateBufferTime(minutes) {
        this.bufferTimeMinutes = minutes;
        this.bufferTimeLimitMs = minutes * 60 * 1000;
        localStorage.setItem('bufferTime', minutes.toString());
        
        // Clean existing buffer based on new limit
        const cutoffTime = Date.now() - this.bufferTimeLimitMs;
        this.audioBuffer = this.audioBuffer.filter(chunk => chunk.timestamp >= cutoffTime);
    }
    
    /**
     * Load presets from localStorage
     */
    loadPresets() {
        const defaultPresets = [30, 60, 120, 300, 600]; // 30s, 1m, 2m, 5m, 10m
        const saved = localStorage.getItem('audioPresets');
        
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return Array.isArray(parsed) ? parsed : defaultPresets;
            } catch (e) {
                console.warn('Failed to parse saved presets, using defaults');
                return defaultPresets;
            }
        }
        
        return defaultPresets;
    }
    
    /**
     * Save presets to localStorage
     */
    savePresets(presets) {
        this.presets = presets;
        localStorage.setItem('audioPresets', JSON.stringify(presets));
    }
    
    /**
     * Get current presets
     */
    getPresets() {
        return [...this.presets];
    }
    
    /**
     * Setup audio analysis for waveform visualization
     */
    setupAudioAnalysis() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            
            const source = this.audioContext.createMediaStreamSource(this.audioStream);
            source.connect(this.analyser);
            
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;
            
            this.startAudioAnalysis();
        } catch (error) {
            console.warn('Audio analysis setup failed:', error);
        }
    }
    
    /**
     * Start continuous audio analysis
     */
    startAudioAnalysis() {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const timeDataArray = new Uint8Array(bufferLength);
        
        const analyze = () => {
            if (this.isRecording && !this.isPaused) {
                // Get both frequency and time domain data
                this.analyser.getByteFrequencyData(dataArray);
                this.analyser.getByteTimeDomainData(timeDataArray);
                
                // Calculate RMS from time domain data (better for waveform)
                let sum = 0;
                for (let i = 0; i < timeDataArray.length; i++) {
                    const sample = (timeDataArray[i] - 128) / 128; // Normalize to -1 to 1
                    sum += sample * sample;
                }
                const rms = Math.sqrt(sum / timeDataArray.length);
                
                // Also calculate peak amplitude
                let peak = 0;
                for (let i = 0; i < timeDataArray.length; i++) {
                    const amplitude = Math.abs((timeDataArray[i] - 128) / 128);
                    peak = Math.max(peak, amplitude);
                }
                
                // Store audio data with timestamp - use the higher value for better visualization
                const audioDataPoint = {
                    timestamp: Date.now(),
                    amplitude: Math.max(rms, peak * 0.5) // Use peak but scale it down
                };
                
                this.audioData.push(audioDataPoint);
                
                // Keep audio data within buffer time limit
                const cutoffTime = Date.now() - this.bufferTimeLimitMs;
                this.audioData = this.audioData.filter(data => data.timestamp >= cutoffTime);
                
                if (this.onAudioData) {
                    this.onAudioData(this.audioData);
                }
            }
            
            if (this.isRecording || this.isPaused) {
                requestAnimationFrame(analyze);
            }
        };
        
        analyze();
    }
    
    /**
     * Get audio data for visualization
     */
    getAudioData() {
        return [...this.audioData];
    }
    
    /**
     * Save audio from custom time range
     */
    async saveCustomRangeAudio(startTime, endTime, filename) {
        try {
            if (this.audioBuffer.length === 0) {
                throw new Error('No audio buffer available');
            }
            
            const totalRecordedDuration = this.getAvailableAudioDuration();
            const actualStartTime = Math.max(0, Math.min(startTime, totalRecordedDuration));
            const actualEndTime = endTime ? Math.min(endTime, totalRecordedDuration) : totalRecordedDuration;
            
            if (actualStartTime >= actualEndTime) {
                throw new Error('Invalid time range');
            }
            
            // Calculate chunk indices based on time proportions
            const totalChunks = this.audioBuffer.length;
            const startRatio = actualStartTime / totalRecordedDuration;
            const endRatio = actualEndTime / totalRecordedDuration;
            
            const startIndex = Math.floor(startRatio * totalChunks);
            const endIndex = Math.ceil(endRatio * totalChunks);
            
            const relevantChunks = this.audioBuffer.slice(startIndex, endIndex);
            
            if (relevantChunks.length === 0) {
                throw new Error('No audio available in the specified time range');
            }
            
            const audioBlob = new Blob(relevantChunks.map(chunk => chunk.data), { 
                type: this.getSupportedMimeType() 
            });
            
            // Create download link
            const url = URL.createObjectURL(audioBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename + this.getFileExtension();
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Cleanup
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            return true;
        } catch (error) {
            console.error('Failed to save custom range audio:', error);
            if (this.onError) this.onError(error.message);
            return false;
        }
    }
    
    /**
     * Format buffer time as "xm xs"
     */
    formatBufferTime(minutes) {
        const totalSeconds = Math.floor(minutes * 60);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}m ${secs}s`;
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        this.stopRecording();
        this.stopTimer();
        this.audioBuffer = [];
        this.audioChunks = [];
        this.audioData = [];
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}
