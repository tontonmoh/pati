// ============================================================
// PATI - Application Principale
// ============================================================

// --- Database init ---
let db = {
    livres: Storage.getBooks(),
    chapitres: Storage.getChapitres(),
    quiz: Storage.getQuiz()
};

// --- State ---
const savedState = Storage.getState();
const state = {
    currentPage: savedState.currentPage || 'home',
    selectedBook: savedState.selectedBook || null,
    currentChapter: savedState.currentChapter || 0,
    textLanguage: savedState.textLanguage || 'fr',
    audioLanguage: savedState.audioLanguage || 'pular',
    isPlaying: false,
    currentTime: 0,
    duration: 180,
    quizScore: 0,
    currentQuestion: 0,
    quizAnswers: [],
    audioInterval: null,
    showAdmin: false
};

// --- Audio Engine ---
let audioCtx = null;
let oscillator = null;
let gainNode = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playTone() {
    initAudio();
    if (oscillator) { try { oscillator.stop(); } catch(e){} oscillator = null; }
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.value = 440;
    gainNode.gain.value = 0.05;
    oscillator.start();
}

function stopTone() {
    if (oscillator) {
        try { oscillator.stop(); } catch(e){}
        oscillator = null;
    }
}

function cleanupAudio() {
    stopTone();
    if (state.audioInterval) {
        clearInterval(state.audioInterval);
        state.audioInterval = null;
    }
    state.isPlaying = false;
    state.currentTime = 0;
}

// --- Router ---
function navigate(page, data = null) {
    if (state.currentPage === 'audio' && page !== 'audio') {
        cleanupAudio();
    }
    state.currentPage = page;
    if (data) {
        if (data.book) state.selectedBook = data.book;
        if (data.chapter !== undefined) state.currentChapter = data.chapter;
    }
    Storage.saveState({
        currentPage: state.currentPage,
        selectedBook: state.selectedBook,
        currentChapter: state.currentChapter
    });
    try {
        history.pushState({ page, data }, '', `#${page}`);
    } catch(e) {}
    render();
    window.scrollTo(0, 0);
}

window.onpopstate = function(e) {
    if (e.state && e.state.page) {
        state.currentPage = e.state.page;
        if (e.state.data && e.state.data.book) state.selectedBook = e.state.data.book;
        render();
    }
};

