document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const lastUpdated = document.getElementById('lastUpdated');
    const refreshButton = document.getElementById('refreshButton');
    const newReportButton = document.getElementById('newReportButton');
    const evidenceSearch = document.getElementById('evidenceSearch');
    const evidenceType = document.getElementById('evidenceType');
    const dateRange = document.getElementById('dateRange');
    const evidenceGrid = document.getElementById('evidenceGrid');
    const compareButton = document.getElementById('compareButton');
    const complianceChart = document.getElementById('complianceChart');
    const timelineEvents = document.getElementById('timelineEvents');

    // Sample data
    const evidenceItems = [
        {
            title: 'AWS CloudTrail Logs',
            type: 'logs',
            date: '2024-03-15',
            tags: ['AWS', 'Security', 'Q1 2024']
        },
        {
            title: 'GDPR Policy Document',
            type: 'policies',
            date: '2024-03-10',
            tags: ['GDPR', 'Policy']
        },
        {
            title: 'ISO 27001 Certificate',
            type: 'certificates',
            date: '2024-03-05',
            tags: ['ISO27001', 'Certification']
        }
    ];

    const timelineData = [
        {
            date: '2024-03-15',
            title: 'GDPR Compliance Update',
            description: 'Updated data retention policies to meet GDPR requirements'
        },
        {
            date: '2024-03-10',
            title: 'ISO 27001 Audit',
            description: 'Completed annual ISO 27001 compliance audit'
        },
        {
            date: '2024-03-05',
            title: 'SOC2 Type II Report',
            description: 'Generated SOC2 Type II compliance report'
        }
    ];

    // Initialize Chart
    function initializeChart() {
        const ctx = complianceChart.getContext('2d');
        const data = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Compliance Score',
                data: [85, 88, 92, 90, 95, 98],
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.4,
                fill: true
            }]
        };

        new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    }

    // Render Evidence Items
    function renderEvidenceItems(items) {
        evidenceGrid.innerHTML = '';
        items.forEach(item => {
            const evidenceItem = document.createElement('div');
            evidenceItem.className = 'evidence-item';
            evidenceItem.innerHTML = `
                <div class="evidence-item-header">
                    <span class="evidence-item-title">${item.title}</span>
                    <span class="evidence-item-meta">${item.date}</span>
                </div>
                <div class="evidence-item-tags">
                    ${item.tags.map(tag => `<span class="evidence-tag">${tag}</span>`).join('')}
                </div>
            `;
            evidenceGrid.appendChild(evidenceItem);
        });
    }

    // Render Timeline Events
    function renderTimelineEvents(events) {
        timelineEvents.innerHTML = '';
        events.forEach(event => {
            const timelineEvent = document.createElement('div');
            timelineEvent.className = 'timeline-event';
            timelineEvent.innerHTML = `
                <div class="timeline-event-header">
                    <span class="timeline-event-title">${event.title}</span>
                    <span class="timeline-event-date">${event.date}</span>
                </div>
                <div class="timeline-event-description">${event.description}</div>
            `;
            timelineEvents.appendChild(timelineEvent);
        });
    }

    // Filter Evidence Items
    function filterEvidenceItems() {
        const searchTerm = evidenceSearch.value.toLowerCase();
        const typeFilter = evidenceType.value;
        const dateFilter = dateRange.value;

        const filteredItems = evidenceItems.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm) ||
                                item.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            const matchesType = typeFilter === 'all' || item.type === typeFilter;
            const matchesDate = dateFilter === 'all' || true; // Add date filtering logic

            return matchesSearch && matchesType && matchesDate;
        });

        renderEvidenceItems(filteredItems);
    }

    // Update Last Updated Time
    function updateLastUpdated() {
        const now = new Date();
        lastUpdated.textContent = now.toLocaleString();
    }

    // Event Listeners
    refreshButton.addEventListener('click', () => {
        updateLastUpdated();
        // Add refresh logic here
    });

    newReportButton.addEventListener('click', () => {
        // Add new report creation logic here
        alert('New report creation feature coming soon!');
    });

    evidenceSearch.addEventListener('input', filterEvidenceItems);
    evidenceType.addEventListener('change', filterEvidenceItems);
    dateRange.addEventListener('change', filterEvidenceItems);

    compareButton.addEventListener('click', () => {
        // Add version comparison logic here
        alert('Version comparison feature coming soon!');
    });

    // Initialize
    initializeChart();
    renderEvidenceItems(evidenceItems);
    renderTimelineEvents(timelineData);
    updateLastUpdated();
}); 