document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const policyTextarea = document.getElementById('policy-textarea');
    const analyzeButton = document.getElementById('analyze-button');
    const reflectButton = document.getElementById('reflect-button');
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
    reflectButton.addEventListener('click', reflectiveAnalysis);
    clearButton.addEventListener('click', clearForm);
    copyButton.addEventListener('click', copyResults);
    sampleSelector.addEventListener('change', loadSamplePolicy);
    
    // Function to handle reflective policy analysis
    async function reflectiveAnalysis() {
        const policyText = policyTextarea.value.trim();
        
        if (!policyText) {
            showError('Please enter policy text before analyzing.');
            return;
        }
        
        // Check for policies that are likely too large
        if (policyText.length > 30000) {
            if (!confirm('This policy text is very large and may exceed token limits for reflective analysis. Continue anyway? (Consider using standard analysis for large documents)')) {
                return;
            }
        }
        
        // Show loading indicator and hide other containers
        loadingIndicator.classList.add('active');
        loadingIndicator.querySelector('p').textContent = 'Performing reflective analysis (this may take longer)...';
        resultsContainer.classList.remove('active');
        errorContainer.classList.remove('active');
        
        try {
            const formData = new FormData();
            formData.append('policy', policyText);
            
            const response = await fetch('/reflect_analyze', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                
                // Handle specific error cases
                if (response.status === 413) {
                    throw new Error('Policy text is too large for reflective analysis. Please reduce size or use standard analysis instead.');
                } else {
                    throw new Error(`Server returned ${response.status}: ${errorData.detail || response.statusText}`);
                }
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
            showError(`Error performing reflective analysis: ${error.message}`);
            console.error('Analysis error:', error);
            
            // Suggest standard analysis if token error
            if (error.message.includes('too large') || error.message.includes('token')) {
                const errorElement = document.createElement('div');
                errorElement.innerHTML = '<br><button id="try-standard" class="button primary-button"><i class="fas fa-bolt"></i> Try Standard Analysis Instead</button>';
                errorMessage.appendChild(errorElement);
                
                document.getElementById('try-standard').addEventListener('click', function() {
                    errorContainer.classList.remove('active');
                    analyzePolicy();
                });
            }
        } finally {
            loadingIndicator.classList.remove('active');
            loadingIndicator.querySelector('p').textContent = 'Analyzing policy and generating compliance report...';
        }
    }
    
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
        
        // Add summary section - check for different formats
        const summarySection = document.createElement('div');
        summarySection.className = 'result-section';
        
        // Handle both standard and reflective formats
        if (data.summary) {
            // Standard orchestrator format
            summarySection.innerHTML = `
                <h3>Compliance Summary</h3>
                <div class="summary-content">${data.summary || 'No summary available'}</div>
            `;
        } else if (data.status && data.cycles) {
            // Reflective orchestrator format
            let tokenInfo = '';
            if (data.token_usage) {
                const percentUsed = Math.round((data.token_usage.estimated_tokens / data.token_usage.max_limit) * 100);
                const tokenClass = percentUsed > 70 ? 'token-high' : 'token-normal';
                tokenInfo = `
                    <div class="token-usage ${tokenClass}">
                        <span>Token Usage: <strong>${data.token_usage.estimated_tokens.toLocaleString()}</strong> / ${data.token_usage.max_limit.toLocaleString()} (${percentUsed}%)</span>
                    </div>
                `;
            }
            
            // Add truncation warning if applicable
            let truncationWarning = '';
            if (data.truncated) {
                truncationWarning = `
                    <div class="truncation-warning">
                        <i class="fas fa-exclamation-triangle"></i> 
                        Policy text was truncated from approximately ${data.original_token_estimate.toLocaleString()} tokens 
                        to fit token limits. Analysis is based on the beginning portion only.
                    </div>
                `;
            }
            
            summarySection.innerHTML = `
                <h3>Reflective Analysis Results</h3>
                ${truncationWarning}
                <div class="summary-header">
                    <span>Status: <strong>${data.status}</strong></span>
                    <span>Cycles: <strong>${data.cycles}</strong></span>
                    <span>Tickets Created: <strong>${data.tickets_created}</strong></span>
                </div>
                ${tokenInfo}
                <div class="summary-content">${data.summary || 'Processing complete'}</div>
            `;
        }
        detailedResults.appendChild(summarySection);
        
        // Add reflections section if available (for reflective orchestrator)
        if (data.memory && Array.isArray(data.memory)) {
            const reflectionsSection = document.createElement('div');
            reflectionsSection.className = 'result-section';
            
            let reflectionsHtml = '<h3>Agent Reflections</h3>';
            
            // Add a collapsible section for each reflection cycle
            data.memory.forEach((cycle, index) => {
                reflectionsHtml += `
                    <div class="reflection-cycle">
                        <div class="reflection-header">
                            <span class="cycle-number">Cycle ${index + 1}</span>
                            <span class="expand-icon"><i class="fas fa-chevron-down"></i></span>
                        </div>
                        <div class="reflection-content">
                            <div class="reflection-output"><strong>Output:</strong> ${cycle.results?.output || 'No output available'}</div>
                `;
                
                // Add tool calls if available
                if (cycle.results?.tool_calls && cycle.results.tool_calls.length > 0) {
                    reflectionsHtml += `<div class="reflection-tools"><strong>Tools Used:</strong></div><ul class="tool-list">`;
                    cycle.results.tool_calls.forEach(tool => {
                        reflectionsHtml += `
                            <li class="tool-item">
                                <div class="tool-name">${tool.tool || 'Unknown tool'}</div>
                                <div class="tool-details">
                                    Input: ${JSON.stringify(tool.input)}<br>
                                    Result: ${tool.output || 'No output'}
                                </div>
                            </li>
                        `;
                    });
                    reflectionsHtml += `</ul>`;
                }
                
                // Add logs if available
                if (cycle.results?.logs && cycle.results.logs.length > 0) {
                    reflectionsHtml += `<div class="reflection-logs"><strong>Thought Process:</strong><pre>${cycle.results.logs.join('\n')}</pre></div>`;
                }
                
                reflectionsHtml += `
                        </div>
                    </div>
                `;
            });
            
            reflectionsSection.innerHTML = reflectionsHtml;
            detailedResults.appendChild(reflectionsSection);
            
            // Add script to handle accordion behavior
            setTimeout(() => {
                document.querySelectorAll('.reflection-header').forEach(header => {
                    header.addEventListener('click', () => {
                        header.parentNode.classList.toggle('expanded');
                    });
                });
                
                // Automatically expand the first reflection cycle
                const firstCycle = document.querySelector('.reflection-cycle');
                if (firstCycle) firstCycle.classList.add('expanded');
            }, 100);
        }
        
        // Add findings section if available in standard format
        if (data.findings && Array.isArray(data.findings)) {
            const findingsSection = document.createElement('div');
            findingsSection.className = 'result-section';
            
            let findingsHtml = '<h3>Findings</h3><ul class="findings-list">';
            data.findings.forEach(finding => {
                // Check if it's the standard format or reflective format
                if (finding.type) {
                    // Standard format
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
                } else if (finding.tool) {
                    // Reflective format
                    findingsHtml += `
                        <li class="finding-item">
                            <div class="finding-header">
                                <span class="finding-type">${finding.tool}</span>
                            </div>
                            <div class="finding-data">
                                <strong>Input:</strong> ${JSON.stringify(finding.input)}<br><br>
                                <strong>Output:</strong> ${finding.output || 'No output available'}
                            </div>
                        </li>
                    `;
                }
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
        
        // Insert a separator
        const separator = document.createElement('hr');
        separator.className = 'results-separator';
        jsonParent.insertBefore(separator, resultsJson);
        
        // Add a label for the JSON
        const jsonLabel = document.createElement('div');
        jsonLabel.className = 'json-label';
        jsonLabel.textContent = 'Raw JSON Response:';
        jsonParent.insertBefore(jsonLabel, resultsJson);
        
        // Show the results container
        resultsContainer.classList.add('active');
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