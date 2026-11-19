import { useEffect, type MouseEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ExternalLink, Icon } from '../components/ExternalLink'
import { Logo, type VarianteLogo } from '../components/Logo'
import { ArteHero } from '../components/ArteHero'
import type { Arte } from '../components/ArteHero'
import { GaleriaMembros } from '../components/GaleriaMembros'
import { useScrollMotion } from './useScrollMotion'

const variantesLogo: { id: VarianteLogo; rotulo: string }[] = [
  { id: 'bc-civitas', rotulo: 'BC Civitas Medium' },
  { id: 'adobe', rotulo: 'Adobe Express' },
  { id: 'madimi', rotulo: 'Madimi One' },
  { id: 'audex', rotulo: 'Audex' },
  { id: 'corpta', rotulo: 'Corpta' },
]

const menu = [
  { id: 'sobre', rotulo: 'Sobre' },
  { id: 'membros', rotulo: 'Membros' },
  { id: 'noticias', rotulo: 'Notícias' },
  { id: 'publicacoes', rotulo: 'Publicações' },
  { id: 'parceiros', rotulo: 'Parceiros' },
  { id: 'contato', rotulo: 'Contato' },
]
const idsSecoes = menu.map((m) => m.id)

const versoes: { rota: string; rotulo: string; arte: Arte | null }[] = [
  { rota: '/', rotulo: 'Átomo', arte: 'atomo' },
  { rota: '/qubit', rotulo: 'Com qubit', arte: 'qubit' },
  { rota: '/fundo', rotulo: 'Só fundo', arte: null },
]

const paletas = [
  { id: 'verde', rotulo: 'Verde' },
  { id: 'dourado', rotulo: 'Dourado' },
]

