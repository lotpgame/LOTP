/**
 * Gladius ekipman kataloğu (GDD 15). Marka: GLADIUS. Denar (oyuncu bakiyesi) ile alınır.
 *
 * TASARIM (kullanıcı kararları, docs/EKONOMI.md):
 * - Mağaza SİLAHA GÖRE filtrelenir → `itemsForWeapon(weapon)`. Oyuncu yalnız kendi silahının + ortak
 *   malzemeleri görür. **Epe'de:** elektrikli yelek YOK, maske kordonu YOK (gösterilmez, satılmaz).
 * - **Elektrikli yelek (eski "lamé") silaha özeldir:** flöreciye "flöre için", kılıççıya "kılıç için";
 *   biri diğerininkini görmez.
 * - Fiyat sırası gerçekçi: Elektrikli Yelek (kılıç 550 / flöre 500) > Ceket+Pantolon (420) > Silah (400) …
 * - Maça etki ŞİMDİLİK minik ve GİZLİ (~0.003); "orta & adil" etki + yıpranma/büyüme RELEASE'te (EKONOMI §0,§2).
 *
 * CANLI VERİ KORUMA (CONTRIBUTING §2): eski generic id'ler (gl-weapon, gl-mask, gl-lame, gl-cord,
 * gl-maskcord) LEGACY_ITEMS'te gizli tutulur — daha önce alınmış eşya düşmesin diye. Ortak id'ler
 * (gl-clothing, gl-shoes, gl-socks, gl-plastron, gl-bag) AYNI kalır.
 */
import type { Weapon } from "@/engine/domain";

export type EquipmentSlot =
  | "WEAPON"
  | "MASK"
  | "CORD"
  | "MASK_CORD"
  | "CLOTHING"
  | "PLASTRON"
  | "GLOVE"
  | "LAME"
  | "CHEST"
  | "SHOES"
  | "SOCKS"
  | "BAG";

export interface GladiusItem {
  id: string;
  slot: EquipmentSlot;
  name: string;
  desc: string;
  icon: string;
  denar: number;
  /** null/undefined → ortak (her silahta görünür). Belirliyse yalnız o silahta görünür. */
  weapon?: Weapon;
  /** Maça katkı (effective strength). ŞİMDİLİK minik ve gizli. */
  combatBonus: number;
  cosmetic?: boolean;
  hidden?: boolean; // legacy — sahip olunca sayılır, mağazada gösterilmez
}

/** ⭐ TUNABLE: slot başına minik combat katkısı (şimdilik ~0.003; gerçek "orta & adil" etki release'te). */
const SLOT_BONUS: Record<EquipmentSlot, number> = {
  WEAPON: 0.004, LAME: 0.003, SHOES: 0.004, MASK: 0.003, CLOTHING: 0.003,
  GLOVE: 0.003, CHEST: 0.003, PLASTRON: 0.002, CORD: 0.002, MASK_CORD: 0.002,
  SOCKS: 0.001, BAG: 0,
};
const b = (s: EquipmentSlot) => SLOT_BONUS[s];

/** Ortak malzemeler — her silahta görünür (weapon yok). Eski id'ler korunur. */
const SHARED_ITEMS: readonly GladiusItem[] = [
  { id: "gl-clothing", slot: "CLOTHING", name: "Gladius Ceket + Pantolon", desc: "Beyaz koruyucu takım (alt + üst)", icon: "jacket", denar: 420, combatBonus: b("CLOTHING") },
  { id: "gl-shoes", slot: "SHOES", name: "Gladius Ayakkabı", desc: "Ayak tekniği / denge", icon: "shoes", denar: 280, combatBonus: b("SHOES") },
  { id: "gl-chest", slot: "CHEST", name: "Gladius Göğüs Koruyucu", desc: "Darbe koruyucu (göğüs)", icon: "chest", denar: 90, combatBonus: b("CHEST") },
  { id: "gl-plastron", slot: "PLASTRON", name: "Gladius Plastron", desc: "Kıyafet altına (koltuk altı koruyucu)", icon: "plastron", denar: 80, combatBonus: b("PLASTRON") },
  { id: "gl-socks", slot: "SOCKS", name: "Gladius Çorap", desc: "Uzun eskrim çorabı", icon: "socks", denar: 30, combatBonus: b("SOCKS") },
  { id: "gl-bag", slot: "BAG", name: "Gladius Çanta", desc: "Marka logolu taşıma çantası", icon: "bag", denar: 150, combatBonus: b("BAG"), cosmetic: true },
];

