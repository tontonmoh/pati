// ============================================================
// PATI - Base de données initiale
// Modifie ce fichier pour ajouter tes livres définitifs
// ============================================================

const DB = {
    // Livres : ajoute ici tes couvertures et PDFs finaux
    livres: [
        {
            id: "1",
            titre: "BINTA PILOTE",
            description: "L'épopée de la première femme pilote d'avion d'Afrique noire, LA DAME OISEAU",
            couverture_url: "assets/couvertures/binta_pilote.jpg",
            pdf_url: "assets/pdfs/binta_pilote.pdf",
            auteur: "Mohamed Doumbouya",
            couleur: "from-orange-600 to-amber-700"
        },
        {
            id: "2",
            titre: "LAYE DE KOUROUSSA",
            description: "Un conte initiatique d'un jeune garçon de Kouroussa.",
            couverture_url: "assets/couvertures/laye_kouroussa.jpg",
            pdf_url: "assets/pdfs/laye_kouroussa.pdf",
            auteur: "Mohamed Doumbouya",
            couleur: "from-green-700 to-emerald-800"
        },
        {
            id: "3",
            titre: "GUINEE, CHATEAU D'EAU",
            description: "L'eau en Guinee est une bénédiction, suivons l'histoire de Electroman de Bolodou.",
            couverture_url: "assets/couvertures/guinee_chateau_eau.jpg",
            pdf_url: "assets/pdfs/guinee_chateau_eau.pdf",
            auteur: "Mohamed Doumbouya",
            couleur: "from-yellow-600 to-orange-600"
        },
        {
            id: "4",
            titre: "SACREE D'MBA",
            description: "Tout sur le D'Mba. Amadou et Fifi découvrent les secrets de l'icone nationale de Guinée",
            couverture_url: "assets/couvertures/sacree_dmba.jpg",
            pdf_url: "assets/pdfs/sacree_dmba.pdf",
            auteur: "Mohamed Doumbouya",
            couleur: "from-red-700 to-orange-700"
        }
    ],

    chapitres: [
        {
            id: "c1",
            livre_id: "1",
            numero_chapitre: 1,
            texte_fr: "Il était une fois, dans les terres du Sosso, un roi nommé Sumanguru. Doté de pouvoirs mystiques, il régna avec sagesse et force. Son palais était construit en pierres rouges, reflétant la latérite des collines guinéennes. Les griots chantaient ses exploits jusqu'au coucher du soleil...",
            texte_en: "Once upon a time, in the lands of Sosso, there lived a king named Sumanguru. Endowed with mystical powers, he ruled with wisdom and strength. His palace was built of red stones, reflecting the laterite of the Guinean hills. The griots sang of his exploits until sunset...",
            texte_es: "Érase una vez, en las tierras de Sosso, un rey llamado Sumanguru. Dotado de poderes místicos, gobernó con sabiduría y fuerza. Su palacio estaba construido con piedras rojas, reflejando la laterita de las colinas guineanas. Los griots cantaban sus hazañas hasta la puesta del sol...",
            texte_ar: "كان يا ما كان، في أراضي سوسو، ملك اسمه سومانغورو. متسلحًا بالقوى الغامضة، حكم بالحكمة والقوة. قصره كان مبنيًا من الحجارة الحمراء، تعكس اللاتيريت في التلال الغينية. كان المغنون يرتجلون أشعارهم حتى غروب الشمس...",
            image_url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop",
            audio_fr_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
            audio_pular_url: "https://www.soundjay.com/misc/sounds/bell-ringing-04.wav",
            audio_soussou_url: "https://www.soundjay.com/misc/sounds/bell-ringing-03.wav",
            audio_malinke_url: "https://www.soundjay.com/misc/sounds/bell-ringing-02.wav",
            audio_guerze_url: "https://www.soundjay.com/misc/sounds/bell-ringing-01.wav",
            audio_toma_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
            audio_kissi_url: "https://www.soundjay.com/misc/sounds/bell-ringing-04.wav",
            audio_koniagui_url: "https://www.soundjay.com/misc/sounds/bell-ringing-03.wav",
            audio_landouma_url: "https://www.soundjay.com/misc/sounds/bell-ringing-02.wav"
        }
    ],

    quiz: [
        {
            id: "q1",
            livre_id: "1",
            question: "De quelle couleur était le palais du Roi Sumanguru ?",
            options: ["Blanc", "Rouge (Latérite)", "Bleu", "Jaune"],
            reponse_correcte_index: 1
        },
        {
            id: "q2",
            livre_id: "1",
            question: "Qui chantait les exploits du roi ?",
            options: ["Les guerriers", "Les griots", "Les enfants", "Les étrangers"],
            reponse_correcte_index: 1
        },
        {
            id: "q3",
            livre_id: "1",
            question: "Dans quelle région vivait Sumanguru ?",
            options: ["Le Fouta", "Le Sosso", "La Basse Guinée", "La Guinée Forestière"],
            reponse_correcte_index: 1
        }
    ]
};

// Export pour module (si besoin futur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DB;
}
