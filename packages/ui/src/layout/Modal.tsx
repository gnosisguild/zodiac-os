import {
  ComponentProps,
  createContext,
  ReactNode,
  useContext,
  type PropsWithChildren,
} from 'react'
import { GhostButton } from '../buttons'
import {
  Alert,
  AlertActions,
  AlertBody,
  AlertDescription,
  AlertTitle,
} from '../catalyst'

type Context = {
  onClose: () => void
}

const ModalContext = createContext<Context>({
  onClose() {
    throw new Error('onClose not found on context')
  },
})

const useOnClose = () => {
  const { onClose } = useContext(ModalContext)

  return onClose
}

type ModalProps = Pick<ComponentProps<typeof Alert>, 'size'> &
  PropsWithChildren<{
    title?: string
    description?: string
    open: boolean

    onClose?: () => void
  }>

export const Modal = ({
  open,
  title,
  description,
  children,
  size,
  onClose = () => null,
}: ModalProps) => {
  return (
    <Alert open={open} onClose={onClose} size={size}>
      <ModalContext value={{ onClose }}>
        {title && <AlertTitle>{title}</AlertTitle>}

        {description && <AlertDescription>{description}</AlertDescription>}

        <AlertBody>{children}</AlertBody>
      </ModalContext>
    </Alert>
  )
}

const Actions = ({
  children,
  criticalAction,
}: PropsWithChildren<{ criticalAction?: ReactNode }>) => {
  if (criticalAction == null) {
    return <AlertActions className="mt-6 sm:mt-4">{children}</AlertActions>
  }

  return (
    <div className="mt-6 flex items-center justify-between sm:mt-4">
      {criticalAction}
      <AlertActions>{children}</AlertActions>
    </div>
  )
}

Modal.Actions = Actions

const CloseAction = ({ children }: PropsWithChildren) => (
  <GhostButton onClick={useOnClose()}>{children}</GhostButton>
)

Modal.CloseAction = CloseAction
