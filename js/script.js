// ==================== LOADING SCREEN ====================
window.addEventListener('load', () => {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) loadingScreen.classList.add('hidden');
    }, 2200);
});

// ==================== HEADER SCROLL ====================
const header = document.getElementById('header');
const backToTop = document.getElementById('backToTop');

// Throttled scroll handler
let scrollTicking = false;
window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            if (scrollY > 80) {
                if (header) header.classList.add('scrolled');
                if (backToTop) backToTop.classList.add('show');
            } else {
                if (header) header.classList.remove('scrolled');
                if (backToTop) backToTop.classList.remove('show');
            }
            // Active nav on scroll
            const sections = document.querySelectorAll('section[id]');
            sections.forEach(section => {
                if (scrollY >= section.offsetTop - 100) {
                    document.querySelectorAll('.nav-menu a').forEach(a => a.classList.remove('active'));
                    const activeLink = document.querySelector(`.nav-menu a[href="#${section.id}"]`);
                    if (activeLink) activeLink.classList.add('active');
                }
            });
            scrollTicking = false;
        });
        scrollTicking = true;
    }
}, { passive: true });

// ==================== MOBILE MENU ====================
function toggleMobileMenu() {
    const menu = document.getElementById('navMenu');
    const toggle = document.getElementById('mobileToggle');
    if (menu && toggle) {
        menu.classList.toggle('open');
        toggle.innerHTML = menu.classList.contains('open')
            ? '<i class="fas fa-times"></i>'
            : '<i class="fas fa-bars"></i>';
    }
}

document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        const menu = document.getElementById('navMenu');
        const toggle = document.getElementById('mobileToggle');
        if (menu) menu.classList.remove('open');
        if (toggle) toggle.innerHTML = '<i class="fas fa-bars"></i>';
    });
});

// ==================== HERO SLIDER ====================
const slides = document.querySelectorAll('.hero-slide');
let currentSlide = 0;

if (slides.length > 0) {
    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 5000);
}

// ==================== GALLERY DATA (77 ảnh thực) ====================
const CATEGORIES = ['company', 'birthday', 'event'];
const validImageIds = [3, 4, 5, 10, 12, 13, 14, 15, 16, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33, 34, 35, 37, 38, 41, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 68, 69, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 85, 86, 87, 88, 89, 90, 91, 92, 94, 95, 96, 98];
const TOTAL_IMAGES = validImageIds.length;
const INITIAL_PAGE_SIZE = 12;  // Nhỏ hơn để tải nhanh hơn
const MORE_PAGE_SIZE = 24;

const allImages = validImageIds.map((id, i) => ({
    src: `imgs/banh (${id}).jpg`,
    alt: `Tiệc Lưu Động Candy - Ảnh ${id}`,
    category: CATEGORIES[i % CATEGORIES.length],
    index: i
}));

let currentFilter = 'all';
let currentPage = 0;
let filteredImages = [];
let isRendering = false;

function getFilteredImages() {
    return currentFilter === 'all' ? allImages : allImages.filter(img => img.category === currentFilter);
}

// Intersection Observer for lazy image loading
const imgObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            if (src) {
                img.src = src;
                img.removeAttribute('data-src');
                imgObserver.unobserve(img);
                img.addEventListener('load', () => {
                    img.closest('.masonry-item')?.classList.add('loaded');
                }, { once: true });
                // fallback if already cached
                if (img.complete) {
                    img.closest('.masonry-item')?.classList.add('loaded');
                }
            }
        }
    });
}, {
    rootMargin: '300px 0px',  // Pre-load 300px trước khi vào viewport
    threshold: 0
});

function createGalleryItem(img, pageIndex) {
    const item = document.createElement('div');
    item.className = 'masonry-item';
    item.dataset.category = img.category;
    item.onclick = () => openLightbox(img.index);

    const imgEl = document.createElement('img');
    imgEl.dataset.src = img.src;  // lazy load via IntersectionObserver
    imgEl.alt = img.alt;
    imgEl.decoding = 'async';
    imgEl.width = 400;   // Hint for browser layout
    imgEl.height = 300;

    const overlay = document.createElement('div');
    overlay.className = 'gallery-overlay';
    overlay.innerHTML = '<div class="gallery-zoom"><i class="fas fa-expand-alt"></i></div>';

    item.appendChild(imgEl);
    item.appendChild(overlay);

    // Observe image for lazy loading
    imgObserver.observe(imgEl);

    return item;
}

