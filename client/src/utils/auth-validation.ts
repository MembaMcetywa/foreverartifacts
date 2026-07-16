const EMAIL_MAX_LENGTH = 254
const AUTH_CODE_MAX_LENGTH = 32
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 128

export function isValidAuthEmail(email: string): boolean {
  const normalizedEmail = normalizeAuthEmail(email)

  if (
    normalizedEmail.length === 0 ||
    normalizedEmail.length > EMAIL_MAX_LENGTH
  ) {
    return false
  }

  if (/\s/.test(normalizedEmail)) {
    return false
  }

  const [localPart, domain, ...extraParts] = normalizedEmail.split('@')

  if (
    !localPart ||
    !domain ||
    extraParts.length > 0 ||
    localPart.startsWith('.') ||
    localPart.endsWith('.') ||
    localPart.includes('..')
  ) {
    return false
  }

  const domainLabels = domain.split('.')

  return (
    domainLabels.length >= 2 &&
    domainLabels.every(
      (label) =>
        label.length > 0 &&
        label.length <= 63 &&
        !label.startsWith('-') &&
        !label.endsWith('-'),
    ) &&
    /^[^\s@]+$/.test(localPart) &&
    /^[a-z0-9.-]+$/i.test(domain)
  )
}

export function hasAuthPassword(password: string): boolean {
  return password.length > 0
}

export function isValidAuthPassword(password: string): boolean {
  return getAuthPasswordIssues(password).length === 0
}

export function getAuthPasswordIssues(password: string): string[] {
  const issues: string[] = []

  if (password.length < PASSWORD_MIN_LENGTH) {
    issues.push(`Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    issues.push(`Use no more than ${PASSWORD_MAX_LENGTH} characters.`)
  }

  if (/\s/.test(password)) {
    issues.push('Do not use spaces.')
  }

  return issues
}

export function isValidAuthCode(code: string): boolean {
  const normalizedCode = normalizeAuthCode(code)

  return normalizedCode.length > 0 && normalizedCode.length <= AUTH_CODE_MAX_LENGTH
}

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function normalizeAuthCode(code: string): string {
  return code.trim()
}
