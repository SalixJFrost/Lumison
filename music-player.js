class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isShuffle = false;
        this.isRepeat = false;
        this.isSeeking = false;
        this.isChangingVolume = false;
        this.currentLyrics = [];
        this.animationFrameId = null;

        this.initElements();
        this.attachEventListeners();
        this.loadSavedVolume();
    }

    initElements() {
        this.addMusicBtn = document.getElementById('addMusicBtn');
        this.fileInput = document.getElementById('fileInput');
        this.playlistContainer = document.getElementById('playlistContainer');
        this.albumCoverLarge = document.getElementById('albumCoverLarge');
        this.trackTitleLarge = document.getElementById('trackTitleLarge');
        this.trackArtistLarge = document.getElementById('trackArtistLarge');
        this.audioMetadata = document.getElementById('audioMetadata');
        this.lyricsSection = document.getElementById('lyricsSection');
        this.lyricsContent = document.getElementById('lyricsContent');
        this.dynamicBackground = document.getElementById('dynamicBackground');
        
        this.progressContainer = document.getElementById('progressContainer');
        this.progressBar = document.getElementById('progressBar');
        this.progressHandle = document.getElementById('progressHandle');
        this.currentTime = document.getElementById('currentTime');
        this.totalTime = document.getElementById('totalTime');
        
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.repeatBtn = document.getElementById('repeatBtn');
        
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeBar = document.getElementById('volumeBar');
    }

    attachEventListeners() {
        // File input
        this.addMusicBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Audio events
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleTrackEnd());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());

        // Controls
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.playPrevious());
        this.nextBtn.addEventListener('click', () => this.playNext());
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.repeatBtn.addEventListener('click', () => this.toggleRepeat());

        // Progress bar - smooth seeking
        this.progressContainer.addEventListener('mousedown', (e) => this.startSeeking(e));
        this.progressContainer.addEventListener('mousemove', (e) => this.updateSeekingPreview(e));
        this.progressContainer.addEventListener('mouseleave', () => this.hideSeekingPreview());
        document.addEventListener('mouseup', () => this.stopSeeking());
        document.addEventListener('mousemove', (e) => this.handleSeekingMove(e));

        // Volume control - smooth volume adjustment
        this.volumeSlider.addEventListener('mousedown', (e) => this.startVolumeChange(e));
        this.volumeSlider.addEventListener('mousemove', (e) => this.updateVolumePreview(e));
        document.addEventListener('mouseup', () => this.stopVolumeChange());
        document.addEventListener('mousemove', (e) => this.handleVolumeMove(e));

        // Album cover click to upload
        this.albumCoverLarge.addEventListener('click', () => this.uploadCover());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Start animation loop
        this.startAnimationLoop();
    }

    startAnimationLoop() {
        const animate = () => {
            if (this.isPlaying && !this.isSeeking) {
                this.updateProgressSmooth();
            }
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    updateProgressSmooth() {
        if (this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressBar.style.width = `${progress}%`;
            this.progressHandle.style.left = `${progress}%`;
            this.currentTime.textContent = this.formatTime(this.audio.currentTime);
            this.syncLyrics();
        }
    }

    startSeeking(e) {
        this.isSeeking = true;
        this.seek(e);
    }

    handleSeekingMove(e) {
        if (this.isSeeking) {
            this.seek(e);
        }
    }

    stopSeeking() {
        this.isSeeking = false;
    }

    seek(e) {
        if (!this.audio.duration) return;
        const rect = this.progressContainer.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const progress = x / rect.width;
        const time = progress * this.audio.duration;
        
        this.audio.currentTime = time;
        this.progressBar.style.width = `${progress * 100}%`;
        this.progressHandle.style.left = `${progress * 100}%`;
        this.currentTime.textContent = this.formatTime(time);
    }

    updateSeekingPreview(e) {
        if (this.isSeeking) return;
        const rect = this.progressContainer.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const progress = x / rect.width;
        this.progressHandle.style.left = `${progress * 100}%`;
    }

    hideSeekingPreview() {
        if (!this.isSeeking && this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressHandle.style.left = `${progress}%`;
        }
    }

    startVolumeChange(e) {
        this.isChangingVolume = true;
        this.setVolumeFromEvent(e);
    }

    handleVolumeMove(e) {
        if (this.isChangingVolume) {
            this.setVolumeFromEvent(e);
        }
    }

    stopVolumeChange() {
        this.isChangingVolume = false;
    }

    setVolumeFromEvent(e) {
        const rect = this.volumeSlider.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const volume = x / rect.width;
        
        this.audio.volume = volume;
        this.volumeBar.style.width = `${volume * 100}%`;
        localStorage.setItem('lumison-volume', volume.toString());
    }

    updateVolumePreview(e) {
        if (this.isChangingVolume) return;
        const rect = this.volumeSlider.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const volume = x / rect.width;
        this.volumeBar.style.width = `${volume * 100}%`;
    }

    loadSavedVolume() {
        const savedVolume = localStorage.getItem('lumison-volume');
        if (savedVolume) {
            const volume = parseFloat(savedVolume);
            this.audio.volume = volume;
            this.volumeBar.style.width = `${volume * 100}%`;
        } else {
            this.audio.volume = 0.7;
            this.volumeBar.style.width = '70%';
        }
    }

    async handleFileSelect(event) {
        const files = Array.from(event.target.files);
        
        for (const file of files) {
            if (!file.type.startsWith('audio/')) continue;

            const url = URL.createObjectURL(file);
            const track = {
                title: file.name.replace(/\.[^/.]+$/, ''),
                artist: '未知艺术家',
                album: '未知专辑',
                duration: 0,
                url: url,
                file: file,
                coverUrl: null,
                lyrics: null
            };

            // Extract metadata using jsmediatags
            await this.extractMetadata(file, track);
            
            this.playlist.push(track);
        }

        this.renderPlaylist();
        
        if (this.playlist.length === 1) {
            this.loadTrack(0);
        }

        this.updateControlsState();
        event.target.value = '';
    }

    async extractMetadata(file, track) {
        return new Promise((resolve) => {
            window.jsmediatags.read(file, {
                onSuccess: (tag) => {
                    const tags = tag.tags;
                    
                    // Extract basic info
                    if (tags.title) track.title = tags.title;
                    if (tags.artist) track.artist = tags.artist;
                    if (tags.album) track.album = tags.album;
                    
                    // Extract cover art
                    if (tags.picture) {
                        const picture = tags.picture;
                        const blob = new Blob([new Uint8Array(picture.data)], { type: picture.format });
                        track.coverUrl = URL.createObjectURL(blob);
                    }
                    
                    // Extract lyrics
                    if (tags.lyrics || tags.USLT || tags['unsynchronised lyrics']) {
                        const lyricsText = tags.lyrics || tags.USLT?.lyrics || tags['unsynchronised lyrics'];
                        if (lyricsText) {
                            track.lyrics = this.parseLyrics(lyricsText);
                        }
                    }
                    
                    resolve();
                },
                onError: (error) => {
                    console.log('读取元数据失败:', error);
                    resolve();
                }
            });
        });
    }

    parseLyrics(lyricsText) {
        const lines = lyricsText.split('\n');
        const lyrics = [];
        const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

        for (const line of lines) {
            const match = line.match(timeRegex);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const milliseconds = parseInt(match[3].padEnd(3, '0'));
                const time = minutes * 60 + seconds + milliseconds / 1000;
                const text = line.replace(timeRegex, '').trim();
                
                if (text) {
                    lyrics.push({ time, text });
                }
            }
        }

        return lyrics.sort((a, b) => a.time - b.time);
    }

    renderPlaylist() {
        if (this.playlist.length === 0) {
            this.playlistContainer.innerHTML = `
                <div class="empty-playlist">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.3; margin: 0 auto 16px;">
                        <path d="M9 18V5L21 3V16M9 18C9 19.6569 7.65685 21 6 21C4.34315 21 3 19.6569 3 18C3 16.3431 4.34315 15 6 15C7.65685 15 9 16.3431 9 18ZM21 16C21 17.6569 19.6569 19 18 19C16.3431 19 15 17.6569 15 16C15 14.3431 16.3431 13 18 13C19.6569 13 21 14.3431 21 16ZM9 10L21 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p>暂无音乐</p>
                </div>
            `;
            return;
        }

        this.playlistContainer.innerHTML = this.playlist.map((track, index) => `
            <div class="playlist-item ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
                <div class="playlist-item-cover">
                    ${track.coverUrl 
                        ? `<img src="${track.coverUrl}" alt="封面">`
                        : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18V5L21 3V16M9 18C9 19.6569 7.65685 21 6 21C4.34315 21 3 19.6569 3 18C3 16.3431 4.34315 15 6 15C7.65685 15 9 16.3431 9 18ZM21 16C21 17.6569 19.6569 19 18 19C16.3431 19 15 17.6569 15 16C15 14.3431 16.3431 13 18 13C19.6569 13 21 14.3431 21 16ZM9 10L21 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>`
                    }
                </div>
                <div class="playlist-item-info">
                    <div class="playlist-item-title">${track.title}</div>
                    <div class="playlist-item-duration">${track.duration ? this.formatTime(track.duration) : '--:--'}</div>
                </div>
                <button class="playlist-item-remove" data-index="${index}">×</button>
            </div>
        `).join('');

        // Attach event listeners
        document.querySelectorAll('.playlist-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('playlist-item-remove')) {
                    const index = parseInt(item.dataset.index);
                    this.loadTrack(index);
                    this.play();
                }
            });
        });

        document.querySelectorAll('.playlist-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.removeTrack(index);
            });
        });
    }

    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;

        const track = this.playlist[index];
        this.currentIndex = index;

        this.audio.src = track.url;
        this.trackTitleLarge.textContent = track.title;
        this.trackArtistLarge.textContent = track.artist;
        document.title = `${track.title} - Lumison`;

        // Update cover
        if (track.coverUrl) {
            this.albumCoverLarge.innerHTML = `<img src="${track.coverUrl}" alt="${track.title}">`;
            this.updateDynamicBackground(track.coverUrl);
        } else {
            this.albumCoverLarge.innerHTML = `
                <div class="album-cover-placeholder">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18V5L21 3V16M9 18C9 19.6569 7.65685 21 6 21C4.34315 21 3 19.6569 3 18C3 16.3431 4.34315 15 6 15C7.65685 15 9 16.3431 9 18ZM21 16C21 17.6569 19.6569 19 18 19C16.3431 19 15 17.6569 15 16C15 14.3431 16.3431 13 18 13C19.6569 13 21 14.3431 21 16ZM9 10L21 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <div class="cover-upload-hint">点击上传封面</div>
                </div>
            `;
            this.resetDynamicBackground();
        }

        // Update metadata
        this.updateAudioInfo();

        // Update lyrics
        if (track.lyrics && track.lyrics.length > 0) {
            this.currentLyrics = track.lyrics;
            this.renderLyrics();
            this.lyricsSection.style.display = 'block';
        } else {
            this.lyricsSection.style.display = 'none';
            this.currentLyrics = [];
        }

        this.renderPlaylist();
    }

    updateDynamicBackground(coverUrl) {
        // Fade out current background
        this.dynamicBackground.style.opacity = '0';
        
        setTimeout(() => {
            this.dynamicBackground.style.backgroundImage = `url(${coverUrl})`;
            this.dynamicBackground.classList.add('active');
            // Fade in new background
            setTimeout(() => {
                this.dynamicBackground.style.opacity = '1';
            }, 50);
        }, 500);
    }

    resetDynamicBackground() {
        this.dynamicBackground.style.opacity = '0';
        setTimeout(() => {
            this.dynamicBackground.classList.remove('active');
            this.dynamicBackground.style.backgroundImage = '';
        }, 500);
    }

    updateAudioInfo() {
        const track = this.playlist[this.currentIndex];
        if (!track) return;

        this.audioMetadata.innerHTML = `
            <div class="metadata-item">
                <span class="metadata-label">标题</span>
                <span class="metadata-value">${track.title}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">艺术家</span>
                <span class="metadata-value">${track.artist}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">专辑</span>
                <span class="metadata-value">${track.album}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">时长</span>
                <span class="metadata-value">${track.duration ? this.formatTime(track.duration) : '--:--'}</span>
            </div>
        `;
    }

    renderLyrics() {
        if (!this.currentLyrics || this.currentLyrics.length === 0) return;

        this.lyricsContent.innerHTML = this.currentLyrics.map((lyric, index) => 
            `<div class="lyric-line" data-time="${lyric.time}" data-index="${index}">${lyric.text}</div>`
        ).join('');
    }

    syncLyrics() {
        if (!this.currentLyrics || this.currentLyrics.length === 0) return;

        const currentTime = this.audio.currentTime;
        let activeIndex = -1;

        for (let i = 0; i < this.currentLyrics.length; i++) {
            if (currentTime >= this.currentLyrics[i].time) {
                activeIndex = i;
            } else {
                break;
            }
        }

        const lyricLines = this.lyricsContent.querySelectorAll('.lyric-line');
        lyricLines.forEach((line, index) => {
            if (index === activeIndex) {
                line.classList.add('active');
                // Smooth scroll to active lyric
                line.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                line.classList.remove('active');
            }
        });
    }

    uploadCover() {
        if (this.playlist.length === 0) return;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                const track = this.playlist[this.currentIndex];
                
                if (track.coverUrl) {
                    URL.revokeObjectURL(track.coverUrl);
                }
                
                track.coverUrl = url;
                this.albumCoverLarge.innerHTML = `<img src="${url}" alt="${track.title}">`;
                this.updateDynamicBackground(url);
                this.renderPlaylist();
            }
        };
        input.click();
    }

    handleKeyboard(event) {
        if (event.target.tagName === 'INPUT') return;

        switch(event.code) {
            case 'Space':
                event.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.audio.currentTime = Math.max(this.audio.currentTime - 10, 0);
                break;
            case 'ArrowRight':
                event.preventDefault();
                if (this.audio.duration) {
                    this.audio.currentTime = Math.min(this.audio.currentTime + 10, this.audio.duration);
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                const newVolumeUp = Math.min(this.audio.volume + 0.1, 1);
                this.audio.volume = newVolumeUp;
                this.volumeBar.style.width = `${newVolumeUp * 100}%`;
                localStorage.setItem('lumison-volume', newVolumeUp.toString());
                break;
            case 'ArrowDown':
                event.preventDefault();
                const newVolumeDown = Math.max(this.audio.volume - 0.1, 0);
                this.audio.volume = newVolumeDown;
                this.volumeBar.style.width = `${newVolumeDown * 100}%`;
                localStorage.setItem('lumison-volume', newVolumeDown.toString());
                break;
            case 'KeyN':
                this.playNext();
                break;
            case 'KeyP':
                this.playPrevious();
                break;
            case 'KeyS':
                this.toggleShuffle();
                break;
            case 'KeyR':
                this.toggleRepeat();
                break;
        }
    }

    togglePlay() {
        if (this.playlist.length === 0) return;
        
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => console.error('播放失败:', error));
        }
    }

    pause() {
        this.audio.pause();
    }

    playPrevious() {
        if (this.playlist.length === 0) return;
        
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }
        
        let newIndex = this.currentIndex - 1;
        if (newIndex < 0) {
            newIndex = this.playlist.length - 1;
        }
        
        this.loadTrack(newIndex);
        if (this.isPlaying) {
            this.play();
        }
    }

    playNext() {
        if (this.playlist.length === 0) return;
        
        let newIndex;
        if (this.isShuffle) {
            do {
                newIndex = Math.floor(Math.random() * this.playlist.length);
            } while (newIndex === this.currentIndex && this.playlist.length > 1);
        } else {
            newIndex = this.currentIndex + 1;
            if (newIndex >= this.playlist.length) {
                newIndex = 0;
            }
        }
        
        this.loadTrack(newIndex);
        if (this.isPlaying) {
            this.play();
        }
    }

    handleTrackEnd() {
        if (this.isRepeat) {
            this.audio.currentTime = 0;
            this.play();
        } else if (this.currentIndex < this.playlist.length - 1 || this.isShuffle) {
            this.playNext();
        } else {
            this.onPause();
        }
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        this.shuffleBtn.classList.toggle('active', this.isShuffle);
    }

    toggleRepeat() {
        this.isRepeat = !this.isRepeat;
        this.repeatBtn.classList.toggle('active', this.isRepeat);
    }

    updateProgress() {
        // This is called by the audio element, but we use requestAnimationFrame for smooth updates
    }

    updateDuration() {
        if (this.audio.duration && !isNaN(this.audio.duration)) {
            this.totalTime.textContent = this.formatTime(this.audio.duration);
            
            if (this.playlist[this.currentIndex]) {
                this.playlist[this.currentIndex].duration = this.audio.duration;
                this.renderPlaylist();
                this.updateAudioInfo();
            }
        }
    }

    removeTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        const wasPlaying = (index === this.currentIndex && this.isPlaying);
        
        URL.revokeObjectURL(this.playlist[index].url);
        if (this.playlist[index].coverUrl) {
            URL.revokeObjectURL(this.playlist[index].coverUrl);
        }
        this.playlist.splice(index, 1);
        
        if (this.playlist.length === 0) {
            this.audio.src = '';
            this.trackTitleLarge.textContent = '未选择音乐';
            this.trackArtistLarge.textContent = '请添加音乐文件';
            this.audioMetadata.innerHTML = '';
            this.lyricsSection.style.display = 'none';
            this.albumCoverLarge.innerHTML = `
                <div class="album-cover-placeholder">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18V5L21 3V16M9 18C9 19.6569 7.65685 21 6 21C4.34315 21 3 19.6569 3 18C3 16.3431 4.34315 15 6 15C7.65685 15 9 16.3431 9 18ZM21 16C21 17.6569 19.6569 19 18 19C16.3431 19 15 17.6569 15 16C15 14.3431 16.3431 13 18 13C19.6569 13 21 14.3431 21 16ZM9 10L21 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <div class="cover-upload-hint">点击上传封面</div>
                </div>
            `;
            this.resetDynamicBackground();
            this.currentIndex = 0;
            this.onPause();
            document.title = 'Lumison - 本地音乐播放器';
        } else {
            if (index < this.currentIndex) {
                this.currentIndex--;
            } else if (index === this.currentIndex) {
                if (this.currentIndex >= this.playlist.length) {
                    this.currentIndex = this.playlist.length - 1;
                }
                this.loadTrack(this.currentIndex);
                if (wasPlaying) {
                    this.play();
                }
            }
        }
        
        this.renderPlaylist();
        this.updateControlsState();
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    updateControlsState() {
        const hasPlaylist = this.playlist.length > 0;
        this.playBtn.disabled = !hasPlaylist;
        this.prevBtn.disabled = !hasPlaylist;
        this.nextBtn.disabled = !hasPlaylist;
    }

    onPlay() {
        this.isPlaying = true;
        const playIcon = this.playBtn.querySelector('.play-icon');
        const pauseIcon = this.playBtn.querySelector('.pause-icon');
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = 'block';
    }

    onPause() {
        this.isPlaying = false;
        const playIcon = this.playBtn.querySelector('.play-icon');
        const pauseIcon = this.playBtn.querySelector('.pause-icon');
        if (playIcon) playIcon.style.display = 'block';
        if (pauseIcon) pauseIcon.style.display = 'none';
    }
}

// Initialize player
const player = new MusicPlayer();

// Console welcome message
console.log('%c🎵 Lumison 音乐播放器', 'font-size: 20px; font-weight: bold; color: #667eea;');
console.log('%c已就绪！', 'font-size: 14px; color: #764ba2;');
console.log('\n%c⌨️  键盘快捷键:', 'font-weight: bold;');
console.log('   空格键: 播放/暂停');
console.log('   ← →: 快退/快进 10秒');
console.log('   ↑ ↓: 增加/减少音量');
console.log('   N: 下一首');
console.log('   P: 上一首');
console.log('   S: 切换随机播放');
console.log('   R: 切换循环播放');
