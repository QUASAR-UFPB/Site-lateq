import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'

const imagemGrupo = {
  arquivo: 'grupo.jpg',
  largura: 1060,
  altura: 1060,
  recorte: { x: 0, y: 225, largura: 1060 },
  alt: 'Foto do grupo no Centro de Informática da UFPB',
}

const proporcaoQuadro = 16 / 9

export function GaleriaMembros() {
  const galeria = useRef<HTMLDivElement>(null)
  const quadro = useRef<HTMLDivElement>(null)
  const { contextSafe } = useGSAP({ scope: galeria })

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
    <div className="galeria-membros" ref={galeria} role="region" aria-label="Galeria de Membros">
      <div
        className="galeria-quadro"
        ref={quadro}
        onMouseEnter={() => contextSafe(animarHover)(1.03)}
        onMouseLeave={() => contextSafe(animarHover)(1)}
      >
        <div className="galeria-slide">
          <img
            src={`/assets/membros/${imagemGrupo.arquivo}`}
            alt={imagemGrupo.alt}
            width={imagemGrupo.largura}
            height={imagemGrupo.altura}
            style={{
              width: `${(100 * imagemGrupo.largura) / imagemGrupo.recorte.largura}%`,
              left: `${(-100 * imagemGrupo.recorte.x) / imagemGrupo.recorte.largura}%`,
              top: `${(-100 * imagemGrupo.recorte.y * proporcaoQuadro) / imagemGrupo.recorte.largura}%`,
            }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>
  )
}
