/**
 * Instagram'ın uygulama içi tarayıcısını User-Agent'tan tespit eder — orada kalıcı oturum (çerez/localStorage)
 * ve bazı tarayıcı özellikleri güvenilir çalışmayabilir. Saf (I/O yok) → testli.
 */
export function isInstagramBrowser(userAgent: string | null | undefined): boolean {
  return !!userAgent && /instagram/i.test(userAgent);
}
