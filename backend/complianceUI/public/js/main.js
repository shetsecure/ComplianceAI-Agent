document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const normFileInput = document.getElementById('norm-file');
    const pssiFileInput = document.getElementById('pssi-file');
    const analyzeButton = document.getElementById('analyze-button');
    const analysisProgress = document.getElementById('analysis-progress');
    const progressBar = document.querySelector('.progress');
    const progressText = document.querySelector('.progress-text');

    // File state
    let normFile = null;
    let pssiFile = null;

    // Event Listeners
    normFileInput.addEventListener('change', handleFileSelect);
    pssiFileInput.addEventListener('change', handleFileSelect);
    analyzeButton.addEventListener('click', handleAnalysis);

    // Handle file selection
    function handleFileSelect(event) {
        const file = event.target.files[0];
        const uploadBox = event.target.closest('.upload-box');
        
        if (file) {
            // Update file state
            if (event.target.id === 'norm-file') {
                normFile = file;
            } else {
                pssiFile = file;
            }

            // Update UI
            uploadBox.classList.add('file-selected');
            uploadBox.querySelector('p').textContent = file.name;
        }

        // Enable analyze button if both files are selected
        if (normFile && pssiFile) {
            analyzeButton.disabled = false;
        }
    }

    // Handle analysis
    async function handleAnalysis() {
        if (!normFile || !pssiFile) {
            showError("Please upload both documents before analysis");
            return;
        }

        try {
            // Clear previous results
            const existingResults = document.querySelector('.results-container');
            if (existingResults) {
                existingResults.remove();
            }
            
            // Show progress
            analysisProgress.classList.remove('hidden');
            progressText.textContent = 'Uploading and analyzing documents...';
            progressText.style.color = 'initial';
            analyzeButton.disabled = true;

            // First upload the files
            const formData = new FormData();
            formData.append('norm', normFile);
            formData.append('pssi', pssiFile);

            const uploadResponse = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload files');
            }

            const { norm_id, pssi_id } = await uploadResponse.json();

            // Then analyze the documents
            const analyzeFormData = new FormData();
            analyzeFormData.append('norm_id', norm_id);
            analyzeFormData.append('pssi_id', pssi_id);

            const analyzeResponse = await fetch('/analyze', {
                method: 'POST',
                body: analyzeFormData
            });

            if (!analyzeResponse.ok) {
                throw new Error('Analysis failed');
            }

            const result = await analyzeResponse.json();
            
            // Reset UI only after successful analysis
            normFileInput.value = '';
            pssiFileInput.value = '';
            normFile = null;
            pssiFile = null;
            document.querySelectorAll('.upload-box').forEach(box => {
                box.classList.remove('file-selected');
                box.querySelector('p').textContent = 'Drag & drop your file here or click to browse';
            });
            
            showResults(result);

        } catch (error) {
            showError(error.message);
        }
    }

    // Show results
    async function showResults(analysisData) {
        try {
            // Update UI with results
            progressText.textContent = 'Analysis complete!';
            analyzeButton.disabled = false;
            analysisProgress.classList.add('hidden');

            // Create results container
            const resultsContainer = document.createElement('div');
            resultsContainer.className = 'results-container';
            
            // Add analysis section
            const analysisSection = document.createElement('div');
            analysisSection.className = 'analysis-content';
            analysisSection.innerHTML = `
                <h4>Compliance Analysis</h4>
                <div class="analysis-text">${analysisData.analysis || 'No analysis available'}</div>
            `;
            resultsContainer.appendChild(analysisSection);

            // Add tool calls section if there are any
            if (analysisData.tool_calls && analysisData.tool_calls.length > 0) {
                const toolCallsSection = document.createElement('div');
                toolCallsSection.className = 'tool-calls';
                toolCallsSection.innerHTML = '<h4>Jira Issues Created</h4>';
                
                analysisData.tool_calls.forEach((toolCall, index) => {
                    const toolCallDiv = document.createElement('div');
                    toolCallDiv.className = 'tool-call';
                    toolCallDiv.innerHTML = `
                        <div class="tool-call-header">
                            <span class="tool-call-number">Issue #${index + 1}</span>
                            <span class="tool-call-status">${toolCall.result || 'Processing...'}</span>
                        </div>
                        <div class="tool-call-details">
                            <p><strong>Summary:</strong> ${toolCall.args.summary || 'No summary available'}</p>
                            <p><strong>Description:</strong> ${toolCall.args.description || 'No description available'}</p>
                        </div>
                    `;
                    toolCallsSection.appendChild(toolCallDiv);
                });
                
                resultsContainer.appendChild(toolCallsSection);
            }

            // Remove any existing results
            const existingResults = document.querySelector('.results-container');
            if (existingResults) {
                existingResults.remove();
            }

            // Add results to the page
            const uploadSection = document.querySelector('.upload-section');
            uploadSection.appendChild(resultsContainer);

            // Scroll to results
            resultsContainer.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            showError('Error displaying results: ' + error.message);
        }
    }

    // Show error
    function showError(message) {
        progressText.textContent = message;
        progressText.style.color = 'red';
        analyzeButton.disabled = false;
        analysisProgress.classList.add('hidden');
        
        // Remove any existing results
        const existingResults = document.querySelector('.results-container');
        if (existingResults) {
            existingResults.remove();
        }
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}); 