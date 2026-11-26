import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const RASTRO = 180
const RAIO = 1.004
const VELOCIDADE_PORTA = 3.1 // rad/s no espaço de Bloch
const VELOCIDADE_PRECESSAO = 0.9 // rad/s em torno de Bz
const INTERVALO_LEITURA = 80 // ms

const VERTEX = `varying vec3 n; void main(){ n=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`

export type Complexo = { re: number; im: number }
export type PortaQuantica = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'Sdg' | 'Tdg'
export type EstadoPreparado = '|0>' | '|1>' | '|+>' | '|->' | '|+i>' | '|-i>'

export type LeituraQubit = {
  alpha: Complexo
  beta: Complexo
  p0: number
  p1: number
  theta: number
  phi: number
  ultimoResultado: '0' | '1' | null
}

/**
 * Convenção de Bloch destra:
 * Bx = (0, 0, 1), By = (1, 0, 0), Bz = (0, 1, 0).
 * Assim Bx × By = Bz e o vetor vai para a cena como (By, Bz, Bx).
 */
const PORTAS: Record<PortaQuantica, { eixo: THREE.Vector3; angulo: number }> = {
  X: { eixo: new THREE.Vector3(0, 0, 1), angulo: Math.PI },
  Y: { eixo: new THREE.Vector3(1, 0, 0), angulo: Math.PI },
  Z: { eixo: new THREE.Vector3(0, 1, 0), angulo: Math.PI },
  S: { eixo: new THREE.Vector3(0, 1, 0), angulo: Math.PI / 2 },
  T: { eixo: new THREE.Vector3(0, 1, 0), angulo: Math.PI / 4 },
  Sdg: { eixo: new THREE.Vector3(0, 1, 0), angulo: -Math.PI / 2 },
  Tdg: { eixo: new THREE.Vector3(0, 1, 0), angulo: -Math.PI / 4 },
  H: { eixo: new THREE.Vector3(0, 1, 1).normalize(), angulo: Math.PI },
}

const EIXO_Z = new THREE.Vector3(0, 1, 0)
const INV_SQRT2 = Math.SQRT1_2

const cplx = (re: number, im = 0): Complexo => ({ re, im })

const SPINORES: Record<EstadoPreparado, () => [Complexo, Complexo]> = {
  '|0>': () => [cplx(1), cplx(0)],
  '|1>': () => [cplx(0), cplx(1)],
  '|+>': () => [cplx(INV_SQRT2), cplx(INV_SQRT2)],
  '|->': () => [cplx(INV_SQRT2), cplx(-INV_SQRT2)],
  '|+i>': () => [cplx(INV_SQRT2), cplx(0, INV_SQRT2)],
  '|-i>': () => [cplx(INV_SQRT2), cplx(0, -INV_SQRT2)],
}
const somar = (a: Complexo, b: Complexo): Complexo => ({ re: a.re + b.re, im: a.im + b.im })
const subtrair = (a: Complexo, b: Complexo): Complexo => ({ re: a.re - b.re, im: a.im - b.im })
const escalar = (a: Complexo, k: number): Complexo => ({ re: a.re * k, im: a.im * k })
const multiplicar = (a: Complexo, b: Complexo): Complexo => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
})
const girar = (a: Complexo, angulo: number): Complexo => {
  const c = Math.cos(angulo)
  const s = Math.sin(angulo)
  return { re: a.re * c - a.im * s, im: a.re * s + a.im * c }
}
const aquad = (a: Complexo) => a.re * a.re + a.im * a.im

/** Aplica a matriz unitária exata da porta ao spinor (α, β). */
const aplicarMatriz = (porta: PortaQuantica, alpha: Complexo, beta: Complexo): [Complexo, Complexo] => {
  switch (porta) {
    case 'X':
      return [beta, alpha]
    case 'Y':
      return [multiplicar(cplx(0, -1), beta), multiplicar(cplx(0, 1), alpha)]
    case 'Z':
      return [alpha, escalar(beta, -1)]
    case 'S':
      return [alpha, multiplicar(cplx(0, 1), beta)]
    case 'T':
      return [alpha, multiplicar(cplx(INV_SQRT2, INV_SQRT2), beta)]
    case 'Sdg':
      return [alpha, multiplicar(cplx(0, -1), beta)]
    case 'Tdg':
      return [alpha, multiplicar(cplx(INV_SQRT2, -INV_SQRT2), beta)]
    case 'H':
      return [escalar(somar(alpha, beta), INV_SQRT2), escalar(subtrair(alpha, beta), INV_SQRT2)]
  }
}

