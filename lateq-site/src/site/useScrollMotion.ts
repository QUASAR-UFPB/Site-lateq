import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother, ScrollToPlugin, SplitText)

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
      smooth: 1.2,
      effects: true,
      onFocusIn: () => (focoProgramatico.current ? false : undefined),
    })

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
      el.querySelectorAll<HTMLElement>('.section > .wrap > h2').forEach((titulo) => {
        const { chars } = SplitText.create(titulo, { type: 'words,chars', tag: 'span' })

        gsap.timeline({
          scrollTrigger: {
            trigger: titulo,
            start: 'clamp(top 88%)',
            end: 'clamp(top 58%)',
            scrub: movimentoReduzido ? true : 0.3,
          },
        })
          .fromTo(titulo, { '--progresso-risco': 0 }, {
            '--progresso-risco': 1,
            duration: 1,
            ease: 'none',
          })
          .fromTo(chars, { opacity: 0, yPercent: movimentoReduzido ? 0 : 24 }, {
            opacity: 1,
            yPercent: 0,
            duration: 0.36,
            ease: 'power2.out',
            stagger: { amount: 0.54 },
          }, 0.1)
      })
    })

    media.add('(prefers-reduced-motion: no-preference)', () => {
      el.querySelectorAll<HTMLElement>('[data-reveal]').forEach((elemento) => {
        gsap.from(elemento, {
          opacity: 0,
          y: 40,
          duration: 0.6,
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

    return () => {
      limparHover.forEach((fn) => fn())
      observador?.disconnect()
      smoother.current = null
    }
  }, { scope: raiz, dependencies: [secoes], revertOnUpdate: true })

  const irPara = (id: string) => {
    const alvo = document.getElementById(id)
    if (!alvo) return
    const focar = () => {
      focoProgramatico.current = true
      alvo.focus({ preventScroll: true })
      focoProgramatico.current = false
    }
    if (smoother.current) {
      const destino = Math.min(topoNoLayout(alvo) - alturaTopo(), ScrollTrigger.maxScroll(window))
      contextSafe(() => {
        gsap.to(window, {
          duration: 1.2,
          ease: 'power3.inOut',
          overwrite: true,
          scrollTo: { y: Math.max(0, destino), autoKill: false },
        })
      })()
      focar()
    } else {
      alvo.scrollIntoView?.({ block: 'start' })
      focar()
    }
    window.history.replaceState(null, '', `#${id}`)
    return alvo
  }

  return { raiz, ativa, setAtiva, irPara }
}

