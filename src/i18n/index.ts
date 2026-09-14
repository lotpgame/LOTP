/**
 * Basit i18n katmanı (TR/EN). Dil tercihi bir cookie'de tutulur → sunucu bileşenleri istekte
 * doğru dilde render eder. `t(locale, key)` saf fonksiyondur (sözlük bundle'da) → hem sunucu hem
 * istemci bileşenlerinde kullanılabilir.
 *
 * NOT (aşamalı çeviri): Şimdilik yalnız "kabuk" (menü, alt çubuk, ayarlar, oyuncu oluşturma) çevrildi.
 * Sayfa içerikleri ve maç anlatımları sonraki aşamalarda eklenecek; anahtarı olmayan metin TR döner.
 *
 * Bu modül istemci-güvenlidir (next/headers YOK) → client bileşenleri de `t`/tipleri import edebilir.
 * Sunucu tarafı dil okuma `./server` içindedir.
 */
export type Locale = "tr" | "en";
export const LOCALES: Locale[] = ["tr", "en"];
export const LOCALE_COOKIE = "engarde_locale";
export const LOCALE_LABEL: Record<Locale, string> = { tr: "Türkçe", en: "English" };

type Dict = Record<string, string>;

const TR: Dict = {
  // Menü
  "nav.profil": "Profil",
  "nav.antrenman": "Antrenman",
  "nav.turnuvalar": "Turnuvalar",
  "nav.klasman": "Klasman",
  "nav.kulup": "Kulüp",
  "nav.ekipman": "Ekipman",
  "nav.gecmis": "Kariyer Geçmişi",
  "nav.ayarlar": "Ayarlar",
  "nav.menu": "Menü",
  // Alt çubuk
  "bar.ilerle": "İlerle →",
  "bar.katil": "🏆 Katıl",
  "bar.gec": "Geç · antren ⏭",
  "bar.injured": "🩹 Sakat — {n} gün",
  "bar.training": "Antrenman",
  // Ayarlar
  "settings.title": "Ayarlar",
  "settings.language": "Dil",
  "settings.languageNote": "Arayüz dili. (İngilizce çevirisi aşamalı ekleniyor.)",
  "settings.sound": "Ses",
  "settings.soundNote": "Arka plan müziği ve efektler (yakında). Şimdilik tercihini saklar.",
  "settings.soundOn": "Açık",
  "settings.soundOff": "Kapalı",
  "settings.career": "Kariyer",
  "settings.newCareer": "🔄 Yeni Kariyer",
  "settings.newCareerNote": "Yeni bir oyuncuyla baştan başla.",
  "settings.deleteCareer": "🗑 Kariyeri Sil",
  "settings.deleteWarning": "Mevcut kariyer silinir ve yeni oyuncu ekranına dönersin. Geri alınamaz.",
  "settings.deleteConfirm": "Emin misin? Sil",
  "settings.cancel": "Vazgeç",
  "settings.soundComingSoon": "yakında",
  // Oyuncu oluşturma
  "create.tagline": "Eskrim kariyeri simülasyonu. Bir eskrimci yarat ve kariyerini yönet.",
  "create.firstName": "Ad",
  "create.lastName": "Soyad",
  "create.gender": "Cinsiyet",
  "create.country": "Ülke",
  "create.city": "Şehir",
  "create.cityHint": "Kulübünü belirler.",
  "create.birthDate": "Doğum Tarihi",
  "create.birthHint": "Yaş kategorisi (U10…Senior) doğum tarihinden otomatik belirlenir. Oyun 2026'da başlar; varsayılan 8 yaş (erken kariyer).",
  "create.weapon": "Silah",
  "create.profile": "Başlangıç Profili",
  "create.profileHint": "Başlangıç yönelimi; kariyeri belirlemez, gelişimle değişir.",
  "create.start": "Kariyere Başla",
  // Enum etiketleri (cinsiyet / silah / profil)
  "gender.MALE": "Erkek",
  "gender.FEMALE": "Kadın",
  "weapon.FOIL": "Flöre",
  "weapon.EPEE": "Epe",
  "weapon.SABRE": "Kılıç",
  "profile.BALANCED": "Dengeli",
  "profile.TECHNICAL": "Teknik",
  "profile.PHYSICAL": "Fiziksel",
  "profile.MENTAL": "Mental",
  "profile.TACTICAL": "Taktik",
};

const EN: Dict = {
  "nav.profil": "Profile",
  "nav.antrenman": "Training",
  "nav.turnuvalar": "Tournaments",
  "nav.klasman": "Rankings",
  "nav.kulup": "Club",
  "nav.ekipman": "Equipment",
  "nav.gecmis": "Career History",
  "nav.ayarlar": "Settings",
  "nav.menu": "Menu",
  "bar.ilerle": "Advance →",
  "bar.katil": "🏆 Enter",
  "bar.gec": "Skip · train ⏭",
  "bar.injured": "🩹 Injured — {n} days",
  "bar.training": "Training",
  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.languageNote": "Interface language. (English translation is being rolled out.)",
  "settings.sound": "Sound",
  "settings.soundNote": "Background music and effects (coming soon). Saves your preference for now.",
  "settings.soundOn": "On",
  "settings.soundOff": "Off",
  "settings.career": "Career",
  "settings.newCareer": "🔄 New Career",
  "settings.newCareerNote": "Start over with a new fencer.",
  "settings.deleteCareer": "🗑 Delete Career",
  "settings.deleteWarning": "Your current career is deleted and you return to the new-player screen. Cannot be undone.",
  "settings.deleteConfirm": "Are you sure? Delete",
  "settings.cancel": "Cancel",
  "settings.soundComingSoon": "coming soon",
  "create.tagline": "Fencing career simulator. Create a fencer and manage their career.",
  "create.firstName": "First name",
  "create.lastName": "Last name",
  "create.gender": "Gender",
  "create.country": "Country",
  "create.city": "City",
  "create.cityHint": "Determines your club.",
  "create.birthDate": "Date of birth",
  "create.birthHint": "Age category (U10…Senior) is set from the birth date. The game starts in 2026; default age 8 (early career).",
  "create.weapon": "Weapon",
  "create.profile": "Starting Profile",
  "create.profileHint": "A starting bias; it doesn't fix your career and changes as you develop.",
  "create.start": "Start Career",
  "gender.MALE": "Male",
  "gender.FEMALE": "Female",
  "weapon.FOIL": "Foil",
  "weapon.EPEE": "Épée",
  "weapon.SABRE": "Sabre",
  "profile.BALANCED": "Balanced",
  "profile.TECHNICAL": "Technical",
  "profile.PHYSICAL": "Physical",
  "profile.MENTAL": "Mental",
  "profile.TACTICAL": "Tactical",
};

const DICT: Record<Locale, Dict> = { tr: TR, en: EN };

/** Çeviri. Anahtar yoksa TR'ye, o da yoksa anahtarın kendisine düşer. {n} gibi yer tutucular doldurulur. */
export function t(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  let s = DICT[locale][key] ?? DICT.tr[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
