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

  it('o menu segue a ordem pedida', () => {
    renderAt('/')
    const nav = screen.getByRole('navigation', { name: /menu principal/i })
    expect(within(nav).getAllByRole('link').map((a) => a.textContent)).toEqual([
      'Sobre',
      'Membros',
      'Notícias',
      'Publicações',
      'Parceiros',
      'Contato',
    ])
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
    expect(logos.getAllByRole('link').map((link) => link.textContent)).toEqual(['Adobe Express', 'Madimi One', 'Audex', 'Corpta'])
    expect(logos.getByRole('link', { name: 'Corpta' })).toHaveAttribute('aria-current', 'page')
  })

  it('usa o logotipo padrão quando o parâmetro logo é desconhecido', () => {
    renderAt('/fundo?logo=neutronic')
    const seletor = screen.getByRole('navigation', { name: 'Versões do logotipo' })
    expect(within(seletor).getByRole('link', { name: 'Adobe Express' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { level: 1 }).querySelector('.lateq--adobe .lateq-marca')).toBeInTheDocument()
    expect(document.querySelector('.hero')).toHaveClass('sem-arte')
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
  })

  it('o menu leva à seção e move o foco para ela', async () => {
    renderAt('/')
    const nav = screen.getByRole('navigation', { name: /menu principal/i })
    await userEvent.click(within(nav).getByRole('link', { name: 'Parceiros' }))
    expect(document.getElementById('parceiros')).toHaveFocus()
    expect(within(nav).getByRole('link', { name: 'Parceiros' })).toHaveAttribute('aria-current', 'true')
  })

  it('a versão "só fundo" não desenha a cena 3D', () => {
    renderAt('/fundo')
    expect(document.querySelector('.qubit-art')).not.toBeInTheDocument()
    expect(document.querySelector('.hero')).toHaveClass('sem-arte')
  })

  it('a versão padrão abre com o átomo como primeira opção', () => {
    renderAt('/')
    expect(document.querySelector('.arte-atomo')).toBeInTheDocument()
    expect(document.querySelector('.hero')).toHaveClass('hero-atomo')
    const nav = screen.getByRole('navigation', { name: /versões do protótipo/i })
    expect(within(nav).getAllByRole('link').map((a) => a.textContent)).toEqual(['Átomo', 'Com qubit', 'Só fundo'])
    expect(within(nav).getByRole('link', { name: 'Átomo' })).toHaveAttribute('aria-current', 'page')
  })

  it('a versão do qubit usa a própria arte e marca o link no dock', () => {
    renderAt('/qubit')
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
