import * as THREE from 'three'

const DISTANCIA = 4.4

const VERTEX = `varying float vZ; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vZ=mv.z; gl_Position=projectionMatrix*mv; }`
const FRAGMENT = `uniform vec3 uCor; uniform float uCentro; uniform float uRaio; varying float vZ;
void main(){ float frente=clamp((vZ-uCentro)/uRaio*0.5+0.5,0.0,1.0); gl_FragColor=vec4(uCor,mix(0.22,1.0,frente*frente)); }`

type Orbita = {
  raio: number
  espessura: number
  inclinacao: number
  eixo: 'x' | 'y'
  base: number
  amplitude: number
  velocidade: number
  fase: number
}

const ORBITAS: Orbita[] = [
  { raio: 1.3, espessura: 0.024, inclinacao: -0.42, eixo: 'y', base: 1.22, amplitude: 0.16, velocidade: 0.21, fase: 0 },
  { raio: 1.2, espessura: 0.018, inclinacao: -0.3, eixo: 'x', base: 1.18, amplitude: 0.14, velocidade: 0.17, fase: 1.3 },
  { raio: 0.84, espessura: 0.012, inclinacao: 0.32, eixo: 'x', base: 1.12, amplitude: 0.18, velocidade: 0.25, fase: 2.4 },
  { raio: 0.72, espessura: 0.012, inclinacao: 0.04, eixo: 'y', base: 1.25, amplitude: 0.2, velocidade: 0.19, fase: 3.7 },
]

function estrela(tamanho: number) {
  const curva = tamanho * 0.18
  const forma = new THREE.Shape()
  forma.moveTo(0, tamanho)
  forma.quadraticCurveTo(curva, curva, tamanho, 0)
  forma.quadraticCurveTo(curva, -curva, 0, -tamanho)
  forma.quadraticCurveTo(-curva, -curva, -tamanho, 0)
  forma.quadraticCurveTo(-curva, curva, 0, tamanho)
  return new THREE.ShapeGeometry(forma, 12)
}

export function criarAtomo(host: HTMLElement, onFailure: () => void) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setClearColor(0x000000, 0)
  renderer.domElement.setAttribute('aria-hidden', 'true')
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20)
  camera.position.set(0, 0, DISTANCIA)
  const atomo = new THREE.Group()
  scene.add(atomo)

  const cor = new THREE.Color()

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uCor: { value: cor }, uCentro: { value: -DISTANCIA }, uRaio: { value: 1.3 } },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
  })

  const aneis = ORBITAS.map((o) => {
    const pivo = new THREE.Group()
    pivo.rotation.z = o.inclinacao
    const anel = new THREE.Mesh(new THREE.TorusGeometry(o.raio, o.espessura, 8, 220), material)
    pivo.add(anel)
    atomo.add(pivo)
    return { anel, o }
  })

  const nucleo = new THREE.Mesh(estrela(0.12), new THREE.MeshBasicMaterial({ color: cor }))
  scene.add(nucleo)

  const aplicarCores = () => {
    const estilos = getComputedStyle(host)
    cor.set(estilos.getPropertyValue('--arte-cor').trim() || '#6b4f12')
    const corNucleo = estilos.getPropertyValue('--arte-nucleo').trim()
    if (corNucleo) nucleo.material.color.set(corNucleo)
    else nucleo.material.color.copy(cor)
  }

  let frame = 0
  let ultimo = 0
  let decorrido = 0
  let pausado = false
  let visivel = true
  let descartado = false

  const desenhar = () => {
    const t = decorrido
    atomo.rotation.y = Math.sin(t * 0.13) * 0.45
    atomo.rotation.x = Math.sin(t * 0.09 + 0.6) * 0.18
    for (const { anel, o } of aneis) {
      anel.rotation[o.eixo] = o.base + Math.sin(t * o.velocidade + o.fase) * o.amplitude
    }
    nucleo.rotation.z = Math.sin(t * 0.3) * 0.25
    nucleo.scale.setScalar(1 + Math.sin(t * 0.8) * 0.06)
    renderer.render(scene, camera)
  }

  const podeAnimar = () => !descartado && !pausado && visivel && !document.hidden
  const tick = (tempo: number) => {
    frame = 0
    if (!podeAnimar()) return
    if (tempo - ultimo >= 32) {
      decorrido += Math.min((tempo - ultimo) / 1000, 0.05)
      ultimo = tempo
      desenhar()
    }
    frame = requestAnimationFrame(tick)
  }
  const sincronizar = () => {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    ultimo = performance.now()
    if (podeAnimar()) frame = requestAnimationFrame(tick)
    else if (!descartado) desenhar()
  }

  const resize = new ResizeObserver(([entry]) => {
    const largura = Math.max(1, entry.contentRect.width)
    const altura = Math.max(1, entry.contentRect.height)
    renderer.setSize(largura, altura)
    camera.aspect = largura / altura
    camera.updateProjectionMatrix()
    desenhar()
  })
  resize.observe(host)
  const intersecao = new IntersectionObserver(([entry]) => {
    visivel = entry.isIntersecting
    sincronizar()
  })
  intersecao.observe(host)
  document.addEventListener('visibilitychange', sincronizar)
  const contextoPerdido = (event: Event) => {
    event.preventDefault()
    onFailure()
  }
  renderer.domElement.addEventListener('webglcontextlost', contextoPerdido)
  aplicarCores()
  sincronizar()

  return {
    atualizarCores() {
      aplicarCores()
      desenhar()
    },
    setPausado(valor: boolean) {
      pausado = valor
      sincronizar()
    },
    dispose() {
      descartado = true
      cancelAnimationFrame(frame)
      resize.disconnect()
      intersecao.disconnect()
      document.removeEventListener('visibilitychange', sincronizar)
      renderer.domElement.removeEventListener('webglcontextlost', contextoPerdido)
      aneis.forEach(({ anel }) => anel.geometry.dispose())
      material.dispose()
      nucleo.geometry.dispose()
      nucleo.material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
