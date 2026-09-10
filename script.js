"use strict";

// ── DOM References ──
const nav = document.getElementById("nav");
const toggle = document.getElementById("navToggle");
const links = document.getElementById("navLinks");
const navAnchors = document.querySelectorAll(".nav__links a");
const contactForm = document.getElementById("contactForm");
const submitBtn = document.getElementById("submitBtn");
const toast = document.getElementById("toast");
const workGrid = document.getElementById("workGrid");
const filterBtns = document.querySelectorAll(".filter-btn");

// Cursor Elements
const cursorDot = document.getElementById("cursorDot");
const cursorRing = document.getElementById("cursorRing");

// Audio Toggle Elements
const soundToggle = document.getElementById("soundToggle");
const soundIcon = document.getElementById("soundIcon");

// Modal Elements
const projectModal = document.getElementById("projectModal");
const modalClose = document.getElementById("modalClose");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalContent = document.getElementById("modalContent");

// ── Web Audio API Micro-Interactions ──
let audioCtx = null;
let soundEnabled = localStorage.getItem("soundFX") === "true";

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
}

function updateSoundUI() {
  if (soundEnabled) {
    soundToggle.classList.add("active");
    soundIcon.textContent = "🔊";
    soundToggle.setAttribute("aria-label", "Sound effects enabled");
  } else {
    soundToggle.classList.remove("active");
    soundIcon.textContent = "🔇";
    soundToggle.setAttribute("aria-label", "Sound effects muted");
  }
}
updateSoundUI();

soundToggle.addEventListener("click", () => {
  initAudio();
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  soundEnabled = !soundEnabled;
  localStorage.setItem("soundFX", String(soundEnabled));
  updateSoundUI();
  if (soundEnabled) playSound("click");
});

function playSound(type) {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === "hover") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.05);
    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === "click") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === "success") {
    // Elegant two-tone chime
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(783.99, now + 0.22); // G5
    gain2.gain.setValueAtTime(0.04, now + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc2.start(now + 0.22);
    osc2.stop(now + 0.55);
  }
}

// ── Custom Glow Cursor ──
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let ringX = mouseX;
let ringY = mouseY;

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (cursorDot) {
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
  }
});

function renderCursorRing() {
  ringX += (mouseX - ringX) * 0.2;
  ringY += (mouseY - ringY) * 0.2;
  if (cursorRing) {
    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;
  }
  requestAnimationFrame(renderCursorRing);
}
requestAnimationFrame(renderCursorRing);

// Hover scaling on interactive elements
const interactiveElements =
  "a, button, input, select, textarea, .project, .service, .tag, .faq__question, .process__card, .testimonial-card";
document.querySelectorAll(interactiveElements).forEach((el) => {
  el.addEventListener("mouseenter", () => {
    if (cursorRing) cursorRing.classList.add("active");
    playSound("hover");
  });
  el.addEventListener("mouseleave", () => {
    if (cursorRing) cursorRing.classList.remove("active");
  });
  el.addEventListener("click", () => {
    playSound("click");
  });
});

