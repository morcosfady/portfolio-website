/*===============================================
NETWORK-INSPIRED ANIMATED BACKGROUND
Lightweight canvas particle network — glowing nodes,
thin connection lines, slow drift. No external libraries.
================================================*/
(function () {
  const canvas = document.getElementById('network-bg')
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const hue = getComputedStyle(document.documentElement).getPropertyValue('--hue').trim() || '255'

  const MAX_DISTANCE = 150
  const SPEED = 0.15

  let width, height, nodes, animationId

  function buildNodes() {
    const area = width * height
    const count = Math.min(70, Math.max(24, Math.round(area / 22000)))

    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      pulse: Math.random() * Math.PI * 2,
    }))
  }

  function resize() {
    width = canvas.width = window.innerWidth
    height = canvas.height = window.innerHeight
    buildNodes()
  }

  function drawFrame() {
    ctx.clearRect(0, 0, width, height)

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x
        const dy = nodes[i].y - nodes[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < MAX_DISTANCE) {
          const opacity = (1 - dist / MAX_DISTANCE) * 0.15
          ctx.strokeStyle = `hsla(${hue}, 60%, 64%, ${opacity})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(nodes[i].x, nodes[i].y)
          ctx.lineTo(nodes[j].x, nodes[j].y)
          ctx.stroke()
        }
      }
    }

    nodes.forEach((node) => {
      const glow = 0.35 + Math.sin(node.pulse) * 0.2
      ctx.beginPath()
      ctx.arc(node.x, node.y, 1.8, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${hue}, 70%, 75%, ${glow})`
      ctx.fill()
    })
  }

  function step() {
    nodes.forEach((node) => {
      node.x += node.vx
      node.y += node.vy
      node.pulse += 0.01

      if (node.x < 0 || node.x > width) node.vx *= -1
      if (node.y < 0 || node.y > height) node.vy *= -1
    })

    drawFrame()
    animationId = requestAnimationFrame(step)
  }

  resize()

  if (prefersReducedMotion) {
    drawFrame()
  } else {
    step()
  }

  let resizeTimeout
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      cancelAnimationFrame(animationId)
      resize()
      prefersReducedMotion ? drawFrame() : step()
    }, 200)
  })

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId)
    } else if (!prefersReducedMotion) {
      step()
    }
  })
})()
