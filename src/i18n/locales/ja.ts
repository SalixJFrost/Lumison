export default {
  // 共通
  common: {
    confirm: "確認",
    cancel: "キャンセル",
    close: "閉じる",
    save: "保存",
    delete: "削除",
    edit: "編集",
    search: "検索",
    loading: "読み込み中...",
    error: "エラー",
    success: "成功",
    done: "完了",
  },

  // アバウトダイアログ
  about: {
    description: "高忠実度で没入型の音楽プレーヤー",
    inspiredBy: "Apple Musicにインスパイアされました。",
    viewOnGitHub: "GitHubで見る",
    createdBy: "SalixJFrost 作成",
  },

  // オーディオエフェクト
  audioEffect: {
    none: "なし",
    noEffect: "エフェクトなし",
    reverb: "リバーブ",
    reverbEffect: "リバーブエフェクト",
    echo: "エコー",
    echoEffect: "エコーエフェクト",
    bass: "ベース",
    bassBoost: "ベースブースト",
    off: "オフ",
  },

  // 空間オーディオ
  spatialAudio: {
    title: "3D 空間オーディオ",
    subtitle: "シネマスタイルの没入感",
    on: "オン",
    off: "オフ",
    active: "アクティブ",
    inactive: "非アクティブ",
    presets: "プリセット",
    music: "音楽",
    cinema: "シネマ",
    vocal: "ボーカル",
    advanced: "詳細設定",
    equalizer: "5バンドイコライザー",
    spatial: "空間パラメータ",
    sub: "サブ",
    bass: "ベース",
    mid: "ミッド",
    highMid: "ハイミッド",
    treble: "トレブル",
    width: "幅",
    depth: "深さ",
    height: "高さ",
    roomSize: "ルームサイズ",
    distance: "距離",
    disclaimer: "⚠️ これは本物のDolby Atmosではありません。ヘッドフォンでの没入型リスニングのためのシミュレートされた空間強化システムです。",
  },

  // プレーヤーコントロール
  player: {
    play: "再生",
    pause: "一時停止",
    next: "次へ",
    previous: "前へ",
    shuffle: "シャッフル",
    repeat: "リピート",
    repeatOne: "1曲リピート",
    volume: "音量",
    speed: "速度",
    settings: "設定",
    queue: "キュー",
    lyrics: "歌詞",
    noMusicLoaded: "音楽が読み込まれていません",
    welcomeTitle: "Lumisonへようこそ",
    selectSong: "曲を選択",
  },

  // 速度設定
  speed: {
    title: "再生速度",
    slow: "遅い",
    normal: "標準",
    fast: "速い",
    veryFast: "とても速い",
    ultraFast: "超高速",
    digital: "デジタル",
    vinyl: "ビニール",
    preservePitch: "ピッチ保持",
    vinylMode: "ビニールモード",
    presets: "クイックプリセット",
  },

  // プレイリスト
  playlist: {
    title: "プレイリスト",
    playingNext: "次に再生",
    songs: "曲",
    empty: "キューが空です",
    addSongs: "曲を追加して開始",
    importUrl: "URLからインポート",
    importLocal: "ローカルファイルをインポート",
    remove: "削除",
    clear: "すべてクリア",
    songCount: "{count} 曲",
    selectAll: "すべて選択",
    deleteSelected: "選択項目を削除",
    done: "完了",
    addFromUrl: "URLから追加",
    editList: "リストを編集",
  },

  // 検索
  search: {
    title: "音楽を検索",
    placeholder: "曲、アーティスト、アルバムを検索...",
    noResults: "結果が見つかりません",
    searching: "検索中...",
    netease: "Netease Music",
    bilibili: "Bilibili",
    queue: "現在のキュー",
    playNow: "今すぐ再生",
    addToQueue: "キューに追加",
  },

  // 歌词
  lyrics: {
    noLyrics: "歌詞がありません",
    loading: "歌詞を読み込み中...",
    failed: "歌詞の読み込みに失敗しました",
    importLyrics: "歌詞ファイルをインポート",
    fontSize: "フォントサイズ",
    effects: "歌詞エフェクト",
    gradient: "グラデーション",
    glow: "グロー",
    shadow: "シャドウ",
  },

  // キーボードショートカット
  shortcuts: {
    title: "キーボードショートカット",
    subtitle: "再生の素早い操作",
    playPause: "再生 / 一時停止",
    loopMode: "ループモード",
    seek: "シーク ±5秒",
    prevNext: "前へ / 次へ",
    volumeControl: "音量調整",
    speedControl: "速度 ±0.25x",
    speedPreset: "速度プリセット",
    resetSpeed: "速度リセット (1x)",
    volumeDialog: "音量ダイアログ",
    speedDialog: "速度ダイアログ",
    searchDialog: "検索",
    togglePlaylist: "プレイリスト切替",
    toggleShortcuts: "ショートカット切替",
    closeHint: "閉じる",
    pressEsc: "押す",
  },

  // インポートダイアログ
  import: {
    title: "音楽をインポート",
    description: "貼り付け",
    netease: "Netease Cloud Music",
    or: "または",
    internetArchive: "Internet Archive",
    directAudio: "直接オーディオURL",
    linkToAdd: "リンクをキューに追加します。",
    placeholder: "https://music.163.com/... または https://archive.org/details/... または直接オーディオURL",
    cancel: "キャンセル",
    import: "インポート",
    importing: "インポート中...",
  },
  toast: {
    importSuccess: "{count} 曲を正常にインポートしました",
    importFailed: "URLから曲を読み込めませんでした",
    fileImportSuccess: "ファイルを正常にインポートしました",
    lyricsLoaded: "歌詞を読み込みました",
    lyricsFailed: "歌詞の読み込みに失敗しました",
    speedChanged: "速度を {speed}x に変更しました",
  },

  // トップバー
  topBar: {
    import: "インポート",
    search: "検索",
    settings: "設定",
    theme: "テーマ",
    language: "言語",
    about: "について",
    enterFullscreen: "フルスクリーン",
    exitFullscreen: "フルスクリーン終了",
  },

  // テーマ
  theme: {
    light: "ライト",
    dark: "ダーク",
    auto: "自動",
  },
};
