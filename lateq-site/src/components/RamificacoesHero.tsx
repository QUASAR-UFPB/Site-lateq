type No = readonly [x: number, y: number, raio: number]

const percursoEsquerdo: readonly No[] = [
  [56, 140, 3.5],
  [148, 92, 4],
  [236, 164, 4.5],
  [356, 218, 3],
]

const percursoDireito: readonly No[] = [
  [740, 96, 3.5],
  [864, 62, 3],
  [942, 152, 4.5],
  [1086, 118, 4],
  [1168, 206, 5],
  [1264, 334, 4.5],
]

const intervaloEntreNos = 960
const atrasoDaAresta = 375

function Sinal({ percurso, inicio }: { percurso: readonly No[]; inicio: number }) {
  return (
    <>
      {percurso.slice(0, -1).map(([x, y], indice) => {
        const [proximoX, proximoY] = percurso[indice + 1]
        return (
          <line
            key={x}
            className="hero-ramificacoes-sinal"
            x1={x}
            y1={y}
            x2={proximoX}
            y2={proximoY}
            style={{ animationDelay: `${inicio + indice * intervaloEntreNos + atrasoDaAresta}ms` }}
          />
        )
      })}
      {percurso.map(([x, y, raio], indice) => (
        <circle
          key={x}
          className="hero-ramificacoes-no"
          cx={x}
          cy={y}
          r={raio}
          style={{ animationDelay: `${inicio + indice * intervaloEntreNos}ms` }}
        />
      ))}
    </>
  )
}

export function RamificacoesHero() {
  return (
    <svg className="hero-ramificacoes" viewBox="0 0 1440 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <g className="hero-ramificacoes-esquerda">
        <g fill="none" stroke="white" strokeOpacity=".48" strokeWidth="1.1">
          <path d="M56 140L148 92L236 164L172 268L56 140Z" />
          <path d="M148 92L292 68L236 164L356 218L284 328L172 268" />
          <path d="M56 140L18 248L112 356L172 268" />
        </g>
        <g fill="white" fillOpacity=".75">
          <circle cx="292" cy="68" r="3" />
          <circle cx="172" cy="268" r="3.5" />
          <circle cx="284" cy="328" r="4" />
          <circle cx="112" cy="356" r="3" />
          <Sinal percurso={percursoEsquerdo} inicio={5800} />
        </g>
      </g>
      <g className="hero-ramificacoes-direita">
        <g fill="none" stroke="white" strokeOpacity=".48" strokeWidth="1.1">
          <path d="M740 96L864 62L942 152L828 214L740 96Z" />
          <path d="M942 152L1086 118L1168 206L1044 282L942 152Z" />
          <path d="M1168 206L1296 142L1382 236L1264 334L1168 206Z" />
          <path d="M1044 282L1142 384L1264 334L1354 416" />
          <path d="M828 214L912 326L1044 282" />
        </g>
        <g fill="white" fillOpacity=".75">
          <circle cx="828" cy="214" r="3.5" />
          <circle cx="1044" cy="282" r="4" />
          <circle cx="1296" cy="142" r="3.5" />
          <circle cx="1382" cy="236" r="4" />
          <circle cx="1142" cy="384" r="3.5" />
          <circle cx="912" cy="326" r="3" />
          <Sinal percurso={percursoDireito} inicio={0} />
        </g>
      </g>
    </svg>
  )
}
