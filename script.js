const siteConfig = {
  whatsappNumber: "972532317044",
  phoneDisplay: "053-231-7044",
  phoneTel: "0532317044",
  instagramHandle: "cross.the.city",
  instagramUrl: "https://www.instagram.com/cross.the.city/",
  facebookUrl: "https://www.facebook.com/crossthecitytiberias",
};

function buildWhatsAppUrl(message) {
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

const siteConfigWhatsApp = {
  get whatsappUrl() {
    return buildWhatsAppUrl("שלום, מעוניין/ת באימון שמתאים לדרך שלי — Cross The City");
  },
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const loader = document.querySelector("#site-loader");
const loaderPct = document.querySelector("#site-loader-pct");
const loaderMinMs = 1100;
const loaderMaxMs = 4500;
const loaderFinishMs = 480;
let loaderProgressRaf = 0;
let loaderProgressValue = 0;

function revealHeroCopy() {
  document.querySelectorAll(".hero .reveal").forEach((item) => {
    item.classList.add("visible");
  });
}

function setLoaderProgress(value) {
  if (!loader) return;

  loaderProgressValue = value;
  loader.style.setProperty("--loader-progress", `${value}%`);
  if (loaderPct) loaderPct.textContent = String(Math.round(value));
}

function stopLoaderProgress() {
  if (loaderProgressRaf) {
    cancelAnimationFrame(loaderProgressRaf);
    loaderProgressRaf = 0;
  }
}

function runLoaderProgress() {
  if (!loader || loader.classList.contains("is-finishing") || loader.classList.contains("is-done")) {
    return;
  }

  const target = 94;
  loaderProgressValue = Math.min(
    target,
    loaderProgressValue + Math.max(0.35, (target - loaderProgressValue) * 0.05),
  );
  setLoaderProgress(loaderProgressValue);
  loaderProgressRaf = requestAnimationFrame(runLoaderProgress);
}

function finishLoading() {
  if (!loader || loader.classList.contains("is-done") || loader.classList.contains("is-finishing")) {
    return;
  }

  stopLoaderProgress();
  loader.classList.add("is-finishing");
  setLoaderProgress(100);

  window.setTimeout(() => {
    loader.classList.add("is-done");
    loader.setAttribute("aria-busy", "false");
    document.body.classList.remove("is-loading");
    revealHeroCopy();
    window.setTimeout(() => loader.remove(), 780);
  }, loaderFinishMs);
}

function initSiteLoader() {
  if (!loader) return;

  setLoaderProgress(0);
  runLoaderProgress();

  const startedAt = performance.now();
  const heroImage = document.querySelector(".hero-media > img:not(.hero-wall-logo)");
  const loaderWordmark = document.querySelector(".site-loader__wordmark");

  function waitForImage(img) {
    if (!img) return Promise.resolve();
    return img.complete
      ? Promise.resolve()
      : new Promise((resolve) => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        });
  }

  const waitForWindow = new Promise((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", resolve, { once: true });
  });

  Promise.all([waitForImage(heroImage), waitForImage(loaderWordmark), waitForWindow]).then(() => {
    const elapsed = performance.now() - startedAt;
    const remaining = Math.max(0, loaderMinMs - elapsed);
    window.setTimeout(finishLoading, remaining);
  });

  window.setTimeout(finishLoading, loaderMaxMs);
}

if (!loader) {
  document.body.classList.remove("is-loading");
  revealHeroCopy();
} else if (reducedMotion) {
  window.setTimeout(() => {
    finishLoading();
    document.querySelectorAll(".reveal").forEach((item) => item.classList.add("visible"));
  }, 120);
} else {
  initSiteLoader();
}

const header = document.querySelector(".site-header");
const menuButton = document.querySelector(".menu-toggle");
const menu = document.querySelector(".main-nav");
const toast = document.querySelector(".toast");

document.querySelector("#year").textContent = new Date().getFullYear();

function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  menu.classList.remove("open");
  document.body.classList.remove("menu-open");
}

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menu.classList.toggle("open", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
});

menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 24);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const introScroll = document.querySelector(".intro-scroll");
const scrollCue = document.querySelector(".hero > .scroll-cue");

function updateScrollCueVisibility() {
  if (!scrollCue) return;

  const hasStartedScrolling =
    window.scrollY > Math.max(24, window.innerHeight * 0.03);
  scrollCue.classList.toggle("scroll-cue--hide", hasStartedScrolling);
}

