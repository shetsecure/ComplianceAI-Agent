document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const currentPolicyEditor = document.getElementById('currentPolicyEditor');
    const aiPolicyEditor = document.getElementById('aiPolicyEditor');
    const syncButton = document.getElementById('syncButton');
    const diffButton = document.getElementById('diffButton');
    const saveButton = document.getElementById('saveButton');
    const approveButton = document.getElementById('approveButton');
    const rejectButton = document.getElementById('rejectButton');
    const auditorNotes = document.getElementById('auditorNotes');
    const changesList = document.getElementById('changesList');
    const auditList = document.getElementById('auditList');

    // Sample policy content
    const currentPolicy = `# Data Retention Policy

## Purpose
This policy defines the requirements for data retention and disposal.

## Scope
All company data stored in any format.

## Policy
1. Customer data must be retained for 7 years
2. Employee records must be kept for 5 years
3. Financial records must be maintained for 10 years

## Exceptions
None.`;

    const aiPolicy = `# Data Retention Policy

## Purpose
This policy defines the requirements for data retention and disposal.

## Scope
All company data stored in any format.

## Policy
1. Customer data must be retained for 7 years
2. Employee records must be kept for 5 years
3. Financial records must be maintained for 10 years
4. Audit logs must be retained for 3 years
5. Backup data must be kept for 1 year

## Exceptions
Temporary files may be deleted after 30 days.`;

    // Initialize Monaco Editor
    function initializeEditors() {
        try {
            // Current Policy Editor
            const currentEditor = monaco.editor.create(currentPolicyEditor, {
                value: currentPolicy,
                language: 'markdown',
                theme: 'vs-light',
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                automaticLayout: true
            });

            // AI Policy Editor
            const aiEditor = monaco.editor.create(aiPolicyEditor, {
                value: aiPolicy,
                language: 'markdown',
                theme: 'vs-light',
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                automaticLayout: true
            });

            // Sync scrolling
            let isSynced = false;
            syncButton.addEventListener('click', () => {
                isSynced = !isSynced;
                syncButton.classList.toggle('active', isSynced);
                
                if (isSynced) {
                    currentEditor.onDidScrollChange(() => {
                        const scrollTop = currentEditor.getScrollTop();
                        aiEditor.setScrollTop(scrollTop);
                    });
                    
                    aiEditor.onDidScrollChange(() => {
                        const scrollTop = aiEditor.getScrollTop();
                        currentEditor.setScrollTop(scrollTop);
                    });
                } else {
                    // Remove scroll listeners
                    currentEditor.onDidScrollChange(() => {});
                    aiEditor.onDidScrollChange(() => {});
                }
            });

            // Show differences
            let showDiff = false;
            diffButton.addEventListener('click', () => {
                showDiff = !showDiff;
                diffButton.classList.toggle('active', showDiff);
                
                if (showDiff) {
                    const diff = monaco.editor.createDiffEditor(aiPolicyEditor, {
                        theme: 'vs-light',
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        renderWhitespace: 'selection',
                        automaticLayout: true
                    });
                    
                    diff.setModel({
                        original: monaco.editor.createModel(currentPolicy, 'markdown'),
                        modified: monaco.editor.createModel(aiPolicy, 'markdown')
                    });
                } else {
                    // Restore original editor
                    aiEditor = monaco.editor.create(aiPolicyEditor, {
                        value: aiPolicy,
                        language: 'markdown',
                        theme: 'vs-light',
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        lineNumbers: 'on',
                        renderWhitespace: 'selection',
                        automaticLayout: true
                    });
                }
            });

            return { currentEditor, aiEditor };
        } catch (error) {
            console.error('Error initializing Monaco Editor:', error);
            // Fallback to simple textareas if Monaco fails to load
            currentPolicyEditor.innerHTML = `<textarea class="fallback-editor">${currentPolicy}</textarea>`;
            aiPolicyEditor.innerHTML = `<textarea class="fallback-editor">${aiPolicy}</textarea>`;
            return null;
        }
    }

    // Wait for Monaco to be ready
    if (window.monaco) {
        initializeEditors();
    } else {
        window.addEventListener('load', () => {
            if (window.monaco) {
                initializeEditors();
            } else {
                console.error('Monaco Editor failed to load');
                // Fallback to simple textareas
                currentPolicyEditor.innerHTML = `<textarea class="fallback-editor">${currentPolicy}</textarea>`;
                aiPolicyEditor.innerHTML = `<textarea class="fallback-editor">${aiPolicy}</textarea>`;
            }
        });
    }

    // Sample changes
    const changes = [
        { type: 'added', text: 'Added requirement for audit log retention' },
        { type: 'added', text: 'Added backup data retention policy' },
        { type: 'added', text: 'Added exception for temporary files' }
    ];

    // Render changes
    function renderChanges() {
        changesList.innerHTML = '';
        changes.forEach(change => {
            const changeElement = document.createElement('div');
            changeElement.className = `change-item ${change.type}`;
            changeElement.textContent = change.text;
            changesList.appendChild(changeElement);
        });
    }

    // Sample audit trail
    const auditTrail = [
        { action: 'Review started', timestamp: new Date() },
        { action: 'AI recommendations generated', timestamp: new Date(Date.now() - 3600000) }
    ];

    // Render audit trail
    function renderAuditTrail() {
        auditList.innerHTML = '';
        auditTrail.forEach(entry => {
            const auditElement = document.createElement('div');
            auditElement.className = 'audit-item';
            auditElement.innerHTML = `
                <span>${entry.action}</span>
                <span class="timestamp">${formatTimestamp(entry.timestamp)}</span>
            `;
            auditList.appendChild(auditElement);
        });
    }

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

    // Handle review actions
    approveButton.addEventListener('click', () => {
        const notes = auditorNotes.value.trim();
        if (notes) {
            auditTrail.unshift({
                action: `Approved changes with notes: ${notes}`,
                timestamp: new Date()
            });
        } else {
            auditTrail.unshift({
                action: 'Approved changes',
                timestamp: new Date()
            });
        }
        renderAuditTrail();
        alert('Changes approved successfully!');
    });

    rejectButton.addEventListener('click', () => {
        const notes = auditorNotes.value.trim();
        if (notes) {
            auditTrail.unshift({
                action: `Rejected changes with notes: ${notes}`,
                timestamp: new Date()
            });
        } else {
            auditTrail.unshift({
                action: 'Rejected changes',
                timestamp: new Date()
            });
        }
        renderAuditTrail();
        alert('Changes rejected successfully!');
    });

    // Save review
    saveButton.addEventListener('click', () => {
        // In a real app, this would save the review state
        console.log('Saving review state...');
        alert('Review saved successfully!');
    });

    // Initialize
    renderChanges();
    renderAuditTrail();
}); 