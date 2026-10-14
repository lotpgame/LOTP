/**
 * Sözlük sayfası içeriği (P1) — eskrim ve oyun terimleri. Ana i18n sözlüğünden ayrı: uzun biçimli,
 * yalnız bu sayfada kullanılan içerik (kısa UI etiketleriyle karıştırılmasın). es/fr için TR'ye düşer
 * (ana i18n sözlüğüyle aynı kural).
 */
import type { Locale } from "@/i18n";

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface GlossarySection {
  title: string;
  terms: GlossaryTerm[];
}

const TR: GlossarySection[] = [
  {
    title: "Eskrim Terimleri",
    terms: [
      { term: "Flöre", definition: "Hafif silah — yalnız gövde (torso) hedef; puanlama önceliğe (hak yoluna) dayalı." },
      { term: "Epe", definition: "En ağır silah — tüm vücut hedef; öncelik yok, çift tuş mümkün." },
      { term: "Kılıç", definition: "Kesme + saplama silahı — bel üstü, kollar ve baş hedef; önceliğe dayalı, en hızlı silah." },
      { term: "Hedef", definition: "Bir tuşun sayılabileceği vücut bölgesi; silaha göre değişir." },
      {
        term: "Öncelik",
        definition:
          "Flöre ve kılıçta, iki eskrimci aynı anda hücum ederse tuşun kime verileceğini belirleyen kural — ilk atağa çıkan veya parat/kontra hakkı olan taraf kazanır.",
      },
      { term: "Tuş", definition: "Rakibe geçerli bir vuruş/saplama başarmak; skor birimi." },
      { term: "Pul", definition: "Turnuvanın ilk aşaması — küçük bir grup birbiriyle tek periyot (genelde 5 tuşa kadar) maç yapar." },
      { term: "Eleme", definition: "Pul aşamasından sonraki tek-eleme aşaması — kaybeden turnuvadan çıkar." },
      { term: "Bay", definition: "Yüksek sıralama veya tek sayıda katılımcı nedeniyle bir eleme turunu maçsız geçmek." },
      { term: "Averaj", definition: "Atılan tuş sayısı eksi yenen tuş sayısı — pul sıralamasında eşitlik bozar." },
      { term: "Seri Başı", definition: "Eleme tablosuna girerken klasmana göre verilen sıra — üst sıra alt sırayla eşleşir." },
      {
        term: "Altın Tuş",
        definition: "Normal süre berabere biterse kura ile önceliğin belirlendiği ek süre — ilk tuşu bulan kazanır.",
      },
      { term: "Parat", definition: "Rakibin hücumunu silahla savuşturmak." },
      { term: "Ripost", definition: "Parattan hemen sonra gelen karşı hücum." },
      { term: "Kontra", definition: "Rakip hücuma geçerken, onun hazırlığını bozacak şekilde araya giren hücum." },
      { term: "Hamle", definition: "Arka bacağı iterek öne doğru uzanılan temel atak hareketi (Fr. fente / İng. lunge)." },
      { term: "Fleş", definition: "Mesafe dışından koşarak yapılan sürpriz atak (Fr. flèche)." },
      { term: "Feint", definition: "Bir yönde başlayıp atak bitmeden diğer yöne değişen aldatma hareketi — gösteriş (Fr. feinte)." },
      { term: "Bate", definition: "Rakibin silahının yönünü değiştirmek için silahına kısa, sert bir vuruş (Fr. battement)." },
      { term: "Degaje", definition: "Rakibin paratını atlatmak için silahın yön değiştiren dairesel hareketi (Fr. dégagé)." },
      { term: "Kupe", definition: "Rakibin ucunun/siperinin üstünden geçerek yapılan atak ya da aldatma (Fr. coupé)." },
      { term: "Apel", definition: "Rakibi şaşırtıp yanlış tepkiye zorlamak için ön ayağı güçlüce yere vurma (Fr. appel)." },
      { term: "Priz de fer", definition: "Rakibin silahını alıp yeni bir yöne zorlayan temas — bağlama (Fr. prise de fer)." },
      { term: "Römiz", definition: "Kolu geri çekmeden, paratlanan veya ıskalanan atağı hemen tazelemek (Fr. remise)." },
      { term: "Uzatılmış Kol", definition: "Kolun uzatılıp ucun rakibe yöneltildiği tehdit duruşu; hücum hakkını tutar (İng. point in line)." },
      { term: "Vücut Teması", definition: "İki eskrimcinin vücut vücuda teması; flöre ve kılıçta kural dışıdır, hakem durdurur (Fr. corps-à-corps)." },
      { term: "Milli Takım", definition: "Ülke klasmanında ilk 4'e giren oyunculara verilen statü." },
      {
        term: "Beyaz Lamba",
        definition:
          "Flöre ve kılıçta, hedef dışına isabet eden ve sayılmayan vuruşta yanan lamba. Epede yoktur — tüm vücut hedef olduğu için her vuruş geçerlidir.",
      },
    ],
  },
  {
    title: "Oyun Terimleri",
    terms: [
      { term: "Sezon", definition: "Kariyerin ilerleme birimi — her sezon sporcu yaşlanır ve gelişir." },
      { term: "Kondisyon", definition: "O anki fiziksel tazelik — antrenman/maçla düşer, dinlenmeyle toparlanır." },
      { term: "Form", definition: "Maça ne kadar hazır/keskin olunduğu — düzenli antrenman ve maçla artar." },
      { term: "Yorgunluk", definition: "Kondisyonun tersi — yüksek yorgunluk sakatlık riskini artırır." },
      { term: "Quarter Ranking", definition: "O oyun yılına (quarter) ait klasman — her quarter sonunda sıfırlanır." },
      { term: "Lisans No", definition: "Sporcunun kalıcı, benzersiz kimlik kodu (kimlik kartında görünür)." },
      { term: "Denar", definition: "Oyun içi para birimi — ekipman ve kariyer sıfırlama gibi işlemlerde kullanılır." },
    ],
  },
];

