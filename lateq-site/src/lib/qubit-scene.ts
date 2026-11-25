import * as THREE from 'three'

const RASTRO = 140

const VERTEX = `varying vec3 n; void main(){ n=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`

const circulo = (raio: number, eixo: 'y' | 'z') => {
  const passos = 128
  return Array.from({ length: passos }, (_, i) => {
    const a = (i / passos) * Math.PI * 2
    const c = Math.cos(a) * raio
    const s = Math.sin(a) * raio
    return eixo === 'y' ? new THREE.Vector3(c, 0, s) : new THREE.Vector3(c, s, 0)
  })
}

export function criarQubit(host: HTMLElement, labelHost: HTMLElement, onFailure: () => void) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setClearColor(0x000000, 0)
  renderer.domElement.setAttribute('aria-hidden', 'true')
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20)
  camera.position.set(0, 0, 4.4)
  camera.updateMatrixWorld()
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

  const rastroGeo = new THREE.BufferGeometry()
  rastroGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(RASTRO * 3), 3))
  rastroGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(RASTRO * 3), 3))
  bloch.add(new THREE.Line(rastroGeo, new THREE.LineBasicMaterial({ vertexColors: true })))

  const aplicarCores = () => {
    const estilos = getComputedStyle(host)
    cor.set(estilos.getPropertyValue('--arte-cor').trim() || '#0d7053')
    for (const material of [fino, forte, eixoMat, vetor.material, ponta.material, aura.material]) {
      material.color.copy(cor)
    }
    const corCssRastro = estilos.getPropertyValue('--arte-rastro').trim()
    const corRastro = corCssRastro
      ? new THREE.Color(corCssRastro)
      : new THREE.Color().setRGB(0.56, 0.82, 0.65)
    const cores = rastroGeo.getAttribute('color')
    for (let i = 0; i < RASTRO; i++) {
      const brilho = Math.pow(i / (RASTRO - 1), 1.6)
      cores.setXYZ(
        i,
        corRastro.r + (cor.r - corRastro.r) * brilho,
        corRastro.g + (cor.g - corRastro.g) * brilho,
        corRastro.b + (cor.b - corRastro.b) * brilho,
      )
    }
    cores.needsUpdate = true
  }

  const posicaoEstado = (t: number) => {
    const theta = 1.15 + 0.55 * Math.sin(t * 0.21)
    const phi = t * 0.55
    return new THREE.Vector3(
      Math.sin(theta) * Math.cos(phi),
      Math.cos(theta),
      Math.sin(theta) * Math.sin(phi),
    ).multiplyScalar(1.004)
  }
  const preencherRastro = (t: number) => {
    const posicoes = rastroGeo.getAttribute('position')
    for (let i = 0; i < RASTRO; i++) {
      const ponto = posicaoEstado(t - (RASTRO - 1 - i) * 0.05)
      posicoes.setXYZ(i, ponto.x, ponto.y, ponto.z)
    }
    posicoes.needsUpdate = true
  }

  const rotuloEstado = { texto: '|ψ>', posicao: new THREE.Vector3(), el: document.createElement('span'), classe: 'destaque' }
  const rotulos = [
    { texto: '|0>', posicao: new THREE.Vector3(0, 1.34, 0), el: document.createElement('span'), classe: '' },
    { texto: '|1>', posicao: new THREE.Vector3(0, -1.34, 0), el: document.createElement('span'), classe: '' },
    rotuloEstado,
  ]
  for (const r of rotulos) {
    r.el.textContent = r.texto
    if (r.classe) r.el.className = r.classe
    labelHost.appendChild(r.el)
  }
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
    if (descartado) return
    const atual = posicaoEstado(decorrido)
    bloch.rotation.y = GIRO_INICIAL + decorrido * 0.04
    preencherRastro(decorrido)
    vetorGeo.attributes.position.setXYZ(1, atual.x, atual.y, atual.z)
    vetorGeo.attributes.position.needsUpdate = true
    ponta.position.copy(atual)
    aura.position.copy(atual)
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
    cancelAnimationFrame(frame)
    resize?.disconnect()
    intersecao?.disconnect()
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
  }
  try {
    resize?.observe(host)
    intersecao?.observe(host)
    document.addEventListener('visibilitychange', sincronizar)
    renderer.domElement.addEventListener('webglcontextlost', contextoPerdido)
    aplicarCores()
    ajustarTamanho(host.clientWidth, host.clientHeight)
    sincronizar()
  } catch (erro) {
    dispose()
    throw erro
  }

  return {
    setPausado(valor: boolean) {
      pausado = valor
      sincronizar()
    },
    dispose,
  }
}
