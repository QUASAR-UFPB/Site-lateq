export type VarianteLogo = 'adobe' | 'madimi' | 'audex' | 'corpta'

export function Logo({ variante, className = '' }: { variante: VarianteLogo; className?: string }) {
  return (
    <span
      className={`lateq lateq--${variante} ${className}`.trim()}
      role="img"
      aria-label="LATEQ, Laboratório de Tecnologias Quânticas"
    >
      {variante === 'adobe' ? (
        <span className="lateq-marca" aria-hidden="true" />
      ) : (
        <span className="lateq-txt" aria-hidden="true">LATEQ</span>
      )}
      <span className="lateq-sub" aria-hidden="true">
        <span>Laboratório de</span>
        <span>Tecnologias Quânticas</span>
      </span>
    </span>
  )
}