export function Site({ arte }: { arte: Arte | null }) {
  const { pathname, search, hash } = useLocation()
  const parametros = new URLSearchParams(search)
  const logoAtual = parametros.get('logo')
  const variante = variantesLogo.find((v) => v.id === logoAtual)?.id ?? 'adobe'
  const paletaAtual = parametros.get('paleta')
  const paleta = paletas.find((p) => p.id === paletaAtual)?.id ?? paletas[0].id
  const { raiz, ativa, setAtiva, irPara } = useScrollMotion(idsSecoes)

  useEffect(() => {
    if (!raiz.current) return
    const cor = getComputedStyle(raiz.current).getPropertyValue('--tom-escuro').trim()
    if (cor) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', cor)
  }, [paleta, raiz])

  const comParam = (chave: string, valor: string) => {
    const p = new URLSearchParams(search)
    p.set(chave, valor)
    return { pathname, search: `?${p}` }
  }
  const comRota = (rota: string) => ({ pathname: rota, search })

  const ir = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setAtiva(id)
    irPara(id)
  }

  return (
    <div className="site" data-paleta={paleta} ref={raiz}>
      <a className="skip" href="#conteudo" onClick={ir('conteudo')}>
        Pular para o conteúdo
      </a>

      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#inicio" onClick={ir('inicio')} aria-label="LATEQ, voltar ao início">
            <Logo variante={variante} className="lateq--topo" />
          </a>
          <nav className="menu" aria-label="Menu principal">
            {menu.map((m) => (
              <a
                key={m.id}
                href={`#${m.id}`}
                onClick={ir(m.id)}
                aria-current={ativa === m.id ? 'true' : undefined}
              >
                {m.rotulo}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div id="smooth-wrapper">
        <div id="smooth-content">
          <main id="conteudo" tabIndex={-1}>
            <section
              className={arte ? `hero hero-${arte}` : 'hero sem-arte'}
              id="inicio"
              tabIndex={-1}
              aria-labelledby="titulo"
            >
              {arte && <ArteHero key={arte} arte={arte} paleta={paleta} />}
              <div className="hero-copy">
                <h1 id="titulo" data-intro>
                  <Logo variante={variante} className="lateq--hero" />
                </h1>
                <div className="actions" data-intro>
                  <a className="pill" href="#sobre" onClick={ir('sobre')}>
                    Conhecer a liga <Icon name="arrow-down" />
                  </a>
                </div>
              </div>
            </section>

            <section className="section" id="sobre" tabIndex={-1} aria-labelledby="sobre-titulo">
              <div className="wrap">
                <h2 id="sobre-titulo">
                  Sobre o LATEQ
                </h2>
                <p data-reveal>
                  O Laboratório de Tecnologias Quânticas (LATEQ) é um grupo de pesquisa da Universidade Federal da
                  Paraíba (UFPB) que estuda as possibilidades de aplicação da computação quântica em diferentes áreas
                  do conhecimento. Nosso trabalho busca compreender como as propriedades dos sistemas quânticos podem
                  ser utilizadas para representar e processar informações, aproximando conceitos da física e da
                  computação. A partir desses estudos, procuramos entender em quais problemas essa tecnologia pode ser
                  útil, como ela pode ser aplicada e quais são suas limitações.
                </p>
              </div>
            </section>

            <section className="section band" id="membros" tabIndex={-1} aria-labelledby="membros-titulo">
              <div className="wrap">
                <h2 id="membros-titulo">
                  Membros
                </h2>
                <GaleriaMembros />
              </div>
            </section>

            <section className="section" id="noticias" tabIndex={-1} aria-labelledby="noticias-titulo">
              <div className="wrap">
                <h2 id="noticias-titulo">
                  Notícias
                </h2>
                <div className="noticias-lista">
                  <article className="noticia" data-reveal>
                    <ExternalLink
                      className="noticia-link"
                      href="https://g1.globo.com/pb/paraiba/noticia/2026/11/16/computadore-quantico-america-latina-chegam-paraiba-instalados-joao-pessoa.ghtml"
                      hideIcon
                    >
                      <img
                        src="/assets/computador-quantico-pb.jpg"
                        width="984"
                        height="738"
                        alt="Equipamentos dos primeiros computadores quânticos da América Latina ao desembarcarem na Paraíba"
                        loading="lazy"
                        decoding="async"
                      />
                      <h3 className="noticia-titulo">
                        Primeiros computadores quânticos da América Latina chegam à Paraíba e vão ser instalados em João
                        Pessoa <Icon name="arrow-out" />
                      </h3>
                    </ExternalLink>
                  </article>
                  <article className="noticia" data-reveal>
                    <ExternalLink
                      className="noticia-link"
                      href="https://paraibabusiness.com.br/ciquanta-abrira-computadores-quanticos-para-empresas-da-paraiba-e-negocia-parcerias-com-bancos/"
                      hideIcon
                    >
                      <img
                        src="/assets/ciquanta-empresas-pb.webp"
                        width="1200"
                        height="675"
                        alt="Fachada do Centro de Computação Quântica da Paraíba (Ciquanta), em João Pessoa"
                        loading="lazy"
                        decoding="async"
                      />
                      <h3 className="noticia-titulo">
                        Ciquanta abrirá computadores quânticos para empresas da Paraíba e negocia parcerias com bancos{' '}
                        <Icon name="arrow-out" />
                      </h3>
                    </ExternalLink>
                  </article>
                </div>
              </div>
            </section>

            <section className="section band" id="publicacoes" tabIndex={-1} aria-labelledby="publicacoes-titulo">
              <div className="wrap">
                <h2 id="publicacoes-titulo">
                  Publicações
                </h2>
                <p className="empty" data-reveal>
                  As publicações do laboratório serão listadas aqui.
                </p>
              </div>
            </section>

            <section className="section" id="parceiros" tabIndex={-1} aria-labelledby="parceiros-titulo">
              <div className="wrap">
                <h2 id="parceiros-titulo">
                  Parceiros
                </h2>
                <ul className="partners" role="list">
                  <li data-reveal>
                    <ExternalLink href="https://www.ufpb.br/" hideIcon>
                      <img src="/assets/brasao-ufpb.png" width="52" height="70" alt="" />
                      <span className="partner-name">
                        Universidade Federal da Paraíba (UFPB) <Icon name="arrow-out" />
                      </span>
                    </ExternalLink>
                  </li>
                  <li data-reveal>
                    <ExternalLink href="https://www.ci.ufpb.br/" hideIcon>
                      <img src="/assets/logo-ci.png" width="70" height="70" alt="" />
                      <span className="partner-name">
                        Centro de Informática (CI) <Icon name="arrow-out" />
                      </span>
                    </ExternalLink>
                  </li>
                </ul>
              </div>
            </section>

            <section className="section band contact" id="contato" tabIndex={-1} aria-labelledby="contato-titulo">
              <div className="wrap">
                <h2 id="contato-titulo">
                  Fale com o LATEQ
                </h2>
                <p data-reveal>Os canais de contato do laboratório serão informados aqui.</p>
                <p className="actions" data-reveal>
                  <ExternalLink className="pill solid" href="https://www.ci.ufpb.br/">
                    Centro de Informática
                  </ExternalLink>
                </p>
              </div>
            </section>
          </main>

          <footer className="footer">
            <div className="wrap footer-inner">
              <Logo variante={variante} className="lateq--rodape" />
              <p>
                Universidade Federal da Paraíba
                <br />
                Centro de Informática · João Pessoa (PB)
              </p>
              <button type="button" className="to-top" aria-label="Voltar ao topo" onClick={() => irPara('inicio')}>
                <Icon name="arrow-up" />
              </button>
            </div>
          </footer>
        </div>
      </div>

      <div className="dock">
        <div className="dock-variantes">
          <nav className="versoes" aria-label="Versões do protótipo">
            {versoes.map((v) => (
              <Link key={v.rota} to={comRota(v.rota)} aria-current={v.arte === arte ? 'page' : undefined}>
                {v.rotulo}
              </Link>
            ))}
          </nav>
          <nav className="versoes" aria-label="Versões do logotipo">
            <span className="versoes-rotulo" aria-hidden="true">
              Logo
            </span>
            {variantesLogo.map((v) => (
              <Link key={v.id} to={comParam('logo', v.id)} aria-current={variante === v.id ? 'page' : undefined}>
                {v.rotulo}
              </Link>
            ))}
          </nav>
        </div>
        <nav className="versoes" aria-label="Paletas de cores">
          <span className="versoes-rotulo" aria-hidden="true">
            Paleta
          </span>
          {paletas.map((p) => (
            <Link
              key={p.id}
              to={{ ...comParam('paleta', p.id), hash }}
              aria-current={paleta === p.id ? 'page' : undefined}
            >
              {p.rotulo}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
