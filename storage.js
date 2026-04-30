// ============================================================
// PATI - Storage Layer (localStorage)
// ============================================================

const Storage = {
    KEYS: {
        BOOKS: 'pati_books',
        CHAPITRES: 'pati_chapitres',
        QUIZ: 'pati_quiz',
        STATE: 'pati_state'
    },

    getBooks() {
        const saved = localStorage.getItem(this.KEYS.BOOKS);
        return saved ? JSON.parse(saved) : [...DB.livres];
    },

    saveBooks(books) {
        localStorage.setItem(this.KEYS.BOOKS, JSON.stringify(books));
    },

    getChapitres() {
        const saved = localStorage.getItem(this.KEYS.CHAPITRES);
        return saved ? JSON.parse(saved) : [...DB.chapitres];
    },

    saveChapitres(chapitres) {
        localStorage.setItem(this.KEYS.CHAPITRES, JSON.stringify(chapitres));
    },

    getQuiz() {
        const saved = localStorage.getItem(this.KEYS.QUIZ);
        return saved ? JSON.parse(saved) : [...DB.quiz];
    },

    getState() {
        const saved = localStorage.getItem(this.KEYS.STATE);
        return saved ? JSON.parse(saved) : {};
    },

    saveState(partialState) {
        const current = this.getState();
        localStorage.setItem(this.KEYS.STATE, JSON.stringify({ ...current, ...partialState }));
    },

    updateBookCover(bookId, dataUrl) {
        const books = this.getBooks();
        const idx = books.findIndex(b => b.id === bookId);
        if (idx !== -1) {
            books[idx].couverture_url = dataUrl;
            this.saveBooks(books);
        }
    },

    updateBookPdf(bookId, blobUrl) {
        const books = this.getBooks();
        const idx = books.findIndex(b => b.id === bookId);
        if (idx !== -1) {
            books[idx].pdf_url = blobUrl;
            this.saveBooks(books);
        }
    },

    resetToDefault() {
        localStorage.removeItem(this.KEYS.BOOKS);
        localStorage.removeItem(this.KEYS.CHAPITRES);
        localStorage.removeItem(this.KEYS.QUIZ);
        localStorage.removeItem(this.KEYS.STATE);
        location.reload();
    },

    exportData() {
        const data = {
            livres: this.getBooks(),
            chapitres: this.getChapitres(),
            quiz: this.getQuiz(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pati_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    importData(jsonString) {
        const data = JSON.parse(jsonString);
        if (data.livres) {
            this.saveBooks(data.livres);
        }
        if (data.chapitres) {
            this.saveChapitres(data.chapitres);
        }
        return true;
    }
};