/** Flöre — hedef gövde; çene iletken maske + gövde elektrikli yelek + vücut/maske kordonu. */
const FOIL_ITEMS: readonly GladiusItem[] = [
  { id: "gl-lame-foil", slot: "LAME", name: "Gladius Elektrikli Yelek", desc: "Flöre için gerekli — gövdeyi kaplayan iletken yelek", icon: "lame", denar: 500, weapon: "FOIL", combatBonus: b("LAME") },
  { id: "gl-weapon-foil", slot: "WEAPON", name: "Gladius Flöre", desc: "Elektrikli flöre silahı", icon: "sword", denar: 400, weapon: "FOIL", combatBonus: b("WEAPON") },
  { id: "gl-mask-foil", slot: "MASK", name: "Gladius Flöre Maske", desc: "Çene altı iletken", icon: "mask", denar: 260, weapon: "FOIL", combatBonus: b("MASK") },
  { id: "gl-glove-foil", slot: "GLOVE", name: "Gladius Eldiven", desc: "Koruyucu eldiven", icon: "glove", denar: 150, weapon: "FOIL", combatBonus: b("GLOVE") },
  { id: "gl-cord-foil", slot: "CORD", name: "Gladius Vücut Kordonu", desc: "Flöre soketli", icon: "cord", denar: 100, weapon: "FOIL", combatBonus: b("CORD") },
  { id: "gl-maskcord-foil", slot: "MASK_CORD", name: "Gladius Maske Kordonu", desc: "Maskeyi yeleğe bağlar", icon: "mask-cord", denar: 50, weapon: "FOIL", combatBonus: b("MASK_CORD") },
];

/** Epe — tüm vücut hedef; YELEK YOK, MASKE KORDONU YOK; yalıtkan maske; 3 soketli kordon. */
const EPEE_ITEMS: readonly GladiusItem[] = [
  { id: "gl-weapon-epee", slot: "WEAPON", name: "Gladius Epe", desc: "Elektrikli epe silahı", icon: "sword", denar: 400, weapon: "EPEE", combatBonus: b("WEAPON") },
  { id: "gl-mask-epee", slot: "MASK", name: "Gladius Epe Maske", desc: "Yalıtkan, beyaz", icon: "mask", denar: 260, weapon: "EPEE", combatBonus: b("MASK") },
  { id: "gl-glove-epee", slot: "GLOVE", name: "Gladius Eldiven", desc: "Koruyucu eldiven", icon: "glove", denar: 150, weapon: "EPEE", combatBonus: b("GLOVE") },
  { id: "gl-cord-epee", slot: "CORD", name: "Gladius Vücut Kordonu", desc: "3 soketli epe kordonu", icon: "cord", denar: 100, weapon: "EPEE", combatBonus: b("CORD") },
];

/** Kılıç — bel üstü + kol + kafa; iletken maske + gövde+kol yeleği + iletken eldiven; 2 soketli kordon + maske kordonu. */
const SABRE_ITEMS: readonly GladiusItem[] = [
  { id: "gl-lame-sabre", slot: "LAME", name: "Gladius Elektrikli Yelek", desc: "Kılıç için gerekli — gövde + kolları kaplayan iletken yelek", icon: "lame", denar: 550, weapon: "SABRE", combatBonus: b("LAME") },
  { id: "gl-weapon-sabre", slot: "WEAPON", name: "Gladius Kılıç", desc: "Elektrikli kılıç silahı", icon: "sword", denar: 400, weapon: "SABRE", combatBonus: b("WEAPON") },
  { id: "gl-mask-sabre", slot: "MASK", name: "Gladius Kılıç Maske", desc: "İçi-dışı iletken", icon: "mask", denar: 320, weapon: "SABRE", combatBonus: b("MASK") },
  { id: "gl-glove-sabre", slot: "GLOVE", name: "Gladius Eldiven", desc: "Manşet kısmı iletken", icon: "glove", denar: 150, weapon: "SABRE", combatBonus: b("GLOVE") },
  { id: "gl-cord-sabre", slot: "CORD", name: "Gladius Vücut Kordonu", desc: "2 soketli kılıç kordonu", icon: "cord", denar: 100, weapon: "SABRE", combatBonus: b("CORD") },
  { id: "gl-maskcord-sabre", slot: "MASK_CORD", name: "Gladius Maske Kordonu", desc: "Maskeyi yeleğe bağlar", icon: "mask-cord", denar: 50, weapon: "SABRE", combatBonus: b("MASK_CORD") },
];

