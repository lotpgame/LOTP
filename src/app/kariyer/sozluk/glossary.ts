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
      { term: "Lunge", definition: "The basic attack: extending forward by driving off the back leg (Fr. fente)." },
      { term: "Flèche", definition: "A surprise attack launched by running in from out of distance (Fr. flèche)." },
      { term: "Feint", definition: "A false attack that starts in one line and switches to another before finishing." },
      { term: "Beat", definition: "A short, sharp tap on the opponent's blade to knock it aside (Fr. battement)." },
      { term: "Disengage", definition: "A circular blade action that slips around the opponent's parry (Fr. dégagé)." },
      { term: "Cut-over", definition: "An attack or deception made by passing over the opponent's point (Fr. coupé)." },
      { term: "Appel", definition: "A firm stamp of the front foot to startle the opponent into a reaction (Fr. appel)." },
      { term: "Prise de fer", definition: "Taking the opponent's blade and forcing it into a new line — a bind (Fr. prise de fer)." },
      { term: "Remise", definition: "Renewing a parried or missed attack at once, without withdrawing the arm (Fr. remise)." },
      { term: "Point in line", definition: "An extended-arm threat with the point aimed at the opponent; it holds right of way." },
      { term: "Corps-à-corps", definition: "Body-to-body contact between fencers; illegal in foil and sabre, the referee halts the bout (Fr.)." },
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
      { term: "Ausfall", definition: "Der Grundangriff: Strecken nach vorn durch Abdruck vom hinteren Bein (frz. fente)." },
      { term: "Flèche", definition: "Ein Überraschungsangriff im Laufschritt aus der Distanz (frz. flèche)." },
      { term: "Finte", definition: "Ein Scheinangriff, der in einer Linie beginnt und vor dem Abschluss die Linie wechselt." },
      { term: "Battuta", definition: "Ein kurzer, scharfer Schlag auf die gegnerische Klinge, um sie beiseitezuschlagen (frz. battement)." },
      { term: "Degagement", definition: "Eine kreisförmige Klingenbewegung, die die gegnerische Parade umgeht (frz. dégagé)." },
      { term: "Coupé", definition: "Ein Angriff oder eine Täuschung über die gegnerische Spitze hinweg (frz. coupé)." },
      { term: "Appell", definition: "Ein festes Aufstampfen des vorderen Fußes, um den Gegner zu einer Reaktion zu verleiten (frz. appel)." },
      { term: "Prise de fer", definition: "Die gegnerische Klinge nehmen und in eine neue Linie zwingen — eine Bindung (frz. prise de fer)." },
      { term: "Remise", definition: "Das sofortige Erneuern eines parierten oder verfehlten Angriffs, ohne den Arm zurückzuziehen (frz. remise)." },
      { term: "Point in line", definition: "Eine Bedrohung mit gestrecktem Arm und auf den Gegner gerichteter Spitze; sie hält das Vorrecht." },
      { term: "Corps-à-corps", definition: "Körperkontakt zwischen den Fechtern; bei Florett und Säbel unzulässig, der Kampfrichter unterbricht (frz.)." },
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

