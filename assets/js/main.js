/*=============== SHOW MENU ===============*/
const navMenu = document.getElementById('nav-menu'),
      navToggle = document.getElementById('nav-toggle'),
      navClose = document.getElementById('nav-close')

if (navToggle) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.add('show-menu')
  })
}

if (navClose) {
  navClose.addEventListener('click', () => {
    navMenu.classList.remove('show-menu')
  })
}

/* Close menu when a nav link is clicked */
const navLinks = document.querySelectorAll('.nav__link')

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('show-menu')
  })
})

/*=============== SCROLL PROGRESS, HEADER STATE & SCROLL-TO-TOP ===============*/
/* One rAF-throttled scroll listener drives all three, instead of three separate listeners */
const header = document.getElementById('header'),
      scrollProgress = document.getElementById('scroll-progress'),
      scrollTopBtn = document.getElementById('scroll-top')

let scrollTicking = false

function updateOnScroll() {
  const scrollY = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  const progress = docHeight > 0 ? scrollY / docHeight : 0

  header.classList.toggle('scroll-header', scrollY >= 50)
  scrollProgress.style.transform = `scaleX(${progress})`
  scrollTopBtn.classList.toggle('show', scrollY >= 500)

  scrollTicking = false
}

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(updateOnScroll)
    scrollTicking = true
  }
})

updateOnScroll()

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

/*=============== HOME SPLIT TEXT ===============*/


/*=============== PROJECT DETAIL MODAL ===============*/
/* To add a project later: add its card in index.html, then add a matching
   entry here keyed by the same data-project value used on its Read More button. */
