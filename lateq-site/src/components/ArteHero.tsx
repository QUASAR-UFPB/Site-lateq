import { useEffect, useRef, useState } from 'react'

export type Arte = 'qubit' | 'atomo'

type Cena = { setPausado: (v: boolean) => void; dispose: () => void }

const nomes: Record<Arte, string> = { qubit: 'qubit', atomo: 'átomo' }

const Pausa = ({ pausado }: { pausado: boolean }) => (
  <svg className="icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    {pausado ? <path d="M6 4l10 6-10 6z" /> : <path d="M7 4v12M13 4v12" />}
  </svg>
)

export function ArteHero({ arte }: { arte: Arte }) {
  const host = useRef<HTMLDivElement>(null)
  const rotulos = useRef<HTMLDivElement>(null)
  const cena = useRef<Cena | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'indisponivel'>('carregando')
  const [pausado, setPausado] = useState(false)

  useEffect(() => {
    let cancelado = false
    const falhar = () => {
      if (cancelado) return
      cena.current?.dispose()
      cena.current = null
      setEstado('indisponivel')
    }
    const montar: Promise<(h: HTMLElement, r: HTMLElement) => Cena> =
      arte === 'atomo'
        ? import('../lib/atomo-scene').then(({ criarAtomo }) => (h) => criarAtomo(h, falhar))
        : import('../lib/qubit-scene').then(({ criarQubit }) => (h, r) => criarQubit(h, r, falhar))
    montar
      .then((criar) => {
        if (cancelado || !host.current || !rotulos.current) return
        try {
          cena.current = criar(host.current, rotulos.current)
          setEstado('pronto')
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

  const alternar = () => {
    cena.current?.setPausado(!pausado)
    setPausado(!pausado)
  }

  return (
    <>
      <div className={`qubit-art arte-${arte} ${estado}`} aria-hidden="true">
        <div className="qubit-glow" />
        <div className="qubit-renderer" ref={host} />
        <div className="qubit-labels" ref={rotulos} />
      </div>
      {estado === 'pronto' && (
        <button
          type="button"
          className="qubit-toggle"
          onClick={alternar}
          aria-label={`${pausado ? 'Retomar' : 'Pausar'} animação do ${nomes[arte]}`}
        >
          <Pausa pausado={pausado} />
          {pausado ? 'Retomar' : 'Pausar'}
        </button>
      )}
    </>
  )
}
