import { useNavigation } from 'react-router'

type CheckFn = (data: FormData) => boolean

export const useIsPending = (
  intent: string | string[] = [],
  ...checkFns: CheckFn[]
) => {
  const { state, formData } = useNavigation()

  if (state === 'idle') {
    return false
  }

  const intents = Array.isArray(intent) ? intent : [intent]

  if (intents.length === 0 && checkFns.length === 0) {
    return true
  }

  if (formData == null) {
    return false
  }

  const matchesIntent =
    intents.length === 0
      ? true
      : intents.some((intent) => formData.get('intent') === intent)

  if (checkFns.length === 0 || !matchesIntent) {
    return matchesIntent
  }

  return checkFns.some((checkFn) => checkFn(formData))
}
