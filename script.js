document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const hadithTextElement = document.querySelector('.hadith-text');
    const hadithSourceElement = document.querySelector('.hadith-source');
    const hadithNumberElement = document.querySelector('.hadith-number');
    const getHadithBtn = document.getElementById('getHadithBtn');
    const copyHadithBtn = document.getElementById('copyHadithBtn');
    const favoriteBtn = document.getElementById('favoriteBtn');
    const shareBtn = document.getElementById('shareBtn');
    const viewFavoritesBtn = document.getElementById('viewFavoritesBtn');
    const loadingElement = document.querySelector('.loading');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const copyMessage = document.querySelector('.copy-message');
    const favoritesPanel = document.querySelector('.favorites-panel');
    const favoritesList = document.getElementById('favoritesList');
    const favoritesCloseBtn = document.querySelector('.favorites-close');
    const overlay = document.querySelector('.overlay');
    const hadithContainer = document.querySelector('.hadith-container');
    
    // Variables
    let currentHadith = null;
    let currentSource = 'all';
    let favorites = JSON.parse(localStorage.getItem('favoriteHadiths')) || [];
    
    // Initialize
    updateFavoritesList();
    getRandomHadith();
    
    // Event listeners
    getHadithBtn.addEventListener('click', () => {
        getRandomHadith();
        hadithContainer.classList.remove('fade-in');
        // Trigger reflow
        void hadithContainer.offsetWidth;
        hadithContainer.classList.add('fade-in');
    });
    
    copyHadithBtn.addEventListener('click', copyHadith);
    favoriteBtn.addEventListener('click', toggleFavorite);
    shareBtn.addEventListener('click', shareHadith);
    viewFavoritesBtn.addEventListener('click', toggleFavoritesPanel);
    favoritesCloseBtn.addEventListener('click', toggleFavoritesPanel);
    
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentSource = this.dataset.source;
            getRandomHadith();
        });
    });
    
    // Toggle favorites panel when clicking overlay
    overlay.addEventListener('click', toggleFavoritesPanel);
    
    // Functions
    function getRandomHadith() {
        showLoading(true);
        let apiUrl;
        
        switch(currentSource) {
            case 'bukhari':
                apiUrl = 'https://api.hadith.gading.dev/books/bukhari?range=1-300';
                break;
            case 'muslim':
                apiUrl = 'https://api.hadith.gading.dev/books/muslim?range=1-300';
                break;
            case 'abudawud':
                apiUrl = 'https://api.hadith.gading.dev/books/abu-dawud?range=1-300';
                break;
            case 'tirmidhi':
                apiUrl = 'https://api.hadith.gading.dev/books/tirmidzi?range=1-300';
                break;
            default:
                // Randomly select a collection for 'all'
                const collections = ['bukhari', 'muslim', 'abu-dawud', 'tirmidzi'];
                const randomCollection = collections[Math.floor(Math.random() * collections.length)];
                apiUrl = `https://api.hadith.gading.dev/books/${randomCollection}?range=1-300`;
        }
        
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('حدث خطأ في الاتصال بالخادم');
                }
                return response.json();
            })
            .then(data => {
                if (data && data.data && data.data.hadiths && data.data.hadiths.length > 0) {
                    // Get a random hadith from the response
                    const randomIndex = Math.floor(Math.random() * data.data.hadiths.length);
                    const hadith = data.data.hadiths[randomIndex];
                    
                    // Update the current hadith
                    currentHadith = {
                        text: hadith.arab,
                        source: `${data.data.name} - حديث رقم ${hadith.number}`,
                        number: hadith.number
                    };
                    
                    // Update the UI with the hadith
                    updateHadithUI();
                    
                    // Check if the hadith is in favorites
                    updateFavoriteButton();
                } else {
                    throw new Error('لم يتم العثور على أحاديث');
                }
            })
            .catch(error => {
                console.error('Error fetching hadith:', error);
                hadithTextElement.textContent = 'عذراً، حدث خطأ أثناء جلب الحديث. الرجاء المحاولة مرة أخرى.';
                hadithSourceElement.textContent = '';
                
                // Fallback to another API if the first one fails
                fetchFallbackHadith();
            })
            .finally(() => {
                showLoading(false);
            });
    }
    
    function fetchFallbackHadith() {
        fetch('https://ahadith-api.herokuapp.com/api/ahadith/random')
            .then(response => response.json())
            .then(data => {
                if (data && data.data && data.data.text) {
                    // Update the current hadith
                    currentHadith = {
                        text: data.data.text,
                        source: data.data.source || 'مصدر الحديث',
                        number: data.data.hadithNumber || '0'
                    };
                    
                    // Update the UI with the hadith
                    updateHadithUI();
                    
                    // Check if the hadith is in favorites
                    updateFavoriteButton();
                }
            })
            .catch(error => {
                console.error('Error fetching fallback hadith:', error);
            })
            .finally(() => {
                showLoading(false);
            });
    }
    
    function updateHadithUI() {
        if (!currentHadith) return;
        
        hadithTextElement.textContent = currentHadith.text;
        hadithSourceElement.textContent = currentHadith.source;
        hadithNumberElement.textContent = currentHadith.number;
    }
    
    function copyHadith() {
        if (!currentHadith) return;
        
        const textToCopy = `${currentHadith.text}\n\n${currentHadith.source}`;
        
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                showCopyMessage();
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                // Fallback method for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = textToCopy;
                textarea.style.position = 'fixed';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showCopyMessage();
            });
    }
    
    function showCopyMessage() {
        copyMessage.classList.add('show');
        setTimeout(() => {
            copyMessage.classList.remove('show');
        }, 2000);
    }
    
    function toggleFavorite() {
        if (!currentHadith) return;
        
        const index = favorites.findIndex(h => h.text === currentHadith.text);
        
        if (index === -1) {
            // Add to favorites
            favorites.push(currentHadith);
            favoriteBtn.classList.add('active');
        } else {
            // Remove from favorites
            favorites.splice(index, 1);
            favoriteBtn.classList.remove('active');
        }
        
        // Save to localStorage
        localStorage.setItem('favoriteHadiths', JSON.stringify(favorites));
        
        // Update the favorites list
        updateFavoritesList();
    }
    
    function updateFavoriteButton() {
        if (!currentHadith) return;
        
        const isInFavorites = favorites.some(h => h.text === currentHadith.text);
        
        if (isInFavorites) {
            favoriteBtn.classList.add('active');
        } else {
            favoriteBtn.classList.remove('active');
        }
    }
    
    function updateFavoritesList() {
        favoritesList.innerHTML = '';
        
        if (favorites.length === 0) {
            favoritesList.innerHTML = '<p>لا توجد أحاديث في المفضلة</p>';
            return;
        }
        
        favorites.forEach((hadith, index) => {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            
            item.innerHTML = `
                <p>${hadith.text}</p>
                <small>${hadith.source}</small>
                <button class="remove-favorite" data-index="${index}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            
            favoritesList.appendChild(item);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-favorite').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const index = parseInt(this.getAttribute('data-index'));
                favorites.splice(index, 1);
                localStorage.setItem('favoriteHadiths', JSON.stringify(favorites));
                updateFavoritesList();
                
                // Update the favorite button if the current hadith is removed
                updateFavoriteButton();
            });
        });
    }
    
    function toggleFavoritesPanel() {
        favoritesPanel.classList.toggle('open');
        overlay.classList.toggle('show');
    }
    
    function shareHadith() {
        if (!currentHadith) return;
        
        if (navigator.share) {
            navigator.share({
                title: 'حديث نبوي',
                text: `${currentHadith.text}\n\n${currentHadith.source}`,
                url: window.location.href
            })
            .catch(error => console.error('Error sharing:', error));
        } else {
            // Fallback for browsers that don't support navigator.share
            copyHadith();
            alert('تم نسخ الحديث. يمكنك مشاركته الآن.');
        }
    }
    
    function showLoading(show) {
        if (show) {
            loadingElement.style.display = 'block';
            hadithContainer.style.opacity = '0.5';
        } else {
            loadingElement.style.display = 'none';
            hadithContainer.style.opacity = '1';
        }
    }
});
