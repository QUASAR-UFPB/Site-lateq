import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { criarSimuladorBloch, Complexo, EstadoPreparado, LeituraQubit, PortaQuantica } from '../lib/bloch-simulator-scene'

const Ket = ({ children }: { children: ReactNode }) => <span className="ket">|{children}⟩</span>

const preparos: { id: EstadoPreparado; simbolo: string; dica: string }[] = [
  { id: '|0>', simbolo: '0', dica: 'Preparar o estado |0⟩ e limpar o rastro' },
  { id: '|+>', simbolo: '+', dica: 'Preparar o estado |+⟩ e limpar o rastro' },
]

const portas: { id: PortaQuantica; rotulo: string; dica: string }[] = [
  { id: 'H', rotulo: 'H', dica: 'Aplicar Hadamard: π em torno de (Bx + Bz)/√2' },
  { id: 'X', rotulo: 'X', dica: 'Aplicar Pauli-X: π em torno de Bx' },
  { id: 'Y', rotulo: 'Y', dica: 'Aplicar Pauli-Y: π em torno de By' },
  { id: 'Z', rotulo: 'Z', dica: 'Aplicar Pauli-Z: π em torno de Bz' },
  { id: 'S', rotulo: 'S', dica: 'Aplicar fase S: +π/2 em torno de Bz' },
  { id: 'T', rotulo: 'T', dica: 'Aplicar fase T: +π/4 em torno de Bz' },
]

const LIMIAR = 0.005

const arredondar = (n: number) => {
  const r = Math.round(n * 100) / 100
  return Object.is(r, -0) ? 0 : r
}

const formatarNumero = (n: number) => {
  const r = arredondar(n)
  const texto = Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0$/, '')
  return texto.replace('-', '−')
}

const formatarComplexo = ({ re, im }: Complexo) => {
  const r = arredondar(re)
  const i = arredondar(im)
  const temReal = Math.abs(r) >= LIMIAR
  const temIm = Math.abs(i) >= LIMIAR
  if (!temReal && !temIm) return '0'

  const real = temReal ? formatarNumero(r) : ''
  const imaginario = temIm ? `${Math.abs(i) === 1 ? '' : formatarNumero(Math.abs(i))}i` : ''
  if (!temIm) return real
  if (!temReal) return `${i < 0 ? '−' : ''}${imaginario}`
  return `(${real} ${i < 0 ? '−' : '+'} ${imaginario})`
}

type Termo = { sinal: '+' | '−'; coeficiente: string; base: '0' | '1' }

const formatarTermo = (complexo: Complexo, base: '0' | '1'): Termo | null => {
  const coeficiente = formatarComplexo(complexo)
  if (coeficiente === '0') return null
  if (coeficiente === '1') return { sinal: '+', coeficiente: '', base }
  if (coeficiente === '−1') return { sinal: '−', coeficiente: '', base }
  if (coeficiente.startsWith('−')) return { sinal: '−', coeficiente: coeficiente.slice(1), base }
  return { sinal: '+', coeficiente, base }
}

const formatarTermos = (leitura: LeituraQubit) =>
  [formatarTermo(leitura.alpha, '0'), formatarTermo(leitura.beta, '1')].filter(
    (t): t is Termo => t !== null,
  )