function renderGallery(reset = false) {
    if (isRendering) return;
    isRendering = true;

    const gallery = document.getElementById('mainGallery');
    if (!gallery) { isRendering = false; return; }

    if (reset) {
        gallery.innerHTML = '';
        currentPage = 0;
    }

    filteredImages = getFilteredImages();
    const pageSize = currentPage === 0 ? INITIAL_PAGE_SIZE : MORE_PAGE_SIZE;
    const start = currentPage === 0 ? 0 : INITIAL_PAGE_SIZE + (currentPage - 1) * MORE_PAGE_SIZE;
    const end = Math.min(start + pageSize, filteredImages.length);
    const pageImages = filteredImages.slice(start, end);

    // Use DocumentFragment for single reflow
    const fragment = document.createDocumentFragment();
    pageImages.forEach((img, localIdx) => {
        fragment.appendChild(createGalleryItem(img, localIdx));
    });
    gallery.appendChild(fragment);

    // Animate items in with staggered RAF
    const newItems = [...gallery.querySelectorAll('.masonry-item:not(.visible-init)')];
    const firstNewIdx = newItems.length - pageImages.length;
    requestAnimationFrame(() => {
        newItems.slice(firstNewIdx).forEach((item, i) => {
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'scale(1) translateY(0)';
                item.classList.add('visible-init');
            }, 50 * i);
        });
    });

    currentPage++;

    // Update counter
    const shown = start + pageImages.length;
    const shownCount = document.getElementById('galleryShownCount');
    if (shownCount) shownCount.textContent = shown;

    // Update load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        if (shown >= filteredImages.length) {
            loadMoreBtn.innerHTML = '<i class="fas fa-check"></i> Đã Xem Hết';
            loadMoreBtn.disabled = true;
            loadMoreBtn.style.opacity = '0.5';
        } else {
            const remaining = filteredImages.length - shown;
            loadMoreBtn.innerHTML = `<i class="fas fa-images"></i> Xem Thêm (còn ${remaining} ảnh)`;
            loadMoreBtn.disabled = false;
            loadMoreBtn.style.opacity = '1';
        }
    }

    isRendering = false;
}

// Init gallery - defer until after critical rendering
if ('requestIdleCallback' in window) {
    requestIdleCallback(() => renderGallery(true), { timeout: 2000 });
} else {
    setTimeout(() => renderGallery(true), 100);
}

// ==================== GALLERY FILTER ====================
function filterGallery(category, btn) {
    document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    currentFilter = category;
    renderGallery(true);
}

// ==================== LOAD MORE ====================
function loadMoreGallery() {
    renderGallery(false);
}

// ==================== EVENT TOGGLE ====================
function toggleEvent(header) {
    const body = header.nextElementSibling;
    const toggle = header.querySelector('.event-toggle');
    if (body) body.classList.toggle('open');
    if (toggle) toggle.classList.toggle('open');
}

// ==================== LOAD MORE EVENTS ====================
const INITIAL_EVENTS = 3;
let currentVisibleEvents = INITIAL_EVENTS;

function initEventsLoadMore() {
    const events = document.querySelectorAll('.events-section .event-card');
    const wrap = document.getElementById('loadMoreEventsWrap');
    const loadMoreBtn = document.getElementById('loadMoreEventsBtn');
    const collapseBtn = document.getElementById('collapseEventsBtn');
    
    if (!events.length) return;
    
    events.forEach((ev, i) => {
        if(i >= currentVisibleEvents) {
            ev.style.display = 'none';
            ev.classList.remove('visible'); 
        } else {
            ev.style.display = 'block';
        }
    });

    if (wrap && loadMoreBtn && collapseBtn) {
        if (events.length <= currentVisibleEvents) {
            loadMoreBtn.style.display = 'none';
            collapseBtn.style.display = 'none';
            wrap.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'inline-block';
            collapseBtn.style.display = 'none';
            wrap.style.display = 'block';
        }
    }
}