/** Mağazada gösterilen tam katalog (ortak + silaha özel). UI silaha göre filtreler → itemsForWeapon(). */
export const GLADIUS_ITEMS: readonly GladiusItem[] = [
  ...SHARED_ITEMS,
  ...FOIL_ITEMS,
  ...EPEE_ITEMS,
  ...SABRE_ITEMS,
];

/**
 * LEGACY — eski generic id'ler (v1). Sahip olunca hâlâ tanınır, bonusu sabit kalır; mağazada gösterilmez.
 * Canlı veri koruma (CONTRIBUTING §2).
 */
const LEGACY_ITEMS: readonly GladiusItem[] = [
  { id: "gl-weapon", slot: "WEAPON", name: "Gladius Silah", desc: "(eski katalog)", icon: "sword", denar: 400, combatBonus: 0.004, hidden: true },
  { id: "gl-mask", slot: "MASK", name: "Gladius Maske", desc: "(eski katalog)", icon: "mask", denar: 300, combatBonus: 0.003, hidden: true },
  { id: "gl-lame", slot: "LAME", name: "Gladius Elektrikli Yelek", desc: "(eski katalog)", icon: "lame", denar: 500, combatBonus: 0.003, hidden: true },
  { id: "gl-cord", slot: "CORD", name: "Gladius Body Cord", desc: "(eski katalog)", icon: "cord", denar: 100, combatBonus: 0.002, hidden: true },
  { id: "gl-maskcord", slot: "MASK_CORD", name: "Gladius Maske Kordonu", desc: "(eski katalog)", icon: "mask-cord", denar: 50, combatBonus: 0.002, hidden: true },
];

/** Tüm tanınan ürünler (katalog + legacy) — sahiplik/bonus aramaları için. */
const ALL_ITEMS: readonly GladiusItem[] = [...GLADIUS_ITEMS, ...LEGACY_ITEMS];

export function itemById(id: string): GladiusItem | undefined {
  return ALL_ITEMS.find((i) => i.id === id);
}

/**
 * Ekipman ad/açıklama çevirileri (mağaza ekranı). TR = katalogdaki `name`/`desc` (fallback).
 * "Gladius" marka adı tüm dillerde korunur. Engine katmanı olduğu için düz string locale kullanılır
 * (i18n app katmanına bağımlılık yok). Yeni dil → buraya eklenir.
 */
