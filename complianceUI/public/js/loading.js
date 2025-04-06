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
    const totalDuration = 7000; // 7 seconds
    const messageInterval = 1200; // Change message every 1.2 seconds
    const factInterval = 2000; // Change fact every 2 seconds
    const statusCheckInterval = 1500; // Check status every 1.5 seconds

    let currentProgress = 0;
    let currentMessageIndex = 0;
    let currentFactIndex = 0;
    let currentStatusIndex = 0;

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

    // Start animations
    updateProgress();
    setInterval(updateMessage, messageInterval);
    setInterval(updateFact, factInterval);
    setInterval(updateStatus, statusCheckInterval);

    // Redirect after loading
    setTimeout(() => {
        document.body.style.opacity = '0';
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    }, totalDuration);
}); 