// --- PDF Viewer ---
function openPdf(url, title) {
    if (!url) {
        showToast('Aucun PDF disponible pour ce livre');
        return;
    }
    const viewer = document.getElementById('pdfViewer');
    const frame = document.getElementById('pdfFrame');
    const titleEl = document.getElementById('pdfTitle');

    // Pour les URLs blob (local) ou externes
    if (url.startsWith('blob:') || url.startsWith('http')) {
        frame.src = url;
    } else {
        // Fallback pour chemins relatifs via Google Docs Viewer
        const absoluteUrl = new URL(url, window.location.href).href;
        frame.src = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(absoluteUrl)}`;
    }

    titleEl.textContent = title || 'Document';
    viewer.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePdf() {
    const viewer = document.getElementById('pdfViewer');
    const frame = document.getElementById('pdfFrame');
    frame.src = '';
    viewer.classList.remove('active');
    document.body.style.overflow = '';
}

// --- Upload Handlers ---
function handleCoverUpload(bookId, input) {
    const file = input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showToast('Veuillez sélectionner une image');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        Storage.updateBookCover(bookId, e.target.result);
        db.livres = Storage.getBooks();
        showToast('Couverture mise à jour !');
        render();
    };
    reader.readAsDataURL(file);
}

function handlePdfUpload(bookId, input) {
    const file = input.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
        showToast('Veuillez sélectionner un PDF');
        return;
    }
    const blobUrl = URL.createObjectURL(file);
    Storage.updateBookPdf(bookId, blobUrl);
    db.livres = Storage.getBooks();
    showToast('PDF chargé avec succès !');
    render();
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            Storage.importData(e.target.result);
            db.livres = Storage.getBooks();
            db.chapitres = Storage.getChapitres();
            showToast('Données importées avec succès !');
            render();
        } catch(err) {
            showToast("Erreur lors de l'import");
        }
    };
    reader.readAsText(file);
}

// --- Helpers ---
function getBookById(id) {
    const book = db.livres.find(b => b.id === id);
    return book ? { ...book } : null;
}

function showToast(message) {
    const existing = document.querySelector('.pati-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'pati-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function toggleAdmin() {
    state.showAdmin = !state.showAdmin;
    state.currentPage = state.showAdmin ? 'admin' : 'home';
    render();
}

function changeTextLanguage(lang) {
    state.textLanguage = lang;
    Storage.saveState({ textLanguage: lang });
    render();
}

function changeAudioLanguage(lang) {
    state.audioLanguage = lang;
    Storage.saveState({ audioLanguage: lang });
    showToast(`Audio changé en ${lang.charAt(0).toUpperCase() + lang.slice(1)}`);
    render();
}

function togglePlay() {
    state.isPlaying = !state.isPlaying;
    if (state.isPlaying) {
        playTone();
        state.audioInterval = setInterval(() => {
            if (state.currentTime < state.duration) {
                state.currentTime++;
                const range = document.querySelector('input[type=range]');
                if (range) range.value = state.currentTime;
            } else {
                cleanupAudio();
                render();
            }
        }, 1000);
    } else {
        stopTone();
        if (state.audioInterval) clearInterval(state.audioInterval);
    }
    render();
}

function seekAudio(value) {
    state.currentTime = parseInt(value);
    render();
}

function selectAnswer(idx) {
    state.quizAnswers[state.currentQuestion] = idx;
    render();
}

function nextQuestion() {
    const quiz = db.quiz.filter(q => q.livre_id === state.selectedBook.id);
    const currentQ = quiz[state.currentQuestion];
    if (state.quizAnswers[state.currentQuestion] === currentQ.reponse_correcte_index) {
        state.quizScore++;
    }
    state.currentQuestion++;
    render();
}

function resetQuiz() {
    state.currentQuestion = 0;
    state.quizScore = 0;
    state.quizAnswers = [];
    render();
}

function showSubscription() {
    alert("🎉 Abonnement Premium\n\nCette fonctionnalité serait connectée à Orange Money / MTN Mobile Money en production.\n\nPour le MVP : Accès complet déverrouillé !");
}

// --- Components ---
function Header() {
    return `
        <header class="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b-2 border-orange-200">
            <div class="flex items-center justify-between px-4 py-3">
                <button onclick="navigate('home')" class="flex items-center gap-2">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                        <i class="fas fa-book-open text-white text-lg"></i>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-gray-800 leading-tight">Pati</h1>
                        <p class="text-xs text-gray-500">Édition Jeunesse Guinée</p>
                    </div>
                </button>
                <div class="flex gap-2">
                    <button onclick="toggleAdmin()" class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200" title="Gérer les livres">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button onclick="showSubscription()" class="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all">
                        <i class="fas fa-crown mr-1"></i> Premium
                    </button>
                </div>
            </div>
        </header>
    `;
}

function AdminPanel() {
    return `
        <div class="animate-fade-in px-4 py-6 pb-24">
            <div class="flex items-center gap-3 mb-6">
                <button onclick="toggleAdmin()" class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <i class="fas fa-arrow-left text-gray-700"></i>
                </button>
                <h2 class="text-2xl font-bold text-gray-800">Gestion des livres</h2>
            </div>

            <div class="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-5 mb-6 border border-orange-200">
                <h3 class="font-bold text-orange-800 mb-2"><i class="fas fa-info-circle mr-2"></i>Comment ajouter tes contenus</h3>
                <ul class="text-sm text-orange-700 space-y-1 list-disc list-inside">
                    <li>Clique sur "Changer couverture" pour uploader une image (JPG/PNG)</li>
                    <li>Clique sur "Charger PDF" pour uploader le fichier du livre</li>
                    <li>Les fichiers sont stockés localement dans le navigateur</li>
                    <li>Pour un usage permanent, place les fichiers dans <code>assets/</code> et modifie <code>js/db.js</code></li>
                </ul>
            </div>

            <div class="space-y-4">
                ${db.livres.map(book => `
                    <div class="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
                        <div class="flex gap-4">
                            <img src="${book.couverture_url}" class="w-20 h-28 object-cover rounded-xl shadow-sm bg-gray-200" alt="cover" onerror="this.src='https://via.placeholder.com/200x280/D2691E/FFFFFF?text=Pas+d\'image'">
                            <div class="flex-1 min-w-0">
                                <h4 class="font-bold text-gray-800 truncate">${book.titre}</h4>
                                <p class="text-xs text-gray-500 mb-2">${book.auteur}</p>
                                <div class="flex flex-wrap gap-2">
                                    <label class="cursor-pointer bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-200 transition-colors">
                                        <i class="fas fa-image mr-1"></i>Couverture
                                        <input type="file" accept="image/*" class="hidden" onchange="handleCoverUpload('${book.id}', this)">
                                    </label>
                                    <label class="cursor-pointer bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors">
                                        <i class="fas fa-file-pdf mr-1"></i>PDF
                                        <input type="file" accept="application/pdf" class="hidden" onchange="handlePdfUpload('${book.id}', this)">
                                    </label>
                                    ${book.pdf_url ? `
                                        <button onclick="openPdf('${book.pdf_url}', '${book.titre}')" class="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200">
                                            <i class="fas fa-eye mr-1"></i>Voir
                                        </button>
                                    ` : ''}
                                </div>
                                ${book.pdf_url ? `<p class="text-xs text-green-600 mt-2"><i class="fas fa-check mr-1"></i>PDF prêt</p>` : `<p class="text-xs text-gray-400 mt-2">Aucun PDF</p>`}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="mt-8 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <h4 class="font-bold text-gray-700 mb-2">Sauvegarde</h4>
                <div class="flex gap-2">
                    <button onclick="Storage.exportData()" class="flex-1 bg-gray-800 text-white py-2 rounded-xl text-sm font-bold">
                        <i class="fas fa-download mr-1"></i>Exporter JSON
                    </button>
                    <label class="flex-1 cursor-pointer bg-white border-2 border-gray-300 text-gray-700 py-2 rounded-xl text-sm font-bold text-center hover:bg-gray-50">
                        <i class="fas fa-upload mr-1"></i>Importer
                        <input type="file" accept=".json" class="hidden" onchange="importData(this)">
                    </label>
                </div>
                <button onclick="if(confirm('Réinitialiser toutes les données ?')) Storage.resetToDefault()" class="w-full mt-2 bg-red-50 text-red-600 border border-red-200 py-2 rounded-xl text-sm font-bold hover:bg-red-100">
                    <i class="fas fa-trash-alt mr-1"></i>Réinitialiser
                </button>
            </div>
        </div>
    `;
}

function HomePage() {
    return `
        <div class="animate-fade-in pb-20">
            ${Header()}

            <div class="relative overflow-hidden bg-gradient-to-br from-orange-600 via-red-600 to-yellow-500 text-white p-6 mb-6">
                <div class="absolute inset-0 opacity-20" style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
                <div class="relative z-10">
                    <h2 class="text-3xl font-bold mb-2 animate-float">Découvre tes histoires !</h2>
                    <p class="text-orange-100 mb-4">Livres et contes traditionnels guinéens en 8 langues</p>
                    <div class="flex gap-2 flex-wrap">
                        <span class="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">🇬🇳 Pular</span>
                        <span class="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">🇬🇳 Soussou</span>
                        <span class="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">🇬🇳 Malinké</span>
                        <span class="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">+5</span>
                    </div>
                </div>
            </div>

            <div class="px-4">
                <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <i class="fas fa-fire text-orange-500"></i>
                    Livres Populaires
                </h3>
                <div class="grid grid-cols-2 gap-4">
                    ${db.livres.map(book => `
                        <div onclick="navigate('detail', {book: getBookById('${book.id}')})" 
                             class="book-card bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-orange-300">
                            <div class="relative h-48 overflow-hidden">
                                <img src="${book.couverture_url}" class="w-full h-full object-cover" alt="${book.titre}" onerror="this.src='https://via.placeholder.com/400x600/D2691E/FFFFFF?text=Pati'">
                                <div class="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow-md">
                                    <i class="fas fa-headphones text-orange-600 text-sm"></i>
                                </div>
                                ${book.pdf_url ? `
                                    <div class="absolute top-2 left-2 bg-red-600 rounded-full p-1.5 shadow-md">
                                        <i class="fas fa-file-pdf text-white text-sm"></i>
                                    </div>
                                ` : ''}
                                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div class="absolute bottom-2 left-2 right-2">
                                    <span class="text-white text-xs font-bold bg-orange-600 px-2 py-1 rounded-full">Audio</span>
                                </div>
                            </div>
                            <div class="p-3">
                                <h4 class="font-bold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">${book.titre}</h4>
                                <p class="text-xs text-gray-500">${book.auteur}</p>
                                <div class="flex items-center gap-1 mt-2">
                                    <div class="flex text-yellow-400 text-xs">
                                        <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
                                    </div>
                                    <span class="text-xs text-gray-400">4.5</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="px-4 mt-8 mb-8">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Explorer par thème</h3>
                <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <div class="flex-shrink-0 bg-gradient-to-br from-green-600 to-green-700 text-white px-5 py-3 rounded-2xl shadow-md">
                        <i class="fas fa-leaf mb-1 block text-center text-xl"></i>
                        <span class="text-sm font-bold">Nature</span>
                    </div>
                    <div class="flex-shrink-0 bg-gradient-to-br from-red-600 to-red-700 text-white px-5 py-3 rounded-2xl shadow-md">
                        <i class="fas fa-landmark mb-1 block text-center text-xl"></i>
                        <span class="text-sm font-bold">Histoire</span>
                    </div>
                    <div class="flex-shrink-0 bg-gradient-to-br from-yellow-500 to-orange-600 text-white px-5 py-3 rounded-2xl shadow-md">
                        <i class="fas fa-music mb-1 block text-center text-xl"></i>
                        <span class="text-sm font-bold">Musique</span>
                    </div>
                    <div class="flex-shrink-0 bg-gradient-to-br from-purple-600 to-purple-700 text-white px-5 py-3 rounded-2xl shadow-md">
                        <i class="fas fa-hat-wizard mb-1 block text-center text-xl"></i>
                        <span class="text-sm font-bold">Contes</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function DetailPage() {
    const book = state.selectedBook;
    if (!book) { navigate('home'); return ''; }

    return `
        <div class="animate-slide-in pb-24">
            <div class="relative">
                <button onclick="navigate('home')" class="absolute top-4 left-4 z-20 bg-white/90 rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                    <i class="fas fa-arrow-left text-gray-700"></i>
                </button>
                <div class="h-72 w-full relative">
                    <img src="${book.couverture_url}" class="w-full h-full object-cover" alt="${book.titre}" onerror="this.src='https://via.placeholder.com/800x600/D2691E/FFFFFF?text=Pati'">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                </div>
                <div class="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h1 class="text-3xl font-bold mb-2">${book.titre}</h1>
                    <p class="text-lg opacity-90 mb-2">${book.auteur}</p>
                    <div class="flex items-center gap-4 text-sm">
                        <span class="flex items-center gap-1"><i class="fas fa-clock"></i> 15 min</span>
                        <span class="flex items-center gap-1"><i class="fas fa-globe"></i> 8 langues</span>
                        <span class="flex items-center gap-1"><i class="fas fa-child"></i> 6-12 ans</span>
                    </div>
                </div>
            </div>

            <div class="px-6 py-6">
                <div class="flex gap-3 mb-6">
                    <button onclick="navigate('reader')" class="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                        <i class="fas fa-book-reader"></i> Lire
                    </button>
                    <button onclick="navigate('audio')" class="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                        <i class="fas fa-headphones"></i> Écouter
                    </button>
                </div>

                ${book.pdf_url ? `
                    <button onclick="openPdf('${book.pdf_url}', '${book.titre}')" class="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mb-6">
                        <i class="fas fa-file-pdf"></i> Lire le PDF complet
                    </button>
                ` : ''}

                <div class="bg-white rounded-2xl p-5 shadow-md mb-6 border border-orange-100">
                    <h3 class="font-bold text-gray-800 mb-3 text-lg">Résumé</h3>
                    <p class="text-gray-600 leading-relaxed">${book.description}</p>
                </div>

                <div class="bg-white rounded-2xl p-5 shadow-md mb-6 border border-orange-100">
                    <h3 class="font-bold text-gray-800 mb-4 text-lg">Langues disponibles</h3>
                    <div class="grid grid-cols-4 gap-3">
                        <div class="text-center p-2 bg-gray-50 rounded-xl"><span class="text-2xl block mb-1">🇫🇷</span><span class="text-xs text-gray-600">Français</span></div>
                        <div class="text-center p-2 bg-gray-50 rounded-xl"><span class="text-2xl block mb-1">🇬🇧</span><span class="text-xs text-gray-600">English</span></div>
                        <div class="text-center p-2 bg-gray-50 rounded-xl"><span class="text-2xl block mb-1">🇪🇸</span><span class="text-xs text-gray-600">Español</span></div>
                        <div class="text-center p-2 bg-gray-50 rounded-xl"><span class="text-2xl block mb-1">🇸🇦</span><span class="text-xs text-gray-600">العربية</span></div>
                    </div>
                    <div class="mt-3 pt-3 border-t border-gray-100">
                        <p class="text-sm text-gray-500 mb-2 font-semibold">Langues nationales :</p>
                        <div class="flex flex-wrap gap-2">
                            ${['Pular','Soussou','Malinké','Guerzé','Toma','Kissi','Koniagui','Landouma'].map(l => `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">${l}</span>`).join('')}
                        </div>
                    </div>
                </div>

                <button onclick="navigate('quiz')" class="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mb-4">
                    <i class="fas fa-question-circle"></i> Quiz Interactif
                </button>
            </div>
        </div>
    `;
}

function ReaderPage() {
    const chapter = db.chapitres[state.currentChapter];
    if (!chapter) { showToast('Chapitre non disponible'); navigate('detail'); return ''; }
    const text = chapter[`texte_${state.textLanguage}`] || chapter.texte_fr;
    const flags = { fr: '🇫🇷', en: '🇬🇧', es: '🇪🇸', ar: '🇸🇦' };
    const isRTL = state.textLanguage === 'ar';

    return `
        <div class="animate-fade-in min-h-screen flex flex-col">
            <div class="sticky top-0 bg-white/95 backdrop-blur-md border-b border-orange-200 px-4 py-3 flex items-center justify-between z-20">
                <button onclick="navigate('detail')" class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <i class="fas fa-arrow-left text-gray-700"></i>
                </button>
                <span class="font-bold text-gray-800">Chapitre ${chapter.numero_chapitre}</span>
                <div class="w-10"></div>
            </div>

            <div class="px-4 py-4 bg-orange-50 border-b border-orange-200">
                <p class="text-sm text-gray-600 mb-2 font-semibold">Langue du texte :</p>
                <div class="flex gap-2">
                    ${Object.keys(flags).map(lang => `
                        <button onclick="changeTextLanguage('${lang}')" 
                                class="lang-btn ${state.textLanguage === lang ? 'active' : 'bg-white'} w-12 h-12 rounded-xl shadow-sm flex items-center justify-center text-2xl border-2 ${state.textLanguage === lang ? 'border-orange-500' : 'border-transparent'}">
                            ${flags[lang]}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="flex-1 px-6 py-8">
                <div class="mb-6 rounded-2xl overflow-hidden shadow-lg">
                    <img src="${chapter.image_url}" class="w-full h-48 object-cover" alt="Illustration" onerror="this.style.display='none'">
                </div>
                <div class="prose prose-lg max-w-none">
                    <p class="text-gray-800 leading-loose text-lg font-medium" style="line-height: 1.8; text-align: ${isRTL ? 'right' : 'left'}; direction: ${isRTL ? 'rtl' : 'ltr'};">
                        ${text}
                    </p>
                </div>
            </div>

            <div class="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
                <button class="text-gray-400 cursor-not-allowed" disabled><i class="fas fa-chevron-left text-2xl"></i></button>
                <div class="flex gap-1"><div class="w-2 h-2 rounded-full bg-orange-500"></div><div class="w-2 h-2 rounded-full bg-gray-300"></div><div class="w-2 h-2 rounded-full bg-gray-300"></div></div>
                <button class="text-orange-600 hover:text-orange-700"><i class="fas fa-chevron-right text-2xl"></i></button>
            </div>
        </div>
    `;
}

function AudioPage() {
    const chapter = db.chapitres[state.currentChapter];
    if (!chapter) { showToast('Audio non disponible'); navigate('detail'); return ''; }

    const languages = [
        { code: 'pular', name: 'Pular', flag: '🇬🇳' },
        { code: 'soussou', name: 'Soussou', flag: '🇬🇳' },
        { code: 'malinke', name: 'Malinké', flag: '🇬🇳' },
        { code: 'guerze', name: 'Guerzé', flag: '🇬🇳' },
        { code: 'toma', name: 'Toma', flag: '🇬🇳' },
        { code: 'kissi', name: 'Kissi', flag: '🇬🇳' },
        { code: 'koniagui', name: 'Koniagui', flag: '🇬🇳' },
        { code: 'landouma', name: 'Landouma', flag: '🇬🇳' }
    ];

    const currentLang = languages.find(l => l.code === state.audioLanguage) || languages[0];
    const progress = (state.currentTime / state.duration) * 100;
    const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

    return `
        <div class="animate-fade-in min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">
            <div class="px-4 py-4 flex items-center justify-between">
                <button onclick="navigate('detail')" class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                    <i class="fas fa-chevron-down text-white"></i>
                </button>
                <div class="text-center">
                    <p class="text-xs text-gray-400 uppercase tracking-wider">Lecture Audio</p>
                    <p class="font-bold text-sm">Chapitre ${chapter.numero_chapitre}</p>
                </div>
                <button class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                    <i class="fas fa-ellipsis-h text-white"></i>
                </button>
            </div>

            <div class="flex-1 flex flex-col items-center justify-center px-8 py-8">
                <div class="relative w-64 h-64 mb-8">
                    <div class="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500 to-red-600 animate-pulse opacity-20 ${state.isPlaying ? 'playing' : ''}"></div>
                    <div class="absolute inset-2 rounded-full bg-gray-800 overflow-hidden shadow-2xl">
                        <img src="${chapter.image_url}" class="w-full h-full object-cover opacity-80" alt="Cover" onerror="this.style.display='none'">
                    </div>
                    <div class="absolute inset-0 rounded-full border-4 border-orange-500/30"></div>
                    <div class="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex items-end gap-1 h-12 ${state.isPlaying ? 'playing' : ''}" id="visualizer">
                        ${Array(8).fill(0).map((_,i) => `<div class="audio-bar" style="animation-delay: ${i*50}ms; height: ${20 + Math.random()*60}%"></div>`).join('')}
                    </div>
                </div>

                <h2 class="text-2xl font-bold text-center mb-2">${state.selectedBook ? state.selectedBook.titre : 'Lecture'}</h2>
                <p class="text-gray-400 mb-8">${state.selectedBook ? state.selectedBook.auteur : ''}</p>

                <div class="w-full mb-8">
                    <label class="text-xs text-gray-400 uppercase tracking-wider mb-2 block text-center">Langue audio</label>
                    <div class="relative">
                        <select onchange="changeAudioLanguage(this.value)" class="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-center appearance-none cursor-pointer focus:outline-none focus:border-orange-500 text-white">
                            ${languages.map(lang => `<option value="${lang.code}" ${state.audioLanguage === lang.code ? 'selected' : ''}>${lang.flag} ${lang.name}</option>`).join('')}
                        </select>
                        <div class="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none"><i class="fas fa-chevron-down text-gray-400"></i></div>
                    </div>
                    <p class="text-center text-xs text-orange-400 mt-2"><i class="fas fa-info-circle mr-1"></i>Audio en ${currentLang.name}</p>
                </div>

                <div class="w-full mb-6">
                    <input type="range" min="0" max="${state.duration}" value="${state.currentTime}" oninput="seekAudio(this.value)" class="w-full mb-2">
                    <div class="flex justify-between text-xs text-gray-400">
                        <span>${formatTime(state.currentTime)}</span>
                        <span>${formatTime(state.duration)}</span>
                    </div>
                </div>

                <div class="flex items-center gap-8">
                    <button class="text-gray-400 hover:text-white text-xl" onclick="seekAudio(Math.max(0, state.currentTime - 10))"><i class="fas fa-step-backward"></i></button>
                    <button onclick="togglePlay()" class="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                        <i class="fas ${state.isPlaying ? 'fa-pause' : 'fa-play'} text-3xl ${state.isPlaying ? '' : 'ml-1'}"></i>
                    </button>
                    <button class="text-gray-400 hover:text-white text-xl" onclick="seekAudio(Math.min(state.duration, state.currentTime + 10))"><i class="fas fa-step-forward"></i></button>
                </div>
            </div>

            <div class="px-6 py-6 bg-gray-900/50">
                <button onclick="navigate('quiz')" class="w-full bg-white/10 border border-white/20 rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-white/20 transition-all">
                    <i class="fas fa-question-circle text-orange-400"></i>
                    <span class="font-semibold">Passer au Quiz</span>
                </button>
            </div>
        </div>
    `;
}

function QuizPage() {
    if (!state.selectedBook) { navigate('home'); return ''; }
    const quiz = db.quiz.filter(q => q.livre_id === state.selectedBook.id);

    if (quiz.length === 0) {
        return `
            <div class="animate-fade-in min-h-screen flex flex-col items-center justify-center px-6">
                <i class="fas fa-clipboard-list text-6xl text-gray-300 mb-4"></i>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Pas encore de quiz</h2>
                <p class="text-gray-500 mb-6 text-center">Le quiz pour ce livre sera bientôt disponible.</p>
                <button onclick="navigate('detail')" class="bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg">Retour au livre</button>
            </div>
        `;
    }

    const currentQ = quiz[state.currentQuestion];
    const isLast = state.currentQuestion === quiz.length - 1;

    if (state.currentQuestion >= quiz.length) {
        return QuizResult(quiz.length);
    }

    return `
        <div class="animate-fade-in min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
            <div class="sticky top-0 bg-white/90 backdrop-blur-md border-b border-orange-200 px-4 py-4 flex items-center justify-between">
                <button onclick="navigate('detail')" class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"><i class="fas fa-times text-gray-700"></i></button>
                <div class="flex-1 mx-4">
                    <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all" style="width: ${((state.currentQuestion + 1) / quiz.length) * 100}%"></div>
                    </div>
                </div>
                <span class="text-sm font-bold text-gray-600">${state.currentQuestion + 1}/${quiz.length}</span>
            </div>

            <div class="flex-1 px-6 py-8">
                <div class="mb-8">
                    <span class="inline-block bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-bold mb-4">Question ${state.currentQuestion + 1}</span>
                    <h2 class="text-2xl font-bold text-gray-800 leading-tight">${currentQ.question}</h2>
                </div>
                <div class="space-y-3">
                    ${currentQ.options.map((opt, idx) => `
                        <button onclick="selectAnswer(${idx})" 
                                class="quiz-option w-full bg-white border-2 border-gray-200 rounded-2xl p-4 text-left font-semibold text-gray-700 hover:border-orange-300 hover:shadow-md transition-all ${state.quizAnswers[state.currentQuestion] === idx ? 'selected' : ''}" data-idx="${idx}">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold option-letter">${String.fromCharCode(65 + idx)}</div>
                                <span>${opt}</span>
                            </div>
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="px-6 py-6 bg-white border-t border-gray-200">
                <button onclick="nextQuestion()" ${state.quizAnswers[state.currentQuestion] === undefined ? 'disabled' : ''} 
                        class="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                    ${isLast ? 'Voir les résultats' : 'Question suivante'}
                </button>
            </div>
        </div>
    `;
}

function QuizResult(total) {
    const score = state.quizScore;
    const percentage = Math.round((score / total) * 100);
    let message = "";
    let emoji = "";

    if (percentage >= 80) { message = "Excellent ! Tu es un expert !"; emoji = "🏆"; }
    else if (percentage >= 60) { message = "Très bien ! Continue comme ça !"; emoji = "🌟"; }
    else { message = "Continue à lire pour t'améliorer !"; emoji = "📚"; }

    return `
        <div class="animate-fade-in min-h-screen flex flex-col items-center justify-center px-6 py-8 bg-gradient-to-b from-orange-50 to-white">
            <div class="text-6xl mb-4 animate-float">${emoji}</div>
            <h2 class="text-3xl font-bold text-gray-800 mb-2">Quiz terminé !</h2>
            <p class="text-gray-600 mb-8 text-center">${message}</p>

            <div class="bg-white rounded-3xl shadow-xl p-8 mb-8 w-full max-w-sm border-4 border-orange-100">
                <div class="text-center">
                    <p class="text-sm text-gray-500 uppercase tracking-wider mb-2">Score</p>
                    <div class="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">${score}/${total}</div>
                    <p class="text-2xl font-bold text-gray-700 mt-2">${percentage}%</p>
                </div>
            </div>

            <div class="w-full space-y-3">
                <button onclick="resetQuiz()" class="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg">Rejouer</button>
                <button onclick="navigate('home')" class="w-full bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-2xl font-bold text-lg">Retour à l'accueil</button>
            </div>
        </div>
    `;
}

// --- Render Engine ---
function render() {
    const app = document.getElementById('app');
    switch(state.currentPage) {
        case 'home': app.innerHTML = HomePage(); break;
        case 'admin': app.innerHTML = AdminPanel(); break;
        case 'detail': app.innerHTML = DetailPage(); break;
        case 'reader': app.innerHTML = ReaderPage(); break;
        case 'audio': app.innerHTML = AudioPage(); break;
        case 'quiz': app.innerHTML = QuizPage(); break;
        default: app.innerHTML = HomePage();
    }
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    if (savedState.currentPage && savedState.currentPage !== 'admin') {
        state.currentPage = savedState.currentPage;
    }
    render();
});