const PROJECT_DETAILS = {
  'aws-cicd-oidc': {
    title: 'Keyless CI/CD: GitHub Actions + AWS OIDC',
    overview: 'A CI/CD pipeline that deploys my serverless visitor counter API on every push, authenticating to AWS with OpenID Connect so no access keys are stored anywhere.',
    problem: 'Deploying from a laptop with long-lived admin keys is risky and does not scale: keys can leak, never expire on their own, and there is no shared, locked Terraform state for automation.',
    solution: 'A Terraform bootstrap creates a GitHub OIDC identity provider, a deploy role that trusts only my repository (by immutable IDs) on the main branch or pull requests, a versioned and encrypted S3 state bucket, and a DynamoDB lock table. The GitHub Actions workflow runs fmt, validate, and plan on pull requests, and plan, apply, and a live smoke test on main.',
    technologies: ['GitHub Actions', 'OpenID Connect (OIDC)', 'AWS IAM', 'AWS STS', 'Terraform', 'Amazon S3', 'Amazon DynamoDB'],
    challenges: 'The first run failed with AccessDenied on AssumeRoleWithWebIdentity. CloudTrail showed GitHub now sends a subject claim with immutable owner and repo IDs, so I updated the trust policy to match. That is also more secure, because a renamed or re-created repo cannot take over the role. The deploy role is scoped to only this project\'s Lambda, API, table, log group, and IAM role.',
    keyResults: ['Zero stored AWS keys in GitHub', '1-hour credentials, only for one repo and branch', 'Push to deploy in under a minute, with a live API smoke test', 'Shared remote state with locking and versioning', '$0 (free OIDC and IAM, free Actions for public repos)'],
  },
  'aws-sg-auto-remediation': {
    title: 'Security Group Auto-Remediation',
    overview: 'An event-driven security guardrail on AWS. When a security group rule opens SSH (22), RDP (3389), or all traffic to the internet, it is removed automatically and the team gets an email.',
    problem: 'One wrong security group rule can expose servers to the whole internet within seconds. Manual reviews are slow, and attackers scan for open SSH and RDP constantly.',
    solution: 'CloudTrail records the AuthorizeSecurityGroupIngress API call, an EventBridge rule matches it and triggers a Python Lambda. The Lambda reads the current rules and revokes only the world-open ranges (0.0.0.0/0 or ::/0) on risky ports, then SNS emails who made the change and what was removed. Everything is deployed with Terraform.',
    technologies: ['AWS CloudTrail', 'Amazon EventBridge', 'AWS Lambda', 'Amazon SNS', 'Amazon S3', 'Python', 'Terraform', 'IAM'],
    challenges: 'Fixing only what is dangerous. A rule allowing SSH from an office IP, or HTTPS from anywhere, must stay untouched, so the Lambda removes just the internet-wide ranges on SSH/RDP/all-traffic rules. It re-reads current state before acting, so duplicate events are harmless.',
    keyResults: ['Public SSH rule removed automatically within ~2 minutes', 'Email alert naming the SG and the IAM identity', 'Surgical fix: safe rules are kept', 'Least-privilege Lambda role, encrypted private log bucket', 'About $0 (free CloudTrail trail, logs expire in 7 days)'],
  },
  'aws-serverless-visitor-counter': {
    title: 'Serverless Visitor Counter API (with Observability)',
    overview: 'A live visitor counter for this portfolio, served by an AWS serverless API and deployed with Terraform through a keyless CI/CD pipeline. The number in the footer comes from it, and it is fully monitored with dashboards, alarms, and a cost budget.',
    problem: 'A static site on GitHub Pages has no backend, so it cannot count or store visits. I wanted a real, always-on API without running a server, and I needed to know right away if it ever broke or started costing money.',
    solution: 'The page calls an API Gateway HTTP API (GET /count). It triggers a Python Lambda that atomically adds 1 to a DynamoDB item and returns the new total. A CloudWatch dashboard shows requests, 4xx/5xx, p50/p90 latency, Lambda errors, throttles, duration, and DynamoDB writes. Four alarms (Lambda errors, API 5xx, p90 latency, throttles) email me through SNS, and an AWS Budget warns at 20% of a $5 monthly limit. Every change ships through GitHub Actions with OIDC.',
    technologies: ['AWS Lambda', 'API Gateway (HTTP API)', 'DynamoDB', 'CloudWatch Dashboards & Alarms', 'SNS', 'AWS Budgets', 'Python', 'Terraform', 'IAM'],
    challenges: 'Keeping a public endpoint secure and free: the Lambda role can only run UpdateItem on one table, CORS only allows this site, and throttling (5 req/s, burst 10) blocks abuse. For monitoring, I chose alarms on user impact (5xx, latency) instead of noisy metrics, used notBreaching for missing data so quiet periods do not page me, and tested the full alert path end to end with set-alarm-state.',
    keyResults: ['Live in production on this site', 'Dashboard + 4 alarms + budget, all tested end to end', 'Least-privilege IAM, CORS lock, throttling', 'Deployed by CI/CD, no laptop or stored keys', 'About $0/month (within always-free limits)'],
  },
  'aws-hub-spoke-network': {
    title: 'AWS Hub-and-Spoke Network (Terraform)',
    overview: 'A hub-and-spoke network on AWS built entirely with Terraform: a Shared services VPC (hub) peered with Dev and Prod VPCs (spokes), with private test instances used to prove the isolation.',
    problem: 'Dev and Prod environments need shared services, but a mistake in Dev must never be able to reach Prod. The design also had to stay at $0 for a learning account.',
    solution: 'Three VPCs with non-overlapping CIDRs, built from one reusable Terraform VPC module. Shared peers with Dev and with Prod, with no Dev-Prod link. Because VPC peering is non-transitive, Dev cannot route through Shared to reach Prod. Test instances run in private subnets with no public IPs and are reached through an EC2 Instance Connect Endpoint (no bastion, no SSH keys). IMDSv2 is required and EBS volumes are encrypted.',
    technologies: ['AWS', 'Terraform', 'VPC', 'VPC Peering', 'Route Tables', 'EC2', 'Security Groups', 'EC2 Instance Connect Endpoint'],
    challenges: 'Proving that isolation comes from routing and not the firewall. Prod was deliberately allowed to accept ping from all internal ranges, so a failed Dev to Prod ping can only mean there is no route. Cost was kept at $0 by choosing peering over Transit Gateway, skipping NAT Gateways, using one AZ, and toggling test instances off with a Terraform variable.',
    keyResults: ['Dev to Shared: 3/3 packets received (0% loss)', 'Dev to Prod: 0/3 received (100% loss), isolation proven', '18 resources managed as code with a reusable module', 'Private-only access, no public IPs or SSH keys', '$0 running cost'],
  },
  'aws-three-tier': {
    title: 'AWS Three-Tier Web Application',
    overview: 'Designed a production-style AWS infrastructure following cloud best practices.',
    problem: null,
    solution: null,
    technologies: ['AWS', 'EC2', 'ALB', 'Auto Scaling', 'RDS', 'VPC', 'IAM'],
    challenges: null,
    keyResults: ['High Availability', 'Secure networking', 'Private/Public subnets', 'Auto Scaling', 'Load Balancer', 'Database tier', 'IAM security'],
  },
  'cisco-enterprise-network': {
    title: 'Enterprise Network Infrastructure',
    overview: 'Enterprise network designed following Cisco best practices.',
    problem: null,
    solution: null,
    technologies: ['Cisco IOS', 'CCNA', 'CCNP', 'OSPF', 'EIGRP', 'ACL', 'VPN', 'HSRP'],
    challenges: null,
    keyResults: ['Inter-VLAN Routing', 'Redundant Gateways', 'Routing Protocols', 'Secure Remote Access', 'Network Segmentation', 'High Availability'],
  },
  'azure-hybrid-infrastructure': {
    title: 'Hybrid Azure Infrastructure',
    overview: 'Built hybrid cloud solutions integrating on-premises infrastructure with Microsoft Azure services.',
    problem: null,
    solution: null,
    technologies: ['Azure', 'Azure Virtual Network', 'Azure AD', 'ARM', 'Azure Monitor', 'Azure VM'],
    challenges: null,
    keyResults: ['Identity Management', 'Secure Connectivity', 'Virtual Networks', 'Monitoring', 'Infrastructure as Code'],
  },
  'portfolio-website': {
    title: 'Personal Portfolio Website',
    overview: 'Designed and developed a fully responsive portfolio showcasing projects, certifications, technical skills, and professional experience.',
    problem: 'Recruiters need one fast, clear place to see my certifications, experience, and real project work.',
    solution: 'A static HTML, CSS, and JavaScript site with no build step, hosted for free on GitHub Pages. Project details open in an accessible modal driven by a single data object, so adding a new project is one card plus one entry.',
    technologies: ['HTML', 'CSS', 'JavaScript', 'Responsive Design', 'ScrollReveal', 'GitHub'],
    challenges: 'Fixed a mobile bug where hero content stayed invisible on Android Chrome: opacity-based keyframe animations left elements hidden when they did not trigger. Rewrote them as transform-only animations.',
    keyResults: ['Responsive UI', 'Dark Theme', 'Modern Animations', 'Contact Form', 'Resume Download', 'Smooth Navigation'],
  },
}