const EN: GlossarySection[] = [
  {
    title: "Fencing Terms",
    terms: [
      { term: "Foil", definition: "Light weapon — valid target is the torso only; scoring is based on right of way." },
      { term: "Épée", definition: "Heaviest weapon — the whole body is valid target; no right of way, double touches possible." },
      { term: "Sabre", definition: "Cut-and-thrust weapon — target is above the waist plus arms and head; based on right of way, the fastest weapon." },
      { term: "Target area", definition: "The part of the body a touch must land on to count; depends on the weapon." },
      {
        term: "Right of way",
        definition:
          "In foil and sabre, the rule that decides who gets the touch when both fencers attack at once — whoever attacked first, or has the right to parry/counter, wins it.",
      },
      { term: "Touch", definition: "Landing a valid hit on the opponent; the unit of scoring." },
      { term: "Pool", definition: "The tournament's first stage — a small group where everyone fences everyone, usually to 5 touches." },
      { term: "Direct Elimination", definition: "The single-elimination stage after the pools — lose once and you're out." },
      { term: "Bye", definition: "Advancing to the next elimination round without a match, due to a high seed or an odd number of fencers." },
      { term: "Indicator", definition: "Touches scored minus touches received — breaks ties in the pool standings." },
      { term: "Seed", definition: "The number assigned entering the bracket, based on ranking — higher seeds face lower seeds." },
      {
        term: "Golden touch",
        definition: "If regular time ends level, priority is drawn and extra time is fenced — the first touch wins.",
      },
      { term: "Parry", definition: "Blocking or deflecting the opponent's attack with your blade." },
      { term: "Riposte", definition: "The counter-attack that immediately follows a parry." },
      { term: "Counter-attack", definition: "Attacking into the opponent's own attack, timed to disrupt their preparation." },
      { term: "National team", definition: "The status earned by finishing in the top 4 of the national ranking." },
      {
        term: "White light",
        definition:
          "In foil and sabre, the light showing a hit landed outside the target area and doesn't score. Épée has no such thing — the whole body is valid, so every hit counts.",
      },
    ],
  },
  {
    title: "Game Terms",
    terms: [
      { term: "Season", definition: "The unit of career progress — the fencer ages and develops each season." },
      { term: "Condition", definition: "How physically fresh the fencer currently is — drops with training/matches, recovers with rest." },
      { term: "Form", definition: "How match-ready the fencer is — builds up with regular training and matches." },
      { term: "Fatigue", definition: "The opposite of condition — high fatigue raises injury risk." },
      { term: "Quarter Ranking", definition: "The ranking for the current quarter (game year) — reset at the end of each one." },
      { term: "License number", definition: "The fencer's permanent, unique ID code (shown on the ID card)." },
      { term: "Denar", definition: "The in-game currency — used for equipment and things like starting a new career." },
    ],
  },
];

