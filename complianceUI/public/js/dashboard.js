document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const lastUpdated = document.getElementById('lastUpdated');
    const refreshButton = document.getElementById('refreshButton');
    const heatmapContainer = document.getElementById('heatmap');

    // State
    let autoRefreshInterval;
    const refreshInterval = 60000; // 60 seconds

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
    initializeHeatmap();
    startAutoRefresh();
    setupEventListeners();

    // Functions
    function initializeHeatmap() {
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

        // Generate sample data
        const data = generateSampleData();

        // Create scales
        const x = d3.scaleBand()
            .range([0, width])
            .domain(data.map(d => d.framework))
            .padding(0.1);

        const y = d3.scaleBand()
            .range([height, 0])
            .domain(data.map(d => d.date))
            .padding(0.1);

        const color = d3.scaleLinear()
            .domain([0, 50, 100])
            .range(['#F44336', '#FFC107', '#4CAF50']);

        // Create heatmap cells
        svg.selectAll()
            .data(data)
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

    function generateSampleData() {
        const frameworks = ['GDPR', 'ISO 27001', 'SOC2'];
        const dates = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        });

        return frameworks.flatMap(framework =>
            dates.map(date => ({
                framework,
                date,
                score: Math.floor(Math.random() * 100)
            }))
        );
    }

    function updateDashboard() {
        // Update last updated timestamp
        lastUpdated.textContent = 'Just now';

        // Simulate data refresh
        const scorecards = document.querySelectorAll('.scorecard');
        scorecards.forEach(card => {
            const scoreElement = card.querySelector('.score-value');
            const newScore = Math.floor(Math.random() * 100);
            scoreElement.textContent = `${newScore}%`;
            scoreElement.setAttribute('data-score', newScore);
            
            // Update color based on score
            if (newScore >= 80) {
                scoreElement.style.background = '#4CAF50';
                scoreElement.style.color = 'white';
            } else if (newScore >= 60) {
                scoreElement.style.background = '#FFC107';
                scoreElement.style.color = '#333';
            } else {
                scoreElement.style.background = '#F44336';
                scoreElement.style.color = 'white';
            }
        });

        // Update uncertainty scores
        const confidenceScores = document.querySelectorAll('.confidence-score');
        confidenceScores.forEach(score => {
            const newScore = Math.floor(Math.random() * 100);
            score.textContent = `${newScore}%`;
            score.setAttribute('data-confidence', newScore);
            
            if (newScore >= 70) {
                score.style.background = '#4CAF50';
                score.style.color = 'white';
            } else if (newScore >= 40) {
                score.style.background = '#FFC107';
                score.style.color = '#333';
            } else {
                score.style.background = '#F44336';
                score.style.color = 'white';
            }
        });
    }

    function startAutoRefresh() {
        autoRefreshInterval = setInterval(updateDashboard, refreshInterval);
    }

    function stopAutoRefresh() {
        clearInterval(autoRefreshInterval);
    }

    function setupEventListeners() {
        // Manual refresh button
        refreshButton.addEventListener('click', () => {
            updateDashboard();
        });

        // Drill-down buttons
        document.querySelectorAll('.drill-down-button').forEach(button => {
            button.addEventListener('click', function() {
                const card = this.closest('.scorecard');
                const framework = card.dataset.framework;
                alert(`Showing detailed view for ${framework}`);
            });
        });

        // Review buttons
        document.querySelectorAll('.review-button').forEach(button => {
            button.addEventListener('click', function() {
                const card = this.closest('.uncertainty-card');
                const title = card.querySelector('h3').textContent;
                alert(`Requesting human review for: ${title}`);
            });
        });

        // Ignore buttons
        document.querySelectorAll('.ignore-button').forEach(button => {
            button.addEventListener('click', function() {
                const card = this.closest('.uncertainty-card');
                card.style.opacity = '0.5';
                setTimeout(() => card.remove(), 300);
            });
        });

        // Create ticket buttons
        document.querySelectorAll('.create-ticket-button').forEach(button => {
            button.addEventListener('click', function() {
                const card = this.closest('.remediation-card');
                const title = card.querySelector('h3').textContent;
                alert(`Creating Jira ticket for: ${title}`);
            });
        });

        // Toggle switches
        document.querySelectorAll('.toggle-switch input').forEach(toggle => {
            toggle.addEventListener('change', function() {
                const card = this.closest('.remediation-card');
                const isEnabled = this.checked;
                const title = card.querySelector('h3').textContent;
                console.log(`Auto-remediation ${isEnabled ? 'enabled' : 'disabled'} for: ${title}`);
            });
        });
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