const PROJECT_PLACEHOLDER_TEXT = {
  problem: '[Add the specific problem this project addressed.]',
  solution: '[Add how the solution was implemented.]',
  challenges: '[Add any notable challenges and how they were resolved.]',
}

const projectModal = document.getElementById('project-modal')

if (projectModal) {
  const modalTitle = projectModal.querySelector('.project-modal__title'),
        modalOverview = projectModal.querySelector('.project-modal__overview'),
        modalProblem = projectModal.querySelector('.project-modal__problem'),
        modalSolution = projectModal.querySelector('.project-modal__solution'),
        modalTech = projectModal.querySelector('.project-modal__tech'),
        modalChallenges = projectModal.querySelector('.project-modal__challenges'),
        modalResults = projectModal.querySelector('.project-modal__results')

  function setProjectModalField(el, value, placeholderKey) {
    if (value) {
      el.textContent = value
      el.classList.remove('is-placeholder')
    } else {
      el.textContent = PROJECT_PLACEHOLDER_TEXT[placeholderKey]
      el.classList.add('is-placeholder')
    }
  }

  function openProjectModal(key) {
    const data = PROJECT_DETAILS[key]
    if (!data) return

    modalTitle.textContent = data.title
    modalOverview.textContent = data.overview
    setProjectModalField(modalProblem, data.problem, 'problem')
    setProjectModalField(modalSolution, data.solution, 'solution')
    setProjectModalField(modalChallenges, data.challenges, 'challenges')

    modalTech.innerHTML = data.technologies
      .map((tech) => `<span class="projects__tech-tag">${tech}</span>`)
      .join('')

    modalResults.innerHTML = data.keyResults
      .map((result) => `<li>${result}</li>`)
      .join('')

    projectModal.classList.add('active')
    projectModal.setAttribute('aria-hidden', 'false')
    document.body.style.overflow = 'hidden'
  }

  function closeProjectModal() {
    projectModal.classList.remove('active')
    projectModal.setAttribute('aria-hidden', 'true')
    document.body.style.overflow = ''
  }

  document.querySelectorAll('.projects__read-more').forEach((btn) => {
    btn.addEventListener('click', () => openProjectModal(btn.dataset.project))
  })

  projectModal.querySelectorAll('[data-modal-close]').forEach((el) => {
    el.addEventListener('click', closeProjectModal)
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && projectModal.classList.contains('active')) {
      closeProjectModal()
    }
  })

  /* Never come back from bfcache with the modal still up. The overlay is a
     near-black sheet at 75% plus a blur, and opening the modal also sets
     body{overflow:hidden} — so a restored-open modal reads as a black screen
     that will not scroll. Escape is the only other way out and phones have no
     Escape key, so on mobile this is the difference between a stuck page and a
     working one. */
  window.addEventListener('pageshow', () => {
    if (projectModal.classList.contains('active')) closeProjectModal()
    else document.body.style.overflow = ''
  })
}

