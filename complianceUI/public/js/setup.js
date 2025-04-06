document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const steps = document.querySelectorAll('.setup-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const previewList = document.getElementById('previewList');
    
    // State
    let currentStep = 1;
    const totalSteps = steps.length;
    const uploadedFiles = new Map();

    // Navigation Functions
    function updateNavigation() {
        prevButton.disabled = currentStep === 1;
        nextButton.textContent = currentStep === totalSteps ? 'Complete Setup' : 'Next';
        
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
            alert('Setup completed!');
        }
    });

    // File Upload Handling
    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (!uploadedFiles.has(file.name)) {
                uploadedFiles.set(file.name, file);
                addFileToPreview(file);
            }
        });
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

    // Function to handle setup completion
    function completeSetup() {
        // Show completion message
        const completionMessage = document.createElement('div');
        completionMessage.className = 'completion-message';
        completionMessage.innerHTML = `
            <div class="completion-content">
                <i class="fas fa-check-circle"></i>
                <h3>Setup Complete!</h3>
                <p>Your ComplianceAI Agent is being configured...</p>
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
                color: #4CAF50;
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

        // Redirect to loading page after 2 seconds
        setTimeout(() => {
            window.location.href = 'loading.html';
        }, 2000);
    }

    // Function to validate setup completion
    function validateSetup() {
        // Check if at least one regulation is selected
        const selectedRegulations = document.querySelectorAll('.regulation-card.selected');
        if (selectedRegulations.length === 0) {
            alert('Please select at least one regulation framework.');
            return false;
        }

        // Check if at least one policy file is uploaded
        const uploadedFiles = document.querySelectorAll('.file-preview-item');
        if (uploadedFiles.length === 0) {
            alert('Please upload at least one policy document.');
            return false;
        }

        // Check if at least one integration is connected
        const connectedIntegrations = document.querySelectorAll('.integration-card.connected');
        if (connectedIntegrations.length === 0) {
            alert('Please connect at least one integration.');
            return false;
        }

        return true;
    }

    // Initialize
    updateNavigation();
}); 