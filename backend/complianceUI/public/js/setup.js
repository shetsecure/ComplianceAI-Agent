document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const steps = document.querySelectorAll('.setup-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const previewList = document.getElementById('previewList');
    const regulationCards = document.querySelectorAll('.regulation-card');
    
    // State
    let currentStep = 1;
    const totalSteps = steps.length;
    const uploadedFiles = new Map();
    
    // Hardcoded norm for demo
    let selectedNorm = "guide_hygiene_informatique_anssi.pdf";

    // Automatically select ANSSI card if it exists
    const anssiCard = document.querySelector('.regulation-card[data-framework="anssi"]');
    if (anssiCard) {
        // Deselect all cards
        regulationCards.forEach(c => c.classList.remove('selected'));
        // Select ANSSI card
        anssiCard.classList.add('selected');
        console.log('Automatically selected norm:', selectedNorm);
    }

    // Simplified norm loading - just for visual consistency
    async function loadAvailableNorms() {
        try {
            const response = await fetch('/norms');
            const data = await response.json();
            
            if (data.norms && data.norms.length > 0) {
                console.log('Available norms:', data.norms);
            }
        } catch (error) {
            console.error('Error loading norms:', error);
        }
    }

    // Call on page load
    loadAvailableNorms();

    // Navigation Functions
    function updateNavigation() {
        prevButton.disabled = currentStep === 1;
        nextButton.textContent = currentStep === totalSteps ? 'Complete Setup' : 'Next';
        
        // For demo, we can potentially skip step 1 since norm is hardcoded
        // Uncomment this to skip directly to file upload
        // if (currentStep === 1) {
        //     showStep(2);
        // }
        
        // Update progress steps
        progressSteps.forEach((step, index) => {
            if (index + 1 < currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index + 1 === currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });

        if (currentStep === totalSteps) {
            nextButton.addEventListener('click', () => {
                // Validate all required fields are completed
                if (validateSetup()) {
                    completeSetup();
                }
            });
        }
    }

    function showStep(stepNumber) {
        steps.forEach(step => step.classList.remove('active'));
        document.getElementById(`step-${stepNumber}`).classList.add('active');
        currentStep = stepNumber;
        updateNavigation();
    }

    // Event Listeners
    prevButton.addEventListener('click', () => {
        if (currentStep > 1) {
            showStep(currentStep - 1);
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            showStep(currentStep + 1);
        } else {
            // Handle finish
            startAnalysis();
        }
    });

    // Disable norm selection since it's hardcoded
    regulationCards.forEach(card => {
        card.addEventListener('click', () => {
            // Show card as selected for visual feedback only
            regulationCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            // But keep using the hardcoded norm
            console.log('Using hardcoded norm:', selectedNorm);
        });
    });

    // File Upload Handling
    function handleFiles(files) {
        // Clear previous files
        uploadedFiles.clear();
        previewList.innerHTML = '';
        
        // Add the new file (only use the first file)
        if (files.length > 0) {
            const file = files[0];
            uploadedFiles.set(file.name, file);
            addFileToPreview(file);
        }
    }

    function addFileToPreview(file) {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        const fileIcon = document.createElement('i');
        fileIcon.className = 'fas fa-file';
        
        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        
        const fileSize = document.createElement('span');
        fileSize.className = 'file-size';
        fileSize.textContent = formatFileSize(file.size);
        
        const removeButton = document.createElement('i');
        removeButton.className = 'fas fa-times remove-file';
        removeButton.addEventListener('click', () => {
            uploadedFiles.delete(file.name);
            previewItem.remove();
        });
        
        previewItem.appendChild(fileIcon);
        previewItem.appendChild(fileName);
        previewItem.appendChild(fileSize);
        previewItem.appendChild(removeButton);
        previewList.appendChild(previewItem);
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Drag and Drop Handling
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        fileInput.value = ''; // Reset input
    });

    // Integration Test Connection
    document.querySelectorAll('.test-button').forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.integration-card');
            const statusIndicator = card.querySelector('.status-indicator');
            const statusText = card.querySelector('.status-text');
            
            // Simulate connection test
            statusIndicator.classList.remove('connected', 'disconnected');
            statusText.textContent = 'Testing...';
            
            setTimeout(() => {
                // Simulate successful connection
                statusIndicator.classList.add('connected');
                statusIndicator.classList.remove('disconnected');
                statusText.textContent = 'Connected';
                card.classList.add('connected');
            }, 1500);
        });
    });

    // OAuth Button Handling
    document.querySelectorAll('.oauth-button').forEach(button => {
        button.addEventListener('click', function() {
            const service = this.closest('.integration-card').dataset.service;
            // In a real implementation, this would redirect to the OAuth provider
            alert(`Redirecting to ${service} OAuth...`);
        });
    });

    // Start Analysis Process
    async function startAnalysis() {
        if (!validateSetup()) {
            return false;
        }
        
        showCompletionMessage("Uploading and analyzing your documents...");
        
        try {
            // First, upload the PSSI file
            const pssiFile = Array.from(uploadedFiles.values())[0];
            if (!pssiFile) {
                throw new Error("No PSSI file selected");
            }
            
            const formData = new FormData();
            formData.append('pssi', pssiFile);
            
            const uploadResponse = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!uploadResponse.ok) {
                throw new Error("Error uploading PSSI document");
            }
            
            const uploadData = await uploadResponse.json();
            const pssiId = uploadData.pssi_id;
            
            // Instead of handling analysis here, redirect to the loading page
            // with query parameters
            window.location.href = `/loading.html?pssi_id=${encodeURIComponent(pssiId)}&norm_name=${encodeURIComponent(selectedNorm)}`;
            
            return true;
        } catch (error) {
            console.error("Error starting analysis:", error);
            showError(`Error: ${error.message}`);
            return false;
        }
    }

    // Show completion message
    function showCompletionMessage(message) {
        const completionMessage = document.createElement('div');
        completionMessage.className = 'completion-message';
        completionMessage.innerHTML = `
            <div class="completion-content">
                <i class="fas fa-cog fa-spin"></i>
                <h3>Processing</h3>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(completionMessage);

        // Add completion message styles
        const style = document.createElement('style');
        style.textContent = `
            .completion-message {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.95);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .completion-content {
                text-align: center;
                padding: 2rem;
                animation: fadeIn 0.5s ease-out;
            }
            .completion-content i {
                font-size: 4rem;
                color: #3498db;
                margin-bottom: 1rem;
            }
            .completion-content h3 {
                font-size: 2rem;
                color: #2c3e50;
                margin-bottom: 1rem;
            }
            .completion-content p {
                font-size: 1.2rem;
                color: #666;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    // Show error message
    function showError(message) {
        const errorMessage = document.querySelector('.completion-message');
        if (errorMessage) {
            const content = errorMessage.querySelector('.completion-content');
            content.innerHTML = `
                <i class="fas fa-exclamation-circle" style="color: #e74c3c;"></i>
                <h3>Error</h3>
                <p>${message}</p>
                <button id="errorCloseBtn" class="btn-primary" style="margin-top: 1rem;">Try Again</button>
            `;
            
            document.getElementById('errorCloseBtn').addEventListener('click', () => {
                errorMessage.remove();
            });
        }
    }

    // Function to validate setup completion
    function validateSetup() {
        // We don't need to check norm selection since it's hardcoded
        
        // Check if a policy file is uploaded
        if (uploadedFiles.size === 0) {
            alert('Please upload your PSSI document.');
            showStep(2);
            return false;
        }

        return true;
    }

    // Initialize
    updateNavigation();
}); 