function loadMoreEvents() {
    const events = document.querySelectorAll('.events-section .event-card');
    const loadMoreBtn = document.getElementById('loadMoreEventsBtn');
    const collapseBtn = document.getElementById('collapseEventsBtn');
    
    currentVisibleEvents += 3;
    
    events.forEach((ev, i) => {
        if(i < currentVisibleEvents && ev.style.display === 'none') {
            ev.style.display = 'block';
            
            // Ép browser reflow để animation hoạt động ngay
            void ev.offsetWidth; 
            ev.classList.add('visible');
        }
    });

    if (events.length <= currentVisibleEvents && loadMoreBtn && collapseBtn) {
        loadMoreBtn.style.display = 'none';
        collapseBtn.style.display = 'inline-block';
    }
}

function collapseEvents() {
    const events = document.querySelectorAll('.events-section .event-card');
    const loadMoreBtn = document.getElementById('loadMoreEventsBtn');
    const collapseBtn = document.getElementById('collapseEventsBtn');
    
    currentVisibleEvents = INITIAL_EVENTS;
    
    events.forEach((ev, i) => {
        if(i >= currentVisibleEvents) {
            ev.style.display = 'none';
            ev.classList.remove('visible');
            const toggle = ev.querySelector('.event-toggle');
            const body = ev.querySelector('.event-body');
            if (body) body.classList.remove('open');
            if (toggle) toggle.classList.remove('open');
        }
    });

    if (loadMoreBtn && collapseBtn) {
        loadMoreBtn.style.display = 'inline-block';
        collapseBtn.style.display = 'none';
    }

    // Cuộn mượt mà lên lại phần Sự kiện
    const eventsSection = document.getElementById('events');
    if (eventsSection) {
        const offset = 100; // Để chừa khoảng trống cho fixed header
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = eventsSection.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }
}

window.addEventListener('DOMContentLoaded', initEventsLoadMore);


// ==================== LIGHTBOX ====================
let lightboxIndex = 0;

function openLightbox(globalIndex) {
    lightboxIndex = globalIndex;
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const counter = document.getElementById('lightboxCounter');
    const img = allImages[lightboxIndex];
    if (!img) return;
    if (lightboxImg) { lightboxImg.src = img.src; lightboxImg.alt = img.alt; }
    if (counter) counter.textContent = `${lightboxIndex + 1} / ${TOTAL_IMAGES}`;
    if (lightbox) lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Preload adjacent images
    const preloadNext = allImages[(lightboxIndex + 1) % TOTAL_IMAGES];
    const preloadPrev = allImages[(lightboxIndex - 1 + TOTAL_IMAGES) % TOTAL_IMAGES];
    [preloadNext, preloadPrev].forEach(p => { if (p) new Image().src = p.src; });
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function navigateLightbox(dir) {
    lightboxIndex = (lightboxIndex + dir + TOTAL_IMAGES) % TOTAL_IMAGES;
    const lightboxImg = document.getElementById('lightboxImg');
    const counter = document.getElementById('lightboxCounter');
    const img = allImages[lightboxIndex];
    if (lightboxImg && img) {
        lightboxImg.style.opacity = '0';
        setTimeout(() => {
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightboxImg.style.opacity = '1';
        }, 150);
    }
    if (counter) counter.textContent = `${lightboxIndex + 1} / ${TOTAL_IMAGES}`;

    // Preload next
    const preloadNext = allImages[(lightboxIndex + dir + TOTAL_IMAGES) % TOTAL_IMAGES];
    if (preloadNext) new Image().src = preloadNext.src;
}

document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox?.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
});

document.getElementById('lightbox')?.addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox();
});