const FR: GlossarySection[] = [
  {
    title: "Termes d'escrime",
    terms: [
      { term: "Fleuret", definition: "Arme légère — seule la cible du tronc est valable ; le score se fonde sur la priorité." },
      { term: "Épée", definition: "L'arme la plus lourde — tout le corps est valable ; pas de priorité, coups doubles possibles." },
      { term: "Sabre", definition: "Arme de taille et d'estoc — cible au-dessus de la taille plus les bras et la tête ; selon la priorité, l'arme la plus rapide." },
      { term: "Cible", definition: "La partie du corps où une touche doit arriver pour compter ; dépend de l'arme." },
      {
        term: "Priorité",
        definition:
          "Au fleuret et au sabre, la règle qui décide à qui va la touche quand les deux attaquent en même temps — celui qui a attaqué le premier, ou qui a le droit de parer/contrer, l'emporte.",
      },
      { term: "Touche", definition: "Porter un coup valable sur l'adversaire ; l'unité de score." },
      { term: "Poule", definition: "La première phase du tournoi — un petit groupe où chacun affronte chacun, en général en 5 touches." },
      { term: "Élimination directe", definition: "La phase à élimination après les poules — une défaite et tu es éliminé." },
      { term: "Exempt (bye)", definition: "Passer un tour d'élimination sans match, grâce à une tête de série haute ou à un nombre impair de tireurs." },
      { term: "Indice", definition: "Touches données moins touches reçues — départage les égalités au classement de poule." },
      { term: "Tête de série", definition: "Le rang à l'entrée du tableau, selon le classement — les têtes de série hautes affrontent les basses." },
      {
        term: "Touche en or",
        definition: "Si le temps réglementaire s'achève à égalité, la priorité est tirée au sort et on tire une prolongation — la première touche gagne.",
      },
      { term: "Parade", definition: "Bloquer ou dévier l'attaque de l'adversaire avec sa lame." },
      { term: "Riposte", definition: "La contre-attaque qui suit immédiatement une parade." },
      { term: "Contre-attaque", definition: "Attaquer dans l'attaque de l'adversaire, au bon moment pour perturber sa préparation." },
      { term: "Fente", definition: "L'attaque de base : s'allonger en avant en poussant sur la jambe arrière (lunge)." },
      { term: "Flèche", definition: "Une attaque surprise lancée en courant depuis hors distance." },
      { term: "Feinte", definition: "Une fausse attaque qui commence dans une ligne et change avant de finir." },
      { term: "Battement", definition: "Un choc bref et sec sur la lame adverse pour l'écarter." },
      { term: "Dégagement", definition: "Une action circulaire de la lame qui contourne la parade adverse." },
      { term: "Coupé", definition: "Une attaque ou une tromperie en passant par-dessus la pointe adverse." },
      { term: "Appel", definition: "Un appui ferme du pied avant pour provoquer une réaction de l'adversaire." },
      { term: "Prise de fer", definition: "Prendre la lame adverse et la forcer dans une nouvelle ligne — une liaison." },
      { term: "Remise", definition: "Renouveler aussitôt une attaque parée ou manquée, sans retirer le bras." },
      { term: "Pointe en ligne", definition: "Une menace bras tendu, pointe dirigée vers l'adversaire ; elle détient la priorité." },
      { term: "Corps à corps", definition: "Contact corps à corps entre tireurs ; interdit au fleuret et au sabre, l'arbitre arrête l'assaut." },
      { term: "Équipe nationale", definition: "Le statut obtenu en terminant dans le top 4 du classement national." },
      {
        term: "Lampe blanche",
        definition:
          "Au fleuret et au sabre, la lampe indiquant une touche hors de la cible, qui ne compte pas. À l'épée, cela n'existe pas — tout le corps est valable, chaque touche compte.",
      },
    ],
  },
  {
    title: "Termes du jeu",
    terms: [
      { term: "Saison", definition: "L'unité de progression de carrière — le tireur vieillit et se développe chaque saison." },
      { term: "Condition", definition: "La fraîcheur physique actuelle du tireur — baisse avec l'entraînement/les matchs, remonte avec le repos." },
      { term: "Forme", definition: "À quel point le tireur est prêt pour la compétition — monte avec l'entraînement et les matchs réguliers." },
      { term: "Fatigue", definition: "L'inverse de la condition — une fatigue élevée augmente le risque de blessure." },
      { term: "Quarter Ranking", definition: "Le classement du trimestre en cours (année de jeu) — remis à zéro à la fin de chacun." },
      { term: "Numéro de licence", definition: "L'identifiant unique et permanent du tireur (affiché sur la carte d'identité)." },
      { term: "Denar", definition: "La monnaie du jeu — pour l'équipement et des actions comme recommencer une carrière." },
    ],
  },
];

