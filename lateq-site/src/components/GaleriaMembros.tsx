import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Icon } from './ExternalLink'

const imagens = [
  {
    arquivo: 'grupo.jpg', largura: 1060, altura: 1060,
    recorte: { x: 0, y: 225, largura: 1060 },
    alt: 'Foto do grupo no Centro de Informática da UFPB',
  },
  {
    arquivo: 'seminario.jpg', largura: 1349, altura: 1799,
    recorte: { x: 106, y: 1063, largura: 1136 },
    alt: 'Foto do grupo no primeiro seminário interno da Quasar',
  },
]

const proporcaoQuadro = 16 / 9
const duracaoTroca = 0.38

export function GaleriaMembros() {
  const [ativa, setAtiva] = useState(0)
  const galeria = useRef<HTMLDivElement>(null)
  const quadro = useRef<HTMLDivElement>(null)
  const imagemAtual = useRef(0)
  const destino = useRef<number | null>(null)
  const transicao = useRef<gsap.core.Tween | null>(null)
  const rolagem = useRef<ScrollTrigger | undefined>(undefined)
  const { contextSafe } = useGSAP({ scope: galeria })

  useEffect(() => {
    const painel = galeria.current
    const palco = quadro.current
    if (!painel || !palco) return

    const site = painel.closest('.site')
    const topo = site?.querySelector('.topbar')
    const dock = site?.querySelector('.dock')
    const media = gsap.matchMedia(painel)

    media.add({
      all: 'all',
      alturaSuficiente: '(min-height: 36rem)',
      movimentoReduzido: '(prefers-reduced-motion: reduce)',
    }, ({ conditions }) => {
      transicao.current?.kill()
      transicao.current = null
      destino.current = null
      rolagem.current = undefined
      gsap.set(palco, { '--progresso-galeria': imagemAtual.current, '--sentido-galeria': 1 })
      if (!conditions?.alturaSuficiente || conditions.movimentoReduzido) return

      const deslizamento = gsap.fromTo(palco, { '--progresso-galeria': 0 }, {
        '--progresso-galeria': 1,
        ease: 'none',
        onUpdate(this: gsap.core.Tween) {
          const indice = Math.round(this.progress())
          if (indice === imagemAtual.current) return
          imagemAtual.current = indice
          setAtiva(indice)
        },
        scrollTrigger: {
          trigger: painel,
          start: () => {
            const limiteSuperior = topo?.getBoundingClientRect().bottom ?? 0
            const limiteInferior = dock?.getBoundingClientRect().top ?? window.innerHeight
            return `center ${(limiteSuperior + limiteInferior) / 2}px`
          },
          end: () => `+=${Math.round(palco.offsetHeight * 1.1)}`,
          pin: true,
          scrub: 0.18,
          refreshPriority: 1,
        },
      })

      rolagem.current = deslizamento.scrollTrigger
    })

    return () => {
      media.revert()
      rolagem.current = undefined
    }
  }, [])

  const trocarImagem = (sentido: -1 | 1) => {
    const palco = quadro.current
    if (!palco) return

    const atual = destino.current ?? imagemAtual.current
    const proxima = (atual + sentido + imagens.length) % imagens.length
    const gatilho = rolagem.current
    if (gatilho) {
      transicao.current?.kill()
      destino.current = proxima
      const limparDestino = () => {
        transicao.current = null
        destino.current = null
      }
      transicao.current = gsap.to(window, {
        scrollTo: { y: proxima === 0 ? gatilho.start : gatilho.end, autoKill: true },
        duration: duracaoTroca,
        ease: 'sine.inOut',
        overwrite: 'auto',
        onComplete: limparDestino,
        onInterrupt: limparDestino,
      })
      return
    }

    const emCurso = transicao.current
    if (emCurso) {
      emCurso.kill()
    } else {
      gsap.set(palco, { '--sentido-galeria': atual === 0 ? sentido : -sentido })
    }
    imagemAtual.current = proxima
    setAtiva(proxima)

    const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    transicao.current = gsap.to(palco, {
      '--progresso-galeria': proxima,
      duration: movimentoReduzido ? 0.13 : duracaoTroca,
      ease: 'sine.inOut',
      onComplete: () => {
        transicao.current = null
      },
    })
  }

  return (
    <div className="galeria-membros" ref={galeria} role="region" aria-label="Galeria de Membros" aria-roledescription="carrossel">
      <div className="galeria-quadro" ref={quadro}>
        {imagens.map(({ arquivo, largura, altura, alt, recorte }, indice) => (
          <div key={arquivo} className="galeria-slide" aria-hidden={indice !== ativa}>
            <img
              src={`/assets/membros/${arquivo}`}
              alt={alt}
              width={largura}
              height={altura}
              style={{
                width: `${100 * largura / recorte.largura}%`,
                left: `${-100 * recorte.x / recorte.largura}%`,
                top: `${-100 * recorte.y * proporcaoQuadro / recorte.largura}%`,
              }}
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>
      <div className="galeria-controles">
        <button type="button" aria-label="Imagem anterior" onClick={() => contextSafe(trocarImagem)(-1)}>
          <Icon name="arrow-left" />
        </button>
        <span role="status" aria-atomic="true">{ativa + 1} de {imagens.length}</span>
        <button type="button" aria-label="Próxima imagem" onClick={() => contextSafe(trocarImagem)(1)}>
          <Icon name="arrow-right" />
        </button>
      </div>
    </div>
  )
}