if (introScroll && !reducedMotion) {
  let introFrame = 0;

  function updateIntroTransition() {
    introFrame = 0;
    const scrollRange = window.innerHeight * 1.85;
    const progress = Math.min(
      1,
      Math.max(0, -introScroll.getBoundingClientRect().top / scrollRange),
    );

    introScroll.style.setProperty("--intro-progress", progress.toFixed(4));
    updateScrollCueVisibility();
  }

  function requestIntroTransition() {
    if (introFrame) return;
    introFrame = window.requestAnimationFrame(updateIntroTransition);
  }

  updateIntroTransition();
  window.addEventListener("scroll", requestIntroTransition, { passive: true });
  window.addEventListener("resize", requestIntroTransition);
} else {
  updateScrollCueVisibility();
}

const revealItems = document.querySelectorAll(".reveal");
let revealObserver = null;

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("visible"));
} else {
  revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px" },
  );

  revealItems.forEach((item) => {
    if (item.closest(".hero")) return;
    revealObserver.observe(item);
  });
}

const instagramHandleEl = document.querySelector("#instagram-handle");

if (instagramHandleEl && siteConfig.instagramHandle) {
  instagramHandleEl.textContent = `@${siteConfig.instagramHandle.replace(/^@/, "")}`;
}

let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3600);
}

document.querySelectorAll(".whatsapp-link").forEach((link) => {
  if (!siteConfig.whatsappNumber) return;
  link.href = siteConfigWhatsApp.whatsappUrl;
  link.target = "_blank";
  link.rel = "noreferrer";
});

document.querySelectorAll(".instagram-link").forEach((link) => {
  if (!siteConfig.instagramUrl) return;
  link.href = siteConfig.instagramUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
});

const instagramContactLink = document.querySelector("#contact-instagram");
if (instagramContactLink && siteConfig.instagramHandle) {
  instagramContactLink.textContent = `@${siteConfig.instagramHandle} ↗`;
}

document.querySelectorAll(".whatsapp-pending").forEach((button) => {
  button.addEventListener("click", () => {
    if (!siteConfig.whatsappNumber) {
      showToast("מספר הוואטסאפ טרם אומת.");
      return;
    }

    window.open(siteConfigWhatsApp.whatsappUrl, "_blank", "noopener,noreferrer");
  });
});

const leadForm = document.querySelector("#lead-form");

function normalizePhone(value) {
  return value.replace(/\D/g, "");
}

function isValidIsraeliPhone(value) {
  const digits = normalizePhone(value);
  return /^0?5\d{8}$/.test(digits) || /^9725\d{8}$/.test(digits);
}

if (leadForm) {
  leadForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const nameInput = leadForm.querySelector("#lead-name");
    const phoneInput = leadForm.querySelector("#lead-phone");
    const topicSelect = leadForm.querySelector("#lead-topic");
    const messageInput = leadForm.querySelector("#lead-message");

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const topic = topicSelect.value.trim();
    const message = messageInput.value.trim();

    let valid = true;

    if (!name) {
      nameInput.setAttribute("aria-invalid", "true");
      valid = false;
    } else {
      nameInput.removeAttribute("aria-invalid");
    }

    if (!isValidIsraeliPhone(phone)) {
      phoneInput.setAttribute("aria-invalid", "true");
      valid = false;
    } else {
      phoneInput.removeAttribute("aria-invalid");
    }

    if (!valid) {
      showToast("נא למלא שם וטלפון תקין.");
      return;
    }

    if (!siteConfig.whatsappNumber) {
      showToast("שליחת הטופס אינה זמינה כרגע.");
      return;
    }

    const lines = [
      "שלום, השארתי פרטים באתר Cross The City:",
      `שם: ${name}`,
      `טלפון: ${phone}`,
    ];

    if (topic) lines.push(`נושא: ${topic}`);
    if (message) lines.push(`הודעה: ${message}`);

    window.open(buildWhatsAppUrl(lines.join("\n")), "_blank", "noopener,noreferrer");
    leadForm.reset();
    showToast("מעבירים אתכם לוואטסאפ עם הפרטים.");
  });
}

const phoneField = document.querySelector("#contact-phone");
if (phoneField && siteConfig.phoneDisplay) {
  if (siteConfig.phoneTel) {
    phoneField.innerHTML = `<a href="tel:${siteConfig.phoneTel}">${siteConfig.phoneDisplay}</a>`;
  } else {
    phoneField.textContent = siteConfig.phoneDisplay;
  }
}
