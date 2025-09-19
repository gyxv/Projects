class SquidGameBridge {
    constructor() {
        this.currentScreen = 'start';
        this.gameState = {
            totalRows: 0,
            currentRow: 0,
            playerPosition: { row: -1, side: 0 }, // side: 0 = left, 1 = right
            decisionsUsed: 0,
            maxDecisions: 0,
            completedRows: 0,
            bridge: [], // Array of rows, each row has [leftTile, rightTile] with safe/broken status
            gameMode: 'manual',
            timeLimit: 300, // seconds (5 minutes)
            timeRemaining: 300,
            isPaused: false,
            gameTimer: null,
            firstTrySuccesses: 0,
            rowsAttempted: 0,
            panelCollapsed: false,
            showRowNumbers: true,
            rowsSolved: 0, // Track how many rows have been solved
            decisionTimes: [], // Track time taken for each decision
            gameStartTime: null,
            timeoutPeriod: 10, // seconds
            isTimeoutActive: false,
            timeoutTimer: null,
            tilesPerRow: 2,
            lastDecisionTime: null,
            showSuccessProbability: false,
            initialTimePerDecision: 5,
            initialTimeoutPeriod: 10
        };
        
        this.initializeEventListeners();
        this.showScreen('startScreen');
    }

    initializeEventListeners() {
        // Mode switching
        document.getElementById('manualMode').addEventListener('click', () => this.switchMode('manual'));
        document.getElementById('autoMode').addEventListener('click', () => this.switchMode('auto'));
        
        // Game controls
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('resetGame').addEventListener('click', () => this.resetGame());
        document.getElementById('backToSetup').addEventListener('click', () => this.backToSetup());
        document.getElementById('pauseGame').addEventListener('click', () => this.togglePause());
        
        // Input listeners for real-time calculations
        document.getElementById('calculateManual').addEventListener('click', () => this.calculateManualSuccess());
        document.getElementById('timePerDecisionManual').addEventListener('input', () => this.hideManualResult());
        document.getElementById('timeoutPeriodManual').addEventListener('input', () => this.hideManualResult());
        document.getElementById('timePerDecision').addEventListener('input', () => this.updateAutoCalculation());
        document.getElementById('timeoutPeriod').addEventListener('input', () => this.updateAutoCalculation());
        document.getElementById('successChance').addEventListener('input', () => this.updateAutoCalculation());
        document.getElementById('timeLimit').addEventListener('input', () => {
            if(this.gameState.gameMode === 'auto') this.updateAutoCalculation();
        });
        
        // Sticky panel controls
        document.getElementById('panelToggle').addEventListener('click', () => this.togglePanel());
        document.querySelector('.panel-header').addEventListener('click', () => this.togglePanel());
        document.getElementById('showRowNumbers').addEventListener('change', () => this.toggleRowNumbers());
        document.getElementById('scrollToBottom').addEventListener('click', () => this.scrollToCurrentRow());
        
        // Tile selection controls
        document.querySelectorAll('.tile-option').forEach(option => {
            option.addEventListener('click', () => this.selectTilesPerRow(parseInt(option.dataset.tiles)));
        });
        
        // Success probability toggle
        document.getElementById('showSuccessProbability').addEventListener('change', () => this.toggleSuccessProbability());
    }

    switchMode(mode) {
        this.gameState.gameMode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(mode + 'Mode').classList.add('active');
        
        if (mode === 'manual') {
            document.getElementById('manualSetup').classList.remove('hidden');
            document.getElementById('autoSetup').classList.add('hidden');
            // Hide the success rate display when switching to manual
            document.getElementById('estimatedSuccess').classList.add('hidden');
        } else {
            document.getElementById('manualSetup').classList.add('hidden');
            document.getElementById('autoSetup').classList.remove('hidden');
            this.updateAutoCalculation();
        }
    }

    // Standardized probability calculation used across all modes
    calculateSuccessProbability(rows, timePerDecision, timeoutPeriod, timeLimit, tilesPerRow) {
        const successRate = 1 / tilesPerRow;
        
        // Calculate minimum time needed for all decisions
        const minTimeForDecisions = rows * timePerDecision;
        
        // If not enough time for basic decisions, probability is 0
        if (minTimeForDecisions > timeLimit) {
            return 0;
        }
        
        // Calculate expected wrong attempts and timeout time
        const expectedWrongAttempts = rows * (1 - successRate);
        const expectedTimeoutTime = expectedWrongAttempts * timeoutPeriod;
        const totalExpectedTime = minTimeForDecisions + expectedTimeoutTime;
        
        // If expected time exceeds limit, calculate constrained probability
        if (totalExpectedTime > timeLimit) {
            const availableTimeoutTime = timeLimit - minTimeForDecisions;
            const maxWrongAttempts = Math.floor(availableTimeoutTime / timeoutPeriod);
            
            if (maxWrongAttempts < 0) return 0;
            
            // Use binomial probability for success within constraint
            return this.calculateBinomialProbability(rows, successRate, maxWrongAttempts) * 100;
        }
        
        // Enough time for expected performance - high probability
        const buffer = timeLimit / totalExpectedTime;
        return Math.min(100, buffer * 85); // 85% max for realistic expectation
    }
    
    // Calculate number of rows needed for target success rate
    calculateOptimalRows(timePerDecision, timeoutPeriod, timeLimit, successRate, tilesPerRow) {
        // Binary search for optimal number of rows
        let low = 1, high = 200;
        let bestRows = 1;
        
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const probability = this.calculateSuccessProbability(mid, timePerDecision, timeoutPeriod, timeLimit, tilesPerRow);
            
            if (probability >= successRate) {
                bestRows = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        
        return bestRows;
    }
    
    // Helper function for binomial coefficient
    binomialCoefficient(n, k) {
        if (k > n) return 0;
        if (k === 0 || k === n) return 1;
        
        let result = 1;
        for (let i = 0; i < k; i++) {
            result = result * (n - i) / (i + 1);
        }
        return result;
    }
    
    calculateManualSuccess() {
        const rows = parseInt(document.getElementById('manualRows').value) || 28;
        const timePerDecision = parseInt(document.getElementById('timePerDecisionManual').value) || 5;
        const timeoutPeriod = parseInt(document.getElementById('timeoutPeriodManual').value) || 10;
        const timeLimit = parseFloat(document.getElementById('timeLimit').value) * 60; // Convert to seconds
        
        const successRate = this.calculateSuccessProbability(rows, timePerDecision, timeoutPeriod, timeLimit, this.gameState.tilesPerRow);
        document.getElementById('estimatedSuccess').textContent = `${successRate.toFixed(2)}%`;
        document.getElementById('estimatedSuccess').classList.remove('hidden');
    }
    
    hideManualResult() {
        document.getElementById('estimatedSuccess').classList.add('hidden');
    }
    
    updateAutoCalculation() {
        const timePerDecision = parseInt(document.getElementById('timePerDecision').value) || 5;
        const timeoutPeriod = parseInt(document.getElementById('timeoutPeriod').value) || 10;
        const successRate = parseFloat(document.getElementById('successChance').value) || 70;
        const timeLimit = parseFloat(document.getElementById('timeLimit').value) * 60; // Convert to seconds
        
        const actualRows = this.calculateOptimalRows(timePerDecision, timeoutPeriod, timeLimit, successRate, this.gameState.tilesPerRow);
        const displayRows = Math.min(actualRows, 200);
        
        document.getElementById('calculatedRows').textContent = `${displayRows} rows`;
        
        // Show actual calculation if it exceeds 200
        const actualCalcElement = document.getElementById('actualCalculation');
        if (actualRows > 200) {
            actualCalcElement.textContent = `(Actual calculation: ${actualRows} rows, capped at 200)`;
            actualCalcElement.classList.remove('hidden');
        } else {
            actualCalcElement.classList.add('hidden');
        }
    }

    startGame() {
        console.log('startGame called');
        let rows;
        const timeLimit = parseFloat(document.getElementById('timeLimit').value) * 60; // Convert to seconds
        
        if (this.gameState.gameMode === 'manual') {
            rows = parseInt(document.getElementById('manualRows').value) || 16;
            this.gameState.timeoutPeriod = parseInt(document.getElementById('timeoutPeriodManual').value) || 10;
            this.gameState.initialTimePerDecision = parseInt(document.getElementById('timePerDecisionManual').value) || 5;
            this.gameState.initialTimeoutPeriod = this.gameState.timeoutPeriod;
        } else {
            console.log('Auto mode selected');
            const timePerDecision = parseInt(document.getElementById('timePerDecision').value) || 5;
            const timeoutPeriod = parseInt(document.getElementById('timeoutPeriod').value) || 10;
            const successRate = parseFloat(document.getElementById('successChance').value) || 70;
            
            console.log('Calculating optimal rows with:', { timePerDecision, timeoutPeriod, timeLimit, successRate, tilesPerRow: this.gameState.tilesPerRow });
            rows = Math.min(this.calculateOptimalRows(timePerDecision, timeoutPeriod, timeLimit, successRate, this.gameState.tilesPerRow), 200);
            console.log('Calculated rows:', rows);
            this.gameState.timeoutPeriod = timeoutPeriod;
            this.gameState.initialTimePerDecision = timePerDecision;
            this.gameState.initialTimeoutPeriod = timeoutPeriod;
        }
        
        console.log('About to initialize game with rows:', rows);
        this.initializeGame(rows, timeLimit);
        console.log('About to show game screen');
        this.showScreen('gameScreen');
    }

    initializeGame(totalRows, timeLimit) {
        // Clear any existing timer
        if (this.gameState.gameTimer) {
            clearInterval(this.gameState.gameTimer);
        }
        
        this.gameState = {
            ...this.gameState,
            totalRows: totalRows,
            currentRow: 0,
            playerPosition: { row: -1, tileIndex: 0 },
            decisionsUsed: 0,
            maxDecisions: Math.floor(timeLimit / 5), // Assuming 5 seconds per decision for max calculation
            completedRows: 0,
            bridge: [],
            timeLimit: timeLimit,
            timeRemaining: timeLimit,
            isPaused: false,
            firstTrySuccesses: 0,
            rowsAttempted: 0,
            rowsSolved: 0,
            decisionTimes: [],
            gameStartTime: Date.now(),
            isTimeoutActive: false,
            lastDecisionTime: Date.now(),
            initialTimePerDecision: this.gameState.initialTimePerDecision,
            initialTimeoutPeriod: this.gameState.initialTimeoutPeriod
        };
        
        // Generate bridge configuration based on tiles per row
        for (let i = 0; i < totalRows; i++) {
            const tilesPerRow = this.gameState.tilesPerRow;
            const safeTile = Math.floor(Math.random() * tilesPerRow);
            
            const rowConfig = {
                safeTile: safeTile, // Which tile index is safe (0, 1, 2, 3)
                tilesPerRow: tilesPerRow,
                revealed: new Array(tilesPerRow).fill(false),
                used: new Array(tilesPerRow).fill(false),
                firstTryRow: true,
                solved: false
            };
            
            this.gameState.bridge.push(rowConfig);
        }
        
        this.startTimer();
        this.renderBridge();
        this.updateGameInfo();
        this.showStickyPanel();
        this.updateRowNumbers();
    }

    renderBridge() {
        const container = document.getElementById('bridgeContainer');
        container.innerHTML = '';
        
        // Render from top to bottom (furthest to nearest)
        for (let i = this.gameState.totalRows - 1; i >= 0; i--) {
            const row = document.createElement('div');
            row.className = 'bridge-row';
            row.dataset.row = i;
            
            // Add row number if enabled
            if (this.gameState.showRowNumbers) {
                const rowNumber = document.createElement('div');
                rowNumber.className = 'row-number';
                const displayRowNumber = this.gameState.totalRows - i;
                rowNumber.textContent = displayRowNumber;
                
                // Highlight current row
                if (i === this.gameState.currentRow) {
                    rowNumber.classList.add('current');
                }
                
                row.appendChild(rowNumber);
            }
            
            // Create tiles based on tilesPerRow
            const tilesPerRow = this.gameState.tilesPerRow;
            for (let tileIndex = 0; tileIndex < tilesPerRow; tileIndex++) {
                const tile = this.createTile(i, tileIndex);
                row.appendChild(tile);
            }
            
            container.appendChild(row);
        }
        
        // Add starting position indicator
        this.updatePlayerPosition();
    }

    createTile(row, tileIndex) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.row = row;
        tile.dataset.tileIndex = tileIndex;
        
        const rowData = this.gameState.bridge[row];
        const isRevealed = rowData.revealed[tileIndex];
        const isUsed = rowData.used[tileIndex];
        const isSafe = rowData.safeTile === tileIndex;
        
        if (isUsed && !isRevealed) {
            // Tile was used but broken - show skull icon
            tile.classList.add('shattered');
            tile.textContent = '💀';
        } else if (isRevealed) {
            tile.classList.add(isSafe ? 'safe' : 'broken');
            tile.textContent = isSafe ? '✓' : '✗';
        } else {
            // Set tile labels based on number of tiles
            const tileLabels = {
                2: ['L', 'R'],
                3: ['L', 'M', 'R'],
                4: ['1', '2', '3', '4']
            };
            tile.textContent = tileLabels[rowData.tilesPerRow][tileIndex];
        }
        
        // Add click event
        tile.addEventListener('click', () => this.handleTileClick(row, tileIndex));
        
        return tile;
    }

    handleTileClick(row, tileIndex) {
        // Check if game is paused or tile already used
        if (this.gameState.isPaused) return;
        
        const rowData = this.gameState.bridge[row];
        const isUsed = rowData.used[tileIndex];
        
        if (isUsed) return; // Can't click already used tiles
        
        // Check if this is a valid move or if timeout is active
        if (!this.isValidMove(row, tileIndex) || this.gameState.isTimeoutActive) {
            return;
        }
        
        const isSafe = rowData.safeTile === tileIndex;
        const tileElement = document.querySelector(`[data-row="${row}"][data-tile-index="${tileIndex}"]`);
        
        // Only count as a decision if this row hasn't been solved yet
        if (!rowData.solved) {
            this.gameState.decisionsUsed++;
            
            // Track decision time (excluding timeout periods)
            const currentTime = Date.now();
            const actualDecisionTime = this.gameState.lastDecisionTime ? 
                (currentTime - this.gameState.lastDecisionTime) / 1000 : 
                (currentTime - this.gameState.gameStartTime) / 1000;
            
            if (!this.gameState.isTimeoutActive) {
                this.gameState.decisionTimes.push(actualDecisionTime);
            }
            this.gameState.lastDecisionTime = currentTime;
            
            // Track first try success rate
            if (rowData.firstTryRow) {
                this.gameState.rowsAttempted++;
                if (isSafe) {
                    this.gameState.firstTrySuccesses++;
                }
                rowData.firstTryRow = false;
            }
        }
        
        // Mark tile as used
        rowData.used[tileIndex] = true;
        
        if (isSafe) {
            // Safe tile - reveal and move player forward
            rowData.revealed[tileIndex] = true;
            
            // Mark row as solved
            if (!rowData.solved) {
                rowData.solved = true;
                this.gameState.rowsSolved++;
            }
            
            this.gameState.playerPosition = { row: row, tileIndex: tileIndex };
            this.gameState.currentRow = row + 1;
            
            if (row === this.gameState.totalRows - 1) {
                // Player reached the end! Show checkmark first, then success animation
                this.gameState.completedRows = this.gameState.totalRows;
                this.renderBridge();
                this.updateGameInfo();
                setTimeout(() => {
                    this.showWaveAnimation('success');
                    this.endGame(true);
                }, 500);
                return;
            }
        } else {
            // Broken tile - show shattering animation
            this.animateShatter(tileElement);
            
            // Mark row as solved (since they now know which tile is safe)
            if (!rowData.solved) {
                rowData.solved = true;
                this.gameState.rowsSolved++;
            }
            
            // Start timeout penalty
            this.startTimeoutPenalty();
        }
        
        this.renderBridge();
        this.updateGameInfo();
        this.updateDynamicProbability();
    }

    isValidMove(row, tileIndex) {
        const currentPos = this.gameState.playerPosition;
        
        // First move - can choose any tile in row 0
        if (currentPos.row === -1 && row === 0) {
            return true;
        }
        
        // Must be on the next row from current position
        if (row !== currentPos.row + 1) {
            return false;
        }
        
        // Can move to any tile in the next row (bridge jumping rule)
        return true;
    }

    updatePlayerPosition() {
        // Remove existing player indicators
        document.querySelectorAll('.tile').forEach(tile => {
            tile.classList.remove('player');
        });
        
        // Add player indicator to current position
        if (this.gameState.playerPosition.row >= 0) {
            const playerTile = document.querySelector(
                `[data-row="${this.gameState.playerPosition.row}"][data-tile-index="${this.gameState.playerPosition.tileIndex}"]`
            );
            if (playerTile) {
                playerTile.classList.add('player');
            }
        }
    }
    
    selectTilesPerRow(numTiles) {
        this.gameState.tilesPerRow = numTiles;
        
        // Update visual selection
        document.querySelectorAll('.tile-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-tiles="${numTiles}"]`).classList.add('active');
        
        // Update selected tiles display
        this.updateSelectedTilesDisplay(numTiles);
        
        // Recalculate if in auto mode
        if (this.gameState.gameMode === 'auto') {
            this.updateAutoCalculation();
        }
        
        // Hide manual result to force recalculation
        this.hideManualResult();
    }
    
    updateSelectedTilesDisplay(numTiles) {
        const preview = document.querySelector('.selected-preview');
        const label = document.querySelector('.selected-label');
        
        preview.innerHTML = '';
        
        const tileLabels = {
            2: ['L', 'R'],
            3: ['L', 'M', 'R'],
            4: ['1', '2', '3', '4']
        };
        
        tileLabels[numTiles].forEach(labelText => {
            const tile = document.createElement('div');
            tile.className = 'selected-tile';
            tile.textContent = labelText;
            preview.appendChild(tile);
        });
        
        label.textContent = `${numTiles} Tiles Per Row`;
    }
    
    toggleSuccessProbability() {
        this.gameState.showSuccessProbability = document.getElementById('showSuccessProbability').checked;
        const probabilityDisplay = document.getElementById('dynamicProbability');
        
        if (this.gameState.showSuccessProbability) {
            probabilityDisplay.classList.add('show');
            this.updateDynamicProbability();
        } else {
            probabilityDisplay.classList.remove('show');
        }
    }
    
    updateTimeoutGameTimer() {
        const timeoutTimerValue = document.getElementById('timeoutTimerValue');
        const minutes = Math.floor(this.gameState.timeRemaining / 60);
        const seconds = this.gameState.timeRemaining % 60;
        timeoutTimerValue.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateDynamicProbability() {
        if (!this.gameState.showSuccessProbability) return;
        
        const remainingRows = this.gameState.totalRows - this.gameState.currentRow;
        if (remainingRows <= 0) {
            document.getElementById('probabilityValue').textContent = '100%';
            return;
        }
        
        // Calculate current average decision time from actual gameplay
        let avgDecisionTime;
        if (this.gameState.decisionTimes.length > 1) {
            // Calculate time between decisions (excluding first absolute time)
            const timeDiffs = [];
            for (let i = 1; i < this.gameState.decisionTimes.length; i++) {
                timeDiffs.push(this.gameState.decisionTimes[i] - this.gameState.decisionTimes[i - 1]);
            }
            avgDecisionTime = timeDiffs.reduce((sum, time) => sum + time, 0) / timeDiffs.length;
        } else {
            // Use initial setting if no decisions made yet
            avgDecisionTime = this.gameState.initialTimePerDecision;
        }
        
        // Calculate minimum time needed with current decision speed
        const minTimeForDecisions = remainingRows * avgDecisionTime;
        
        // If not enough time for basic decisions, probability is 0
        if (minTimeForDecisions > this.gameState.timeRemaining) {
            document.getElementById('probabilityValue').textContent = '0.0%';
            return;
        }
        
        // Calculate expected wrong attempts and time for timeouts
        const successRatePerTile = 1 / this.gameState.tilesPerRow;
        const expectedWrongAttempts = remainingRows * (1 - successRatePerTile);
        const expectedTimeoutTime = expectedWrongAttempts * this.gameState.timeoutPeriod;
        const totalExpectedTime = minTimeForDecisions + expectedTimeoutTime;
        
        // If expected time exceeds remaining time, calculate constrained probability
        if (totalExpectedTime > this.gameState.timeRemaining) {
            // Calculate maximum wrong attempts possible with remaining time
            const availableTimeoutTime = this.gameState.timeRemaining - minTimeForDecisions;
            const maxWrongAttempts = Math.floor(availableTimeoutTime / this.gameState.timeoutPeriod);
            
            if (maxWrongAttempts < 0) {
                document.getElementById('probabilityValue').textContent = '0.0%';
                return;
            }
            
            // Use binomial probability for success within constraint
            const probability = this.calculateBinomialProbability(remainingRows, successRatePerTile, maxWrongAttempts);
            document.getElementById('probabilityValue').textContent = `${(probability * 100).toFixed(1)}%`;
        } else {
            // Enough time for expected performance
            const buffer = this.gameState.timeRemaining / totalExpectedTime;
            const probability = Math.min(100, buffer * successRatePerTile * 100);
            document.getElementById('probabilityValue').textContent = `${probability.toFixed(1)}%`;
        }
    }
    
    // Calculate binomial probability of succeeding with limited wrong attempts
    calculateBinomialProbability(trials, successRate, maxFailures) {
        let probability = 0;
        
        // Sum probability for 0 to maxFailures wrong attempts
        for (let failures = 0; failures <= Math.min(maxFailures, trials); failures++) {
            const successes = trials - failures;
            if (successes >= 0) {
                const binomCoeff = this.binomialCoefficient(trials, failures);
                const probThisOutcome = binomCoeff * 
                    Math.pow(1 - successRate, failures) * 
                    Math.pow(successRate, successes);
                probability += probThisOutcome;
            }
        }
        
        return Math.min(1, probability);
    }
    
    showWaveAnimation(type) {
        const waveAnimation = document.getElementById('waveAnimation');
        waveAnimation.className = `wave-animation show ${type}`;
        
        // Hide after animation completes
        setTimeout(() => {
            waveAnimation.classList.remove('show', type);
        }, 3000);
    }

    updateGameInfo() {
        document.getElementById('totalRows').textContent = this.gameState.totalRows;
        
        // Show "Finished!" if game is completed successfully
        if (this.gameState.completedRows === this.gameState.totalRows) {
            document.getElementById('currentRow').textContent = 'Congratulations, you won!';
        } else {
            document.getElementById('currentRow').textContent = this.gameState.currentRow + 1;
        }
        
        
        // Update first try success rate
        const firstTryRate = this.gameState.rowsAttempted > 0 
            ? Math.round((this.gameState.firstTrySuccesses / this.gameState.rowsAttempted) * 100)
            : 0;
        document.getElementById('firstTryRate').textContent = `${firstTryRate}%`;
        
        // Update average time per decision
        const avgTime = this.gameState.decisionTimes.length > 0
            ? this.gameState.decisionTimes.reduce((sum, time, index) => {
                if (index === 0) return time;
                return sum + (time - this.gameState.decisionTimes[index - 1]);
              }, 0) / this.gameState.decisionTimes.length
            : 0;
        document.getElementById('avgTimePerDecision').textContent = `${avgTime.toFixed(1)}s`;
        
        this.updatePlayerPosition();
        this.updateDynamicProbability();
    }

    endGame(success) {
        // Stop all timers
        if (this.gameState.gameTimer) {
            clearInterval(this.gameState.gameTimer);
        }
        if (this.gameState.timeoutTimer) {
            clearInterval(this.gameState.timeoutTimer);
        }
        
        // End any active timeout
        this.endTimeoutPenalty();
        
        // Show wave animation for time up (success animation handled separately)
        if (!success) {
            this.showWaveAnimation('failure');
        }
        
        // Show notification
        setTimeout(() => {
            this.showNotification(success ? '🎉 Success!' : '⏰ Time\'s Up!', success ? 'success' : 'failure');
        }, success ? 1000 : 500);
    }
    
    showNotification(message, type) {
        const notification = document.getElementById('gameNotification');
        notification.textContent = message;
        notification.className = `game-notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    startTimer() {
        this.updateTimerDisplay();
        this.gameState.gameTimer = setInterval(() => {
            if (!this.gameState.isPaused) {
                this.gameState.timeRemaining--;
                this.updateTimerDisplay();
                this.updateDynamicProbability();
                
                if (this.gameState.timeRemaining <= 0) {
                    this.endGame(false);
                }
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.gameState.timeRemaining / 60);
        const seconds = this.gameState.timeRemaining % 60;
        const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const timerElement = document.getElementById('gameTimer');
        timerElement.textContent = display;
        
        // Add warning class when time is low
        if (this.gameState.timeRemaining <= 30) {
            timerElement.classList.add('warning');
        } else {
            timerElement.classList.remove('warning');
        }
    }
    
    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        const pauseBtn = document.getElementById('pauseGame');
        pauseBtn.textContent = this.gameState.isPaused ? 'Resume' : 'Pause';
    }

    resetGame() {
        this.initializeGame(this.gameState.totalRows, this.gameState.timeLimit);
        this.showScreen('gameScreen');
    }

    backToSetup() {
        // Clear timers when going back to setup
        if (this.gameState.gameTimer) {
            clearInterval(this.gameState.gameTimer);
        }
        if (this.gameState.timeoutTimer) {
            clearInterval(this.gameState.timeoutTimer);
        }
        this.endTimeoutPenalty();
        this.hideStickyPanel();
        this.showScreen('startScreen');
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
    }
    
    // New methods for enhanced functionality
    animateShatter(tileElement) {
        tileElement.classList.add('shattering');
        setTimeout(() => {
            tileElement.classList.remove('shattering');
            this.renderBridge(); // Re-render to show skull
            this.updateGameInfo();
            this.updateRowNumbers();
        }, 2500); // Increased to 2.5 seconds for longer animation
    }
    
    showStickyPanel() {
        document.getElementById('stickyPanel').classList.add('show');
    }
    
    hideStickyPanel() {
        document.getElementById('stickyPanel').classList.remove('show');
    }
    
    togglePanel() {
        const content = document.getElementById('panelContent');
        const toggle = document.getElementById('panelToggle');
        
        this.gameState.panelCollapsed = !this.gameState.panelCollapsed;
        
        if (this.gameState.panelCollapsed) {
            content.classList.add('collapsed');
            toggle.textContent = '+';
        } else {
            content.classList.remove('collapsed');
            toggle.textContent = '−';
        }
    }
    
    startTimeoutPenalty() {
        this.gameState.isTimeoutActive = true;
        let timeLeft = this.gameState.timeoutPeriod;
        
        // Show timeout overlay
        const overlay = document.getElementById('timeoutOverlay');
        const countdown = document.getElementById('timeoutCountdown');
        const gameScreen = document.querySelector('.game-screen');
        
        overlay.classList.add('show');
        gameScreen.classList.add('timeout-active');
        countdown.textContent = timeLeft;
        
        // Show game timer during timeout
        const timeoutGameTimer = document.getElementById('timeoutGameTimer');
        timeoutGameTimer.classList.add('show');
        this.updateTimeoutGameTimer();
        
        // Start countdown
        this.gameState.timeoutTimer = setInterval(() => {
            timeLeft--;
            countdown.textContent = timeLeft;
            this.updateTimeoutGameTimer();
            
            if (timeLeft <= 0) {
                this.endTimeoutPenalty();
            }
        }, 1000);
    }
    
    endTimeoutPenalty() {
        this.gameState.isTimeoutActive = false;
        
        // Clear timer
        if (this.gameState.timeoutTimer) {
            clearInterval(this.gameState.timeoutTimer);
            this.gameState.timeoutTimer = null;
        }
        
        // Resume decision time tracking
        this.gameState.lastDecisionTime = Date.now();
        
        // Hide timeout overlay and game timer
        const overlay = document.getElementById('timeoutOverlay');
        const gameScreen = document.querySelector('.game-screen');
        const timeoutGameTimer = document.getElementById('timeoutGameTimer');
        
        overlay.classList.remove('show');
        gameScreen.classList.remove('timeout-active');
        timeoutGameTimer.classList.remove('show');
    }
    
    toggleRowNumbers() {
        this.gameState.showRowNumbers = document.getElementById('showRowNumbers').checked;
        this.updateRowNumbers();
    }
    
    updateRowNumbers() {
        // Re-render bridge to update row numbers
        this.renderBridge();
        this.updatePlayerPosition();
    }
    
    scrollToCurrentRow() {
        const currentRowElement = document.querySelector(`[data-row="${this.gameState.currentRow}"]`);
        if (currentRowElement) {
            currentRowElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        } else {
            // If no current row (game not started or completed), scroll to bottom
            const container = document.getElementById('bridgeContainer');
            container.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'end' 
            });
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SquidGameBridge();
});