/*=============== CONTACT FORM SUBMIT (EmailJS) ===============*/
/*
  Setup required before this form can actually send email:
  1. Create a free account at https://www.emailjs.com
  2. Add an Email Service (e.g. connect your Gmail) and note its Service ID
  3. Create an Email Template and, in the template's own settings, set the
     "To Email" field to morcos.fady94@gmail.com — do this in the EmailJS
     dashboard, not in this code, so the destination can't be tampered with
     from the browser. Use {{from_name}}, {{from_email}}, {{message}} in the
     template body — those match the form field names below.
  4. Copy your Public Key, Service ID, and Template ID into the 3 constants
     below.
  5. In EmailJS dashboard → Account → Security, restrict allowed origins to
     your deployed domain(s) so the public key can't be used from elsewhere.
*/
const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY'
const EMAILJS_SERVICE_ID = 'YOUR_EMAILJS_SERVICE_ID'
const EMAILJS_TEMPLATE_ID = 'YOUR_EMAILJS_TEMPLATE_ID'

if (typeof emailjs !== 'undefined') {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY })
}

const contactForm = document.getElementById('contact-form'),
      contactSubmitBtn = document.getElementById('contact-submit'),
      contactStatus = document.getElementById('contact-status')

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function setFieldError(fieldId, errorId, message) {
  const field = document.getElementById(fieldId)
  const error = document.getElementById(errorId)

  if (message) {
    field.classList.remove('invalid')
    void field.offsetWidth // force reflow so the shake animation replays on repeated errors
    field.classList.add('invalid')
    error.textContent = message
    error.classList.add('active')
  } else {
    field.classList.remove('invalid')
    error.textContent = ''
    error.classList.remove('active')
  }
}

function validateContactForm() {
  const name = document.getElementById('contact-name').value.trim()
  const email = document.getElementById('contact-email').value.trim()
  const message = document.getElementById('contact-message').value.trim()
  let isValid = true

  if (!name) {
    setFieldError('contact-name', 'error-name', 'Please enter your name.')
    isValid = false
  } else {
    setFieldError('contact-name', 'error-name', '')
  }

  if (!email) {
    setFieldError('contact-email', 'error-email', 'Please enter your email.')
    isValid = false
  } else if (!EMAIL_PATTERN.test(email)) {
    setFieldError('contact-email', 'error-email', 'Please enter a valid email address.')
    isValid = false
  } else {
    setFieldError('contact-email', 'error-email', '')
  }

  if (!message) {
    setFieldError('contact-message', 'error-message', 'Please enter a message.')
    isValid = false
  } else {
    setFieldError('contact-message', 'error-message', '')
  }

  return isValid
}

