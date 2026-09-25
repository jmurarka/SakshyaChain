export function getFrozenUntilMs(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) return numericValue;
    const parsedDate = Date.parse(value);
    if (Number.isFinite(parsedDate)) return parsedDate;
  }
  return 0;
}

export function isAccountFrozen(user, now = Date.now()) {
  return Boolean(user?.accountFrozen && getFrozenUntilMs(user.frozenUntil) > now);
}