const ES: GlossarySection[] = [
  {
    title: "Términos de esgrima",
    terms: [
      { term: "Florete", definition: "Arma ligera — solo el tronco es blanco válido; la puntuación se basa en la prioridad." },
      { term: "Espada", definition: "El arma más pesada — todo el cuerpo es blanco válido; sin prioridad, tocados dobles posibles." },
      { term: "Sable", definition: "Arma de corte y estocada — blanco por encima de la cintura más brazos y cabeza; según la prioridad, el arma más rápida." },
      { term: "Blanco", definition: "La parte del cuerpo donde un tocado debe llegar para contar; depende del arma." },
      {
        term: "Prioridad",
        definition:
          "En florete y sable, la regla que decide a quién va el tocado cuando ambos atacan a la vez — gana quien atacó primero o tiene el derecho de parar/contrar.",
      },
      { term: "Tocado", definition: "Dar un golpe válido al rival; la unidad de puntuación." },
      { term: "Poule", definition: "La primera fase del torneo — un grupo pequeño donde cada uno se enfrenta a todos, normalmente a 5 tocados." },
      { term: "Eliminación directa", definition: "La fase de eliminación tras las poules — una derrota y quedas fuera." },
      { term: "Bye (exento)", definition: "Pasar una ronda de eliminación sin combate, por una cabeza de serie alta o un número impar de tiradores." },
      { term: "Índice", definition: "Tocados dados menos recibidos — desempata en la clasificación de poule." },
      { term: "Cabeza de serie", definition: "El puesto al entrar en la tabla, según la clasificación — las cabezas de serie altas se enfrentan a las bajas." },
      {
        term: "Tocado de oro",
        definition: "Si el tiempo reglamentario acaba en empate, se sortea la prioridad y se tira una prórroga — el primer tocado gana.",
      },
      { term: "Parada", definition: "Bloquear o desviar el ataque del rival con la hoja." },
      { term: "Respuesta", definition: "El contraataque que sigue de inmediato a una parada (riposte)." },
      { term: "Contraataque", definition: "Atacar dentro del ataque del rival, en el momento justo para perturbar su preparación." },
      { term: "Fondo", definition: "El ataque básico: extenderse al frente impulsándose con la pierna trasera (lunge)." },
      { term: "Flecha", definition: "Un ataque sorpresa lanzado corriendo desde fuera de distancia (flèche)." },
      { term: "Finta", definition: "Un ataque falso que empieza en una línea y cambia antes de terminar." },
      { term: "Batimiento", definition: "Un golpe breve y seco sobre la hoja rival para apartarla (battement)." },
      { term: "Esquive", definition: "Una acción circular de la hoja que rodea la parada rival (dégagé)." },
      { term: "Coupé", definition: "Un ataque o engaño pasando por encima de la punta rival." },
      { term: "Appel", definition: "Un golpe firme del pie delantero para provocar una reacción del rival." },
      { term: "Toma de hierro", definition: "Tomar la hoja rival y forzarla a una nueva línea — una ligadura (prise de fer)." },
      { term: "Remise", definition: "Renovar de inmediato un ataque parado o fallado, sin retirar el brazo." },
      { term: "Punta en línea", definition: "Una amenaza con el brazo extendido y la punta apuntando al rival; conserva la prioridad." },
      { term: "Cuerpo a cuerpo", definition: "Contacto cuerpo a cuerpo entre tiradores; prohibido en florete y sable, el árbitro detiene el asalto (corps-à-corps)." },
      { term: "Selección nacional", definition: "El estatus que se obtiene al terminar en el top 4 de la clasificación nacional." },
      {
        term: "Luz blanca",
        definition:
          "En florete y sable, la luz que indica un tocado fuera del blanco, que no cuenta. En espada no existe — todo el cuerpo es válido, cada tocado cuenta.",
      },
    ],
  },
  {
    title: "Términos del juego",
    terms: [
      { term: "Temporada", definition: "La unidad de progreso de la carrera — el tirador envejece y se desarrolla cada temporada." },
      { term: "Condición", definition: "La frescura física actual del tirador — baja con el entrenamiento/los combates, se recupera con el descanso." },
      { term: "Forma", definition: "Cuán listo está el tirador para competir — sube con el entrenamiento y los combates regulares." },
      { term: "Fatiga", definition: "Lo contrario de la condición — una fatiga alta aumenta el riesgo de lesión." },
      { term: "Quarter Ranking", definition: "La clasificación del trimestre en curso (año de juego) — se reinicia al final de cada uno." },
      { term: "Número de licencia", definition: "El identificador único y permanente del tirador (en la tarjeta de identidad)." },
      { term: "Denar", definition: "La moneda del juego — para el equipo y acciones como empezar una nueva carrera." },
    ],
  },
];

