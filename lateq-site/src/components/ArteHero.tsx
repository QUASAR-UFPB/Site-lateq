import { useEffect, useRef, useState } from 'react'

export type Arte = 'qubit'

type Cena = {
  atualizarCores: () => void
  setPrecessao: (v: boolean) => void
  dispose: () => void
}

const Pausa = ({ pausado }: { pausado: boolean }) => (
  <svg className="icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    {pausado ? <path d="M6 4l10 6-10 6z" /> : <path d="M7 4v12M13 4v12" />}
  </svg>
)

export function ArteHero({ arte, paleta }: { arte: Arte; paleta: string }) {
  const host = useRef<HTMLDivElement>(null)
  const rotulos = useRef<HTMLDivElement>(null)
  const cena = useRef<Cena | null>(null)
  const [pronto, setPronto] = useState(false)
  const [precessando, setPrecessando] = useState(true)

  useEffect(() => {
    let cancelado = false
    const falhar = () => {
      if (cancelado) return
      cena.current?.dispose()
      cena.current = null
      setPronto(false)
    }

    import('../lib/qubit-scene')
      .then(({ criarQubit }) => {
        if (cancelado || !host.current || !rotulos.current) return
        try {
          cena.current = criarQubit(host.current, rotulos.current, falhar, undefined, {
            estadoInicial: '|+>',
            precessaoInicial: true,
          })
          setPronto(true)
        } catch {
          falhar()
        }
      })
      .catch(falhar)

    return () => {
      cancelado = true
      cena.current?.dispose()
      cena.current = null
    }
  }, [arte])

  useEffect(() => {
    cena.current?.atualizarCores()
  }, [paleta])

  const alternar = () => {
    const proximo = !precessando
    cena.current?.setPrecessao(proximo)
    setPrecessando(proximo)
  }

  return (
    <div className="hero-bloch">
      <div
        className={`qubit-art arte-${arte}${pronto ? ' pronto' : ''}`}
        role="img"
        aria-label="Esfera de Bloch interativa: arraste para girar em 3D"
      >
        <div className="qubit-glow" aria-hidden="true" />
        <div className="qubit-renderer" ref={host} />
        <div className="qubit-labels" ref={rotulos} aria-hidden="true" />
      </div>

      {pronto && (
        <div className="qubit-hero-rodape">
          <span className="qubit-dica">Arraste para girar</span>
          <button
            type="button"
            className="qubit-toggle"
            onClick={alternar}
            aria-label={`${precessando ? 'Pausar' : 'Retomar'} animação do qubit`}
          >
            <Pausa pausado={!precessando} />
            {precessando ? 'Pausar' : 'Retomar'}
          </button>
        </div>
      )}
    </div>
  )
}
