/**
 * Ülke bayrağı görseli (ISO kodundan). Emoji bayrağı Windows'ta "TR" harfleri olarak görünür;
 * bu yüzden gerçek görsel (flagcdn) kullanılır — tüm platformlarda ve tüm ülkeler için çalışır.
 */
export function Flag({ code, className }: { code: string; className?: string }) {
  const cc = (code || "").toLowerCase();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${cc}.svg`}
      alt={code}
      width={18}
      height={13}
      className={className ?? "inline-block h-3 w-[18px] rounded-[2px] align-[-1px] ring-1 ring-black/10 dark:ring-white/15"}
    />
  );
}