// ── Case Study Data Store ──
const projectData = {
  apex: {
    title: "Apex Brand Relaunch",
    category: "Brand Identity & Packaging",
    image:
      "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=1200&q=80",
    client: "Apex Luxury Goods (New York / Austin)",
    year: "2024",
    deliverables:
      "Identity System, Custom Typography, Luxury Packaging, Print Collateral, Brand Guidelines",
    challenge:
      "Apex was operating with an outdated visual language that failed to command luxury price points in a competitive luxury direct-to-consumer landscape.",
    solution:
      "Engineered a stark, minimalist visual identity anchored by bespoke debossed typography, warm gold foil accents on tactile matte stocks, and a modern scalable digital design system.",
    impact:
      "+340% increase in average order value and featured across top design publications within 60 days of relaunch.",
  },
  editorial: {
    title: "Noir Aura Editorial Series",
    category: "Editorial Photography",
    image:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80",
    client: "Noir Studio & Apparel",
    year: "2024",
    deliverables: "Art Direction, Casting, Studio Shoot, Master Color Grading, Lookbook Assets",
    challenge:
      "Creating a hauntingly elegant editorial photo essay to launch an avant-garde eveningwear collection without relying on predictable runway motifs.",
    solution:
      "Deployed dramatic chiaroscuro studio lighting, moody atmospheric haze, and dynamic camera angles to emphasize rich garment silhouettes and tactile fabrics.",
    impact:
      "Syndicated across 3 major digital fashion publications and drove an immediate collection sell-out.",
  },
  social: {
    title: "Velocity Digital Campaign",
    category: "Content Creation & Social Media",
    image:
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1200&q=80",
    client: "Velocity Performance",
    year: "2024",
    deliverables:
      "Social Media Strategy, 40+ Short-form Video Assets, Motion Templates, Visual Content Guidelines",
    challenge:
      "Re-energizing a performance brand on TikTok and Instagram to attract a younger demographic accustomed to ultra-fast visual editing.",
    solution:
      "Produced a cohesive 60-day visual rollout blending high-octane macro photography, kinetic typography, and pulse-driven motion design.",
    impact:
      "Generated 2.4M organic impressions, 45,000+ new followers, and a 220% lift in engagement rate.",
  },
  lookbook: {
    title: "Look Book 2024",
    category: "Visual Direction & Print Publication",
    image:
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80",
    client: "Atelier Monochrome",
    year: "2024",
    deliverables: "Art Direction, Editorial Layout, Print Management, Physical Curation",
    challenge:
      "Designing a collectible, limited-run print monograph that serves as both a seasonal lookbook and a coffee table art piece.",
    solution:
      "Curated 120 pages of archival Japanese paper, raw exposed thread binding, and minimalist Swiss grid typography to highlight collection details.",
    impact:
      "Exhibited at independent publishing fairs and served as a high-conversion sales tool for VIP buyers.",
  },
  "brand-system": {
    title: "Omni Brand System",
    category: "Creative Strategy & Design Matrix",
    image:
      "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80",
    client: "Omni Ventures",
    year: "2023–2024",
    deliverables:
      "Master Brand Book, UI Design Tokens, Corporate Deck Systems, Exhibition Architecture",
    challenge:
      "Consolidating 4 disparate sub-brands under one authoritative, modern umbrella without losing existing brand equity.",
    solution:
      "Constructed an adaptive design matrix featuring variable logotypes, modular grids, and clear governance rules for internal teams.",
    impact: "Unified 120+ team members globally and reduced creative asset production time by 50%.",
  },
};

// ── Sticky Navigation & Active Section Highlight ──
window.addEventListener(
  "scroll",
  () => {
    nav.classList.toggle("scrolled", window.scrollY > 50);
    updateActiveNavLink();
  },
  { passive: true },
);

function updateActiveNavLink() {
  const sections = document.querySelectorAll("section, header.hero");
  const scrollPos = window.scrollY + 120;

  sections.forEach((section) => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute("id");

    if (scrollPos >= top && scrollPos < top + height && id) {
      navAnchors.forEach((a) => {
        if (a.getAttribute("href") === `#${id}`) {
          a.classList.add("active");
        } else if (!a.classList.contains("btn")) {
          a.classList.remove("active");
        }
      });
    }
  });
}

// ── Mobile Navigation Drawer ──
toggle.addEventListener("click", () => {
  const isOpen = links.classList.toggle("open");
  toggle.classList.toggle("open", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
});

links.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    links.classList.remove("open");
    toggle.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

// ── Smooth Scrolling with Offset ──
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const targetId = this.getAttribute("href");
    if (targetId === "#") return;

    const targetEl = document.querySelector(targetId);
    if (!targetEl) return;

    e.preventDefault();
    const navHeight = nav.offsetHeight || 70;
    const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - navHeight;

    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });
  });
});

// ── Intersection Observer for Scroll Fade-In ──
const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
);

document.querySelectorAll(".fade-in").forEach((el) => fadeObserver.observe(el));

// ── Portfolio Category Filtering ──
filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");

    const filter = btn.getAttribute("data-filter");
    const projects = document.querySelectorAll(".project");

    projects.forEach((card) => {
      const categories = (card.getAttribute("data-category") || "").split(" ");
      if (filter === "all" || categories.includes(filter)) {
        card.classList.remove("hidden");
        setTimeout(() => {
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
        }, 30);
      } else {
        card.style.opacity = "0";
        card.style.transform = "translateY(15px)";
        setTimeout(() => card.classList.add("hidden"), 250);
      }
    });
  });
});

