import { getCompanionAppUrl } from '@zodiac/env'
import { formData } from '@zodiac/form-data'
import type { z, ZodTypeAny } from 'zod'

export type FetchOptions = {
  signal?: AbortSignal
}

type ApiOptions<Schema extends ZodTypeAny> = {
  schema: Schema
  method?: RequestInit['method']
  body?: Record<string, string | number>
} & FetchOptions

export const api = async <Schema extends ZodTypeAny>(
  pathname: string,
  {
    schema,
    signal,
    body,
    method = body == null ? 'GET' : 'POST',
  }: ApiOptions<Schema>,
) => {
  const url = new URL(pathname, getCompanionAppUrl())

  const response = await fetch(url, {
    signal,
    method,
    body: body == null ? undefined : formData(body),
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch from companion app(${url.toString()}): ${response.status}\n${await response.text()}`,
    )
  }

  const json = await response.json()

  return schema.parse(json) as z.infer<Schema>
}
