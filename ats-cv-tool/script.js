function updateCV() {
    // Yardımcı fonksiyon: Input boşsa varsayılan metni koruma veya boş bırakma
    function setVal(inputId, outputId, defaultText) {
        const inputVal = document.getElementById(inputId).value;
        const outputEl = document.getElementById(outputId);
        
        // Eğer input doluysa onu yaz, boşsa boş bırak veya tire koy (tercihe bağlı)
        if (inputVal.trim() !== "") {
            outputEl.innerText = inputVal;
            outputEl.style.display = "block"; // Doluysa göster
        } else {
            // İstersen boşken gizleyebilirsin:
            // outputEl.style.display = "none"; 
            
            // Ya da varsayılan bir metin tutabilirsin (Kullanıcı nerenin değiştiğini görsün diye):
            outputEl.innerText = defaultText || "";
        }
    }

    // Kişisel Bilgiler
    setVal('inName', 'outName', 'AD SOYAD');
    setVal('inTitle', 'outTitle', 'Ünvan');
    setVal('inEmail', 'outEmail', 'email@ornek.com');
    setVal('inPhone', 'outPhone', '+90 555 555 55 55');
    setVal('inLink', 'outLink', 'linkedin.com/in/profil');
    setVal('inSummary', 'outSummary', 'Kısa kariyer özeti...');

    // Deneyim 1
    setVal('inExp1Title', 'outExp1Title', 'Pozisyon Adı');
    setVal('inExp1Comp', 'outExp1Comp', 'Şirket Adı');
    setVal('inExp1Date', 'outExp1Date', 'Tarih');
    setVal('inExp1Desc', 'outExp1Desc', 'İş tanımı...');

    // Deneyim 2
    setVal('inExp2Title', 'outExp2Title', 'Pozisyon Adı');
    setVal('inExp2Comp', 'outExp2Comp', 'Şirket Adı');
    setVal('inExp2Date', 'outExp2Date', 'Tarih');
    setVal('inExp2Desc', 'outExp2Desc', 'İş tanımı...');

    // Eğitim
    setVal('inEdu1School', 'outEdu1School', 'Üniversite Adı');
    setVal('inEdu1Dept', 'outEdu1Dept', 'Bölüm');
    setVal('inEdu1Date', 'outEdu1Date', 'Yıl');

    // Yetkinlikler
    setVal('inSkills', 'outSkills', 'Yetenekler...');
}

// PDF İndirme Fonksiyonu
function downloadPDF() {
    const element = document.getElementById('cv-document');
    
    // Mobilden girenler için uyarı (Opsiyonel)
    if(window.innerWidth < 900) {
        alert("PDF oluşturuluyor, lütfen bekleyin...");
    }

    const opt = {
        margin:       0, // Kenar boşluğunu CSS'de verdik (padding), burayı 0 yapıyoruz
        filename:     'benim_cv.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
}