const DE: GlossarySection[] = [
  {
    title: "Fechtbegriffe",
    terms: [
      { term: "Florett", definition: "Leichte Waffe — gültige Trefferfläche ist nur der Rumpf; Wertung nach Vorrecht." },
      { term: "Degen", definition: "Schwerste Waffe — der ganze Körper ist Trefferfläche; kein Vorrecht, Doppeltreffer möglich." },
      { term: "Säbel", definition: "Hieb- und Stoßwaffe — Trefferfläche oberhalb der Gürtellinie plus Arme und Kopf; nach Vorrecht, die schnellste Waffe." },
      { term: "Trefferfläche", definition: "Der Körperbereich, auf den ein Treffer zählen muss; je nach Waffe unterschiedlich." },
      {
        term: "Vorrecht",
        definition:
          "Bei Florett und Säbel die Regel, die entscheidet, wer den Treffer bekommt, wenn beide gleichzeitig angreifen — wer zuerst angegriffen hat oder pariert/kontert, gewinnt ihn.",
      },
      { term: "Treffer", definition: "Ein gültiger Stoß/Hieb auf den Gegner; die Zähleinheit." },
      { term: "Poule", definition: "Die erste Turnierphase — eine kleine Gruppe fechtet jeder gegen jeden, meist bis 5 Treffer." },
      { term: "Direktausscheidung", definition: "Die K.-o.-Phase nach den Poulen — eine Niederlage bedeutet das Ausscheiden." },
      { term: "Freilos", definition: "Der Aufstieg in die nächste Runde ohne Gefecht, wegen hoher Setzung oder ungerader Teilnehmerzahl." },
      { term: "Indikator", definition: "Erzielte minus erhaltene Treffer — entscheidet bei Gleichstand in der Poule-Tabelle." },
      { term: "Setzung", definition: "Die Platzierung beim Einstieg ins Tableau, nach Rangliste — höhere Setzung trifft auf niedrigere." },
      {
        term: "Goldener Treffer",
        definition: "Endet die reguläre Zeit unentschieden, entscheidet das Los das Vorrecht für eine Verlängerung — der erste Treffer gewinnt.",
      },
      { term: "Parade", definition: "Das Blocken oder Ablenken des gegnerischen Angriffs mit der eigenen Klinge." },
      { term: "Riposte", definition: "Der Gegenangriff direkt nach einer Parade." },
      { term: "Konterangriff", definition: "Ein Angriff in den gegnerischen Angriff hinein, der dessen Vorbereitung stört." },
      { term: "Nationalmannschaft", definition: "Der Status für die Top 4 der nationalen Rangliste." },
      {
        term: "Weiße Lampe",
        definition:
          "Bei Florett und Säbel die Lampe, die einen Treffer außerhalb der gültigen Fläche anzeigt und nicht zählt. Beim Degen gibt es das nicht — der ganze Körper ist gültig, jeder Treffer zählt.",
      },
    ],
  },
  {
    title: "Spielbegriffe",
    terms: [
      { term: "Saison", definition: "Die Fortschrittseinheit der Karriere — der Fechter altert und entwickelt sich jede Saison." },
      { term: "Kondition", definition: "Wie körperlich frisch der Fechter aktuell ist — sinkt durch Training/Gefechte, erholt sich durch Ruhe." },
      { term: "Form", definition: "Wie wettkampfbereit der Fechter ist — steigt durch regelmäßiges Training und Gefechte." },
      { term: "Ermüdung", definition: "Das Gegenteil von Kondition — hohe Ermüdung erhöht das Verletzungsrisiko." },
      { term: "Quartalsrangliste", definition: "Die Rangliste für das laufende Quartal (Spieljahr) — wird am Ende jedes Quartals zurückgesetzt." },
      { term: "Lizenznummer", definition: "Die dauerhafte, eindeutige Kennung des Fechters (steht auf der Ausweiskarte)." },
      { term: "Denar", definition: "Die Spielwährung — für Ausrüstung und z. B. einen Neustart der Karriere." },
    ],
  },
];

export function glossaryFor(locale: Locale): GlossarySection[] {
  return locale === "en" ? EN : locale === "de" ? DE : TR;
}
