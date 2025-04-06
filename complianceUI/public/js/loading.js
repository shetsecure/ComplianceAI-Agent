document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const messageText = document.querySelector('.message-text');
    const factText = document.querySelector('.fact-text');
    const statusItems = document.querySelectorAll('.status-item');

    // Loading messages
    const messages = [
        'Initializing security protocols',
        'Analyzing compliance frameworks',
        'Checking policy documentation',
        'Preparing risk assessment',
        'Finalizing security checks',
        'Almost ready...'
    ];

    // Compliance facts
    const facts = [
        'Did you know? 95% of cybersecurity breaches are caused by human error.',
        'Interesting: The average cost of a data breach is $4.24 million.',
        'Fact: Companies that implement automated compliance monitoring reduce audit time by 40%.',
        'Tip: Regular security assessments can prevent 85% of potential breaches.',
        'Stat: Organizations with strong compliance programs are 50% less likely to experience security incidents.'
    ];

    // Animation timing
    const totalDuration = 120000; 
    const messageInterval = 8500; 
    const factInterval = 2000; 
    const statusCheckInterval = 1500;

    let currentProgress = 0;
    let currentMessageIndex = 0;
    let currentFactIndex = 0;
    let currentStatusIndex = 0;

    // Get analysis ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const pssiId = urlParams.get('pssi_id');
    const normName = urlParams.get('norm_name');

    // Update progress bar
    function updateProgress() {
        const increment = 100 / (totalDuration / 100);
        currentProgress += increment;
        
        if (currentProgress <= 100) {
            progressFill.style.width = `${currentProgress}%`;
            progressText.textContent = `${Math.round(currentProgress)}%`;
            setTimeout(updateProgress, 100);
        }
    }

    // Update loading message
    function updateMessage() {
        messageText.style.opacity = '0';
        setTimeout(() => {
            messageText.textContent = messages[currentMessageIndex];
            messageText.style.opacity = '1';
            currentMessageIndex = (currentMessageIndex + 1) % messages.length;
        }, 300);
    }

    // Update compliance fact
    function updateFact() {
        factText.style.opacity = '0';
        setTimeout(() => {
            factText.textContent = facts[currentFactIndex];
            factText.style.opacity = '1';
            currentFactIndex = (currentFactIndex + 1) % facts.length;
        }, 300);
    }

    // Update status checks
    function updateStatus() {
        if (currentStatusIndex < statusItems.length) {
            statusItems[currentStatusIndex].style.opacity = '1';
            statusItems[currentStatusIndex].style.transform = 'translateX(0)';
            currentStatusIndex++;
        }
    }

    // Fetch analysis results
    async function fetchAnalysisResults() {
        try {
            const formData = new FormData();
            formData.append('pssi_id', pssiId);
            if (normName) {
                formData.append('norm_name', normName);
            }

            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Analysis failed: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Analysis results:', data);
            
            // Store results in session storage
            sessionStorage.setItem('analysisResults', JSON.stringify(data));
            
            return data;
        } catch (error) {
            console.error('Error fetching analysis results:', error);
            return null;
        }
    }

    // Start animations
    updateProgress();
    setInterval(updateMessage, messageInterval);
    setInterval(updateFact, factInterval);
    setInterval(updateStatus, statusCheckInterval);

    // If we have an analysis ID, fetch results
    if (pssiId) {
        fetchAnalysisResults();
    }

    // Redirect after loading
    setTimeout(() => {
        document.body.style.opacity = '0';
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    }, totalDuration);
}); 