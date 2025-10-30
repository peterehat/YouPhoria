import React from 'react'

type Props = {
  title?: string
  children?: React.ReactNode
  footer?: React.ReactNode
}

export function Card({ title, children, footer }: Props) {
  return (
    <section className="card">
      {title ? <div className="card-title">{title}</div> : null}
      <div className="card-body">{children}</div>
      {footer ? <div className="card-footer">{footer}</div> : null}
    </section>
  )
}


