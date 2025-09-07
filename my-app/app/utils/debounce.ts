/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function debounce<F extends (...args: any[]) => void>(fn: F, wait = 600) {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    let t: any
    return (...args: Parameters<F>) => {
      clearTimeout(t)
      t = setTimeout(() => fn(...args), wait)
    }
  }