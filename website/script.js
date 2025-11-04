// Rotating screenshots with fan-out effect
const phoneFrames = document.querySelectorAll('.phone-frame');
let currentIndex = 0;

// Define the positions for the fan (5 positions) - top card on the RIGHT
// Positions go from back (left) to front (right)
// Top card is 20% bigger (scale: 1.2) and vertical (rotate: 0)
const fanPositions = [
    { x: 180, y: 20, rotate: 0, scale: 1.2, zIndex: 5, opacity: 1.0 },      // Front (right) - 20% bigger, vertical
    { x: 90, y: 10, rotate: 6, scale: 0.95, zIndex: 4, opacity: 1.0 },
    { x: 0, y: 0, rotate: 0, scale: 0.9, zIndex: 3, opacity: 1.0 },
    { x: -90, y: -10, rotate: -6, scale: 0.88, zIndex: 2, opacity: 1.0 },
    { x: -180, y: -20, rotate: -12, scale: 0.85, zIndex: 1, opacity: 1.0 }  // Back (left)
];

// Mobile positions (for smaller screens)
const mobileFanPositions = [
    { x: 130, y: 20, rotate: 0, scale: 1.2, zIndex: 5, opacity: 1.0 },      // Front (right) - 20% bigger, vertical
    { x: 65, y: 10, rotate: 6, scale: 0.95, zIndex: 4, opacity: 1.0 },
    { x: 0, y: 0, rotate: 0, scale: 0.9, zIndex: 3, opacity: 1.0 },
    { x: -65, y: -10, rotate: -6, scale: 0.88, zIndex: 2, opacity: 1.0 },
    { x: -130, y: -20, rotate: -12, scale: 0.85, zIndex: 1, opacity: 1.0 }  // Back (left)
];

function applyPosition(frame, position, isMobile = false) {
    const positions = isMobile ? mobileFanPositions : fanPositions;
    const pos = positions[position];
    frame.style.transform = `translateX(${pos.x}px) translateY(${pos.y}px) rotate(${pos.rotate}deg) scale(${pos.scale})`;
    frame.style.zIndex = pos.zIndex;
    frame.style.opacity = pos.opacity;
}

function updateFanLayout() {
    if (phoneFrames.length === 0) return;
    
    // Determine if we're on mobile
    const isMobile = window.innerWidth <= 768;
    
    // Apply positions in a rotated order
    phoneFrames.forEach((frame, index) => {
        // Calculate the position index for this frame in the current rotation
        const positionIndex = (index - currentIndex + phoneFrames.length) % phoneFrames.length;
        applyPosition(frame, positionIndex, isMobile);
    });
}

function rotateScreenshots() {
    if (phoneFrames.length === 0) return;
    
    // Find the current front card (position 0)
    const isMobile = window.innerWidth <= 768;
    const positions = isMobile ? mobileFanPositions : fanPositions;
    
    phoneFrames.forEach((frame, index) => {
        const positionIndex = (index - currentIndex + phoneFrames.length) % phoneFrames.length;
        
        if (positionIndex === 0) {
            // This is the front card - keep z-index high initially, slide right
            // Slide to the right beyond the deck
            const slideOutX = positions[0].x + 300; // Slide 300px to the right
            const backPosition = positions[positions.length - 1];
            
            // Start sliding right with high z-index (keep vertical - rotate 0)
            frame.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            frame.style.transform = `translateX(${slideOutX}px) translateY(${positions[0].y}px) rotate(0deg) scale(${positions[0].scale})`;
            
            // After 200ms (when card has moved right), drop z-index and start moving to back
            setTimeout(() => {
                frame.style.zIndex = 0;
                
                // Small delay to ensure z-index is applied
                setTimeout(() => {
                    frame.style.transform = `translateX(${backPosition.x}px) translateY(${backPosition.y}px) rotate(${backPosition.rotate}deg) scale(${backPosition.scale})`;
                }, 50);
            }, 200);
        }
    });
    
    // Move to next phone
    currentIndex = (currentIndex + 1) % phoneFrames.length;
    
    // Update positions for all other cards (they move forward) - wait until top card has started moving back
    setTimeout(() => {
        phoneFrames.forEach((frame, index) => {
            const positionIndex = (index - currentIndex + phoneFrames.length) % phoneFrames.length;
            if (positionIndex !== positions.length - 1) { // Skip the card that just went to back
                applyPosition(frame, positionIndex, isMobile);
            }
        });
    }, 250); // Wait 250ms (after z-index drop) before moving other cards forward
}

