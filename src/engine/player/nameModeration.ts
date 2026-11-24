/**
 * İsim normalize + moderasyon (kullanıcı 24.11). Oyuncu ad/soyadı için:
 *  - titleCaseName: her kelimenin ilk harfi büyük, gerisi küçük ("aLLaN WeBB" → "Allan Webb").
 *    Tire/kesme işareti alt-parçaları da büyür (Jean-Pierre, O'Brien). İsimler ULUSLARARASI olduğundan
 *    Türkçe-locale casing KULLANILMAZ ("IRIS"→"Irıs" bozulurdu) — varsayılan (invariant) casing; Türkçe
 *    bazı adlarda i/İ küçük sapma kabul edilir (çoğunluk uluslararası doğru çalışır).
 *  - isCleanName: küfürlü/uygunsuz adları engeller (güvenlik). Liste beta geri bildirimiyle genişletilir.
 *
 * SAF — I/O yok, test edilebilir (src/engine kuralı).
 */

/** Tek kelimeyi (tire/kesme alt-parçalarıyla) Title Case yapar. */
function capWord(word: string): string {
  return word
    .split(/([-'])/) // tire/kesme işaretlerini ayır ama koru
    .map((seg) => (seg === "-" || seg === "'" ? seg : seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase()))
    .join("");
}

/** "aLLaN   WeBB" → "Allan Webb" (çoklu boşluk tek boşluğa; her kelime Title Case). */
export function titleCaseName(s: string): string {
  return s.trim().replace(/\s+/g, " ").split(" ").map(capWord).join(" ");
}

/**
 * İsmi karşılaştırma için sadeleştirir: küçük harf, Türkçe/aksan harfleri Latin'e indirger, harf-dışı her şeyi
 * atar. Böylece "a.m.k", "A M K", "ş1kt1r" gibi kaçış denemeleri de yakalanır (harf-dışı silinince birleşir).
 */
function foldName(s: string): string {
  const trMap: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
  return s
    .toLowerCase()
    .replace(/[çğıöşüâîû]/g, (c) => trMap[c] ?? c)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // kalan aksanlar
    .replace(/[^a-z]/g, ""); // yalnız harfler
}

/**
 * Güçlü/uzun ve tek-anlamlı küfürler — sadeleştirilmiş ADIN TAMAMINDA (boşluksuz) alt-dize olarak aranır.
 * (Kısa/çift-anlamlı tokenlardan kaçınıldı: "pic"→Picard, "amina"→Amina/Samina gibi gerçek adları engellememek
 * için. Liste bilerek dar + net; beta geri bildirimiyle genişletilir.)
 */
const BLOCK_SUBSTR: readonly string[] = [
  // Türkçe
  "siktir", "orospu", "oruspu", "pezevenk", "gotveren", "yarrak", "yarrag", "aminakoyim", "ananisik", "amcik",
  "kahpe", "kaltak", "surtuk", "gavat", "ibne", "piczo",
  // İngilizce
  "fuck", "motherf", "asshole", "nigger", "nigga", "faggot", "cunt", "whore", "bitch", "bastard", "pussy", "dickhead",
];

/** Tek-kelime olarak tam eşleşince engellenecek kısa tokenlar (alt-dize olarak gerçek adlara girebilenler). */
const BLOCK_WORD: readonly string[] = ["amk", "amq", "aq", "sik", "got", "oc", "mk"];

/** true = ad uygun (engellenmez). İsim/soyisim ayrı ayrı veya birlikte verilebilir. */
export function isCleanName(s: string): boolean {
  const folded = foldName(s);
  if (!folded) return true; // harf yok → diğer kurallar (min/max) karar verir
  if (BLOCK_SUBSTR.some((w) => folded.includes(w))) return false;
  // Kelime-bazlı: her kelimeyi ayrı sadeleştirip tam eşleşme ara.
  const words = s.split(/\s+/).map(foldName).filter(Boolean);
  if (words.some((w) => BLOCK_WORD.includes(w))) return false;
  return true;
}
