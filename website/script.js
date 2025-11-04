// Background image rotation with fade
const backgroundImages = [
    'backgrounds/blood-drawn.png',
    'backgrounds/group-post-workout.png',
    'backgrounds/man-towel-2.png',
    'backgrounds/man-towel.png',
    'backgrounds/stationary-bike.png',
    'backgrounds/woman-curls.png',
    'backgrounds/woman-kettle-bells.png'
];

let currentBackgroundIndex = 0;

// Preload all background images and create layers
function initBackgrounds() {
    const backgroundContainer = document.getElementById('backgroundContainer');
    if (!backgroundContainer) return;
    backgroundImages.forEach((imageSrc, index) => {
        const layer = document.createElement('div');
        layer.className = 'background-layer';
        if (index === 0) {
            layer.classList.add('active');
        }
        layer.style.backgroundImage = `url('${imageSrc}')`;
        backgroundContainer.appendChild(layer);
    });
}

// Switch to next background with fade
function switchBackground() {
    const layers = document.querySelectorAll('.background-layer');
    const currentLayer = layers[currentBackgroundIndex];
    const nextIndex = (currentBackgroundIndex + 1) % backgroundImages.length;
    const nextLayer = layers[nextIndex];
    
    // Fade out current, fade in next
    currentLayer.classList.remove('active');
    nextLayer.classList.add('active');
    
    currentBackgroundIndex = nextIndex;
}

// Initialize backgrounds on page load
document.addEventListener('DOMContentLoaded', function() {
    initBackgrounds();
    // Switch background every 8 seconds
    setInterval(switchBackground, 8000);
    
    // Handle form submission success/error (for Netlify - backup)
    // Check if redirected from Netlify form submission
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('form-submitted') === 'true') {
        if (formSuccess) {
            formSuccess.style.display = 'block';
            formSuccess.textContent = 'Thank you! You\'ve been added to our VIP early access list. We\'ll be in touch soon!';
            contactForm.reset();
            // Scroll to success message
            formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    // Handle hash-based modal opening
    handleHashModal();
    
    // Phone number formatting is initialized in a separate DOMContentLoaded handler above
});

// Initialize Supabase after page fully loads (ensures library is available)
window.addEventListener('load', function() {
    // Try to initialize Supabase client
    if (!initSupabase()) {
        // Try again after a short delay if it didn't work
        setTimeout(function() {
            initSupabase();
        }, 1000);
    }
});

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

// Phone number formatting
function formatPhoneNumber(input) {
    // Remove all non-digit characters
    let value = input.value.replace(/\D/g, '');
    
    // Format as XXX-XXX-XXXX
    if (value.length <= 3) {
        input.value = value;
    } else if (value.length <= 6) {
        input.value = value.slice(0, 3) + '-' + value.slice(3);
    } else {
        input.value = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6, 10);
    }
}

// Initialize phone formatting on page load
document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            formatPhoneNumber(e.target);
        });
        
        phoneInput.addEventListener('keydown', function(e) {
            // Allow backspace, delete, tab, escape, enter
            if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
                // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                (e.keyCode === 65 && e.ctrlKey === true) ||
                (e.keyCode === 67 && e.ctrlKey === true) ||
                (e.keyCode === 86 && e.ctrlKey === true) ||
                (e.keyCode === 88 && e.ctrlKey === true) ||
                // Allow home, end, left, right
                (e.keyCode >= 35 && e.keyCode <= 39)) {
                return;
            }
            // Ensure that it is a number and stop the keypress
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });
    }
});

// Supabase configuration
const SUPABASE_URL = 'https://empmaiqjpyhanrpuabou.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcG1haXFqcHloYW5ycHVhYm91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTU1MjAsImV4cCI6MjA3NzI5MTUyMH0.rRZsoyrEfvkNiBkOjBUQPjw38_bhIOBJarrjwusWXmM';

// Initialize Supabase client (will be initialized after DOM and library loads)
let supabaseClient = null;

// Function to initialize Supabase client
function initSupabase() {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase client initialized');
            return true;
        } catch (error) {
            console.error('Error initializing Supabase:', error);
            return false;
        }
    }
    return false;
}

// Form submission handling
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');
const formError = document.getElementById('formError');

if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Hide any previous messages
        if (formSuccess) formSuccess.style.display = 'none';
        if (formError) formError.style.display = 'none';
        
        // Get form data
        const formData = new FormData(contactForm);
        const name = formData.get('name');
        const email = formData.get('email');
        const phone = formData.get('phone');
        const referral = formData.get('referral');
        
        try {
            // Try to submit to Supabase first
            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .from('vip_early_adopters')
                        .insert([
                            {
                                name: name,
                                email: email,
                                phone: phone,
                                referral_source: referral,
                                submitted_at: new Date().toISOString()
                            }
                        ])
                        .select();
                    
                    if (error) {
                        console.warn('Supabase error:', error);
                        // If table doesn't exist (404), fall through to Netlify
                        if (error.code === 'PGRST116' || error.message.includes('404')) {
                            throw new Error('Table not found - using Netlify fallback');
                        }
                        throw error;
                    }
                    
                    // Success! Show message and reset form
                    if (formSuccess) {
                        formSuccess.style.display = 'block';
                        formSuccess.textContent = 'Thank you! You\'ve been added to our VIP early access list. We\'ll be in touch soon!';
                        formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                    contactForm.reset();
                    return; // Success, exit early
                } catch (supabaseError) {
                    console.warn('Supabase submission failed, trying Netlify:', supabaseError);
                    // Fall through to Netlify fallback
                }
            }
            
            // Fallback to Netlify form submission
            const formData = new FormData(contactForm);
            const response = await fetch('/', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                // Success with Netlify
                if (formSuccess) {
                    formSuccess.style.display = 'block';
                    formSuccess.textContent = 'Thank you! You\'ve been added to our VIP early access list. We\'ll be in touch soon!';
                    formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                contactForm.reset();
                
                // Redirect to success page
                window.location.href = '/?form-submitted=true';
            } else {
                throw new Error('Form submission failed');
            }
            
        } catch (error) {
            console.error('Error submitting form:', error);
            
            // Show error message
            if (formError) {
                formError.style.display = 'block';
                formError.textContent = 'Oops! Something went wrong. Please try again or contact us directly.';
                formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    });
}



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



// Handle hash changes (when user navigates with hash)
window.addEventListener('hashchange', function() {
    handleHashModal();
});