/** (By, Bz, Bx) a partir de α, β. */
const vetorDeBloch = (alpha: Complexo, beta: Complexo) =>
  new THREE.Vector3(
    2 * (alpha.re * beta.im - alpha.im * beta.re),
    aquad(alpha) - aquad(beta),
    2 * (alpha.re * beta.re + alpha.im * beta.im),
  )

const normalizarSpinor = (alpha: Complexo, beta: Complexo): [Complexo, Complexo] => {
  const n = Math.hypot(alpha.re, alpha.im, beta.re, beta.im)
  return n < 1e-12 ? [cplx(1), cplx(0)] : [escalar(alpha, 1 / n), escalar(beta, 1 / n)]
}

const circulo = (raio: number, eixo: 'y' | 'z') =>
  Array.from({ length: 128 }, (_, i) => {
    const a = (i / 128) * Math.PI * 2
    const c = Math.cos(a) * raio
    const s = Math.sin(a) * raio
    return eixo === 'y' ? new THREE.Vector3(c, 0, s) : new THREE.Vector3(c, s, 0)
  })

export function criarSimuladorBloch(
  host: HTMLElement,
  labelHost: HTMLElement,
  onFailure: () => void,
  onStateChange?: (leitura: LeituraQubit) => void,
) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.domElement.setAttribute('aria-hidden', 'true')
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20)
  camera.position.set(2.35, 1.45, 3.15)
  camera.position.multiplyScalar(1.14)
  camera.lookAt(0, 0, 0)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.07
  controls.enableZoom = false
  controls.enablePan = false
  controls.rotateSpeed = 0.75
  renderer.domElement.style.touchAction = 'pan-y'

  // O referencial fica fixo: só a câmera orbita.
  const bloch = new THREE.Group()
  scene.add(bloch)

  const cor = new THREE.Color()

  const corpo = new THREE.Mesh(
    new THREE.SphereGeometry(0.995, 64, 48),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uCor: { value: cor } },
      vertexShader: VERTEX,
      fragmentShader: `uniform vec3 uCor; varying vec3 n; void main(){ float rim=pow(1.0-max(n.z,0.0),3.0); gl_FragColor=vec4(uCor*(0.15+0.85*rim),0.22+rim*0.35); }`,
    }),
  )
  corpo.renderOrder = -1
  bloch.add(corpo)

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 64, 48),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.NormalBlending,
      uniforms: { uCor: { value: cor } },
      vertexShader: VERTEX,
      fragmentShader: `uniform vec3 uCor; varying vec3 n; void main(){ float rim=pow(max(0.0,.72-abs(n.z)),3.0); gl_FragColor=vec4(uCor,rim*.28); }`,
    }),
  )
  halo.renderOrder = -2
  bloch.add(halo)

  const fino = new THREE.LineBasicMaterial({ color: cor, transparent: true, opacity: 0.26 })
  const forte = new THREE.LineBasicMaterial({ color: cor, transparent: true, opacity: 0.72 })
  for (let k = -2; k <= 2; k++) {
    if (k === 0) continue
    const altura = Math.sin((k * Math.PI) / 6)
    const anel = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(circulo(Math.cos((k * Math.PI) / 6) * 1.002, 'y')),
      fino,
    )
    anel.position.y = altura
    bloch.add(anel)
  }
  for (let k = 0; k < 6; k++) {
    const meridiano = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circulo(1.002, 'z')), fino)
    meridiano.rotation.y = (k * Math.PI) / 6
    bloch.add(meridiano)
  }
  bloch.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circulo(1.003, 'y')), forte))

  const estilos = getComputedStyle(host)
  const lerCor = (nome: string, padrao: string) => estilos.getPropertyValue(nome).trim() || padrao

  for (const [corEixo, ate] of [
    [lerCor('--sim-z', '#5cb8ff'), new THREE.Vector3(0, 1.32, 0)],
    [lerCor('--sim-y', '#ffcf5a'), new THREE.Vector3(1.2, 0, 0)],
    [lerCor('--sim-x', '#ff6b6b'), new THREE.Vector3(0, 0, 1.2)],
  ] as const) {
    const material = new THREE.MeshBasicMaterial({ color: corEixo, transparent: true, opacity: 0.95, depthWrite: false })
    const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, ate.length() * 2, 10), material)
    barra.quaternion.setFromUnitVectors(EIXO_Z, ate.clone().normalize())
    bloch.add(barra)
  }

  // Eixo de rotação destacado durante cada porta.
  const eixoPortaGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -1.35, 0),
    new THREE.Vector3(0, 1.35, 0),
  ])
  const eixoPortaMat = new THREE.LineDashedMaterial({
    color: cor,
    transparent: true,
    opacity: 0.85,
    dashSize: 0.07,
    gapSize: 0.05,
  })
  const eixoPorta = new THREE.Line(eixoPortaGeo, eixoPortaMat)
  eixoPorta.computeLineDistances()
  eixoPorta.visible = false
  bloch.add(eixoPorta)

  const corVetor = lerCor('--sim-vetor', '#6dffbf')
  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 12),
    new THREE.MeshBasicMaterial({ color: corVetor, transparent: true, opacity: 0.32, depthWrite: false }),
  )
  bloch.add(aura)

  const ALTURA_CONE = 0.13
  const setaMat = new THREE.MeshBasicMaterial({ color: corVetor })
  const seta = new THREE.Group()
  seta.add(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.017, 0.017, RAIO - ALTURA_CONE, 14).translate(0, (RAIO - ALTURA_CONE) / 2, 0),
      setaMat,
    ),
    new THREE.Mesh(new THREE.ConeGeometry(0.052, ALTURA_CONE, 20).translate(0, RAIO - ALTURA_CONE / 2, 0), setaMat),
  )
  bloch.add(seta)
  const direcaoSeta = new THREE.Vector3()

  const rastroPos = new Float32Array(RASTRO * 3)
  const rastroCor = new Float32Array(RASTRO * 3)
  const rastroGeo = new THREE.BufferGeometry()
  rastroGeo.setAttribute('position', new THREE.BufferAttribute(rastroPos, 3))
  rastroGeo.setAttribute('color', new THREE.BufferAttribute(rastroCor, 3))
  bloch.add(new THREE.Line(rastroGeo, new THREE.LineBasicMaterial({ vertexColors: true })))

  const preencherRastro = (inicio: THREE.Color, fim: THREE.Color) => {
    for (let i = 0; i < RASTRO; i++) {
      const brilho = Math.pow(i / (RASTRO - 1), 1.6)
      rastroCor.set(
        [
          inicio.r + (fim.r - inicio.r) * brilho,
          inicio.g + (fim.g - inicio.g) * brilho,
          inicio.b + (fim.b - inicio.b) * brilho,
        ],
        i * 3,
      )
    }
    rastroGeo.attributes.color.needsUpdate = true
  }

  let alpha = cplx(1)
  let beta = cplx(0)
  let ultimoResultado: '0' | '1' | null = null
  const estadoAtual = vetorDeBloch(alpha, beta).setLength(RAIO)
  const historico = Array.from({ length: RASTRO }, () => estadoAtual.clone())

  const rotulos = [
    { simbolo: '0', eixo: 'z', posicao: new THREE.Vector3(0, 1.38, 0), el: document.createElement('span'), destaque: false },
    { simbolo: '1', eixo: 'z', posicao: new THREE.Vector3(0, -1.38, 0), el: document.createElement('span'), destaque: false },
    { simbolo: '+', eixo: 'x', posicao: new THREE.Vector3(0, 0, 1.38), el: document.createElement('span'), destaque: false },
    { simbolo: '−', eixo: 'x', posicao: new THREE.Vector3(0, 0, -1.38), el: document.createElement('span'), destaque: false },
    { simbolo: '+i', eixo: 'y', posicao: new THREE.Vector3(1.38, 0, 0), el: document.createElement('span'), destaque: false },
    { simbolo: '−i', eixo: 'y', posicao: new THREE.Vector3(-1.38, 0, 0), el: document.createElement('span'), destaque: false },
    { simbolo: 'ψ', eixo: null, posicao: new THREE.Vector3(), el: document.createElement('span'), destaque: true },
  ]
  for (const r of rotulos) {
    r.el.textContent = `|${r.simbolo}⟩`
    r.el.className = r.destaque ? 'ket destaque' : `ket eixo-${r.eixo}`
    labelHost.appendChild(r.el)
  }
  const rotuloEstado = rotulos[6]

  let largura = 1
  let altura = 1
  let frame = 0
  let ultimo = 0
  let precessando = false
  let arrastando = false
  let visivel = true
  let descartado = false
  let ultimaNotificacao = 0

  const fila: PortaQuantica[] = []
  let transicao: {
    porta: PortaQuantica
    origem: THREE.Vector3
    eixo: THREE.Vector3
    angulo: number
    progresso: number
    duracao: number
  } | null = null

  const projetado = new THREE.Vector3()
  const mundo = new THREE.Vector3()
  const direcao = new THREE.Vector3()
  const paraCamera = new THREE.Vector3()
  const pontaEixo = new THREE.Vector3()
  const deslocamentoRotulo = new THREE.Vector3(0.06, 0.08, 0)

  const atualizarBufferRastro = () => {
    for (let i = 0; i < RASTRO; i++) {
      historico[i].toArray(rastroPos, i * 3)
    }
    rastroGeo.attributes.position.needsUpdate = true
  }

  const empurrarRastro = (ponto: THREE.Vector3) => {
    historico.shift()
    historico.push(ponto.clone())
  }

  const limparRastro = (ponto: THREE.Vector3) => {
    for (let i = 0; i < RASTRO; i++) {
      historico[i].copy(ponto).setLength(RAIO)
    }
  }

  const adicionarArco = (origem: THREE.Vector3, eixo: THREE.Vector3, de: number, ate: number) => {
    const passos = Math.max(1, Math.min(10, Math.ceil(Math.abs(ate - de) / 0.035)))
    for (let i = 1; i <= passos; i++) {
      const angulo = de + ((ate - de) * i) / passos
      empurrarRastro(origem.clone().applyAxisAngle(eixo, angulo).setLength(RAIO))
    }
  }

  const atualizarEstado = () => {
    estadoAtual.copy(vetorDeBloch(alpha, beta)).setLength(RAIO)
  }

  const probabilidadeZero = () => THREE.MathUtils.clamp((1 + estadoAtual.y / RAIO) / 2, 0, 1)

  const montarLeitura = (): LeituraQubit => {
    const p0 = probabilidadeZero()
    const theta = Math.acos(2 * p0 - 1)
    const phiBruto = Math.hypot(estadoAtual.x, estadoAtual.z) < 1e-9 ? 0 : Math.atan2(estadoAtual.x, estadoAtual.z)
    const phi = phiBruto < 0 ? phiBruto + Math.PI * 2 : phiBruto
    const magBeta = Math.sqrt(1 - p0)
    return {
      alpha: cplx(Math.sqrt(p0)),
      beta: cplx(magBeta * Math.cos(phi), magBeta * Math.sin(phi)),
      p0,
      p1: 1 - p0,
      theta,
      phi,
      ultimoResultado,
    }
  }

  const notificar = (forcar = false) => {
    if (descartado || !onStateChange) return
    const agora = performance.now()
    if (!forcar && agora - ultimaNotificacao < INTERVALO_LEITURA) return
    ultimaNotificacao = agora
    onStateChange(montarLeitura())
  }

  const desenhar = () => {
    if (descartado) return
    aura.position.copy(estadoAtual)
    seta.quaternion.setFromUnitVectors(EIXO_Z, direcaoSeta.copy(estadoAtual).normalize())
    rotuloEstado.posicao.copy(estadoAtual).multiplyScalar(1.12).add(deslocamentoRotulo)

    bloch.updateMatrixWorld(true)
    camera.updateMatrixWorld()
    paraCamera.copy(camera.position).normalize()
    for (const r of rotulos) {
      mundo.copy(r.posicao).applyMatrix4(bloch.matrixWorld)
      projetado.copy(mundo).project(camera)
      r.el.style.transform = `translate(${((projetado.x + 1) * largura) / 2}px,${((-projetado.y + 1) * altura) / 2}px) translate(-50%, -50%)`
      direcao.copy(mundo).normalize()
      r.el.style.opacity = r.destaque || direcao.dot(paraCamera) >= -0.15 ? '1' : '0.42'
    }
    atualizarBufferRastro()
    renderer.render(scene, camera)
  }

  const mostrarEixo = (eixo: THREE.Vector3) => {
    const p = pontaEixo.copy(eixo).normalize().multiplyScalar(1.35)
    const posicoes = eixoPortaGeo.attributes.position as THREE.BufferAttribute
    posicoes.setXYZ(0, -p.x, -p.y, -p.z)
    posicoes.setXYZ(1, p.x, p.y, p.z)
    posicoes.needsUpdate = true
    eixoPorta.computeLineDistances()
    eixoPorta.visible = true
  }

  const esconderEixo = () => {
    eixoPorta.visible = false
  }

  const iniciarProxima = () => {
    const porta = fila.shift()
    if (!porta) {
      esconderEixo()
      return false
    }
    const def = PORTAS[porta]
    transicao = {
      porta,
      origem: estadoAtual.clone(),
      eixo: def.eixo.clone(),
      angulo: def.angulo,
      progresso: 0,
      duracao: Math.max(0.26, Math.abs(def.angulo) / VELOCIDADE_PORTA),
    }
    mostrarEixo(def.eixo)
    ultimoResultado = null
    return true
  }

  const concluirPorta = () => {
    if (!transicao) return
    const [a, b] = normalizarSpinor(...aplicarMatriz(transicao.porta, alpha, beta))
    alpha = a
    beta = b
    transicao = null
    esconderEixo()
    atualizarEstado()
    empurrarRastro(estadoAtual)
    notificar(true)
    iniciarProxima()
  }

  const podeRodar = () => !descartado && visivel && !document.hidden

  const tick = (tempo: number) => {
    frame = 0
    if (!podeRodar()) return

    const dt = Math.min((tempo - ultimo) / 1000, 0.05)
    ultimo = tempo

    if (transicao) {
      const anterior = transicao.progresso
      transicao.progresso = Math.min(1, transicao.progresso + dt / transicao.duracao)
      const de = transicao.angulo * anterior
      const ate = transicao.angulo * transicao.progresso
      adicionarArco(transicao.origem, transicao.eixo, de, ate)
      estadoAtual.copy(transicao.origem).applyAxisAngle(transicao.eixo, ate).setLength(RAIO)
      if (transicao.progresso >= 1) concluirPorta()
      notificar()
    } else if (precessando) {
      // Evolução livre sob H = ħωZ/2: apenas a fase de β avança (precessão de Larmor).
      beta = girar(beta, VELOCIDADE_PRECESSAO * dt)
      atualizarEstado()
      empurrarRastro(estadoAtual)
      notificar()
    }

    const cameraMudou = controls.update()
    desenhar()

    if (transicao || precessando || arrastando || cameraMudou) {
      frame = requestAnimationFrame(tick)
    }
  }

  const sincronizar = () => {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    ultimo = performance.now()
    if (podeRodar()) frame = requestAnimationFrame(tick)
    else if (!descartado) desenhar()
  }

  const onStart = () => {
    arrastando = true
    sincronizar()
  }
  const onEnd = () => {
    arrastando = false
    sincronizar()
  }
  const ajustarTamanho = (w: number, h: number) => {
    largura = Math.max(1, w)
    altura = Math.max(1, h)
    renderer.setSize(largura, altura)
    camera.aspect = largura / altura
    camera.updateProjectionMatrix()
    desenhar()
  }
  const resize = typeof ResizeObserver === 'function'
    ? new ResizeObserver(([entry]) => ajustarTamanho(entry.contentRect.width, entry.contentRect.height))
    : null
  const intersecao = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(([entry]) => {
      visivel = entry.isIntersecting
      sincronizar()
    })
    : null
  const contextoPerdido = (event: Event) => {
    event.preventDefault()
    onFailure()
  }
  const dispose = () => {
    if (descartado) return
    descartado = true
    fila.length = 0
    transicao = null
    cancelAnimationFrame(frame)
    controls.removeEventListener('start', onStart)
    controls.removeEventListener('end', onEnd)
    controls.dispose()
    resize?.disconnect()
    intersecao?.disconnect()
    document.removeEventListener('visibilitychange', sincronizar)
    renderer.domElement.removeEventListener('webglcontextlost', contextoPerdido)
    const geometrias = new Set<THREE.BufferGeometry>()
    const materiais = new Set<THREE.Material>()
    scene.traverse((objeto) => {
      if (objeto instanceof THREE.Mesh || objeto instanceof THREE.Line) {
        geometrias.add(objeto.geometry)
        materiais.add(objeto.material)
      }
    })
    geometrias.forEach((geometria) => geometria.dispose())
    materiais.forEach((material) => material.dispose())
    renderer.dispose()
    renderer.domElement.remove()
    rotulos.forEach(({ el }) => el.remove())
  }
  try {
    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)
    resize?.observe(host)
    intersecao?.observe(host)
    document.addEventListener('visibilitychange', sincronizar)
    renderer.domElement.addEventListener('webglcontextlost', contextoPerdido)
    cor.set(lerCor('--sim-esfera', '#5ca87c'))
    fino.color.set(lerCor('--sim-grade', '#b7e5ba'))
    forte.color.copy(fino.color)
    eixoPortaMat.color.set('#ffffff')
    preencherRastro(new THREE.Color(lerCor('--sim-fundo', '#0a1f18')), new THREE.Color(lerCor('--sim-rastro', '#34c98c')))
    ajustarTamanho(host.clientWidth, host.clientHeight)
    sincronizar()
    notificar(true)
  } catch (erro) {
    dispose()
    throw erro
  }

  return {
    aplicarPorta(porta: PortaQuantica) {
      fila.push(porta)
      ultimoResultado = null
      if (!transicao) iniciarProxima()
      sincronizar()
      notificar(true)
    },
    preparar(estado: EstadoPreparado) {
      fila.length = 0
      transicao = null
      esconderEixo()
      const [a, b] = SPINORES[estado]()
      alpha = a
      beta = b
      ultimoResultado = null
      atualizarEstado()
      limparRastro(estadoAtual)
      notificar(true)
      sincronizar()
    },
    /** Coloca o qubit em cos(θ/2)|0⟩ + e^(iφ) sen(θ/2)|1⟩. */
    definirAngulos(theta: number, phi: number) {
      fila.length = 0
      transicao = null
      esconderEixo()
      alpha = cplx(Math.cos(theta / 2))
      beta = girar(cplx(Math.sin(theta / 2)), phi)
      ultimoResultado = null
      atualizarEstado()
      empurrarRastro(estadoAtual)
      notificar(true)
      sincronizar()
    },
    medir() {
      // Se uma porta está em curso, conclui o estado unitário dela antes de medir.
      if (transicao) {
        const [a, b] = normalizarSpinor(...aplicarMatriz(transicao.porta, alpha, beta))
        alpha = a
        beta = b
        transicao = null
        esconderEixo()
      }
      fila.length = 0
      atualizarEstado()
      const resultado: '0' | '1' = Math.random() < probabilidadeZero() ? '0' : '1'
      alpha = resultado === '0' ? cplx(1) : cplx(0)
      beta = resultado === '0' ? cplx(0) : cplx(1)
      ultimoResultado = resultado
      atualizarEstado()
      limparRastro(estadoAtual)
      notificar(true)
      sincronizar()
      return resultado
    },
    setPrecessao(valor: boolean) {
      precessando = valor
      notificar(true)
      sincronizar()
    },
    dispose,
  }
}