function showContactStatus(type, text, icon) {
  contactStatus.className = `contact__form-status active contact__form-status--${type}`
  contactStatus.innerHTML = `<i class="${icon}"></i><p>${text}</p>`
}

function clearContactStatus() {
  contactStatus.className = 'contact__form-status'
  contactStatus.innerHTML = ''
}

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault()
    clearContactStatus()

    if (!validateContactForm()) return

    if (typeof emailjs === 'undefined') {
      showContactStatus('error', "Email service didn't load. Please try again later.", 'ri-error-warning-fill')
      return
    }

    contactSubmitBtn.disabled = true
    contactSubmitBtn.classList.add('is-sending')

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      from_name: document.getElementById('contact-name').value.trim(),
      from_email: document.getElementById('contact-email').value.trim(),
      message: document.getElementById('contact-message').value.trim(),
    })
      .then(() => {
        showContactStatus('success', "Message sent! I'll get back to you soon.", 'ri-checkbox-circle-fill')
        contactForm.reset()
      })
      .catch(() => {
        showContactStatus('error', 'Something went wrong. Please try again or email me directly.', 'ri-error-warning-fill')
      })
      .finally(() => {
        contactSubmitBtn.disabled = false
        contactSubmitBtn.classList.remove('is-sending')
      })
  })

  ;['contact-name', 'contact-email', 'contact-message'].forEach((id) => {
    document.getElementById(id).addEventListener('input', () => {
      const errorId = id.replace('contact-', 'error-')
      const el = document.getElementById(id)
      if (el.classList.contains('invalid')) {
        setFieldError(id, errorId, '')
      }
    })
  })
}

/*=============== CURRENT YEAR OF THE FOOTER ===============*/
const footerYear = document.getElementById('footer-year')

if (footerYear) {
  footerYear.textContent = new Date().getFullYear()
}

/*=============== SCROLL SECTIONS ACTIVE LINK ===============*/
const sections = document.querySelectorAll('main section[id]')

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const sectionId = entry.target.getAttribute('id')
    const navLink = document.querySelector(`.nav__link[href="#${sectionId}"]`)

    if (!navLink) return

    if (entry.isIntersecting) {
      document.querySelectorAll('.nav__link').forEach((link) => link.classList.remove('active-link'))
      navLink.classList.add('active-link')
    }
  })
}, {
  rootMargin: '-40% 0px -55% 0px',
  threshold: 0,
})

sections.forEach((section) => sectionObserver.observe(section))

/*=============== EXPERIENCE TIMELINE LINE GROW ===============*/
const timeline = document.querySelector('.experience__timeline')

if (timeline) {
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        timeline.classList.add('in-view')
        timelineObserver.unobserve(timeline)
      }
    })
  }, { threshold: 0.2 })

  timelineObserver.observe(timeline)
}

/*=============== CUSTOM CURSOR ===============*/


/* Hide custom cursor on links */


/*=============== SCROLL REVEAL ANIMATION ===============*/
/* `mobile: false` is the important one, and it is deliberate.

   ScrollReveal works by setting every target to opacity:0 up front and only
   restoring it once the element scrolls into view. That trade — content is
   invisible BY DEFAULT and JS has to actively rescue it — is what kept
   producing a black screen on phones: if the viewport check misfires even
   once, the affected section never comes back, and the near-black page
   background is all that is left. It already happened to the hero (see the
   note below), and the hero was the only thing moved to CSS at the time, so
   every other section was still exposed to exactly the same failure.

   With mobile:false, ScrollReveal does not touch anything on a phone at all.
   Nothing is set to opacity:0, so there is no rescue to miss and no state to
   get stuck in — the worst case on mobile is now "no entrance animation"
   instead of "no content". Desktop keeps the animations unchanged. */
const sr = ScrollReveal({
  origin: 'bottom',
  distance: '2rem',
  duration: 1000,
  delay: 200,
  reset: false,
  mobile: false,
})