type ItemLoc = { name: string; desc: string };
const ITEM_I18N: Record<string, Partial<Record<string, ItemLoc>>> = {
  "gl-clothing": {
    en: { name: "Gladius Jacket + Breeches", desc: "White protective uniform (top + bottom)" },
    de: { name: "Gladius Jacke + Hose", desc: "Weiße Schutzkleidung (oben + unten)" },
    fr: { name: "Gladius Veste + Pantalon", desc: "Tenue de protection blanche (haut + bas)" },
    es: { name: "Gladius Chaqueta + Pantalón", desc: "Uniforme protector blanco (arriba + abajo)" },
    it: { name: "Gladius Giacca + Pantaloni", desc: "Tenuta protettiva bianca (sopra + sotto)" },
    ru: { name: "Gladius Куртка + Брюки", desc: "Белая защитная форма (верх + низ)" },
    pt: { name: "Gladius Jaqueta + Calça", desc: "Uniforme protetor branco (cima + baixo)" },
    zh: { name: "Gladius 上衣 + 护裤", desc: "白色防护服（上 + 下）" },
  },
  "gl-shoes": {
    en: { name: "Gladius Shoes", desc: "Footwork / balance" },
    de: { name: "Gladius Schuhe", desc: "Beinarbeit / Balance" },
    fr: { name: "Gladius Chaussures", desc: "Jeu de jambes / équilibre" },
    es: { name: "Gladius Zapatillas", desc: "Juego de piernas / equilibrio" },
    it: { name: "Gladius Scarpe", desc: "Gioco di gambe / equilibrio" },
    ru: { name: "Gladius Обувь", desc: "Работа ног / баланс" },
    pt: { name: "Gladius Tênis", desc: "Trabalho de pés / equilíbrio" },
    zh: { name: "Gladius 鞋", desc: "步法 / 平衡" },
  },
  "gl-chest": {
    en: { name: "Gladius Chest Protector", desc: "Impact protector (chest)" },
    de: { name: "Gladius Brustschutz", desc: "Aufprallschutz (Brust)" },
    fr: { name: "Gladius Protège-poitrine", desc: "Protection aux chocs (poitrine)" },
    es: { name: "Gladius Protector de pecho", desc: "Protección de impactos (pecho)" },
    it: { name: "Gladius Paracostole", desc: "Protezione dagli urti (petto)" },
    ru: { name: "Gladius Защита груди", desc: "Защита от ударов (грудь)" },
    pt: { name: "Gladius Protetor de peito", desc: "Proteção contra impactos (peito)" },
    zh: { name: "Gladius 护胸", desc: "抗击护具（胸部）" },
  },
  "gl-plastron": {
    en: { name: "Gladius Plastron", desc: "Worn under the jacket (underarm protector)" },
    de: { name: "Gladius Plastron", desc: "Unter der Jacke getragen (Achselschutz)" },
    fr: { name: "Gladius Plastron", desc: "Porté sous la veste (protection sous le bras)" },
    es: { name: "Gladius Plastrón", desc: "Se lleva bajo la chaqueta (protector de axila)" },
    it: { name: "Gladius Plastron", desc: "Indossato sotto la giacca (protezione ascellare)" },
    ru: { name: "Gladius Пластрон", desc: "Под куртку (защита подмышки)" },
    pt: { name: "Gladius Plastron", desc: "Usado sob a jaqueta (proteção da axila)" },
    zh: { name: "Gladius 半背心", desc: "穿在上衣内（腋下护具）" },
  },
  "gl-socks": {
    en: { name: "Gladius Socks", desc: "Long fencing socks" },
    de: { name: "Gladius Socken", desc: "Lange Fechtsocken" },
    fr: { name: "Gladius Chaussettes", desc: "Chaussettes d'escrime longues" },
    es: { name: "Gladius Calcetines", desc: "Calcetines largos de esgrima" },
    it: { name: "Gladius Calze", desc: "Calze da scherma lunghe" },
    ru: { name: "Gladius Гетры", desc: "Длинные фехтовальные гетры" },
    pt: { name: "Gladius Meias", desc: "Meias longas de esgrima" },
    zh: { name: "Gladius 袜", desc: "击剑长袜" },
  },
  "gl-bag": {
    en: { name: "Gladius Bag", desc: "Branded carry bag" },
    de: { name: "Gladius Tasche", desc: "Markentasche" },
    fr: { name: "Gladius Sac", desc: "Sac de transport de marque" },
    es: { name: "Gladius Bolsa", desc: "Bolsa de transporte de marca" },
    it: { name: "Gladius Borsa", desc: "Borsa di trasporto brandizzata" },
    ru: { name: "Gladius Сумка", desc: "Фирменная сумка для оружия" },
    pt: { name: "Gladius Bolsa", desc: "Bolsa de transporte da marca" },
    zh: { name: "Gladius 包", desc: "品牌器材包" },
  },
  "gl-lame-foil": {
    en: { name: "Gladius Electric Vest", desc: "Required for foil — conductive vest covering the torso" },
    de: { name: "Gladius Elektroweste", desc: "Für Florett nötig — leitfähige Weste über dem Rumpf" },
    fr: { name: "Gladius Veste électrique", desc: "Nécessaire au fleuret — veste conductrice couvrant le tronc" },
    es: { name: "Gladius Chaquetilla eléctrica", desc: "Necesaria en florete — chaquetilla conductora que cubre el tronco" },
    it: { name: "Gladius Giubbetto elettrico", desc: "Necessario nel fioretto — giubbetto conduttivo che copre il tronco" },
    ru: { name: "Gladius Электрокуртка", desc: "Нужна для рапиры — токопроводящая куртка на торс" },
    pt: { name: "Gladius Colete elétrico", desc: "Necessário no florete — colete condutor cobrindo o tronco" },
    zh: { name: "Gladius 电衣", desc: "花剑必备 — 覆盖躯干的导电背心" },
  },
  "gl-weapon-foil": {
    en: { name: "Gladius Foil", desc: "Electric foil weapon" },
    de: { name: "Gladius Florett", desc: "Elektrische Florettwaffe" },
    fr: { name: "Gladius Fleuret", desc: "Arme de fleuret électrique" },
    es: { name: "Gladius Florete", desc: "Arma de florete eléctrica" },
    it: { name: "Gladius Fioretto", desc: "Arma di fioretto elettrica" },
    ru: { name: "Gladius Рапира", desc: "Электрическая рапира" },
    pt: { name: "Gladius Florete", desc: "Florete elétrico" },
    zh: { name: "Gladius 花剑", desc: "电动花剑" },
  },
  "gl-mask-foil": {
    en: { name: "Gladius Foil Mask", desc: "Conductive under the chin" },
    de: { name: "Gladius Florett-Maske", desc: "Leitfähig unter dem Kinn" },
    fr: { name: "Gladius Masque de fleuret", desc: "Conductrice sous le menton" },
    es: { name: "Gladius Careta de florete", desc: "Conductora bajo el mentón" },
    it: { name: "Gladius Maschera da fioretto", desc: "Conduttiva sotto il mento" },
    ru: { name: "Gladius Маска для рапиры", desc: "Токопроводящая под подбородком" },
    pt: { name: "Gladius Máscara de florete", desc: "Condutora sob o queixo" },
    zh: { name: "Gladius 花剑面罩", desc: "下巴导电" },
  },
  "gl-glove-foil": {
    en: { name: "Gladius Glove", desc: "Protective glove" },
    de: { name: "Gladius Handschuh", desc: "Schutzhandschuh" },
    fr: { name: "Gladius Gant", desc: "Gant de protection" },
    es: { name: "Gladius Guante", desc: "Guante protector" },
    it: { name: "Gladius Guanto", desc: "Guanto protettivo" },
    ru: { name: "Gladius Перчатка", desc: "Защитная перчатка" },
    pt: { name: "Gladius Luva", desc: "Luva de proteção" },
    zh: { name: "Gladius 手套", desc: "防护手套" },
  },
  "gl-cord-foil": {
    en: { name: "Gladius Body Cord", desc: "Foil socket" },
    de: { name: "Gladius Körperkabel", desc: "Florett-Stecker" },
    fr: { name: "Gladius Fil de corps", desc: "Prise fleuret" },
    es: { name: "Gladius Cable corporal", desc: "Conector de florete" },
    it: { name: "Gladius Cavo di corpo", desc: "Spinotto fioretto" },
    ru: { name: "Gladius Телопровод", desc: "Разъём для рапиры" },
    pt: { name: "Gladius Cabo de corpo", desc: "Tomada de florete" },
    zh: { name: "Gladius 体线", desc: "花剑插口" },
  },
  "gl-maskcord-foil": {
    en: { name: "Gladius Mask Cord", desc: "Connects the mask to the vest" },
    de: { name: "Gladius Maskenkabel", desc: "Verbindet Maske und Weste" },
    fr: { name: "Gladius Fil de masque", desc: "Relie le masque à la veste" },
    es: { name: "Gladius Cable de careta", desc: "Conecta la careta con la chaquetilla" },
    it: { name: "Gladius Cavo maschera", desc: "Collega la maschera al giubbetto" },
    ru: { name: "Gladius Шнур маски", desc: "Соединяет маску с курткой" },
    pt: { name: "Gladius Cabo de máscara", desc: "Liga a máscara ao colete" },
    zh: { name: "Gladius 面罩线", desc: "连接面罩与电衣" },
  },
  "gl-weapon-epee": {
    en: { name: "Gladius Épée", desc: "Electric épée weapon" },
    de: { name: "Gladius Degen", desc: "Elektrische Degenwaffe" },
    fr: { name: "Gladius Épée", desc: "Arme d'épée électrique" },
    es: { name: "Gladius Espada", desc: "Arma de espada eléctrica" },
    it: { name: "Gladius Spada", desc: "Arma di spada elettrica" },
    ru: { name: "Gladius Шпага", desc: "Электрическая шпага" },
    pt: { name: "Gladius Espada", desc: "Espada elétrica" },
    zh: { name: "Gladius 重剑", desc: "电动重剑" },
  },
  "gl-mask-epee": {
    en: { name: "Gladius Épée Mask", desc: "Insulated, white" },
    de: { name: "Gladius Degen-Maske", desc: "Isoliert, weiß" },
    fr: { name: "Gladius Masque d'épée", desc: "Isolé, blanc" },
    es: { name: "Gladius Careta de espada", desc: "Aislada, blanca" },
    it: { name: "Gladius Maschera da spada", desc: "Isolata, bianca" },
    ru: { name: "Gladius Маска для шпаги", desc: "Изолированная, белая" },
    pt: { name: "Gladius Máscara de espada", desc: "Isolada, branca" },
    zh: { name: "Gladius 重剑面罩", desc: "绝缘，白色" },
  },
  "gl-glove-epee": {
    en: { name: "Gladius Glove", desc: "Protective glove" },
    de: { name: "Gladius Handschuh", desc: "Schutzhandschuh" },
    fr: { name: "Gladius Gant", desc: "Gant de protection" },
    es: { name: "Gladius Guante", desc: "Guante protector" },
    it: { name: "Gladius Guanto", desc: "Guanto protettivo" },
    ru: { name: "Gladius Перчатка", desc: "Защитная перчатка" },
    pt: { name: "Gladius Luva", desc: "Luva de proteção" },
    zh: { name: "Gladius 手套", desc: "防护手套" },
  },
  "gl-cord-epee": {
    en: { name: "Gladius Body Cord", desc: "3-prong épée cord" },
    de: { name: "Gladius Körperkabel", desc: "3-poliges Degenkabel" },
    fr: { name: "Gladius Fil de corps", desc: "Fil d'épée à 3 broches" },
    es: { name: "Gladius Cable corporal", desc: "Cable de espada de 3 clavijas" },
    it: { name: "Gladius Cavo di corpo", desc: "Cavo spada a 3 spinotti" },
    ru: { name: "Gladius Телопровод", desc: "3-контактный шнур для шпаги" },
    pt: { name: "Gladius Cabo de corpo", desc: "Cabo de espada de 3 pinos" },
    zh: { name: "Gladius 体线", desc: "三插重剑线" },
  },
  "gl-lame-sabre": {
    en: { name: "Gladius Electric Vest", desc: "Required for sabre — conductive vest covering torso + arms" },
    de: { name: "Gladius Elektroweste", desc: "Für Säbel nötig — leitfähige Weste über Rumpf + Armen" },
    fr: { name: "Gladius Veste électrique", desc: "Nécessaire au sabre — veste conductrice couvrant le tronc + les bras" },
    es: { name: "Gladius Chaquetilla eléctrica", desc: "Necesaria en sable — chaquetilla conductora que cubre el tronco + los brazos" },
    it: { name: "Gladius Giubbetto elettrico", desc: "Necessario nella sciabola — giubbetto conduttivo che copre tronco + braccia" },
    ru: { name: "Gladius Электрокуртка", desc: "Нужна для сабли — токопроводящая куртка на торс + руки" },
    pt: { name: "Gladius Colete elétrico", desc: "Necessário no sabre — colete condutor cobrindo tronco + braços" },
    zh: { name: "Gladius 电衣", desc: "佩剑必备 — 覆盖躯干+手臂的导电背心" },
  },
  "gl-weapon-sabre": {
    en: { name: "Gladius Sabre", desc: "Electric sabre weapon" },
    de: { name: "Gladius Säbel", desc: "Elektrische Säbelwaffe" },
    fr: { name: "Gladius Sabre", desc: "Arme de sabre électrique" },
    es: { name: "Gladius Sable", desc: "Arma de sable eléctrica" },
    it: { name: "Gladius Sciabola", desc: "Arma di sciabola elettrica" },
    ru: { name: "Gladius Сабля", desc: "Электрическая сабля" },
    pt: { name: "Gladius Sabre", desc: "Sabre elétrico" },
    zh: { name: "Gladius 佩剑", desc: "电动佩剑" },
  },
  "gl-mask-sabre": {
    en: { name: "Gladius Sabre Mask", desc: "Conductive inside and out" },
    de: { name: "Gladius Säbel-Maske", desc: "Innen und außen leitfähig" },
    fr: { name: "Gladius Masque de sabre", desc: "Conductrice dedans et dehors" },
    es: { name: "Gladius Careta de sable", desc: "Conductora por dentro y por fuera" },
    it: { name: "Gladius Maschera da sciabola", desc: "Conduttiva dentro e fuori" },
    ru: { name: "Gladius Маска для сабли", desc: "Токопроводящая внутри и снаружи" },
    pt: { name: "Gladius Máscara de sabre", desc: "Condutora por dentro e por fora" },
    zh: { name: "Gladius 佩剑面罩", desc: "内外导电" },
  },
  "gl-glove-sabre": {
    en: { name: "Gladius Glove", desc: "Conductive cuff" },
    de: { name: "Gladius Handschuh", desc: "Leitfähige Stulpe" },
    fr: { name: "Gladius Gant", desc: "Manchette conductrice" },
    es: { name: "Gladius Guante", desc: "Manguito conductor" },
    it: { name: "Gladius Guanto", desc: "Manichetta conduttiva" },
    ru: { name: "Gladius Перчатка", desc: "Токопроводящая манжета" },
    pt: { name: "Gladius Luva", desc: "Punho condutor" },
    zh: { name: "Gladius 手套", desc: "导电护腕" },
  },
  "gl-cord-sabre": {
    en: { name: "Gladius Body Cord", desc: "2-prong sabre cord" },
    de: { name: "Gladius Körperkabel", desc: "2-poliges Säbelkabel" },
    fr: { name: "Gladius Fil de corps", desc: "Fil de sabre à 2 broches" },
    es: { name: "Gladius Cable corporal", desc: "Cable de sable de 2 clavijas" },
    it: { name: "Gladius Cavo di corpo", desc: "Cavo sciabola a 2 spinotti" },
    ru: { name: "Gladius Телопровод", desc: "2-контактный шнур для сабли" },
    pt: { name: "Gladius Cabo de corpo", desc: "Cabo de sabre de 2 pinos" },
    zh: { name: "Gladius 体线", desc: "两插佩剑线" },
  },
  "gl-maskcord-sabre": {
    en: { name: "Gladius Mask Cord", desc: "Connects the mask to the vest" },
    de: { name: "Gladius Maskenkabel", desc: "Verbindet Maske und Weste" },
    fr: { name: "Gladius Fil de masque", desc: "Relie le masque à la veste" },
    es: { name: "Gladius Cable de careta", desc: "Conecta la careta con la chaquetilla" },
    it: { name: "Gladius Cavo maschera", desc: "Collega la maschera al giubbetto" },
    ru: { name: "Gladius Шнур маски", desc: "Соединяет маску с курткой" },
    pt: { name: "Gladius Cabo de máscara", desc: "Liga a máscara ao colete" },
    zh: { name: "Gladius 面罩线", desc: "连接面罩与电衣" },
  },
};

