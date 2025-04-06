document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const lastUpdated = document.getElementById('lastUpdated');
    const refreshButton = document.getElementById('refreshButton');
    const heatmapContainer = document.getElementById('heatmap');
    const scorecardGrid = document.querySelector('.scorecard-grid');
    const uncertaintyGrid = document.querySelector('.uncertainty-grid');
    const remediationGrid = document.querySelector('.remediation-grid');

    // State
    let analysisData = null;
    let lastAnalysisTime = null;
    let autoRefreshInterval = null;
    const refreshInterval = 300000; // 5 minutes

    // Debug flag
    const DEBUG = true;

    // Debug logger
    function logDebug(...args) {
        if (DEBUG) {
            console.log('[Dashboard]', ...args);
        }
    }

    // Alerts functionality
    const alertsFeed = document.getElementById('alertsFeed');
    const filterButton = document.getElementById('filterButton');
    const settingsButton = document.getElementById('settingsButton');

    // Sample alerts data (in a real app, this would come from a WebSocket connection)
    const sampleAlerts = [
        {
            id: 1,
            title: 'AWS RDS misconfiguration',
            description: 'Public access enabled on production database',
            severity: 'high',
            timestamp: new Date(),
            unread: true
        },
        {
            id: 2,
            title: 'Missing encryption at rest',
            description: 'S3 bucket without server-side encryption',
            severity: 'medium',
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            unread: true
        },
        {
            id: 3,
            title: 'Incomplete audit logs',
            description: 'System logs missing user actions',
            severity: 'low',
            timestamp: new Date(Date.now() - 7200000), // 2 hours ago
            unread: false
        }
    ];

    // Initialize
    fetchAnalysisResults();
    startAutoRefresh();
    setupEventListeners();

    // Functions
    async function fetchAnalysisResults() {
        try {
            // Get the latest analysis results from session storage
            const sessionData = sessionStorage.getItem('analysisResults');
            
            if (!sessionData) {
                logDebug('No analysis data found in session storage');
                // For development, create some sample data
                if (DEBUG) {
                    analysisData = createSampleData();
                    updateDashboard(analysisData);
                }
                return;
            }
            
            logDebug('Analysis data found in session storage');
            analysisData = JSON.parse(sessionData);
            logDebug('Parsed data:', analysisData);
            
            lastAnalysisTime = new Date();
            
            // Update the UI with the fetched data
            updateDashboard(analysisData);
            
            // Update last updated time
            lastUpdated.textContent = 'Just now';
        } catch (error) {
            console.error('Error fetching analysis results:', error);
        }
    }

    function createSampleData() {
        return {
            document_analysis: {
                raw: {
                    status: "completed",
                    analysis: "Based on my analysis, the PSSI document has a compliance score of 78% with the ANSSI Hygiene Guide."
                },
                processed: {
                    score: 78,
                    tickets: [
                        {
                            title: "Missing encryption requirement",
                            description: "The PSSI does not specify encryption requirements.",
                            severity: "high",
                            auto_remediate: false
                        }
                    ],
                    issues: []
                }
            },
            infrastructure_analysis: {
                raw: {
                    status: "completed",
                    analysis: "The infrastructure compliance score is 65% based on AWS configurations."
                },
                processed: {
                    score: 65,
                    tickets: [],
                    issues: [
                        {
                            title: "S3 Bucket Misconfiguration",
                            description: "S3 buckets should have server-side encryption enabled",
                            severity: "medium",
                            auto_remediate: true
                        }
                    ]
                }
            }
        };
    }

    function updateDashboard(data) {
        if (!data) {
            logDebug('No data to update dashboard');
            return;
        }
        
        logDebug('Updating dashboard with data:', data);
        
        // Extract data from infrastructure and document analysis
        const docAnalysis = data.document_analysis || {};
        const infraAnalysis = data.infrastructure_analysis || {};
        
        // Clear existing content
        scorecardGrid.innerHTML = '';
        uncertaintyGrid.innerHTML = '';
        remediationGrid.innerHTML = '';
        
        // Update dashboard components with processed data
        updateComplianceScorecard(docAnalysis, infraAnalysis);
        updateUncertaintyFlags(docAnalysis, infraAnalysis);
        updateRemediationActions(docAnalysis, infraAnalysis);
        initializeHeatmap(data);
    }
    
    function updateComplianceScorecard(docAnalysis, infraAnalysis) {
        // Get scores from processed data
        const docScore = docAnalysis.processed ? docAnalysis.processed.score : 0;
        const infraScore = infraAnalysis.processed ? infraAnalysis.processed.score : 0;
        
        logDebug('Scores - Doc:', docScore, 'Infra:', infraScore);
        
        // Create scorecards
        const frameworks = [
            {
                id: 'anssi',
                name: 'ANSSI Hygiene',
                score: docScore,
                violations: docAnalysis.processed ? 
                    (docAnalysis.processed.tickets.length || 0) : 0
            },
            {
                id: 'infra',
                name: 'Infrastructure',
                score: infraScore,
                violations: infraAnalysis.processed ? 
                    (infraAnalysis.processed.issues.length || 0) : 0
            }
        ];
        
        frameworks.forEach(framework => {
            const card = createScorecardElement(framework);
            scorecardGrid.appendChild(card);
        });
    }

    function createScorecardElement(framework) {
        const scoreCardDiv = document.createElement('div');
        scoreCardDiv.className = 'scorecard';
        scoreCardDiv.dataset.framework = framework.id;
        
        // Set color based on score
        const scoreColor = framework.score >= 80 ? '#4CAF50' : 
                          framework.score >= 60 ? '#FFC107' : '#F44336';
        
        scoreCardDiv.innerHTML = `
            <div class="score-header">
                <h3>${framework.name}</h3>
                <div class="score-value" data-score="${framework.score}" style="background: ${scoreColor}; color: ${framework.score >= 60 && framework.score < 80 ? '#333' : 'white'}">
                    ${framework.score}%
                </div>
            </div>
            <div class="score-details">
                <div class="violations">
                    <span class="label">Policy Violations:</span>
                    <span class="value">${framework.violations}</span>
                </div>
                <button class="drill-down-button">View Details</button>
            </div>
        `;
        
        return scoreCardDiv;
    }
    
    function updateUncertaintyFlags(docAnalysis, infraAnalysis) {
        // Extract uncertainty flags - in a real implementation, these would come from processed data
        // For now, let's generate some based on the scores
        const docScore = docAnalysis.processed ? docAnalysis.processed.score : 0;
        const infraScore = infraAnalysis.processed ? infraAnalysis.processed.score : 0;
        
        const uncertainties = [];
        
        // If score is lower than 80, add an uncertainty flag
        if (docScore < 80) {
            uncertainties.push({
                title: 'ANSSI Compliance Gap',
                description: 'Some ANSSI requirements may not be properly addressed in the security policy',
                confidence: 75
            });
        }
        
        if (infraScore < 70) {
            uncertainties.push({
                title: 'Infrastructure Security Gaps',
                description: 'Infrastructure configurations may have security weaknesses that need addressing',
                confidence: 85
            });
        }
        
        logDebug('Generated uncertainties:', uncertainties);
        
        uncertainties.forEach(uncertainty => {
            const card = createUncertaintyElement(uncertainty);
            uncertaintyGrid.appendChild(card);
        });
        
        // If no uncertainties found, add a placeholder
        if (uncertainties.length === 0) {
            uncertaintyGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No uncertainty flags detected</p>
                </div>
            `;
        }
    }
    
    function createUncertaintyElement(uncertainty) {
        const card = document.createElement('div');
        card.className = 'uncertainty-card';
        
        const confidenceColor = uncertainty.confidence >= 70 ? '#4CAF50' : 
                               uncertainty.confidence >= 40 ? '#FFC107' : '#F44336';
        
        card.innerHTML = `
            <div class="uncertainty-header">
                <h3>${uncertainty.title}</h3>
                <div class="confidence-score" data-confidence="${uncertainty.confidence}" 
                     style="background: ${confidenceColor}; color: ${uncertainty.confidence >= 40 && uncertainty.confidence < 70 ? '#333' : 'white'}">
                    ${uncertainty.confidence}%
                </div>
            </div>
            <p class="uncertainty-description">
                ${uncertainty.description}
            </p>
            <div class="uncertainty-actions">
                <button class="review-button">
                    <i class="fas fa-user-check"></i>
                    Request Human Review
                </button>
                <button class="ignore-button">
                    <i class="fas fa-times"></i>
                    Ignore
                </button>
            </div>
        `;
        
        return card;
    }
    
    function updateRemediationActions(docAnalysis, infraAnalysis) {
        // Get remediation actions from both document and infrastructure analyses
        let remediation = [];
        
        // Add document analysis tickets
        if (docAnalysis.processed && docAnalysis.processed.tickets) {
            remediation = remediation.concat(
                docAnalysis.processed.tickets.map(ticket => ({
                    title: ticket.title,
                    description: ticket.description,
                    severity: ticket.severity,
                    canAutoRemediate: ticket.auto_remediate
                }))
            );
        }
        
        // Add infrastructure issues
        if (infraAnalysis.processed && infraAnalysis.processed.issues) {
            remediation = remediation.concat(
                infraAnalysis.processed.issues.map(issue => ({
                    title: issue.title,
                    description: issue.description,
                    severity: issue.severity,
                    canAutoRemediate: issue.auto_remediate
                }))
            );
        }
        
        logDebug('Remediation actions:', remediation);
        
        remediation.forEach(action => {
            const card = createRemediationElement(action);
            remediationGrid.appendChild(card);
        });
        
        // If no remediation actions found, add a placeholder
        if (remediation.length === 0) {
            remediationGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No remediation actions needed</p>
                </div>
            `;
        }
    }
    
    function createRemediationElement(action) {
        const card = document.createElement('div');
        card.className = 'remediation-card';
        
        card.innerHTML = `
            <div class="remediation-header">
                <h3>${action.title}</h3>
                <div class="severity ${action.severity}">${action.severity}</div>
            </div>
            <p class="remediation-description">
                ${action.description}
            </p>
            <div class="remediation-actions">
                <div class="auto-remediation-toggle">
                    <label class="toggle-switch">
                        <input type="checkbox" ${action.canAutoRemediate ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                    <span>Auto-remediate</span>
                </div>
                <button class="create-ticket-button" data-summary="${action.title}" data-description="${action.description}">
                    <i class="fab fa-jira"></i>
                    Create Jira Ticket
                </button>
            </div>
        `;
        
        return card;
    }
    
    function initializeHeatmap(data) {
        // Clear existing content
        heatmapContainer.innerHTML = '';
        
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        const width = heatmapContainer.clientWidth - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        // Create SVG
        const svg = d3.select('#heatmap')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Generate sample data based on real analysis
        const heatmapData = generateHeatmapData(data);

        // Create scales
        const x = d3.scaleBand()
            .range([0, width])
            .domain(heatmapData.map(d => d.framework))
            .padding(0.1);

        const y = d3.scaleBand()
            .range([height, 0])
            .domain(heatmapData.map(d => d.date))
            .padding(0.1);

        const color = d3.scaleLinear()
            .domain([0, 50, 100])
            .range(['#F44336', '#FFC107', '#4CAF50']);

        // Create heatmap cells
        svg.selectAll()
            .data(heatmapData)
            .enter()
            .append('rect')
            .attr('x', d => x(d.framework))
            .attr('y', d => y(d.date))
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .style('fill', d => color(d.score))
            .style('stroke', '#fff')
            .style('stroke-width', 1);

        // Add axes
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        svg.append('g')
            .call(d3.axisLeft(y));
    }

    function generateHeatmapData(data) {
        // Extract scores from processed data
        const docScore = data.document_analysis?.processed?.score || 0;
        const infraScore = data.infrastructure_analysis?.processed?.score || 0;
        
        const frameworks = ['ANSSI', 'Infrastructure', 'Combined'];
        const dates = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        });

        // Create realistic data with last entry being the real score
        return frameworks.flatMap(framework => 
            dates.map((date, i) => {
                let score;
                if (i === 0) {
                    // Today's data is the actual analysis score
                    if (framework === 'ANSSI') score = docScore;
                    else if (framework === 'Infrastructure') score = infraScore;
                    else score = Math.round((docScore + infraScore) / 2);
                } else {
                    // Historical data is randomly generated
                    const baseScore = framework === 'ANSSI' ? docScore : 
                                     framework === 'Infrastructure' ? infraScore : 
                                     Math.round((docScore + infraScore) / 2);
                    
                    // Vary by ±10 points for historical data
                    score = Math.max(0, Math.min(100, baseScore + Math.floor(Math.random() * 20) - 10));
                }
                
                return {
                    framework,
                    date,
                    score
                };
            })
        );
    }

    function startAutoRefresh() {
        // Clear any existing interval first
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }
        autoRefreshInterval = setInterval(fetchAnalysisResults, refreshInterval);
    }

    function stopAutoRefresh() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
    }

    function setupEventListeners() {
        // Manual refresh button
        refreshButton.addEventListener('click', () => {
            fetchAnalysisResults();
        });

        // Event delegation for dynamic elements
        document.addEventListener('click', (event) => {
            // Drill-down buttons
            if (event.target.classList.contains('drill-down-button') || 
                event.target.parentElement.classList.contains('drill-down-button')) {
                const button = event.target.classList.contains('drill-down-button') ? 
                              event.target : event.target.parentElement;
                const card = button.closest('.scorecard');
                const framework = card.dataset.framework;
                alert(`Showing detailed view for ${framework} framework`);
            }
            
            // Review buttons
            if (event.target.classList.contains('review-button') ||
                event.target.parentElement.classList.contains('review-button')) {
                const button = event.target.classList.contains('review-button') ? 
                              event.target : event.target.parentElement;
                const card = button.closest('.uncertainty-card');
                const title = card.querySelector('h3').textContent;
                alert(`Requesting human review for: ${title}`);
            }
            
            // Ignore buttons
            if (event.target.classList.contains('ignore-button') ||
                event.target.parentElement.classList.contains('ignore-button')) {
                const button = event.target.classList.contains('ignore-button') ? 
                              event.target : event.target.parentElement;
                const card = button.closest('.uncertainty-card');
                card.style.opacity = '0.5';
                setTimeout(() => card.remove(), 300);
            }
            
            // Create ticket buttons
            if (event.target.classList.contains('create-ticket-button') ||
                event.target.parentElement.classList.contains('create-ticket-button')) {
                const button = event.target.classList.contains('create-ticket-button') ? 
                              event.target : event.target.parentElement;
                const summary = button.dataset.summary;
                const description = button.dataset.description;
                
                createJiraTicket(summary, description);
            }
        });
        
        // Toggle switches
        document.addEventListener('change', (event) => {
            if (event.target.closest('.toggle-switch')) {
                const toggle = event.target;
                const card = toggle.closest('.remediation-card');
                const isEnabled = toggle.checked;
                const title = card.querySelector('h3').textContent;
                console.log(`Auto-remediation ${isEnabled ? 'enabled' : 'disabled'} for: ${title}`);
            }
        });
    }
    
    async function createJiraTicket(summary, description) {
        try {
            const response = await fetch('/create-ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ summary, description })
            });
            
            if (response.ok) {
                const result = await response.json();
                alert(`Ticket created successfully: ${result.key || result.result}`);
            } else {
                alert('Failed to create ticket');
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            alert('Error creating ticket');
        }
    }

    // Alerts functionality
    // Format timestamp
    function formatTimestamp(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Create alert element
    function createAlertElement(alert) {
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item ${alert.unread ? 'unread' : ''}`;
        alertElement.innerHTML = `
            <div class="alert-header">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-severity severity-${alert.severity}">${alert.severity.toUpperCase()}</div>
            </div>
            <div class="alert-timestamp">${formatTimestamp(alert.timestamp)}</div>
            <p class="alert-description">${alert.description}</p>
            <div class="alert-actions">
                <button class="alert-button acknowledge-button" data-alert-id="${alert.id}">
                    <i class="fas fa-check"></i>
                    Acknowledge
                </button>
                <button class="alert-button assign-button" data-alert-id="${alert.id}">
                    <i class="fas fa-user-tag"></i>
                    Assign to IT
                </button>
                <button class="alert-button snooze-button" data-alert-id="${alert.id}">
                    <i class="fas fa-clock"></i>
                    Snooze
                </button>
            </div>
        `;
        return alertElement;
    }

    // Render alerts
    function renderAlerts(alerts) {
        alertsFeed.innerHTML = '';
        alerts.forEach(alert => {
            alertsFeed.appendChild(createAlertElement(alert));
        });
    }

    // Handle alert actions
    function handleAlertAction(alertId, action) {
        const alert = sampleAlerts.find(a => a.id === alertId);
        if (alert) {
            switch (action) {
                case 'acknowledge':
                    alert.unread = false;
                    // In a real app, send acknowledgment to backend
                    break;
                case 'assign':
                    // In a real app, open assignment dialog
                    console.log(`Assigning alert ${alertId} to IT team`);
                    break;
                case 'snooze':
                    // In a real app, set snooze duration
                    console.log(`Snoozing alert ${alertId}`);
                    break;
            }
            renderAlerts(sampleAlerts);
        }
    }

    // Event listeners
    document.addEventListener('click', (e) => {
        const button = e.target.closest('.alert-button');
        if (button) {
            const alertId = parseInt(button.dataset.alertId);
            const action = button.classList.contains('acknowledge-button') ? 'acknowledge' :
                          button.classList.contains('assign-button') ? 'assign' : 'snooze';
            handleAlertAction(alertId, action);
        }
    });

    filterButton.addEventListener('click', () => {
        // In a real app, open filter dialog
        console.log('Opening filter dialog');
    });

    settingsButton.addEventListener('click', () => {
        // In a real app, open settings dialog
        console.log('Opening settings dialog');
    });

    // Simulate WebSocket connection
    function simulateWebSocket() {
        setInterval(() => {
            // In a real app, this would be a WebSocket message
            const newAlert = {
                id: sampleAlerts.length + 1,
                title: 'New security violation detected',
                description: 'Unauthorized access attempt from suspicious IP',
                severity: 'high',
                timestamp: new Date(),
                unread: true
            };
            sampleAlerts.unshift(newAlert);
            renderAlerts(sampleAlerts);
        }, 30000); // Every 30 seconds
    }

    // Initialize
    renderAlerts(sampleAlerts);
    simulateWebSocket();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        stopAutoRefresh();
    });
}); 