import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
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
  const transicao = useRef<gsap.core.Tween | null>(null)
  const { contextSafe } = useGSAP({ scope: galeria })

  const trocarImagem = (sentido: -1 | 1) => {
    const palco = quadro.current
    if (!palco) return

    const atual = imagemAtual.current
    const proxima = (atual + sentido + imagens.length) % imagens.length
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

  const animarHover = (escala: number) => {
    const palco = quadro.current
    if (!palco) return
    gsap.to(palco, {
      scale: escala,
      duration: 0.35,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  }

  return (
    <div className="galeria-membros" ref={galeria} role="region" aria-label="Galeria de Membros" aria-roledescription="carrossel">
      <div
        className="galeria-quadro"
        ref={quadro}
        onMouseEnter={() => contextSafe(animarHover)(1.04)}
        onMouseLeave={() => contextSafe(animarHover)(1)}
      >
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