// ==================== TESTIMONIAL SLIDER ====================
const testimonials = [
    { text: '"Tiệc bánh trà của Candy rất đẹp và ngon! Mọi người trong công ty đều rất ấn tượng. Setup sang trọng, bánh tươi ngon, phục vụ chu đáo. Chắc chắn sẽ đặt lại!"', name: 'Chị Anh Thư', role: 'HR Manager — Công ty ABC', avatar: 'A' },
    { text: '"Mình đặt set tiệc sinh nhật cho con, Candy setup đẹp lung linh luôn! Bánh ngon, trình bày rất bắt mắt. Khách đến ai cũng khen. 10 điểm!"', name: 'Chị Minh Ngọc', role: 'Khách hàng cá nhân', avatar: 'M' },
    { text: '"Chuyên nghiệp từ khâu tư vấn đến setup. Sự kiện ra mắt sản phẩm của công ty mình được Candy lo phần tea break hoàn hảo. Recommend mạnh!"', name: 'Anh Hùng Nguyễn', role: 'Marketing Director — Startup XYZ', avatar: 'H' },
    { text: '"Giá rất hợp lý so với chất lượng. Bánh ngọt tươi, trái cây đẹp, trang trí hoa thật sang. Candy đúng là lựa chọn tuyệt vời cho tea break!"', name: 'Chị Thu Hà', role: 'Office Manager — Công ty DEF', avatar: 'T' }
];

let currentTestimonial = 0;
setInterval(() => {
    currentTestimonial = (currentTestimonial + 1) % testimonials.length;
    const t = testimonials[currentTestimonial];
    const card = document.getElementById('testimonialCard');
    if (!card) return;
    card.style.opacity = 0;
    card.style.transform = 'translateY(20px)';
    setTimeout(() => {
        document.getElementById('testimonialText').textContent = t.text;
        document.getElementById('testimonialName').textContent = t.name;
        document.getElementById('testimonialRole').textContent = t.role;
        document.getElementById('testimonialAvatar').textContent = t.avatar;
        card.style.opacity = 1;
        card.style.transform = 'translateY(0)';
    }, 400);
}, 6000);

// ==================== SCROLL ANIMATIONS (Intersection Observer) ====================
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeObserver.unobserve(entry.target); // Stop observing once visible
        }
    });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(el => {
    fadeObserver.observe(el);
});

// ==================== FORM SUBMIT ====================
function handleFormSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-submit');
    if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Đã Gửi Thành Công!';
        btn.style.background = '#25D366';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            e.target.reset();
        }, 3000);
    }
}

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        e.preventDefault();
        document.querySelector(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ==================== PRICING SCROLL LOGIC ====================
const s4_container = document.getElementById('scrollContainer');
const s4_dots = document.querySelectorAll('.s4-dot');
const s4_counterEl = document.getElementById('counter');
const s4_progressFill = document.getElementById('progressFill');
const s4_cards = document.querySelectorAll('.s4-card');
const s4_total = s4_cards.length;
let s4_currentIndex = 0;

if (s4_container) {
    function s4_updateUI() {
        const scrollLeft = s4_container.scrollLeft;
        const cardWidth = s4_cards[0].offsetWidth + 28; // gap
        s4_currentIndex = Math.round(scrollLeft / cardWidth);
        s4_currentIndex = Math.max(0, Math.min(s4_currentIndex, s4_total - 1));

        s4_dots.forEach((d, i) => d.classList.toggle('active', i === s4_currentIndex));
        if (s4_counterEl) s4_counterEl.textContent = `${s4_currentIndex + 1} / ${s4_total}`;
        if (s4_progressFill) s4_progressFill.style.width = `${((s4_currentIndex + 1) / s4_total) * 100}%`;
    }

    s4_container.addEventListener('scroll', s4_updateUI);

    window.goToCard = function(index) {
        const cardWidth = s4_cards[0].offsetWidth + 28;
        s4_container.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    };

    window.scrollToCard = function(dir) {
        const next = Math.max(0, Math.min(s4_currentIndex + dir, s4_total - 1));
        window.goToCard(next);
    };

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') window.scrollToCard(-1);
        if (e.key === 'ArrowRight') window.scrollToCard(1);
    });

    // Drag to scroll
    let isDown = false, startX, scrollLeftStart;
    s4_container.addEventListener('mousedown', (e) => {
        isDown = true;
        s4_container.style.cursor = 'grabbing';
        startX = e.pageX - s4_container.offsetLeft;
        scrollLeftStart = s4_container.scrollLeft;
    });
    s4_container.addEventListener('mouseleave', () => { isDown = false; s4_container.style.cursor = 'grab'; });
    s4_container.addEventListener('mouseup', () => { isDown = false; s4_container.style.cursor = 'grab'; });
    s4_container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - s4_container.offsetLeft;
        const walk = (x - startX) * 1.5;
        s4_container.scrollLeft = scrollLeftStart - walk;
    });
}
