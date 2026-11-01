/**
 * AI oyuncular için ülke-bazlı isim havuzları. Her ülke: erkek/kadın ad + soyad.
 * `firstNamesFor(gender, countryCode)` / `lastNamesFor(countryCode)` — bilinmeyen ülke → TR'ye düşer.
 * Latin-dışı diller (RU/UA/CN/KR/JP/EG/TN) yaygın romanizasyonla yazılır (ekranda tek biçim).
 */
import type { Gender } from "../domain";

interface NamePool {
  m: readonly string[]; // erkek adları
  f: readonly string[]; // kadın adları
  last: readonly string[]; // soyadlar
}

const NAMES: Record<string, NamePool> = {
  TR: {
    m: ["Ahmet", "Mehmet", "Emre", "Can", "Kerem", "Yusuf", "Burak", "Deniz", "Kaan", "Ali", "Onur", "Berk", "Efe", "Mert", "Arda", "Tolga", "Cem", "Barış", "Ege", "Umut"],
    f: ["Zeynep", "Elif", "Ayşe", "Defne", "Ece", "Selin", "İrem", "Buse", "Naz", "Melis", "Ceren", "Aslı", "Sude", "Yağmur", "Gizem", "Beren", "Nehir", "Duru", "Ela", "Lara"],
    last: ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Yıldırım", "Öztürk", "Aydın", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özdemir", "Şimşek", "Polat"],
  },
  FR: {
    m: ["Lucas", "Louis", "Hugo", "Nathan", "Léo", "Gabriel", "Arthur", "Jules", "Adam", "Raphaël", "Paul", "Théo", "Antoine", "Maxime", "Clément", "Enzo", "Mathis", "Noah", "Baptiste", "Victor"],
    f: ["Emma", "Jade", "Louise", "Alice", "Chloé", "Léa", "Manon", "Camille", "Sarah", "Inès", "Juliette", "Lola", "Zoé", "Clara", "Anaïs", "Charlotte", "Océane", "Margot", "Lucie", "Eva"],
    last: ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier"],
  },
  IT: {
    m: ["Francesco", "Alessandro", "Lorenzo", "Matteo", "Andrea", "Gabriele", "Riccardo", "Davide", "Luca", "Marco", "Giuseppe", "Antonio", "Simone", "Federico", "Tommaso", "Giovanni", "Stefano", "Pietro", "Daniele", "Nicola"],
    f: ["Giulia", "Sofia", "Aurora", "Alice", "Giorgia", "Martina", "Emma", "Chiara", "Sara", "Beatrice", "Francesca", "Elena", "Alessia", "Ginevra", "Noemi", "Gaia", "Anna", "Elisa", "Valentina", "Camilla"],
    last: ["Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti", "De Luca", "Costa", "Giordano", "Mancini", "Rizzo", "Lombardi", "Moretti"],
  },
  DE: {
    m: ["Lukas", "Leon", "Paul", "Felix", "Jonas", "Luca", "Maximilian", "Noah", "Elias", "Ben", "Finn", "Niklas", "Jan", "Tim", "Luis", "David", "Moritz", "Julian", "Fabian", "Philipp"],
    f: ["Mia", "Emma", "Hannah", "Sophie", "Marie", "Lena", "Lea", "Laura", "Lara", "Anna", "Lina", "Johanna", "Clara", "Emilia", "Julia", "Sarah", "Nele", "Maja", "Leonie", "Charlotte"],
    last: ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Braun", "Krüger", "Hartmann"],
  },
  ES: {
    m: ["Hugo", "Martín", "Lucas", "Mateo", "Leo", "Daniel", "Alejandro", "Pablo", "Álvaro", "Adrián", "David", "Diego", "Javier", "Marcos", "Sergio", "Carlos", "Mario", "Iván", "Rubén", "Marc"],
    f: ["Lucía", "Sofía", "Martina", "María", "Paula", "Julia", "Valeria", "Daniela", "Alba", "Carla", "Sara", "Noa", "Emma", "Claudia", "Laura", "Carmen", "Marta", "Ana", "Natalia", "Elena"],
    last: ["García", "Fernández", "González", "Rodríguez", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Martín", "Jiménez", "Ruiz", "Hernández", "Díaz", "Moreno", "Muñoz", "Álvarez", "Romero", "Alonso", "Gutiérrez"],
  },
  GB: {
    m: ["Oliver", "George", "Harry", "Jack", "Noah", "Charlie", "Thomas", "Oscar", "William", "James", "Henry", "Leo", "Alfie", "Freddie", "Archie", "Theo", "Max", "Arthur", "Joshua", "Ethan"],
    f: ["Olivia", "Amelia", "Isla", "Ava", "Emily", "Sophie", "Grace", "Mia", "Poppy", "Ella", "Lily", "Freya", "Charlotte", "Evie", "Jessica", "Daisy", "Phoebe", "Ruby", "Alice", "Florence"],
    last: ["Smith", "Jones", "Williams", "Taylor", "Brown", "Davies", "Evans", "Wilson", "Thomas", "Roberts", "Johnson", "Walker", "Robinson", "Wright", "Thompson", "White", "Hughes", "Green", "Hall", "Clarke"],
  },
  US: {
    m: ["Liam", "Noah", "Oliver", "Elijah", "James", "William", "Benjamin", "Lucas", "Henry", "Alexander", "Mason", "Michael", "Ethan", "Daniel", "Jacob", "Logan", "Jackson", "Sebastian", "Jack", "Owen"],
    f: ["Olivia", "Emma", "Charlotte", "Amelia", "Ava", "Sophia", "Isabella", "Mia", "Evelyn", "Harper", "Luna", "Camila", "Ella", "Elizabeth", "Sofia", "Emily", "Avery", "Scarlett", "Grace", "Chloe"],
    last: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"],
  },
  HU: {
    m: ["Bence", "Máté", "Levente", "Dávid", "Dániel", "Ádám", "Marcell", "Balázs", "Gergő", "Bálint", "Zalán", "Milán", "Kristóf", "Noel", "Péter", "Tamás", "Ákos", "Zoltán", "András", "Gábor"],
    f: ["Hanna", "Anna", "Jázmin", "Léna", "Zoé", "Emma", "Boglárka", "Lili", "Luca", "Nóra", "Réka", "Eszter", "Dóra", "Kata", "Petra", "Zsófia", "Fanni", "Bianka", "Vivien", "Laura"],
    last: ["Nagy", "Kovács", "Tóth", "Szabó", "Horváth", "Varga", "Kiss", "Molnár", "Németh", "Farkas", "Balogh", "Papp", "Takács", "Juhász", "Lakatos", "Mészáros", "Oláh", "Simon", "Rácz", "Fekete"],
  },
  RU: {
    m: ["Alexander", "Dmitry", "Maxim", "Ivan", "Artyom", "Mikhail", "Nikita", "Andrei", "Egor", "Daniil", "Kirill", "Ilya", "Sergei", "Timofey", "Roman", "Pavel", "Vladimir", "Denis", "Matvey", "Fyodor"],
    f: ["Sofia", "Maria", "Anna", "Daria", "Victoria", "Elizaveta", "Polina", "Anastasia", "Alina", "Ekaterina", "Varvara", "Kira", "Vasilisa", "Arina", "Veronika", "Yulia", "Ksenia", "Milana", "Alexandra", "Olga"],
    last: ["Ivanov", "Smirnov", "Kuznetsov", "Popov", "Vasiliev", "Petrov", "Sokolov", "Mikhailov", "Fedorov", "Morozov", "Volkov", "Alekseev", "Lebedev", "Semenov", "Egorov", "Pavlov", "Kozlov", "Stepanov", "Nikolaev", "Orlov"],
  },
  CN: {
    m: ["Hao", "Wei", "Lei", "Jun", "Ming", "Yang", "Bo", "Chao", "Peng", "Tao", "Jie", "Feng", "Kai", "Bin", "Hui", "Long", "Xiang", "Yu", "Zhe", "Cheng"],
    f: ["Fang", "Li", "Jing", "Yan", "Mei", "Na", "Hong", "Ting", "Xin", "Ying", "Lan", "Qian", "Wen", "Xia", "Juan", "Ling", "Min", "Ping", "Yue", "Dan"],
    last: ["Wang", "Li", "Zhang", "Liu", "Chen", "Yang", "Huang", "Zhao", "Wu", "Zhou", "Xu", "Sun", "Ma", "Zhu", "Hu", "Guo", "Lin", "He", "Gao", "Luo"],
  },
  KR: {
    m: ["Min-jun", "Seo-jun", "Do-yoon", "Ye-jun", "Si-woo", "Ha-jun", "Joo-won", "Ji-ho", "Ju-an", "Jun-seo", "Geon-woo", "Eun-woo", "Hyun-woo", "Seon-ho", "Tae-yang", "Woo-jin", "Jae-won", "Dong-hyun", "Sung-min", "Min-seok"],
    f: ["Seo-yeon", "Seo-hyun", "Ji-woo", "Ha-eun", "Ji-yoo", "Soo-ah", "Da-eun", "Chae-won", "Soo-bin", "Ye-eun", "Yoo-na", "Min-seo", "Eun-seo", "Ha-yeon", "Ji-min", "Na-yeon", "So-yeon", "Yu-jin", "Hye-won", "Ga-eun"],
    last: ["Kim", "Lee", "Park", "Choi", "Jung", "Kang", "Cho", "Yoon", "Jang", "Lim", "Han", "Oh", "Seo", "Shin", "Kwon", "Hwang", "Ahn", "Song", "Hong", "Yoo"],
  },
  JP: {
    m: ["Haruto", "Sota", "Yuto", "Hayato", "Riku", "Ren", "Sora", "Yuki", "Takumi", "Kaito", "Daichi", "Hiroto", "Kenta", "Shota", "Ryo", "Sho", "Yuma", "Taichi", "Kazuki", "Naoki"],
    f: ["Sakura", "Yui", "Aoi", "Hina", "Rin", "Yuna", "Mio", "Akari", "Hana", "Ichika", "Koharu", "Mei", "Riko", "Saki", "Yuka", "Nanami", "Himari", "Miyu", "Kokoro", "Ayaka"],
    last: ["Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Kato", "Yoshida", "Yamada", "Sasaki", "Yamaguchi", "Matsumoto", "Inoue", "Kimura", "Hayashi", "Shimizu", "Mori"],
  },
  UA: {
    m: ["Dmytro", "Andrii", "Oleksandr", "Maksym", "Ivan", "Artem", "Bohdan", "Nazar", "Vladyslav", "Danylo", "Yurii", "Oleh", "Mykola", "Roman", "Serhii", "Taras", "Vitalii", "Volodymyr", "Denys", "Pavlo"],
    f: ["Sofiia", "Anastasiia", "Mariia", "Anna", "Viktoriia", "Daria", "Kateryna", "Yuliia", "Veronika", "Polina", "Diana", "Olena", "Nadiia", "Iryna", "Khrystyna", "Yana", "Solomiia", "Zlata", "Milana", "Oleksandra"],
    last: ["Melnyk", "Shevchenko", "Boyko", "Kovalenko", "Bondarenko", "Tkachenko", "Kravchenko", "Oliinyk", "Shevchuk", "Polishchuk", "Koval", "Lysenko", "Rudenko", "Marchenko", "Pavlenko", "Savchenko", "Petrenko", "Kuzmenko", "Moroz", "Tkachuk"],
  },
  PL: {
    m: ["Jakub", "Kacper", "Antoni", "Jan", "Szymon", "Franciszek", "Filip", "Wojciech", "Aleksander", "Mateusz", "Michał", "Bartosz", "Igor", "Nikodem", "Piotr", "Tomasz", "Marcel", "Adam", "Krzysztof", "Paweł"],
    f: ["Zuzanna", "Julia", "Maja", "Zofia", "Hanna", "Lena", "Alicja", "Maria", "Oliwia", "Amelia", "Wiktoria", "Natalia", "Aleksandra", "Gabriela", "Emilia", "Pola", "Antonina", "Laura", "Nadia", "Karolina"],
    last: ["Nowak", "Kowalski", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski", "Zieliński", "Szymański", "Woźniak", "Dąbrowski", "Kozłowski", "Jankowski", "Mazur", "Wojciechowski", "Kwiatkowski", "Krawczyk", "Kaczmarek", "Piotrowski", "Grabowski"],
  },
  BR: {
    m: ["Miguel", "Arthur", "Davi", "Gael", "Heitor", "Bernardo", "Theo", "Gabriel", "Pedro", "Samuel", "Lucas", "João", "Matheus", "Rafael", "Enzo", "Lorenzo", "Benjamin", "Nicolas", "Guilherme", "Felipe"],
    f: ["Helena", "Alice", "Laura", "Maria", "Sophia", "Manuela", "Valentina", "Heloísa", "Luiza", "Júlia", "Lívia", "Cecília", "Isabella", "Giovanna", "Beatriz", "Mariana", "Clara", "Lara", "Antonella", "Rafaela"],
    last: ["Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Ferreira", "Alves", "Rodrigues", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa"],
  },
  AU: {
    m: ["Oliver", "Jack", "William", "Noah", "Thomas", "James", "Lucas", "Henry", "Leo", "Ethan", "Charlie", "Liam", "Max", "Lachlan", "Cooper", "Hunter", "Oscar", "Harrison", "Mason", "Hudson"],
    f: ["Charlotte", "Olivia", "Amelia", "Isla", "Mia", "Ava", "Grace", "Ruby", "Chloe", "Sophie", "Ella", "Zoe", "Lily", "Harper", "Matilda", "Willow", "Evie", "Ivy", "Scarlett", "Georgia"],
    last: ["Smith", "Jones", "Williams", "Brown", "Wilson", "Taylor", "Johnson", "White", "Martin", "Anderson", "Thompson", "Nguyen", "Ryan", "Lee", "Walker", "Harris", "Kelly", "King", "Campbell", "Murphy"],
  },
  EG: {
    m: ["Mohamed", "Ahmed", "Mahmoud", "Mostafa", "Omar", "Youssef", "Ali", "Hassan", "Khaled", "Amr", "Tarek", "Karim", "Ibrahim", "Hossam", "Sherif", "Ziad", "Adham", "Seif", "Abdelrahman", "Marwan"],
    f: ["Nour", "Salma", "Habiba", "Mariam", "Farida", "Jana", "Malak", "Hana", "Yasmin", "Aya", "Sara", "Nada", "Dina", "Rana", "Menna", "Esraa", "Rania", "Reem", "Lina", "Nourhan"],
    last: ["Mohamed", "Ahmed", "Hassan", "Ali", "Ibrahim", "Mahmoud", "Mostafa", "Said", "Fahmy", "El-Sayed", "Khalil", "Soliman", "Mansour", "Saad", "Fouad", "Abdallah", "Nasser", "Hamdy", "Shaker", "Gaber"],
  },
  TN: {
    m: ["Mohamed", "Ahmed", "Youssef", "Ali", "Aziz", "Hamza", "Nassim", "Wassim", "Bilel", "Skander", "Firas", "Oussama", "Seif", "Rami", "Hedi", "Mehdi", "Anis", "Yassine", "Khalil", "Zied"],
    f: ["Emna", "Yasmine", "Rania", "Nour", "Mariem", "Ines", "Sirine", "Farah", "Aya", "Salma", "Chaima", "Molka", "Dorra", "Asma", "Islem", "Maram", "Rahma", "Eya", "Nesrine", "Ghada"],
    last: ["Ben Ali", "Trabelsi", "Jebali", "Gharbi", "Mejri", "Ben Salah", "Bouazizi", "Khelifi", "Hamdi", "Sassi", "Cheikh", "Ben Youssef", "Mabrouk", "Nasri", "Bouzid", "Ayari", "Jlassi", "Zouari", "Ben Amor", "Dridi"],
  },
};

const DEFAULT_POOL = NAMES.TR;

function poolFor(countryCode?: string): NamePool {
  return (countryCode && NAMES[countryCode.toUpperCase()]) || DEFAULT_POOL;
}

/** Bir cinsiyet + ülke için ad havuzu (bilinmeyen ülke → TR). */
export function firstNamesFor(gender: Gender, countryCode?: string): readonly string[] {
  const p = poolFor(countryCode);
  return gender === "MALE" ? p.m : p.f;
}

/** Bir ülke için soyad havuzu (bilinmeyen ülke → TR). */
export function lastNamesFor(countryCode?: string): readonly string[] {
  return poolFor(countryCode).last;
}