/* NOTE: the hero (.nav + .home__*) is intentionally NOT handled by ScrollReveal.
   That content is visible immediately on page load with nothing to "scroll into
   view", and ScrollReveal's viewport-triggered reveal was found to silently get
   stuck at its opacity:0 starting state on real mobile browsers (the address bar
   resizing the viewport after first paint misses ScrollReveal's initial check),
   leaving the entire hero invisible. It's handled by plain CSS animation in
   styles.css instead — see "HERO ENTRANCE (pure CSS)" — which cannot get stuck
   since it doesn't depend on JS, scroll events, or viewport detection at all. */

/* Every section's eyebrow + title, revealed once each — replaces the previous
   per-section selectors that duplicated the same `.section__subtitle` match */
sr.reveal('.section__subtitle', { origin: 'top' })
sr.reveal('.section__title', { origin: 'top', delay: 100 })

sr.reveal('.about__image', { origin: 'left' })
sr.reveal('.about__block', { origin: 'bottom', distance: '1rem', interval: 120, delay: 200 })

sr.reveal('.skills__category', { interval: 100 })
sr.reveal('.experience__card', { origin: 'left', interval: 150 })
sr.reveal('.projects__card', { interval: 100, scale: 0.95 })
sr.reveal('.certifications__card', { interval: 100, scale: 0.95 })

sr.reveal('.contact__info', { origin: 'left' })
sr.reveal('.contact__form', { origin: 'right', delay: 200 })

/* Safety net: if ScrollReveal fails to trigger for any of the above (same class
   of bug that broke the hero — see note above), force those elements visible so
   no section can ever stay silently invisible again. No-ops when SR worked.

   With mobile:false above, phones should never need this. It stays as a second
   line of defence for desktop, and because the previous single-shot version had
   three gaps worth closing:

     - it only repaired opacity, so an element left hidden by `visibility` or
       stranded by a transform stayed invisible;
     - it ran once on a fixed 2.5s timer, so on a slow device where ScrollReveal
       had not finished hiding its targets yet, it checked too early and then
       never looked again;
     - it never re-ran on bfcache restore. iOS Safari serves back-navigation
       from bfcache: the DOM is restored with whatever inline styles it had,
       scripts do not re-execute, and timers do not re-fire — so a page that
       was mid-reveal when the user navigated away came back frozen and blank.

   Hence: repair all three properties, sweep several times, and re-sweep on
   pageshow. */
const SCROLL_REVEAL_SELECTORS = [
  '.section__subtitle', '.section__title',
  '.about__image', '.about__block',
  '.skills__category', '.experience__card',
  '.projects__card', '.certifications__card',
  '.contact__info', '.contact__form',
]

function forceRevealedContentVisible() {
  SCROLL_REVEAL_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      const cs = getComputedStyle(el)
      if (cs.opacity === '0' || cs.visibility === 'hidden') {
        el.style.setProperty('opacity', '1', 'important')
        el.style.setProperty('visibility', 'visible', 'important')
        el.style.setProperty('transform', 'none', 'important')
      }
    })
  })
}

/* Several passes: the early ones catch a fast failure quickly, the late one
   still fires on a slow phone where ScrollReveal hides its targets well after
   the first pass would have run. */
;[1200, 2500, 5000].forEach((ms) => setTimeout(forceRevealedContentVisible, ms))

window.addEventListener('pageshow', (event) => {
  /* event.persisted means this really is a bfcache restore rather than a fresh
     load, but sweep either way — it is idempotent and costs nothing. */
  forceRevealedContentVisible()
  if (event.persisted) setTimeout(forceRevealedContentVisible, 300)
})


/*=============== VISITOR COUNTER (AWS API Gateway + Lambda + DynamoDB) ===============*/
const VISITOR_API = 'https://ifcw8jlfai.execute-api.us-east-1.amazonaws.com/count'
const visitorEl = document.getElementById('visitor-count')

if (visitorEl) {
  fetch(VISITOR_API)
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then((data) => {
      visitorEl.querySelector('span').textContent = Number(data.count).toLocaleString()
      visitorEl.hidden = false
    })
    .catch(() => { /* stay hidden if the API is unreachable */ })
}