// ── 3D Card Tilt Effect ──
document.querySelectorAll(".tilt-card").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)";
  });
});

// ── Project Modal / Lightbox ──
document.querySelectorAll(".project").forEach((card) => {
  card.addEventListener("click", (e) => {
    const projectId = card.getAttribute("data-project");
    if (projectId && projectData[projectId]) {
      openModal(projectData[projectId]);
    }
  });
});

function openModal(data) {
  modalContent.innerHTML = `
    <img src="${data.image}" alt="${data.title}" class="modal__hero-img" loading="eager">
    <span class="modal__tag">${data.category}</span>
    <h3 class="modal__title" id="modalTitle">${data.title}</h3>
    
    <div class="modal__meta">
      <div class="modal__meta-item">
        <span class="modal__meta-label">Client</span>
        <span class="modal__meta-val">${data.client}</span>
      </div>
      <div class="modal__meta-item">
        <span class="modal__meta-label">Timeline</span>
        <span class="modal__meta-val">${data.year}</span>
      </div>
      <div class="modal__meta-item">
        <span class="modal__meta-label">Deliverables</span>
        <span class="modal__meta-val">${data.deliverables}</span>
      </div>
    </div>

    <div class="modal__body">
      <h4>The Challenge</h4>
      <p>${data.challenge}</p>

      <h4>The Creative Direction</h4>
      <p>${data.solution}</p>

      <h4>The Impact</h4>
      <p>${data.impact}</p>
    </div>
    <div style="margin-top: 2.5rem; text-align: right;">
      <a href="#contact" class="btn btn--gold modal-cta" onclick="closeModal()">Discuss Similar Project →</a>
    </div>
  `;

  projectModal.classList.add("open");
  projectModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  modalClose.focus();
}

function closeModal() {
  projectModal.classList.remove("open");
  projectModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && projectModal.classList.contains("open")) {
    closeModal();
  }
});

// ── FAQ Accordion ──
document.querySelectorAll(".faq__item").forEach((item) => {
  const btn = item.querySelector(".faq__question");
  btn.addEventListener("click", () => {
    const isActive = item.classList.contains("active");

    // Optional: close other accordions
    document.querySelectorAll(".faq__item").forEach((other) => {
      if (other !== item) {
        other.classList.remove("active");
        other.querySelector(".faq__question").setAttribute("aria-expanded", "false");
      }
    });

    item.classList.toggle("active", !isActive);
    btn.setAttribute("aria-expanded", String(!isActive));
  });
});

// ── Contact Form Validation & Submission ──
function showToast(message, isError = false) {
  toast.textContent = message;
  toast.className = `toast show ${isError ? "error" : ""}`;
  setTimeout(() => {
    toast.classList.remove("show");
  }, 5000);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

contactForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const nameInput = document.getElementById("userName");
  const emailInput = document.getElementById("userEmail");
  const messageInput = document.getElementById("userMessage");

  const nameError = document.getElementById("nameError");
  const emailError = document.getElementById("emailError");
  const messageError = document.getElementById("messageError");

  // Reset errors
  [nameInput, emailInput, messageInput].forEach((input) => input.classList.remove("error"));
  [nameError, emailError, messageError].forEach((el) => (el.textContent = ""));

  let isValid = true;

  if (!nameInput.value.trim()) {
    nameError.textContent = "Please enter your name.";
    nameInput.classList.add("error");
    isValid = false;
  }

  if (!emailInput.value.trim()) {
    emailError.textContent = "Please enter your email address.";
    emailInput.classList.add("error");
    isValid = false;
  } else if (!validateEmail(emailInput.value.trim())) {
    emailError.textContent = "Please provide a valid email address.";
    emailInput.classList.add("error");
    isValid = false;
  }

  if (!messageInput.value.trim() || messageInput.value.trim().length < 10) {
    messageError.textContent =
      "Please include details about your project (at least 10 characters).";
    messageInput.classList.add("error");
    isValid = false;
  }

  if (!isValid) {
    showToast("Please correct the highlighted errors.", true);
    return;
  }

  // Simulate Submission State
  submitBtn.classList.add("loading");
  submitBtn.disabled = true;

  setTimeout(() => {
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
    playSound("success");
    showToast("✓ Inquiry received! We will respond within 24 hours.");
    contactForm.reset();
  }, 1200);
});
