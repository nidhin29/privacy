// Interactive logic for Spendy Privacy Policy Website

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. Theme Toggle (Dark / Light Mode)
    // ==========================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Load saved theme or check system default
    const savedTheme = localStorage.getItem('spendy-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
    } else {
        htmlElement.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('spendy-theme', newTheme);
        showToast(`Switched to ${newTheme} theme`, 'info');
    });

    // ==========================================
    // 2. Custom Toast System
    // ==========================================
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    let toastTimeout;

    function showToast(message, type = 'success') {
        clearTimeout(toastTimeout);
        toastMessage.textContent = message;
        
        // Handle icons or styles based on type if needed
        const icon = toast.querySelector('.toast-icon');
        if (type === 'success') {
            icon.style.backgroundColor = 'var(--success-alpha-2)';
            icon.style.color = 'var(--success)';
            icon.style.borderColor = 'var(--success)';
        } else {
            icon.style.backgroundColor = 'var(--primary-alpha-2)';
            icon.style.color = 'var(--primary)';
            icon.style.borderColor = 'var(--primary)';
        }

        toast.classList.add('show');
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ==========================================
    // 3. Permissions Grid (Accordion)
    // ==========================================
    const permissionItems = document.querySelectorAll('.permission-item');

    permissionItems.forEach(item => {
        const header = item.querySelector('.permission-header');
        header.addEventListener('click', () => {
            const isExpanded = item.getAttribute('data-expanded') === 'true';
            
            // Optional: Close other expanded items (standard accordion)
            permissionItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.setAttribute('data-expanded', 'false');
                }
            });

            // Toggle active item
            item.setAttribute('data-expanded', !isExpanded ? 'true' : 'false');
        });
    });

    // ==========================================
    // 4. Live Text Search with Highlighting
    // ==========================================
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const policySections = document.querySelectorAll('.policy-section');
    
    // Store original HTML contents of search-eligible elements to revert highlights cleanly
    const searchables = [];
    policySections.forEach(section => {
        // Elements that contain searchable text
        const elements = section.querySelectorAll('p, li, h2, h3, div.pledge-text, div.note-box');
        elements.forEach(el => {
            searchables.push({
                element: el,
                originalHTML: el.innerHTML,
                originalText: el.textContent
            });
        });
    });

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        
        if (query.length > 0) {
            searchClear.style.display = 'block';
        } else {
            searchClear.style.display = 'none';
        }

        if (query.length < 2) {
            // Revert all to original HTML
            searchables.forEach(item => {
                item.element.innerHTML = item.originalHTML;
            });
            // Show all sections
            policySections.forEach(s => s.style.opacity = '1');
            return;
        }

        let totalMatches = 0;
        const matchedSections = new Set();

        searchables.forEach(item => {
            const text = item.originalText;
            const index = text.toLowerCase().indexOf(query);
            
            if (index !== -1) {
                // Perform highlighting by wrapping match in mark tags
                // Using regex to perform case-insensitive replacement without breaking HTML structures
                const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
                
                // Only replace within clean text boundaries to prevent breaking inline HTML elements
                // A simple approach is searching inside original text and rebuilding if it's basic content
                // Safe replacement helper:
                item.element.innerHTML = item.originalHTML.replace(regex, '<mark class="search-highlight">$1</mark>');
                totalMatches++;
                
                // Track containing section
                const section = item.element.closest('.policy-section');
                if (section) {
                    matchedSections.add(section);
                }
            } else {
                item.element.innerHTML = item.originalHTML;
            }
        });

        // Dim sections that have no matches to make matches stand out
        policySections.forEach(section => {
            if (matchedSections.has(section)) {
                section.style.opacity = '1';
                section.style.borderColor = 'var(--primary)';
            } else {
                section.style.opacity = '0.4';
                section.style.borderColor = 'var(--border-color)';
            }
        });
    });

    // Clear search action
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.style.display = 'none';
        searchables.forEach(item => {
            item.element.innerHTML = item.originalHTML;
        });
        policySections.forEach(s => {
            s.style.opacity = '1';
            s.style.borderColor = 'var(--border-color)';
        });
        searchInput.focus();
    });

    // Shortcut '/' key to focus search
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
        if (e.key === 'Escape' && document.activeElement === searchInput) {
            searchInput.blur();
            searchClear.click();
        }
    });

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // ==========================================
    // 5. Table of Contents (TOC) Active Tracker
    // ==========================================
    const tocLinks = document.querySelectorAll('.toc-link');
    
    // Active highlight on scroll using Intersection Observer
    const observerOptions = {
        root: null,
        rootMargin: '-10% 0px -70% 0px', // Trigger when section is in top-middle of viewport
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.getAttribute('id');
                
                tocLinks.forEach(link => {
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                        // Scroll TOC inside sidebar if needed
                        link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        });
    }, observerOptions);

    policySections.forEach(section => {
        observer.observe(section);
    });

    // Smooth scroll for TOC links (adjusting scroll offsets)
    tocLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerOffset = 90;
                const elementPosition = targetSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==========================================
    // 6. Local Data Wipe Simulator
    // ==========================================
    const wipeBtn = document.getElementById('wipe-data-btn');
    const dbStatus = document.getElementById('db-status');
    const dbVisualizer = document.getElementById('db-visualizer');
    
    const originalDbHTML = dbVisualizer.innerHTML;
    let isWiping = false;

    wipeBtn.addEventListener('click', async () => {
        if (isWiping) return;
        isWiping = true;
        
        wipeBtn.disabled = true;
        wipeBtn.textContent = 'Wiping Sandbox...';
        
        // 1. Set Status to offline
        dbStatus.className = 'status-indicator offline';
        dbStatus.textContent = 'Offline (Wiping Data)';
        
        const rows = dbVisualizer.querySelectorAll('.db-row');
        
        // 2. Sequentially delete each table entry with a visual delay
        for (let i = 0; i < rows.length; i++) {
            await delay(450);
            rows[i].classList.add('deleted');
            const valCell = rows[i].querySelector('.db-cell-val');
            if (valCell) {
                valCell.textContent = '❌ DELETED';
            }
        }
        
        await delay(500);
        dbVisualizer.classList.add('wiped');
        dbVisualizer.innerHTML = '<div style="text-align: center; color: var(--danger); font-weight: bold; padding: 16px;">SQLite Database Deleted (0 bytes)</div>';
        
        showToast('All local data wiped successfully!', 'success');
        wipeBtn.textContent = 'Wiped!';
        
        // 3. Reset after a brief moment so the user can interact again
        await delay(4000);
        dbVisualizer.classList.remove('wiped');
        dbVisualizer.innerHTML = originalDbHTML;
        dbStatus.className = 'status-indicator online';
        dbStatus.textContent = 'Active Database Connected';
        wipeBtn.disabled = false;
        wipeBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Wipe All Data
        `;
        isWiping = false;
    });

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==========================================
    // 7. Email Copy to Clipboard
    // ==========================================
    const copyEmailBtn = document.getElementById('copy-email-btn');
    const emailText = document.getElementById('email-text').textContent;

    copyEmailBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(emailText).then(() => {
            showToast('Email copied to clipboard!', 'success');
        }).catch(err => {
            // Fallback for browsers with clipboard issues
            const input = document.createElement('input');
            input.value = emailText;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            showToast('Email copied to clipboard!', 'success');
        });
    });



});