const IT: GlossarySection[] = [
  {
    title: "Termini di scherma",
    terms: [
      { term: "Fioretto", definition: "Arma leggera — bersaglio valido solo il tronco; il punteggio si basa sulla priorità." },
      { term: "Spada", definition: "L'arma più pesante — tutto il corpo è bersaglio valido; nessuna priorità, stoccate doppie possibili." },
      { term: "Sciabola", definition: "Arma di taglio e di punta — bersaglio sopra la cintura più braccia e testa; secondo la priorità, l'arma più rapida." },
      { term: "Bersaglio", definition: "La parte del corpo dove una stoccata deve arrivare per contare; dipende dall'arma." },
      {
        term: "Priorità",
        definition:
          "Nel fioretto e nella sciabola, la regola che decide a chi va la stoccata quando entrambi attaccano insieme — vince chi ha attaccato per primo o ha il diritto di parare/contrare.",
      },
      { term: "Stoccata", definition: "Portare un colpo valido all'avversario; l'unità di punteggio." },
      { term: "Girone (poule)", definition: "La prima fase del torneo — un piccolo gruppo dove ognuno affronta tutti, di solito a 5 stoccate." },
      { term: "Eliminazione diretta", definition: "La fase a eliminazione dopo i gironi — una sconfitta e sei fuori." },
      { term: "Bye (esente)", definition: "Passare un turno di eliminazione senza incontro, per una testa di serie alta o un numero dispari di tiratori." },
      { term: "Indice", definition: "Stoccate date meno subite — spareggia nella classifica di girone." },
      { term: "Testa di serie", definition: "La posizione all'ingresso nel tabellone, secondo la classifica — le teste di serie alte affrontano le basse." },
      {
        term: "Stoccata d'oro",
        definition: "Se il tempo regolamentare finisce in parità, si sorteggia la priorità e si gioca un supplementare — la prima stoccata vince.",
      },
      { term: "Parata", definition: "Bloccare o deviare l'attacco dell'avversario con la lama." },
      { term: "Risposta", definition: "Il contrattacco che segue subito una parata (riposte)." },
      { term: "Contrattacco", definition: "Attaccare dentro l'attacco dell'avversario, al momento giusto per disturbarne la preparazione." },
      { term: "Affondo", definition: "L'attacco base: allungarsi in avanti spingendo sulla gamba posteriore (lunge)." },
      { term: "Frecciata", definition: "Un attacco a sorpresa lanciato di corsa da fuori misura (flèche)." },
      { term: "Finta", definition: "Un falso attacco che inizia in una linea e cambia prima di concludere." },
      { term: "Battuta", definition: "Un colpo breve e secco sulla lama avversaria per spostarla (battement)." },
      { term: "Cavazione", definition: "Un'azione circolare della lama che aggira la parata avversaria (dégagé)." },
      { term: "Coupé", definition: "Un attacco o inganno passando sopra la punta avversaria." },
      { term: "Appello", definition: "Un battito deciso del piede anteriore per provocare una reazione dell'avversario (appel)." },
      { term: "Presa di ferro", definition: "Prendere la lama avversaria e forzarla in una nuova linea — un legamento (prise de fer)." },
      { term: "Rimessa", definition: "Rinnovare subito un attacco parato o mancato, senza ritirare il braccio (remise)." },
      { term: "Punta in linea", definition: "Una minaccia a braccio teso con la punta rivolta all'avversario; mantiene la priorità." },
      { term: "Corpo a corpo", definition: "Contatto corpo a corpo tra tiratori; vietato nel fioretto e nella sciabola, l'arbitro ferma l'assalto (corps-à-corps)." },
      { term: "Nazionale", definition: "Lo status ottenuto concludendo nel top 4 della classifica nazionale." },
      {
        term: "Lampada bianca",
        definition:
          "Nel fioretto e nella sciabola, la lampada che segnala una stoccata fuori bersaglio, che non conta. Nella spada non esiste — tutto il corpo è valido, ogni stoccata conta.",
      },
    ],
  },
  {
    title: "Termini di gioco",
    terms: [
      { term: "Stagione", definition: "L'unità di progresso della carriera — il tiratore invecchia e si sviluppa ogni stagione." },
      { term: "Condizione", definition: "La freschezza fisica attuale del tiratore — cala con l'allenamento/gli incontri, si recupera col riposo." },
      { term: "Forma", definition: "Quanto il tiratore è pronto per gareggiare — sale con l'allenamento e gli incontri regolari." },
      { term: "Fatica", definition: "Il contrario della condizione — una fatica alta aumenta il rischio di infortunio." },
      { term: "Quarter Ranking", definition: "La classifica del trimestre in corso (anno di gioco) — si azzera alla fine di ciascuno." },
      { term: "Numero di tessera", definition: "L'identificativo unico e permanente del tiratore (sulla tessera)." },
      { term: "Denar", definition: "La valuta del gioco — per l'attrezzatura e azioni come ricominciare una carriera." },
    ],
  },
];

