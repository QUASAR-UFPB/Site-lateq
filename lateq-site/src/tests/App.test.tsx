import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('site do LATEQ', () => {
  it('mostra o título principal', () => {
    renderAt('/')
    expect(
      screen.getByRole('heading', { level: 1, name: 'LATEQ, Laboratório de Tecnologias Quânticas' }),
    ).toBeInTheDocument()
  })

  it('mostra Recursos logo antes de Publicações na página e no menu', () => {
    renderAt('/')
    const nav = screen.getByRole('navigation', { name: /menu principal/i })
    expect(within(nav).getAllByRole('link').map((a) => a.textContent)).toEqual([
      'Sobre',
      'Membros',
      'Notícias',
      'Recursos',
      'Publicações',
      'Parceiros',
      'Contato',
    ])
    const publicacoes = screen.getByRole('region', { name: 'Publicações' })
    expect(publicacoes.previousElementSibling).toBe(screen.getByRole('region', { name: 'Recursos' }))
  })

  it('leva o foco a Recursos pelo menu e exibe o simulador nessa seção', async () => {
    const usuario = userEvent.setup()
    renderAt('/fundo')
    const nav = within(screen.getByRole('navigation', { name: 'Menu principal' }))
    const link = nav.getByRole('link', { name: 'Recursos' })
    const secao = screen.getByRole('region', { name: 'Recursos' })

    expect(link).toHaveAttribute('href', '#recursos')
    await usuario.click(link)
    expect(secao).toHaveFocus()
    expect(within(secao).getByText(/ambientes computacionais/i)).toBeInTheDocument()
    expect(within(secao).getByRole('heading', { name: 'Esfera de Bloch' })).toBeInTheDocument()
  })

  it('exibe as duas notícias lado a lado com título e imagem na seção Notícias', () => {
    renderAt('/fundo')
    const noticias = screen.getByRole('region', { name: 'Notícias' })
    const g1 = within(noticias).getByRole('link', {
      name: /Primeiros computadores quânticos da América Latina chegam à Paraíba e vão ser instalados em João Pessoa/i,
    })
    expect(g1).toHaveAttribute(
      'href',
      'https://g1.globo.com/pb/paraiba/noticia/2026/11/16/computadore-quantico-america-latina-chegam-paraiba-instalados-joao-pessoa.ghtml',
    )
    expect(g1.querySelector('img[src="/assets/computador-quantico-pb.jpg"]')).toBeInTheDocument()

    const ciquanta = within(noticias).getByRole('link', {
      name: /Ciquanta abrirá computadores quânticos para empresas da Paraíba e negocia parcerias com bancos/i,
    })
    expect(ciquanta).toHaveAttribute(
      'href',
      'https://paraibabusiness.com.br/ciquanta-abrira-computadores-quanticos-para-empresas-da-paraiba-e-negocia-parcerias-com-bancos/',
    )
    expect(ciquanta.querySelector('img[src="/assets/ciquanta-empresas-pb.webp"]')).toBeInTheDocument()
  })

  it('mantém a abertura centrada no LATEQ', () => {
    renderAt('/')
    const abertura = document.getElementById('inicio')
    expect(abertura).not.toHaveTextContent(/encontro|palestrante|quasar/i)
    expect(abertura?.querySelector('img[src*="quasar"]')).not.toBeInTheDocument()
  })

  it('pausa a animação suave do fundo fora da área visível ou com a aba oculta', () => {
    const observar = vi.fn()
    const desconectar = vi.fn()
    let notificar: ((entradas: { isIntersecting: boolean }[]) => void) | undefined
    vi.stubGlobal('IntersectionObserver', class {
      observe = observar
      disconnect = desconectar

      constructor(callback: typeof notificar) {
        notificar = callback
      }
    })
    const matchMediaOriginal = window.matchMedia
    const preferencia = vi.spyOn(window, 'matchMedia').mockImplementation((consulta) => ({
      ...matchMediaOriginal(consulta),
      matches: consulta === '(prefers-reduced-motion: reduce)',
    }))
    const abaOculta = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    try {
      const site = renderAt('/fundo')
      const abertura = screen.getByRole('region', { name: 'LATEQ, Laboratório de Tecnologias Quânticas' })

      expect(observar).toHaveBeenCalledWith(abertura)
      notificar?.([{ isIntersecting: true }])
      expect(abertura).toHaveAttribute('data-ramificacoes-ativas')

      abaOculta.mockReturnValue(true)
      document.dispatchEvent(new Event('visibilitychange'))
      expect(abertura).not.toHaveAttribute('data-ramificacoes-ativas')

      abaOculta.mockReturnValue(false)
      document.dispatchEvent(new Event('visibilitychange'))
      expect(abertura).toHaveAttribute('data-ramificacoes-ativas')

      notificar?.([{ isIntersecting: false }])
      expect(abertura).not.toHaveAttribute('data-ramificacoes-ativas')

      site.unmount()
      expect(desconectar).toHaveBeenCalled()
    } finally {
      cleanup()
      abaOculta.mockRestore()
      preferencia.mockRestore()
      vi.unstubAllGlobals()
    }
  })

  it('alterna entre a foto do grupo e a do seminário em Membros', async () => {
    renderAt('/fundo')
    const galeria = within(screen.getByRole('region', { name: 'Galeria de Membros' }))
    const anterior = galeria.getByRole('button', { name: 'Imagem anterior' })
    const proxima = galeria.getByRole('button', { name: 'Próxima imagem' })

    expect(galeria.getAllByRole('img', { hidden: true })).toHaveLength(2)
    expect(galeria.getByRole('img', { name: /centro de informática da ufpb/i })).toBeInTheDocument()
    expect(galeria.getByRole('status')).toHaveTextContent('1 de 2')
    await userEvent.click(proxima)
    expect(galeria.getByRole('img', { name: /seminário interno/i })).toBeInTheDocument()
    expect(galeria.getByRole('status')).toHaveTextContent('2 de 2')
    await userEvent.click(proxima)
    expect(galeria.getByRole('status')).toHaveTextContent('1 de 2')
    await userEvent.click(anterior)
    expect(galeria.getByRole('status')).toHaveTextContent('2 de 2')
  })

  it('usa a marca escolhida no cabeçalho, na abertura e no rodapé', () => {
    renderAt('/fundo')
    const marcas = screen.getAllByRole('img', { name: 'LATEQ, Laboratório de Tecnologias Quânticas' })
    expect(marcas).toHaveLength(3)
    marcas.forEach((marca) => {
      expect(marca.querySelector('.lateq-marca')).toBeInTheDocument()
      expect(marca.querySelector('.lateq-sub')).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: 'Adobe Express' })).toHaveAttribute('aria-current', 'page')
  })

  it('as fontes de comparação ainda exibem o nome LATEQ completo', () => {
    renderAt('/?logo=madimi')
    expect(document.querySelector('.lateq-txt')?.textContent).toBe('LATEQ')
    expect(document.querySelector('.lateq-sub')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Madimi One' })).toHaveAttribute('aria-current', 'page')
    cleanup()
    renderAt('/?logo=audex')
    expect(document.querySelector('.lateq--audex .lateq-txt')?.textContent).toBe('LATEQ')
    expect(document.querySelector('.lateq--audex .lateq-sub')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Audex' })).toHaveAttribute('aria-current', 'page')
  })

  it('seleciona as versões do logotipo pelo seletor e pela URL', () => {
    renderAt('/?logo=corpta')
    expect(document.querySelector('.lateq--corpta')).toBeInTheDocument()
    const logos = within(screen.getByRole('navigation', { name: 'Versões do logotipo' }))
    expect(logos.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'BC Civitas Medium', 'Adobe Express', 'Madimi One', 'Audex', 'Corpta',
    ])
    expect(logos.getByRole('link', { name: 'Corpta' })).toHaveAttribute('aria-current', 'page')
  })

  it('usa o logotipo padrão quando o parâmetro logo é desconhecido', () => {
    renderAt('/fundo?logo=neutronic')
    const seletor = screen.getByRole('navigation', { name: 'Versões do logotipo' })
    expect(within(seletor).getByRole('link', { name: 'Adobe Express' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { level: 1 }).querySelector('.lateq--adobe .lateq-marca')).toBeInTheDocument()
  })

  it('seleciona BC Civitas Medium sem mudar a arte', async () => {
    renderAt('/fundo?fundo=atual')
    const seletor = within(screen.getByRole('navigation', { name: 'Versões do logotipo' }))
    const civitas = seletor.getByRole('link', { name: 'BC Civitas Medium' })

    expect(civitas).toHaveAttribute('href', '/fundo?fundo=atual&logo=bc-civitas')
    await userEvent.click(civitas)
    expect(civitas).toHaveAttribute('aria-current', 'page')
    expect(document.querySelector('.lateq--bc-civitas .lateq-txt')).toHaveTextContent('LATEQ')
    expect(document.querySelector('.hero')).toHaveClass('sem-arte')
  })

  it('abre Fundo1 por padrão e permite alternar para os outros fundos', async () => {
    renderAt('/fundo?logo=corpta')
    const seletor = within(screen.getByRole('navigation', { name: 'Fundos da abertura' }))
    const fundo2 = seletor.getByRole('link', { name: 'Fundo2' })
    const fundo3 = seletor.getByRole('link', { name: 'Fundo3' })
    const fundo1 = seletor.getByRole('link', { name: 'Fundo1' })

    expect(seletor.getAllByRole('link').map((link) => link.textContent)).toEqual(['Fundo1', 'Fundo2', 'Fundo3'])
    expect(fundo1).toHaveAttribute('aria-current', 'page')
    expect(document.querySelector('.site')).toHaveAttribute('data-fundo', 'introducao')
    expect(fundo3).toHaveAttribute('href', '/fundo?logo=corpta&fundo=antigo')
    await userEvent.click(fundo3)
    expect(fundo3).toHaveAttribute('aria-current', 'page')
    expect(document.querySelector('.site')).toHaveAttribute('data-fundo', 'antigo')
    expect(screen.getByRole('link', { name: 'Só fundo' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Com qubit' })).toHaveAttribute('href', '/qubit?logo=corpta&fundo=antigo')
    expect(screen.getByRole('link', { name: 'Corpta' })).toHaveAttribute('aria-current', 'page')

    expect(fundo1).toHaveAttribute('href', '/fundo?logo=corpta&fundo=introducao')
    await userEvent.click(fundo1)
    const abertura = within(screen.getByRole('region', { name: 'LATEQ, Laboratório de Tecnologias Quânticas' }))
    expect(fundo1).toHaveAttribute('aria-current', 'page')
    expect(abertura.getByRole('link', { name: 'Conhecer o laboratório' })).toHaveAttribute('href', '#sobre')
    expect(abertura.getByRole('link', { name: 'Simulador quântico' })).toHaveAttribute('href', '#recursos')
    expect(screen.getByRole('region', { name: 'Publicações' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Corpta' })).toHaveAttribute('aria-current', 'page')

    await userEvent.click(fundo2)
    expect(fundo2).toHaveAttribute('aria-current', 'page')
    expect(document.querySelector('.site')).toHaveAttribute('data-fundo', 'atual')
    expect(screen.queryByRole('navigation', { name: 'Versões do protótipo' })).not.toBeInTheDocument()
  })

  it.each(['dourado', 'azul'])('abre Fundo1 e respeita o logotipo em links antigos com paleta %s', (paleta) => {
    renderAt(`/fundo?logo=corpta&paleta=${paleta}`)

    expect(screen.queryByRole('navigation', { name: 'Paletas de cores' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Corpta' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Fundo1' })).toHaveAttribute('aria-current', 'page')
  })

  it('abre links externos com rel noopener e exibe logos e siglas nos parceiros', () => {
    renderAt('/')
    const externos = document.querySelectorAll('a[target="_blank"]')
    expect(externos.length).toBeGreaterThanOrEqual(3)
    externos.forEach((a) => expect(a.getAttribute('rel')).toContain('noopener'))

    const parceiros = screen.getByRole('region', { name: 'Parceiros' })
    const linkUfpb = within(parceiros).getByRole('link', { name: /Universidade Federal da Paraíba \(UFPB\)/i })
    expect(linkUfpb).toHaveAttribute('href', 'https://www.ufpb.br/')
    expect(linkUfpb.querySelector('img[src="/assets/brasao-ufpb.png"]')).toBeInTheDocument()

    const linkCi = within(parceiros).getByRole('link', { name: /Centro de Informática \(CI\)/i })
    expect(linkCi).toHaveAttribute('href', 'https://www.ci.ufpb.br/')
    expect(linkCi.querySelector('img[src="/assets/logo-ci.png"]')).toBeInTheDocument()

    expect(within(parceiros).getByText('Quasar')).toBeInTheDocument()
    expect(parceiros.querySelector('img[src="/assets/logo-quasar.png"]')).toBeInTheDocument()
  })

  it('o menu leva à seção e move o foco para ela', async () => {
    renderAt('/')
    const nav = screen.getByRole('navigation', { name: /menu principal/i })
    await userEvent.click(within(nav).getByRole('link', { name: 'Parceiros' }))
    expect(document.getElementById('parceiros')).toHaveFocus()
    expect(within(nav).getByRole('link', { name: 'Parceiros' })).toHaveAttribute('aria-current', 'true')
  })

  it.each(['/?fundo=atual', '/qubit?fundo=atual'])('Fundo2 mostra só o fundo em %s', (rota) => {
    renderAt(rota)
    expect(document.querySelector('.qubit-art')).not.toBeInTheDocument()
    expect(document.querySelector('.hero')).toHaveClass('sem-arte')
    expect(screen.queryByRole('navigation', { name: 'Versões do protótipo' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Fundo2' })).toHaveAttribute('aria-current', 'page')
  })

  it('Fundo3 oferece o átomo como primeira opção', () => {
    renderAt('/?fundo=antigo')
    expect(document.querySelector('.arte-atomo')).toBeInTheDocument()
    expect(document.querySelector('.hero')).toHaveClass('hero-atomo')
    const nav = screen.getByRole('navigation', { name: /versões do protótipo/i })
    expect(within(nav).getAllByRole('link').map((a) => a.textContent)).toEqual(['Átomo', 'Com qubit', 'Só fundo'])
    expect(within(nav).getByRole('link', { name: 'Átomo' })).toHaveAttribute('aria-current', 'page')
  })

  it('Fundo3 mantém a opção de qubit', () => {
    renderAt('/qubit?fundo=antigo')
    expect(document.querySelector('.qubit-art')).toBeInTheDocument()
    expect(document.querySelector('.arte-atomo')).not.toBeInTheDocument()
    expect(document.querySelector('.hero')).toHaveClass('hero-qubit')
    expect(screen.getByRole('link', { name: 'Com qubit' })).toHaveAttribute('aria-current', 'page')
  })

  it('rotas desconhecidas voltam para a página única', () => {
    renderAt('/qualquer-coisa')
    expect(document.querySelector('.site')).toBeInTheDocument()
  })
})
