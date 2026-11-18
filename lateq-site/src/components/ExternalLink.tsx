import type { ReactNode } from 'react'

const caminhos = {
  'arrow-up': 'M10 16.5v-12m-5 5 5-5 5 5',
  'arrow-down': 'M10 3.5v12m-5-5 5 5 5-5',
  'arrow-left': 'M16 10H4m5-5-5 5 5 5',
  'arrow-right': 'M4 10h12m-5-5 5 5-5 5',
  'arrow-out': 'M5 15 15 5M6 5h9v9',
}

export function Icon({ name }: { name: keyof typeof caminhos }) {
  return (
    <svg className="icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d={caminhos[name]} />
    </svg>
  )
}

interface Props {
  href: string
  children: ReactNode
  className?: string
  hideIcon?: boolean
}

export function ExternalLink({ href, children, className, hideIcon }: Props) {
  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
      {!hideIcon && (
        <>
          {' '}
          <Icon name="arrow-out" />
        </>
      )}
    </a>
  )
}