// Initialize
if (phoneFrames.length > 0) {
    updateFanLayout();
    
    // Rotate every 2 seconds (faster)
    setInterval(rotateScreenshots, 2000);
    
    // Update on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateFanLayout, 100);
});
}

// Form submission handling
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');
const formError = document.getElementById('formError');

if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        // Hide any previous messages
        if (formSuccess) formSuccess.style.display = 'none';
        if (formError) formError.style.display = 'none';
        
        // Netlify will handle the form submission automatically
    });
}

// Handle form submission success/error (for Netlify)
document.addEventListener('DOMContentLoaded', function() {
    // Check if redirected from Netlify form submission
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('form-submitted') === 'true') {
        if (formSuccess) {
            formSuccess.style.display = 'block';
            contactForm.reset();
            // Scroll to success message
            formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
});

// Modal functionality
const privacyModal = document.getElementById('privacyModal');
const termsModal = document.getElementById('termsModal');
const privacyLink = document.getElementById('privacyLink');
const termsLink = document.getElementById('termsLink');
const closePrivacy = document.getElementById('closePrivacy');
const closeTerms = document.getElementById('closeTerms');

// Function to open Privacy Policy modal
function openPrivacyModal() {
    if (privacyModal) {
        privacyModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        // Update URL hash without triggering hashchange event
        if (window.location.hash !== '#privacy') {
            window.history.replaceState(null, '', '#privacy');
        }
    }
}

// Function to close Privacy Policy modal
function closePrivacyModal() {
    if (privacyModal) {
        privacyModal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
        // Remove hash from URL without triggering hashchange event
        if (window.location.hash === '#privacy') {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }
}

// Function to open Terms of Use modal
function openTermsModal() {
    if (termsModal) {
        termsModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        // Update URL hash without triggering hashchange event
        if (window.location.hash !== '#terms') {
            window.history.replaceState(null, '', '#terms');
        }
    }
}

// Function to close Terms of Use modal
function closeTermsModal() {
    if (termsModal) {
        termsModal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
        // Remove hash from URL without triggering hashchange event
        if (window.location.hash === '#terms') {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }
}

// Function to handle hash-based modal opening
function handleHashModal() {
    const hash = window.location.hash;
    
    // Close any open modals first
    if (privacyModal && privacyModal.style.display === 'block') {
        privacyModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    if (termsModal && termsModal.style.display === 'block') {
        termsModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    // Open modal based on hash
    if (hash === '#privacy') {
        openPrivacyModal();
    } else if (hash === '#terms') {
        openTermsModal();
    }
}

// Open Privacy Policy modal
if (privacyLink) {
    privacyLink.addEventListener('click', function(e) {
        e.preventDefault();
        openPrivacyModal();
    });
}

// Open Terms of Use modal
if (termsLink) {
    termsLink.addEventListener('click', function(e) {
        e.preventDefault();
        openTermsModal();
    });
}

// Close Privacy Policy modal
if (closePrivacy) {
    closePrivacy.addEventListener('click', function() {
        closePrivacyModal();
    });
}

// Close Terms of Use modal
if (closeTerms) {
    closeTerms.addEventListener('click', function() {
        closeTermsModal();
    });
}

// Close modals when clicking outside the modal content
window.addEventListener('click', function(event) {
    if (event.target === privacyModal) {
        closePrivacyModal();
    }
    if (event.target === termsModal) {
        closeTermsModal();
    }
});

// Close modals with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        if (privacyModal && privacyModal.style.display === 'block') {
            closePrivacyModal();
        }
        if (termsModal && termsModal.style.display === 'block') {
            closeTermsModal();
        }
    }
});

// Check hash on page load
document.addEventListener('DOMContentLoaded', function() {
    handleHashModal();
});

// Handle hash changes (when user navigates with hash)
window.addEventListener('hashchange', function() {
    handleHashModal();
});
