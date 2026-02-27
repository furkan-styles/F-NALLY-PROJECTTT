
let tumIlanlar = []; 
let ustlenilenGorevler = JSON.parse(localStorage.getItem('benimGorevlerim')) || [];

// YEREL VERİTABANI VE SAYAC EKLENDİ (Botlanmış Yüksek Sayılar )
let yerelIlanlar = JSON.parse(localStorage.getItem('canliIlanlar')) || [
    { id: "1", kategori: "gida", baslik: "Bebek Maması ve Temiz Su", aciklama: "Bölgedeki 3 aile için acil 1 numara bebek maması ve 5 damacana su ihtiyacı.", talepSayisi: 47 },
    { id: "2", kategori: "barinma", baslik: "Öğrenci Evinde Boş Oda", aciklama: "Öğrenciyim geçici olarak kalacak yer arıyorum.", talepSayisi: 14 },
    { id: "3", kategori: "saglik", baslik: "İnsülin ve Soğutucu Çanta", aciklama: "Tip 1 diyabet hastası için acil insülin kalemi ve soğutucu çanta desteği.", talepSayisi: 28 },
    { id: "4", kategori: "hayvanlar", baslik: "Geçici Yuva veya Klinik Aracı", aciklama: "Yaralı 2 kedi için acil nakil aracı ve geçici yuva sağlayabilecek gönüllüler aranıyor.", talepSayisi: 9 },
    { id: "5", kategori: "egitim", baslik: "Ücretsiz YKS Matematik Dersi", aciklama: "Sınava hazırlanan depremzede öğrencilere online veya yüz yüze matematik desteği.", talepSayisi: 35 },
    { id: "6", kategori: "esya", baslik: "İkinci El Laptop İhtiyacı", aciklama: "Uzaktan eğitim gören üniversite öğrencisi için çalışır durumda bilgisayar.", talepSayisi: 12 },
    { id: "7", kategori: "psikoloji", baslik: "Gönüllü Psikolog Desteği", aciklama: "Çocuklar için oyun terapisi ve yetişkinler için travma sonrası destek sağlayacak uzman.", talepSayisi: 22 },
    { id: "8", kategori: "lojistik", baslik: "Powerbank ve Şarj İstasyonu", aciklama: "İletişimin kopmaması için çadır kente acil çoklu şarj istasyonu ve dolu powerbank'ler.", talepSayisi: 56 }
];

// Eğer hafızada canliIlanlar yoksa, hemen bu orijinal listeyi oraya mühürle!
if (!localStorage.getItem('canliIlanlar')) {
    localStorage.setItem('canliIlanlar', JSON.stringify(yerelIlanlar));
}

document.addEventListener('DOMContentLoaded', () => {
    verileriCek();
    gorevleriEkranaBas();
    sehirleriYukle(); // Form için şehirleri hazırla
});

// ==========================================
// 2. API'DEN VERİ ÇEKME VE KRİZ (OFFLINE) MODU 
// ==========================================
async function verileriCek() {
    try {
        // 1. Dış Dünyaya (API'ye) Bağlanmayı Dene
        const response = await fetch("https://api.npoint.io/433d2b54b3c3bb324e23");
        
        // Eğer sunucu çöktüyse veya internet yoksa direkt hata fırlat (Catch'e düş)
        if (!response.ok) throw new Error("API Hatası veya İnternet Yok"); 
        
        // 2. İnternet Varsa: Veriyi al, ana listeye eşitle
        const apiVerisi = await response.json();
        
        // Not: Gerçek API'den gelen veride talep sayacı olmayacağı için,
        // Sistem kriz modunda o devasa sayıları göstersin diye kendi yerel
        // listemizden harmanlayıp devam ediyoruz. (Gerçek projede birleştirilir).
        tumIlanlar = yerelIlanlar; 
        
        // İnternet varken bu güncel veriyi cihazın derinliklerine yedekle
        localStorage.setItem('yedekIlanlar', JSON.stringify(tumIlanlar));
        
        // Kriz bandını gizle ve ilanları ekrana bas
        const band = document.getElementById('kriz-bandi');
        if(band) band.style.display = 'none';
        
        ilanlariEkranaBas(tumIlanlar);

    } catch (error) {
        // 3. İNTERNET KOPTUYSA BURASI ÇALIŞIR (SAHA OPERASYONU)
        console.log("Kriz Modu devrede! İnternet bağlantısı koptu.");
        
        // Kırmızı Kriz Bandını Ekranda Patlat
        const band = document.getElementById('kriz-bandi');
        if(band) band.style.display = 'block';
        
        // Ekrana API'den değil, cihazın zulasındaki verilerden (yedeklerden) bas
        const yedekVeri = JSON.parse(localStorage.getItem('yedekIlanlar')) || JSON.parse(localStorage.getItem('canliIlanlar'));
        tumIlanlar = yedekVeri;
        ilanlariEkranaBas(tumIlanlar);
    }
}

