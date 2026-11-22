import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Eskrim Nedir? Silahlar, Kurallar ve Puanlama · Legends of the Piste",
  description:
    "Eskrim sporunun rehberi: flöre, epe ve kılıç silahları, hedef bölgeleri, avantaj (right-of-way) kuralı, elektronik puanlama, pist, ekipman, turnuva formatı ve yaş kategorileri.",
};

// Public eğitici içerik (AdSense "değerli içerik" için, kullanıcı 22.11). Girişsiz, crawl edilebilir.
// İçerik gerçek eskrim bilgisidir (FIE kuralları temelli); oyun tanıtımı değil, spor rehberi.
export default function EskrimPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 text-[15px] leading-relaxed sm:px-6">
      <h1 className="font-display text-[30px] font-bold">Eskrim Nedir?</h1>
      <p className="mt-1 text-[13px] text-steel">Sporun temelleri, silahlar, kurallar ve puanlama</p>

      <p className="mt-6">
        <strong>Eskrim</strong>, iki sporcunun kılıçla karşı karşıya geldiği, Olimpiyat Oyunları’nın
        1896’daki ilk modern programından beri yer alan bir dövüş sporudur. Hız, zekâ ve zamanlamaya dayanır;
        bu yüzden sık sık <em>“fiziksel satranç”</em> olarak anılır. Amaç, kurallara uygun biçimde rakibe
        geçerli bir dokunuş (<strong>tuş</strong>) yapmaktır. Modern eskrimde tuşlar <strong>elektronik bir
        sistemle</strong> algılanır ve bir lamba yanar.
      </p>

      <Section title="Üç silah: flöre, epe, kılıç">
        <p>
          Eskrim üç ayrı silahta yapılır. Her birinin kendi silahı, hedef bölgesi ve kuralları vardır:
        </p>
        <ul className="ml-5 mt-2 list-disc space-y-2">
          <li>
            <strong>Flöre (Foil):</strong> Hafif, esnek bir <strong>delme (dürtme)</strong> silahıdır. Geçerli
            hedef yalnızca <strong>gövdedir</strong> (kollar, bacaklar ve baş hariç). <strong>Avantaj kuralı</strong>{" "}
            (aşağıya bak) uygulanır. Hedef dışına yapılan dokunuş sayı getirmez; geleneksel olarak{" "}
            <strong>beyaz lamba</strong> yanar ve hamle durur.
          </li>
          <li>
            <strong>Epe (Épée):</strong> En ağır silahtır ve yine bir <strong>delme</strong> silahıdır. Geçerli
            hedef <strong>tüm vücuttur</strong> (ayak ucundan maskeye). <strong>Avantaj kuralı yoktur</strong>:
            iki sporcu birbirine 1/25 saniye içinde dokunursa <strong>ikisi de sayı alır</strong> (çift tuş).
            Bu yüzden epe daha temkinli ve mesafe-odaklı bir silahtır.
          </li>
          <li>
            <strong>Kılıç (Sabre):</strong> Hem <strong>kesme (kenarla) hem delme</strong> ile sayı yapılabilen
            tek silahtır. Geçerli hedef <strong>belden yukarısıdır</strong> — gövde, kollar ve baş/maske dâhil.
            <strong> Avantaj kuralı</strong> uygulanır. En hızlı silah olarak bilinir.
          </li>
        </ul>
      </Section>

      <Section title="Avantaj (öncelik / right-of-way) kuralı">
        <p>
          Flöre ve kılıçta, iki sporcu neredeyse aynı anda dokunduğunda sayıyı kimin alacağını{" "}
          <strong>avantaj kuralı</strong> belirler. Kısaca: <strong>hücumu doğru biçimde ilk başlatan</strong>{" "}
          sporcunun önceliği vardır. Rakip, sayı alabilmek için önce bu hücumu <strong>savunmayla (parad)</strong>{" "}
          durdurup kendi hamlesini (<strong>riposte</strong>) yapmalıdır. Bu kural eskrimi bir
          <em> diyalog</em> hâline getirir: hücum → savunma → karşı hücum. <strong>Epede avantaj yoktur</strong>,
          bu yüzden orada “önce dokunan” ya da aynı anda dokunan sayı alır.
        </p>
      </Section>

      <Section title="Puanlama ve maç süresi">
        <p>
          Her geçerli tuş <strong>1 sayı</strong>dır. Resmî maçlar iki biçimde oynanır:
        </p>
        <ul className="ml-5 mt-2 list-disc space-y-1.5">
          <li><strong>Havuz (pool) maçı:</strong> genellikle <strong>5 tuşa</strong> kadar, 3 dakika.</li>
          <li><strong>Eleme (direct elimination) maçı:</strong> <strong>15 tuşa</strong> kadar, 3×3 dakikalık üç devre.</li>
        </ul>
        <p className="mt-2">
          Süre dolduğunda önde olan kazanır; eşitlikte <strong>1 dakikalık uzatma</strong> oynanır ve rastgele
          belirlenen bir sporcuya “öncelik” verilir — uzatmada ilk tuşu yapan ya da öncelikli olup süreyi
          bitiren kazanır (<strong>altın tuş</strong>).
        </p>
      </Section>

      <Section title="Turnuva formatı">
        <p>
          Tipik bir turnuva iki aşamadan oluşur. Önce sporcular <strong>havuzlara</strong> ayrılır (genelde
          6 kişilik) ve herkes havuzdaki herkesle oynar. Havuz sonuçlarına göre (galibiyet oranı, verilen–yenilen
          tuş farkı) bir <strong>sıralama</strong> çıkar. Sonra bu sıralamaya göre <strong>eleme tablosu</strong>{" "}
          (8’li, 16’lı, 32’li…) kurulur ve tek maçlık elemelerle finale kadar gidilir. Eskrimde{" "}
          <strong>üçüncülük maçı oynanmaz</strong>: yarı finalde elenen iki sporcu <strong>birlikte 3.</strong> olur.
        </p>
      </Section>

      <Section title="Ekipman">
        <p>Güvenlik ve puanlama için standart ekipman kullanılır:</p>
        <ul className="ml-5 mt-2 list-disc space-y-1.5">
          <li><strong>Maske</strong> — yüzü ve başı korur; flöre/kılıçta iletken yakası vardır.</li>
          <li><strong>Ceket ve pantolon (knicker)</strong> — dayanıklı koruyucu kıyafet.</li>
          <li><strong>Lame</strong> — flöre ve kılıçta geçerli hedefi gösteren iletken üst (epede yoktur, tüm vücut hedeftir).</li>
          <li><strong>Eldiven, göğüslük, ayakkabı, beden kordonu</strong> ve tabii ki <strong>silah</strong>.</li>
        </ul>
      </Section>

      <Section title="Pist (piste)">
        <p>
          Maçlar <strong>14 metre uzunluğunda, 1,5–2 metre genişliğinde</strong> bir <strong>pist</strong>
          üzerinde yapılır. Sporcular ileri-geri hareket eder; pistin arka sınırını geçmek rakibe sayı
          kazandırır. Modern pistlerde tuşlar, sporcuları puanlama makinesine bağlayan kordonlarla algılanır.
        </p>
      </Section>

      <Section title="Yaş kategorileri">
        <p>
          Eskrim her yaşta yapılır. Yarışmalar yaş gruplarına ayrılır: <strong>U10, U12, U14, U17</strong>,{" "}
          <strong>Genç/Junior (U20)</strong> ve <strong>Büyükler (Senior)</strong>. Sporcular yıllar içinde bir
          kategoriden diğerine geçerek kariyerlerini sürdürür — çocuk yaşta başlayıp büyükler seviyesine,
          hatta milli takıma ve olimpiyatlara kadar uzanan uzun bir yolculuktur.
        </p>
      </Section>

      <Section title="Bu oyunla ilişkisi">
        <p>
          <strong>Legends of the Piste</strong>, bu sporu temel alan bir <strong>eskrim kariyer
          simülasyonudur</strong>: kendi sporcunu yaratır, antrenman yapar, turnuvalara katılır ve U10’dan
          büyüklere uzanan bir kariyer yönetirsin. Oynamaya başlamak için eskrim bilmen gerekmez — oyun
          temel mantığı öğretir. Daha fazlası:{" "}
          <a href="/nasil-oynanir" className="underline">Nasıl Oynanır?</a> ·{" "}
          <a href="/hakkinda" className="underline">Hakkında</a>
        </p>
      </Section>

      <p className="mt-10">
        <a href="/" className="underline">← Ana sayfaya dön</a>
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="font-display text-[20px] font-bold">{title}</h2>
      <div className="mt-2 text-steel [&_strong]:text-ink [&_em]:text-ink/80">{children}</div>
    </section>
  );
}
