import * as THREE from 'three'

const RASTRO = 140

const VERTEX = `varying vec3 n; void main(){ n=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`

const circulo = (raio: number, eixo: 'x' | 'y' | 'z', passos = 128) =>
  Array.from({ length: passos }, (_, i) => {
    const a = (i / passos) * Math.PI * 2
    const c = Math.cos(a) * raio
    const s = Math.sin(a) * raio
    return eixo === 'y' ? new THREE.Vector3(c, 0, s) : eixo === 'x' ? new THREE.Vector3(0, c, s) : new THREE.Vector3(c, s, 0)
  })

const estado = (theta: number, phi: number, raio = 1) =>
  new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)).multiplyScalar(raio)

export function criarQubit(
  host: HTMLElement,
  labelHost: HTMLElement,
  onFailure: () => void,
) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setClearColor(0x000000, 0)
  renderer.domElement.setAttribute('aria-hidden', 'true')
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20)
  camera.position.set(0, 0, 4.4)
  const bloch = new THREE.Group()
  const GIRO_INICIAL = 0.5
  bloch.rotation.set(0.38, GIRO_INICIAL, 0)
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

  const fino = new THREE.LineBasicMaterial({ color: cor, transparent: true, opacity: 0.2 })
  const forte = new THREE.LineBasicMaterial({ color: cor, transparent: true, opacity: 0.72 })
  for (let k = -2; k <= 2; k++) {
    if (k === 0) continue
    const altura = Math.sin((k * Math.PI) / 6)
    const anel = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circulo(Math.cos((k * Math.PI) / 6) * 1.002, 'y')), fino)
    anel.position.y = altura
    bloch.add(anel)
  }
  for (let k = 0; k < 6; k++) {
    const meridiano = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circulo(1.002, 'z')), fino)
    meridiano.rotation.y = (k * Math.PI) / 6
    bloch.add(meridiano)
  }
  bloch.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circulo(1.003, 'y')), forte))

  const eixoGeo = (de: THREE.Vector3, ate: THREE.Vector3) => new THREE.BufferGeometry().setFromPoints([de, ate])
  const eixoMat = new THREE.LineBasicMaterial({ color: cor, transparent: true, opacity: 0.5 })
  bloch.add(new THREE.Line(eixoGeo(new THREE.Vector3(0, -1.32, 0), new THREE.Vector3(0, 1.32, 0)), eixoMat))
  bloch.add(new THREE.Line(eixoGeo(new THREE.Vector3(-1.2, 0, 0), new THREE.Vector3(1.2, 0, 0)), eixoMat))
  bloch.add(new THREE.Line(eixoGeo(new THREE.Vector3(0, 0, -1.2), new THREE.Vector3(0, 0, 1.2)), eixoMat))

  const vetorGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)])
  const vetor = new THREE.Line(vetorGeo, new THREE.LineBasicMaterial({ color: cor }))
  bloch.add(vetor)
  const ponta = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshBasicMaterial({ color: cor }))
  bloch.add(ponta)
  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 16, 12),
    new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.22, depthWrite: false }),
  )
  bloch.add(aura)

  const rastroPos = new Float32Array(RASTRO * 3)
  const rastroCor = new Float32Array(RASTRO * 3)
  const rastroGeo = new THREE.BufferGeometry()
  rastroGeo.setAttribute('position', new THREE.BufferAttribute(rastroPos, 3))
  rastroGeo.setAttribute('color', new THREE.BufferAttribute(rastroCor, 3))
  bloch.add(new THREE.Line(rastroGeo, new THREE.LineBasicMaterial({ vertexColors: true })))

  const aplicarCores = () => {
    const estilos = getComputedStyle(host)
    cor.set(estilos.getPropertyValue('--arte-cor').trim() || '#0d5240')
    for (const material of [fino, forte, eixoMat, vetor.material, ponta.material, aura.material]) {
      material.color.copy(cor)
    }
    const corCssRastro = estilos.getPropertyValue('--arte-rastro').trim()
    const corRastro = corCssRastro
      ? new THREE.Color(corCssRastro)
      : new THREE.Color().setRGB(0.56, 0.82, 0.65)
    for (let i = 0; i < RASTRO; i++) {
      const brilho = Math.pow(i / (RASTRO - 1), 1.6)
      rastroCor.set([
        corRastro.r + (cor.r - corRastro.r) * brilho,
        corRastro.g + (cor.g - corRastro.g) * brilho,
        corRastro.b + (cor.b - corRastro.b) * brilho,
      ], i * 3)
    }
    rastroGeo.attributes.color.needsUpdate = true
  }

  const posicaoEstado = (t: number) => estado(1.15 + 0.55 * Math.sin(t * 0.21), t * 0.55, 1.004)
  const preencherRastro = (t: number) => {
    for (let i = 0; i < RASTRO; i++) {
      posicaoEstado(t - (RASTRO - 1 - i) * 0.05).toArray(rastroPos, i * 3)
    }
    rastroGeo.attributes.position.needsUpdate = true
  }

  const rotulos = [
    { texto: '|0>', posicao: new THREE.Vector3(0, 1.34, 0), el: document.createElement('span'), classe: '' },
    { texto: '|1>', posicao: new THREE.Vector3(0, -1.34, 0), el: document.createElement('span'), classe: '' },
    { texto: '|ψ>', posicao: new THREE.Vector3(), el: document.createElement('span'), classe: 'destaque' },
  ]
  for (const r of rotulos) {
    r.el.textContent = r.texto
    if (r.classe) r.el.className = r.classe
    labelHost.appendChild(r.el)
  }
  const rotuloEstado = rotulos[2]

  let largura = 1
  let altura = 1
  let frame = 0
  let ultimo = 0
  let decorrido = 4
  let pausado = false
  let visivel = true
  let descartado = false
  const projetado = new THREE.Vector3()
  const mundo = new THREE.Vector3()

  const desenhar = () => {
    bloch.rotation.y = GIRO_INICIAL + decorrido * 0.04
    const atual = posicaoEstado(decorrido)
    vetorGeo.attributes.position.setXYZ(1, atual.x, atual.y, atual.z)
    vetorGeo.attributes.position.needsUpdate = true
    ponta.position.copy(atual)
    aura.position.copy(atual)
    preencherRastro(decorrido)
    rotuloEstado.posicao.copy(atual).multiplyScalar(1.1).add(new THREE.Vector3(0.07, 0.1, 0))
    bloch.updateMatrixWorld(true)
    for (const r of rotulos) {
      mundo.copy(r.posicao).applyMatrix4(bloch.matrixWorld)
      projetado.copy(mundo).project(camera)
      r.el.style.transform = `translate(${((projetado.x + 1) * largura) / 2}px,${((-projetado.y + 1) * altura) / 2}px) translate(-50%, -50%)`
    }
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
    largura = Math.max(1, entry.contentRect.width)
    altura = Math.max(1, entry.contentRect.height)
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
      const geometrias = new Set<THREE.BufferGeometry>()
      const materiais = new Set<THREE.Material>()
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
          geometrias.add(o.geometry)
          ;(Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => materiais.add(m))
        }
      })
      geometrias.forEach((g) => g.dispose())
      materiais.forEach((m) => m.dispose())
      renderer.dispose()
      renderer.domElement.remove()
      rotulos.forEach((r) => r.el.remove())
    },
  }
}