// ==========================================
// 3. İLANLARI EKRANA BASMA (SAYAÇLI VE İPTAL METİNLİ)
// ==========================================
function ilanlariEkranaBas(veriler) {
    const liste = document.getElementById("ilan-listesi");
    if(!liste) return;
    liste.innerHTML = "";
    
    veriler.forEach(ilan => {
        // Bu ilan daha önce seçilmiş mi kontrol et
        const isTaken = ustlenilenGorevler.some(g => String(g.id) === String(ilan.id));
        const butonClass = isTaken ? "btn-secildi" : "btn-notr";
        const butonMetni = isTaken ? "Üstlenildi ✅ (İptal için tıkla)" : "Ben Üstleniyorum";

        liste.innerHTML += `
            <div class="ilan-karti">
                <span class="talep-sayaci">🔥 ${ilan.talepSayisi || 0} Bekleyen Talep</span>
                <span style="font-size: 12px; color: #94a3b8; display:block; margin-top:5px;">#${ilan.id} | ${ilan.kategori}</span>
                <h3>${ilan.baslik}</h3>
                <p>${ilan.aciklama}</p>
                <button id="btn-${ilan.id}" class="${butonClass}" onclick="goreviAl('${ilan.id}', '${ilan.baslik}')">
                    ${butonMetni}
                </button>
            </div>
        `;
    });
}

// ==========================================
// 4. KATEGORİ FİLTRELEME
// ==========================================
function kategoriFiltrele(secilenKategori) {
    if (secilenKategori === 'Hepsi') {
        ilanlariEkranaBas(tumIlanlar);
    } else {
        const filtrelenmis = tumIlanlar.filter(ilan => ilan.kategori === secilenKategori);
        ilanlariEkranaBas(filtrelenmis);
    }
}

// ==========================================
// 5. GÖREV ÜSTLENME
// ==========================================
function goreviAl(ilanId, ilanBaslik) {
    // Zaten alınmışsa iptal fonksiyonunu çalıştır ve işlemi kes
    const zatenVarMi = ustlenilenGorevler.find(g => String(g.id) === String(ilanId));
    if (zatenVarMi) {
        goreviIptalEt(ilanId);
        return;
    }

    ustlenilenGorevler.push({ id: ilanId, baslik: ilanBaslik });
    localStorage.setItem('benimGorevlerim', JSON.stringify(ustlenilenGorevler));
    
    // Butonu anında yeşile çevir
    const btn = document.getElementById(`btn-${ilanId}`);
    if(btn) {
        btn.className = "btn-secildi";
        btn.innerText = "Üstlenildi ✅ (İptal için tıkla)";
    }
    
    gorevleriEkranaBas();
}

function gorevleriEkranaBas() {
    const gorevListesi = document.getElementById("gorevlerim-listesi");
    if(!gorevListesi) return;
    gorevListesi.innerHTML = "";
    
    if (ustlenilenGorevler.length === 0) {
        gorevListesi.innerHTML = "<li>Henüz bir görev üstlenmediniz.</li>";
        return;
    }

    ustlenilenGorevler.forEach(gorev => {
        gorevListesi.innerHTML += `
            <li style="display: flex; justify-content: space-between; align-items: center;">
                <span>✅ ${gorev.baslik}</span>
                <button onclick="goreviIptalEt('${gorev.id}')" style="background: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">İptal</button>
            </li>
        `;
    });
}

