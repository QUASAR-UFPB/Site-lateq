import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother, ScrollToPlugin)

function alturaTopo() {
  return document.querySelector<HTMLElement>('.topbar')?.getBoundingClientRect().height ?? 76
}

function topoNoLayout(el: HTMLElement) {
  let topo = 0
  for (let atual: HTMLElement | null = el; atual && atual.id !== 'smooth-content'; atual = atual.offsetParent as HTMLElement | null) {
    topo += atual.offsetTop
  }
  return topo
}

function observarRamificacoes(raiz: HTMLElement) {
  const abertura = raiz.querySelector<HTMLElement>('#inicio')
  if (!abertura || typeof IntersectionObserver !== 'function') return

  let visivel = false
  const sincronizar = () => {
    abertura.toggleAttribute('data-ramificacoes-ativas', visivel && !document.hidden)
  }
  const intersecao = new IntersectionObserver(([entrada]) => {
    visivel = entrada.isIntersecting
    sincronizar()
  })
  intersecao.observe(abertura)
  document.addEventListener('visibilitychange', sincronizar)

  return () => {
    intersecao.disconnect()
    document.removeEventListener('visibilitychange', sincronizar)
    abertura.removeAttribute('data-ramificacoes-ativas')
  }
}

export function useScrollMotion(secoes: string[]) {
  const raiz = useRef<HTMLDivElement>(null)
  const smoother = useRef<ScrollSmoother | null>(null)
  const focoProgramatico = useRef(false)
  const [ativa, setAtiva] = useState<string | null>(null)

  const { contextSafe } = useGSAP(() => {
    const el = raiz.current
    if (!el) return

    const topo = el.querySelector<HTMLElement>('.topbar')
    const dock = el.querySelector<HTMLElement>('.dock')
    const medirBarras = () => {
      el.style.setProperty('--offset', `${Math.round(alturaTopo())}px`)
      if (dock) el.style.setProperty('--altura-dock', `${dock.offsetHeight}px`)
    }
    medirBarras()
    const observador = typeof ResizeObserver === 'function' ? new ResizeObserver(medirBarras) : null
    if (topo) observador?.observe(topo)
    if (dock) observador?.observe(dock)

    smoother.current = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 0.7,
      effects: true,
      onFocusIn: () => (focoProgramatico.current ? false : undefined),
    })

    if (topo) {
      const fimTransparencia = () => `bottom top+=${alturaTopo() + 48}`
      const atualizarTopo = (trigger: ScrollTrigger) => {
        topo.toggleAttribute('data-rolado', trigger.progress > 0)
      }
      ScrollTrigger.create({
        trigger: '#inicio',
        start: fimTransparencia,
        end: 'max',
        onUpdate: atualizarTopo,
        onRefresh: atualizarTopo,
      })
      ScrollTrigger.create({
        trigger: '#membros',
        start: () => `top+=${(el.querySelector<HTMLElement>('.onda-membros')?.offsetHeight ?? 0) + 1} top`,
        endTrigger: '.galeria-membros',
        end: () => `top top+=${alturaTopo()}`,
        toggleClass: { targets: topo, className: 'topbar--sobre-membros' },
      })
    }

    ScrollTrigger.create({
      trigger: '#inicio',
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: (self) => self.isActive && setAtiva(null),
    })

    secoes.forEach((id) => {
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top 45%',
        end: 'bottom 45%',
        onToggle: (self) => self.isActive && setAtiva(id),
      })
    })

    const media = gsap.matchMedia()
    media.add({ all: 'all', movimentoReduzido: '(prefers-reduced-motion: reduce)' }, ({ conditions }) => {
      const movimentoReduzido = conditions?.movimentoReduzido
      el.querySelectorAll<HTMLElement>('.section h2').forEach((titulo) => {
        gsap.fromTo(titulo, { '--progresso-risco': 0, opacity: 0, y: movimentoReduzido ? 0 : 12 }, {
          '--progresso-risco': 1,
          opacity: 1,
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: titulo,
            start: 'clamp(top 88%)',
            end: 'clamp(top 62%)',
            scrub: movimentoReduzido ? true : 0.3,
          },
        })
      })
    })

    media.add('(prefers-reduced-motion: no-preference)', () => {
      el.querySelectorAll<HTMLElement>('[data-reveal]').forEach((elemento) => {
        gsap.from(elemento, {
          opacity: 0,
          y: 16,
          duration: 0.5,
          scrollTrigger: {
            trigger: elemento,
            start: 'top 80%',
            once: true,
          },
        })
      })
    })

    gsap.from('[data-intro]', { y: 32, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.1 })

    const limparHover: (() => void)[] = []
    el.querySelectorAll<HTMLAnchorElement>('.noticia-link').forEach((link) => {
      const imagem = link.querySelector('img')
      if (!imagem) return
      const entrar = () => {
        gsap.to(imagem, { scale: 1.04, duration: 0.35, ease: 'power2.out', overwrite: 'auto' })
      }
      const sair = () => {
        gsap.to(imagem, { scale: 1, duration: 0.35, ease: 'power2.out', overwrite: 'auto' })
      }
      link.addEventListener('mouseenter', entrar)
      link.addEventListener('mouseleave', sair)
      limparHover.push(() => {
        link.removeEventListener('mouseenter', entrar)
        link.removeEventListener('mouseleave', sair)
      })
    })

    const limparRamificacoes = observarRamificacoes(el)
    return () => {
      limparRamificacoes?.()
      limparHover.forEach((fn) => fn())
      observador?.disconnect()
      topo?.removeAttribute('data-rolado')
      topo?.classList.remove('topbar--sobre-membros')
      smoother.current = null
    }
  }, { scope: raiz, dependencies: [secoes], revertOnUpdate: true })

  const irPara = (id: string, navegar = true) => {
    const alvo = document.getElementById(id)
    if (!alvo) return
    const focar = () => {
      focoProgramatico.current = true
      alvo.focus({ preventScroll: true })
      focoProgramatico.current = false
    }
    if (smoother.current) {
      const margem = Number.parseFloat(getComputedStyle(alvo).scrollMarginTop)
      const deslocamento = Number.isNaN(margem) ? alturaTopo() : margem
      const destino = Math.min(topoNoLayout(alvo) - deslocamento, ScrollTrigger.maxScroll(window))
      contextSafe(() => {
        gsap.to(window, {
          duration: 1.2,
          ease: 'power3.inOut',
          overwrite: true,
          scrollTo: { y: Math.max(0, destino), autoKill: false },
        })
      })()
    } else {
      alvo.scrollIntoView?.({ block: 'start' })
    }
    if (navegar) {
      focar()
      window.history.replaceState(null, '', `#${id}`)
    }
  }

  return { raiz, ativa, setAtiva, irPara }
}

