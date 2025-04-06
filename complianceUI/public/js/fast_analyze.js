document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const policyTextarea = document.getElementById('policy-textarea');
    const analyzeButton = document.getElementById('analyze-button');
    const clearButton = document.getElementById('clear-button');
    const copyButton = document.getElementById('copy-button');
    const sampleSelector = document.getElementById('sample-selector');
    const resultsContainer = document.getElementById('results-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const resultsJson = document.getElementById('results-json');
    
    // Sample policy texts
    const samplePolicies = {
        'password-policy': `# Password Policy
            
All system and user passwords must adhere to the following requirements:

1. Minimum length of 12 characters
2. Must contain at least one uppercase letter
3. Must contain at least one lowercase letter
4. Must contain at least one number
5. Must contain at least one special character (!@#$%^&*()_+)
6. Passwords must be changed every 90 days
7. Cannot reuse the previous 5 passwords
8. Accounts will be locked after 5 failed login attempts
9. Temporary passwords must be changed on first login

Password Management:
- Passwords must not be written down or stored electronically in clear text
- Password managers approved by IT department are recommended
- Multi-factor authentication must be used where available
- Service account passwords must be changed every 60 days
- All default passwords must be changed before systems enter production`,

        'access-control': `# Access Control Policy
            
Access to company systems and data shall follow these principles:

1. Principle of least privilege: Users should only have access to the resources necessary to perform their job functions
2. Need-to-know basis: Access to sensitive information should only be granted when required for business operations
3. Separation of duties: Critical tasks should be divided among multiple individuals

Access Control Requirements:
- All system access must be uniquely identifiable and traceable to a specific individual
- Shared accounts are prohibited except in documented exceptions approved by CISO
- Third-party access must be disabled when not in active use
- Temporary access must have an expiration date
- All access rights must be reviewed quarterly
- Privileged access must use multi-factor authentication
- Remote access requires VPN with encryption
- All access changes require manager approval`,

        'data-protection': `# Data Protection Policy
            
Company data shall be classified and protected according to the following guidelines:

Data Classification:
1. Public: Information explicitly approved for public distribution
2. Internal: Non-sensitive information for company-wide use
3. Confidential: Sensitive business information with restricted access
4. Restricted: Highly sensitive data with strictly controlled access

Data Protection Requirements:
- All confidential and restricted data must be encrypted at rest
- Data transfers over public networks must use secure protocols (HTTPS, SFTP, SSH)
- Sensitive data in test environments must be anonymized
- Customer PII must be protected with access controls and encryption
- Backups containing sensitive data must be encrypted
- Data retention periods must comply with legal and regulatory requirements
- All data breaches must be reported within 24 hours
- Mobile devices with access to company data must use encryption and remote wipe capability`
    };
    
    // Event Listeners
    analyzeButton.addEventListener('click', analyzePolicy);
    clearButton.addEventListener('click', clearForm);
    copyButton.addEventListener('click', copyResults);
    sampleSelector.addEventListener('change', loadSamplePolicy);
    
    // Function to handle policy analysis
    async function analyzePolicy() {
        const policyText = policyTextarea.value.trim();
        
        if (!policyText) {
            showError('Please enter policy text before analyzing.');
            return;
        }
        
        // Show loading indicator and hide other containers
        loadingIndicator.classList.add('active');
        resultsContainer.classList.remove('active');
        errorContainer.classList.remove('active');
        
        try {
            const formData = new FormData();
            formData.append('policy', policyText);
            
            const response = await fetch('/fast_analyze', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            // Get the raw text response
            const rawData = await response.text();
            
            try {
                // Try to parse it as JSON
                const data = JSON.parse(rawData);
                displayResults(data);
            } catch (jsonError) {
                // If not valid JSON, display the raw text
                console.error('Error parsing JSON:', jsonError);
                console.log('Raw response:', rawData);
                displayRawResults(rawData);
            }
        } catch (error) {
            showError(`Error analyzing policy: ${error.message}`);
            console.error('Analysis error:', error);
        } finally {
            loadingIndicator.classList.remove('active');
        }
    }
    
    // Function to display results
    function displayResults(data) {
        // First show the raw JSON
        resultsJson.textContent = JSON.stringify(data, null, 2);
        
        // Then create a more user-friendly display above it
        const detailedResults = document.createElement('div');
        detailedResults.className = 'detailed-results';
        
        // Add summary section
        const summarySection = document.createElement('div');
        summarySection.className = 'result-section';
        summarySection.innerHTML = `
            <h3>Compliance Summary</h3>
            <div class="summary-content">${data.summary || 'No summary available'}</div>
        `;
        detailedResults.appendChild(summarySection);
        
        // Add findings section if available
        if (data.findings && data.findings.length > 0) {
            const findingsSection = document.createElement('div');
            findingsSection.className = 'result-section';
            
            let findingsHtml = '<h3>Findings</h3><ul class="findings-list">';
            data.findings.forEach(finding => {
                const statusClass = finding.status === 'compliant' ? 'compliant' : 'non-compliant';
                findingsHtml += `
                    <li class="finding-item ${statusClass}">
                        <div class="finding-header">
                            <span class="finding-type">${finding.type}</span>
                            <span class="finding-status">${finding.status || 'N/A'}</span>
                        </div>
                        <div class="finding-data">${finding.data || 'No data available'}</div>
                    </li>
                `;
            });
            findingsHtml += '</ul>';
            
            findingsSection.innerHTML = findingsHtml;
            detailedResults.appendChild(findingsSection);
        }
        
        // Add tickets section if available
        if (data.jira_tickets && data.jira_tickets.length > 0) {
            const ticketsSection = document.createElement('div');
            ticketsSection.className = 'result-section';
            
            let ticketsHtml = '<h3>Jira Tickets Created</h3><ul class="tickets-list">';
            data.jira_tickets.forEach(ticket => {
                ticketsHtml += `
                    <li class="ticket-item">
                        <div class="ticket-header">
                            <span class="ticket-key">${ticket.key || 'N/A'}</span>
                            <span class="ticket-summary">${ticket.summary || 'No summary'}</span>
                        </div>
                        <div class="ticket-link">
                            ${ticket.link ? `<a href="${ticket.link}" target="_blank">View in Jira</a>` : 'No link available'}
                        </div>
                    </li>
                `;
            });
            ticketsHtml += '</ul>';
            
            ticketsSection.innerHTML = ticketsHtml;
            detailedResults.appendChild(ticketsSection);
        }
        
        // Insert the detailed results before the raw JSON
        const jsonParent = resultsJson.parentNode;
        jsonParent.insertBefore(detailedResults, resultsJson);
        
        // Add a separator
        const separator = document.createElement('hr');
        separator.className = 'results-separator';
        jsonParent.insertBefore(separator, resultsJson);
        
        // Add a label for the raw JSON
        const jsonLabel = document.createElement('h4');
        jsonLabel.textContent = 'Raw JSON Response:';
        jsonLabel.className = 'json-label';
        jsonParent.insertBefore(jsonLabel, resultsJson);
        
        resultsContainer.classList.add('active');
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Function to display raw text results
    function displayRawResults(text) {
        // Display the raw text
        resultsJson.textContent = text;
        
        // Create a simplified structured display
        const detailedResults = document.createElement('div');
        detailedResults.className = 'detailed-results';
        
        // Add raw response section
        const responseSection = document.createElement('div');
        responseSection.className = 'result-section';
        responseSection.innerHTML = `
            <h3>LLM Response</h3>
            <div class="summary-content">${text}</div>
        `;
        detailedResults.appendChild(responseSection);
        
        // Insert the detailed results before the raw text
        const jsonParent = resultsJson.parentNode;
        jsonParent.insertBefore(detailedResults, resultsJson);
        
        // Add a separator
        const separator = document.createElement('hr');
        separator.className = 'results-separator';
        jsonParent.insertBefore(separator, resultsJson);
        
        // Add a label for the raw JSON
        const jsonLabel = document.createElement('h4');
        jsonLabel.textContent = 'Raw Response:';
        jsonLabel.className = 'json-label';
        jsonParent.insertBefore(jsonLabel, resultsJson);
        
        resultsContainer.classList.add('active');
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Function to show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorContainer.classList.add('active');
        loadingIndicator.classList.remove('active');
    }
    
    // Function to clear the form
    function clearForm() {
        policyTextarea.value = '';
        sampleSelector.selectedIndex = 0;
        resultsContainer.classList.remove('active');
        errorContainer.classList.remove('active');
    }
    
    // Function to copy results to clipboard
    function copyResults() {
        const resultsText = resultsJson.textContent;
        
        navigator.clipboard.writeText(resultsText)
            .then(() => {
                // Change button text temporarily
                const originalText = copyButton.innerHTML;
                copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
                
                setTimeout(() => {
                    copyButton.innerHTML = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy results:', err);
                showError('Failed to copy results to clipboard.');
            });
    }
    
    // Function to load sample policy
    function loadSamplePolicy() {
        const selectedSample = sampleSelector.value;
        
        if (selectedSample && samplePolicies[selectedSample]) {
            policyTextarea.value = samplePolicies[selectedSample];
        }
    }
}); 