function goreviIptalEt(ilanId) {
    ustlenilenGorevler = ustlenilenGorevler.filter(g => String(g.id) !== String(ilanId));
    localStorage.setItem('benimGorevlerim', JSON.stringify(ustlenilenGorevler));
    
    // Ana listedeki butonu tekrar griye çevir
    const btn = document.getElementById(`btn-${ilanId}`);
    if(btn) {
        btn.className = "btn-notr";
        btn.innerText = "Ben Üstleniyorum";
    }
    
    gorevleriEkranaBas();
}

// ==========================================
// 6. FORM VE LOJİSTİK MOTORU
// ==========================================
const yardimBtn = document.getElementById('btn-yardim-yolla');
const yardimModal = document.getElementById('yardim-modal');
const modalKapat = document.getElementById('modal-kapat');
const yardimFormu = document.getElementById('yardim-formu');

if (yardimBtn) {
    yardimBtn.addEventListener('click', () => {
        if (ustlenilenGorevler.length === 0) {
            alert("Önce bir görev seçmeniz lazım!");
        } else {
            yardimModal.style.display = 'flex';
        }
    });
}

if (modalKapat) {
    modalKapat.addEventListener('click', () => { yardimModal.style.display = 'none'; });
}

// Şehir Verileri ve Lojistik Ağı
const lojistikAg = {
    "Düzce": { "Merkez": ["Kültür Mah.", "Uzunmustafa Mah.", "Konuralp"], "Akçakoca": ["Osmaniye Mah.", "Yalı Mah."] },
    "Hatay": { "Antakya": ["Emek Mah.", "Cebrail Mah."], "Defne": ["Armutlu Mah.", "Sümerler Mah."] },
    "Kahramanmaraş": { "Pazarcık": ["Narlı Mah."], "Elbistan": ["Güneşli Mah."] }
};

function sehirleriYukle() {
    const sehirSelect = document.getElementById("sehir");
    if(!sehirSelect) return;
    
    // 🧹 KUTUYU TEMİZLEYEN ZIRH SATIRI (Çift yazılmayı engeller)
    sehirSelect.innerHTML = '<option value="">İl Seçiniz</option>';
    
    for (let sehir in lojistikAg) {
        let opt = new Option(sehir, sehir);
        sehirSelect.add(opt);
    }
}

function ilceDoldur() {
    const sehir = document.getElementById("sehir").value;
    const ilceSel = document.getElementById("ilce");
    const mahSel = document.getElementById("mahalle");
    ilceSel.innerHTML = '<option value="">İlçe Seçiniz</option>';
    mahSel.innerHTML = '<option value="">Önce İlçe Seçiniz</option>';
    mahSel.disabled = true;

    if (sehir) {
        ilceSel.disabled = false;
        for (let ilce in lojistikAg[sehir]) {
            ilceSel.add(new Option(ilce, ilce));
        }
    } else { ilceSel.disabled = true; }
}

function mahalleDoldur() {
    const sehir = document.getElementById("sehir").value;
    const ilce = document.getElementById("ilce").value;
    const mahSel = document.getElementById("mahalle");
    mahSel.innerHTML = '<option value="">Mahalle Seçiniz</option>';

    if (ilce) {
        mahSel.disabled = false;
        lojistikAg[sehir][ilce].forEach(m => mahSel.add(new Option(m, m)));
    } else { mahSel.disabled = true; }
}

if (yardimFormu) {
    yardimFormu.addEventListener("submit", (e) => {
        e.preventDefault();
        const isim = document.getElementById("isim").value;
        const tel = document.getElementById("telefon").value;
        alert(`Talebiniz alındı Sayın ${isim}.\n📞 Tel: ${tel}\nGörevlimiz size ulaşacaktır.`);
        yardimFormu.reset();
        yardimModal.style.display = "none";
        document.getElementById("ilce").disabled = true;
        document.getElementById("mahalle").disabled = true;
    });
}