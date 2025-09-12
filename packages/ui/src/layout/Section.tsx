import { type PropsWithChildren, useId } from 'react'

type SectionProps = PropsWithChildren<{ title?: string; description?: string }>

export const Section = ({ title, description, children }: SectionProps) => {
  const titleId = useId()
  const descriptionId = useId()

  return (
    <section aria-labelledby={titleId} aria-describedby={descriptionId}>
      {(description || title) && (
        <div className="mb-2 text-sm">
          {title && (
            <h2 className="font-semibold dark:text-gray-50" id={titleId}>
              {title}
            </h2>
          )}

          {description && (
            <p id={descriptionId} className="opacity-75">
              {description}
            </p>
          )}
        </div>
      )}

      {children}
    </section>
  )
}