export function SimuladorBloch({ naAbertura = false }: { naAbertura?: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const rotulos = useRef<HTMLDivElement>(null)
  const cena = useRef<ReturnType<typeof criarSimuladorBloch> | null>(null)
  const [falhou, setFalhou] = useState(false)
  const [pronto, setPronto] = useState(false)
  const [precessando, setPrecessando] = useState(false)
  const [leitura, setLeitura] = useState<LeituraQubit | null>(null)

  useEffect(() => {
    let cancelado = false
    const falhar = () => {
      if (cancelado) return
      cena.current?.dispose()
      cena.current = null
      setFalhou(true)
      setPronto(false)
      setPrecessando(false)
      setLeitura(null)
    }

    if (typeof WebGL2RenderingContext === 'undefined') {
      falhar()
      return
    }

    import('../lib/bloch-simulator-scene')
      .then(({ criarSimuladorBloch }) => {
        if (cancelado || !host.current || !rotulos.current) return
        const atualizarLeitura = (estado: LeituraQubit) => {
          if (!cancelado) setLeitura(estado)
        }
        cena.current = criarSimuladorBloch(host.current, rotulos.current, falhar, naAbertura ? undefined : atualizarLeitura)
        if (naAbertura) {
          const animar = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
          cena.current.preparar('|+>')
          cena.current.setPrecessao(animar)
          setPrecessando(animar)
          setPronto(true)
        }
      })
      .catch(falhar)

    return () => {
      cancelado = true
      cena.current?.dispose()
      cena.current = null
    }
  }, [naAbertura])

  const alternarPrecessao = () => {
    const proximo = !precessando
    cena.current?.setPrecessao(proximo)
    setPrecessando(proximo)
  }

  const camadas = (
    <>
      <div className="qubit-glow" aria-hidden="true" />
      <div className="qubit-renderer" ref={host} />
      <div className="qubit-labels" ref={rotulos} aria-hidden="true" />
    </>
  )
  const mensagem = falhou ? 'A visualização 3D está indisponível. Ela requer WebGL 2.' : 'Carregando a esfera de Bloch…'

  if (naAbertura) {
    return (
      <div className="hero-bloch">
        <div
          className="hero-bloch-palco"
          role={pronto ? 'img' : undefined}
          aria-label={pronto ? 'Esfera de Bloch interativa' : undefined}
        >
          {camadas}
          {!pronto && <span className="hero-bloch-status" role="status">{mensagem}</span>}
        </div>
        {pronto && (
          <div className="hero-bloch-acoes">
            <span>Arraste para girar</span>
            <button
              type="button"
              className="qubit-porta"
              aria-label={`${precessando ? 'Pausar' : 'Retomar'} animação do qubit`}
              onClick={alternarPrecessao}
            >
              {precessando ? 'Pausar' : 'Retomar'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const pct0 = leitura ? Math.round(leitura.p0 * 100) : 100
  const pct1 = 100 - pct0
  const theta = leitura ? Math.round((leitura.theta * 180) / Math.PI) : 0
  const phi = leitura ? Math.round((leitura.phi * 180) / Math.PI) : 0
  const termos = leitura ? formatarTermos(leitura) : []

  return (
    <div className="simulador-bloch" data-reveal>
      <div className="simulador-esfera">
        <div
          className="simulador-palco"
          role={leitura ? 'img' : undefined}
          aria-label={leitura ? 'Simulador interativo da Esfera de Bloch' : undefined}
        >
          {camadas}
          {!leitura && (
            <p className="simulador-status" role="status">
              {mensagem}
            </p>
          )}
        </div>
        {leitura && <p className="simulador-dica">Arraste para girar a esfera.</p>}
      </div>

      <div className="simulador-painel">
        <div className="simulador-cabecalho">
          <h3>Esfera de Bloch</h3>
          <p className="simulador-desc">
            Prepare um estado, aplique portas unitárias e observe a rotação no espaço de Bloch ou realize uma medição.
          </p>
        </div>

        {leitura && (
          <>
            <div className="qubit-leitura" role="group" aria-label="Leitura do estado quântico">
              <div className="qubit-leitura-topo">
                <span className="qubit-ket">
                  <Ket>ψ</Ket> ={' '}
                  {termos.length === 0
                    ? '0'
                    : termos.map((t, i) => (
                        <span className="qubit-termo" key={t.base}>
                          {i === 0 ? (t.sinal === '−' ? '−' : '') : ` ${t.sinal} `}
                          {t.coeficiente}
                          <Ket>{t.base}</Ket>
                        </span>
                      ))}
                </span>
                <span className="qubit-probs">
                  <span>
                    P(<Ket>0</Ket>) <b>{pct0}%</b>
                  </span>
                  <span>
                    P(<Ket>1</Ket>) <b>{pct1}%</b>
                  </span>
                </span>
              </div>
              <div className="qubit-barra" aria-hidden="true">
                <span style={{ width: `${leitura.p0 * 100}%` }} />
                <span style={{ width: `${leitura.p1 * 100}%` }} />
              </div>
              <div className="qubit-leitura-rodape">
                <span className="qubit-angulos">
                  θ {theta}° · φ {phi}°
                </span>
                {leitura.ultimoResultado && (
                  <span className="qubit-resultado" role="status">
                    Medido: <Ket>{leitura.ultimoResultado}</Ket>
                  </span>
                )}
              </div>
            </div>

            <div className="qubit-controles" role="group" aria-label="Controles da esfera de Bloch">
              <div className="qubit-linha">
                <div className="qubit-grupo">
                  <span className="qubit-grupo-rotulo">Preparar</span>
                  <div className="qubit-botoes">
                    {preparos.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="qubit-porta"
                        title={p.dica}
                        aria-label={p.dica}
                        onClick={() => cena.current?.preparar(p.id)}
                      >
                        <Ket>{p.simbolo}</Ket>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="qubit-grupo">
                  <span className="qubit-grupo-rotulo">Portas</span>
                  <div className="qubit-botoes">
                    {portas.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="qubit-porta"
                        title={p.dica}
                        aria-label={p.dica}
                        onClick={() => cena.current?.aplicarPorta(p.id)}
                      >
                        {p.rotulo}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="qubit-linha">
                <div className="qubit-grupo">
                  <span className="qubit-grupo-rotulo">Ações</span>
                  <div className="qubit-botoes">
                    <button
                      type="button"
                      className="qubit-porta"
                      title="Medir na base computacional (regra de Born)"
                      aria-label="Medir o qubit na base computacional"
                      onClick={() => cena.current?.medir()}
                    >
                      Medir
                    </button>
                    <button
                      type="button"
                      className="qubit-porta"
                      onClick={alternarPrecessao}
                      aria-label={`${precessando ? 'Pausar' : 'Iniciar'} a precessão de Larmor`}
                      data-ativa={precessando || undefined}
                    >
                      {precessando ? 'Pausar' : 'Precessão'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
