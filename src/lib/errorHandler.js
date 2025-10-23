import { logError } from './logger'

export const handleError = (error, context = {}) => {
  logError(error.message || 'Unknown error', context)
  return { success: false, error: error.message }
}