/** Mağaza ekranı için yerelleştirilmiş ekipman adı (yoksa katalog TR adına düşer). */
export function itemName(item: GladiusItem, locale: string): string {
  return ITEM_I18N[item.id]?.[locale]?.name ?? item.name;
}
/** Mağaza ekranı için yerelleştirilmiş ekipman açıklaması (yoksa katalog TR açıklamasına düşer). */
export function itemDesc(item: GladiusItem, locale: string): string {
  return ITEM_I18N[item.id]?.[locale]?.desc ?? item.desc;
}

/**
 * Bir silaha uygun mağaza listesi: ortak malzemeler + yalnız o silaha özel malzemeler (legacy hariç).
 * Epe → yelek/maske kordonu otomatik dışarıda (o ürünler yalnız FOIL/SABRE'de tanımlı).
 */
export function itemsForWeapon(weapon: Weapon): GladiusItem[] {
  return GLADIUS_ITEMS.filter((i) => !i.hidden && (i.weapon == null || i.weapon === weapon));
}

/** Sahip olunan ekipmanların toplam maç katkısı (küçük). Legacy dahil. */
export function equipmentCombatBonus(ownedIds: readonly string[]): number {
  return ALL_ITEMS.filter((i) => ownedIds.includes(i.id)).reduce((acc, i) => acc + i.combatBonus, 0);
}

/** CSV → sahip olunan ürün id listesi (legacy dahil geçerli). */
export function parseOwned(csv: string): string[] {
  return (csv || "").split(",").map((s) => s.trim()).filter((s) => s && itemById(s) != null);
}

export function encodeOwned(ids: readonly string[]): string {
  return [...new Set(ids)].join(",");
}