const RU: GlossarySection[] = [
  {
    title: "Термины фехтования",
    terms: [
      { term: "Рапира", definition: "Лёгкое оружие — действительная цель только торс; счёт ведётся по приоритету." },
      { term: "Шпага", definition: "Самое тяжёлое оружие — вся поверхность тела действительна; приоритета нет, возможны обоюдные уколы." },
      { term: "Сабля", definition: "Рубяще-колющее оружие — цель выше пояса плюс руки и голова; по приоритету, самое быстрое оружие." },
      { term: "Поражаемая поверхность", definition: "Часть тела, куда должен прийти укол, чтобы засчитаться; зависит от оружия." },
      {
        term: "Приоритет",
        definition:
          "В рапире и сабле правило, определяющее, кому засчитать укол при одновременной атаке — выигрывает тот, кто атаковал первым или имеет право на защиту/контратаку.",
      },
      { term: "Укол", definition: "Нанести сопернику действительный удар; единица счёта." },
      { term: "Пулька", definition: "Первый этап турнира — малая группа, где каждый фехтует с каждым, обычно до 5 уколов." },
      { term: "Прямое выбывание", definition: "Этап на выбывание после пулек — одно поражение, и ты выбыл." },
      { term: "Проход без боя (bye)", definition: "Пройти круг выбывания без боя из-за высокого посева или нечётного числа участников." },
      { term: "Показатель", definition: "Нанесённые уколы минус полученные — разводит равенство в таблице пулек." },
      { term: "Посев", definition: "Место при входе в таблицу по рейтингу — высокие посевы встречаются с низкими." },
      {
        term: "Золотой укол",
        definition: "Если основное время закончилось вничью, жребием определяют приоритет и играют дополнительное время — первый укол выигрывает.",
      },
      { term: "Защита", definition: "Заблокировать или отвести атаку соперника своим клинком." },
      { term: "Ответ", definition: "Контратака сразу после защиты (riposte)." },
      { term: "Контратака", definition: "Атака в атаку соперника, рассчитанная по времени, чтобы сорвать его подготовку." },
      { term: "Выпад", definition: "Основная атака: вытягивание вперёд с толчком задней ногой (lunge)." },
      { term: "Флеш", definition: "Внезапная атака с разбега с дальней дистанции (flèche)." },
      { term: "Финт", definition: "Ложная атака, которая начинается в одной линии и меняет её перед завершением." },
      { term: "Батман", definition: "Короткий резкий удар по клинку соперника, чтобы отбить его (battement)." },
      { term: "Перевод", definition: "Круговое движение клинка, обходящее защиту соперника (dégagé)." },
      { term: "Купе", definition: "Атака или обман переносом через остриё соперника (coupé)." },
      { term: "Аппель", definition: "Твёрдый притоп передней ногой, чтобы вызвать реакцию соперника (appel)." },
      { term: "Захват", definition: "Взять клинок соперника и перевести его в новую линию (prise de fer)." },
      { term: "Ремиз", definition: "Немедленно возобновить отражённую или неудавшуюся атаку, не убирая руку (remise)." },
      { term: "Укол в линию", definition: "Угроза вытянутой рукой с остриём, направленным на соперника; сохраняет приоритет." },
      { term: "Корпус в корпус", definition: "Телесный контакт между фехтовальщиками; в рапире и сабле запрещён, судья останавливает бой (corps-à-corps)." },
      { term: "Сборная", definition: "Статус за попадание в топ-4 национального рейтинга." },
      {
        term: "Белая лампа",
        definition:
          "В рапире и сабле лампа, показывающая укол вне цели, который не засчитывается. В шпаге её нет — вся поверхность действительна, каждый укол считается.",
      },
    ],
  },
  {
    title: "Игровые термины",
    terms: [
      { term: "Сезон", definition: "Единица прогресса карьеры — фехтовальщик стареет и развивается каждый сезон." },
      { term: "Состояние", definition: "Текущая физическая свежесть фехтовальщика — падает от тренировок/боёв, восстанавливается отдыхом." },
      { term: "Форма", definition: "Насколько фехтовальщик готов к соревнованиям — растёт от регулярных тренировок и боёв." },
      { term: "Усталость", definition: "Противоположность состоянию — высокая усталость повышает риск травмы." },
      { term: "Quarter Ranking", definition: "Рейтинг текущего квартала (игрового года) — обнуляется в конце каждого." },
      { term: "Номер лицензии", definition: "Постоянный уникальный идентификатор фехтовальщика (на карточке)." },
      { term: "Денар", definition: "Игровая валюта — для снаряжения и действий вроде начала новой карьеры." },
    ],
  },
];

export function glossaryFor(locale: Locale): GlossarySection[] {
  return locale === "en"
    ? EN
    : locale === "de"
      ? DE
      : locale === "fr"
        ? FR
        : locale === "es"
          ? ES
          : locale === "it"
            ? IT
            : locale === "ru"
              ? RU
              : TR;
}
