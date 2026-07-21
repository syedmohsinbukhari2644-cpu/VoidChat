import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, SafeAreaView, Alert, Modal,
  Image, TextInput, BackHandler, Platform, useWindowDimensions, Share
} from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
const NavigationBar = Platform.OS === 'android' ? require('expo-navigation-bar') : { setVisibilityAsync: async () => {}, setBehaviorAsync: async () => {} }
import LoginScreen from './login'
import ReelsScreen from './Screens/ReelsScreen'
import ChatScreen from './Screens/screen'
import NotificationsScreen from './Screens/NotificationsScreen'
import ReferScreen from './Screens/ReferScreen'
import Icon from '../components/Icon'
import * as Contacts from 'expo-contacts'
import * as ImagePicker from 'expo-image-picker'
import { setToken, loadSavedToken, getFeed, getBalance, dailyLogin, likePost, createPost, getMyCode, blockUser, getMe, getUsers, sendMessage, buyPremium, createGroup, joinGroup, addGroupMember, updatePreferences, commentPost, savePost } from './api'

export default function App() {
  const { width: windowWidth } = useWindowDimensions()
  const isLargeScreen = windowWidth >= 768
  const insets = useSafeAreaInsets()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [activeTab, setActiveTab] = useState('feed')
  const [chatInboxTab, setChatInboxTab] = useState('chats')

  // ── Navigation Bar Immersive Mode ──
  useEffect(() => {
    if (Platform.OS === 'android') {
      const hideNavigationBar = async () => {
        try {
          await NavigationBar.setVisibilityAsync('hidden')
          await NavigationBar.setBehaviorAsync('overlay-swipe')
        } catch (e) {
          console.warn('Navigation Bar Hide Error: ', e)
        }
      }
      hideNavigationBar()
    }
  }, [])

  // ── Tab Persistence ──
  useEffect(() => {
    const loadPersistedTab = async () => {
      try {
        const savedTab = await AsyncStorage.getItem('active_tab')
        if (savedTab) {
          setActiveTab(savedTab)
        }
      } catch (e) {}
    }
    loadPersistedTab()
  }, [])

  useEffect(() => {
    const saveTab = async () => {
      try {
        await AsyncStorage.setItem('active_tab', activeTab)
      } catch (e) {}
    }
    saveTab()
  }, [activeTab])

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await loadSavedToken()
        if (token) {
          setIsLoggedIn(true)
        }
      } catch (e) {
      } finally {
        setLoadingAuth(false)
      }
    }
    checkToken()
  }, [])
  const [posts, setPosts] = useState([])
  const [VOIDBalance, setVOIDBalance] = useState(0)
  const [pkrValue, setPkrValue] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showWallet, setShowWallet] = useState(false)
  const [showStarredModal, setShowStarredModal] = useState(false)
  const [showChatOptionsMenu, setShowChatOptionsMenu] = useState(false)

  // Contacts Sync states
  const [showContactsSyncModal, setShowContactsSyncModal] = useState(false)
  const [matchedContacts, setMatchedContacts] = useState([])
  const [syncingContacts, setSyncingContacts] = useState(false)

  // Status/Story states
  const [mockStatuses, setMockStatuses] = useState([
    { id: '1', name: 'Ali Bhai', avatar: 'A', time: '10 mins ago', content: '🔥 Just earned +500 VOID streak bonus! speak write live!', color: '#10b981' },
    { id: '2', name: 'Anonymous_42', avatar: '🕵️', time: '2 hours ago', content: '🔓 Encrypted routing updated. Stay safe.', color: '#6366f1' },
    { id: '3', name: 'Inklab Admin', avatar: 'I', time: '5 hours ago', content: '🎙️ Join our community debate at 8 PM tonight!', color: '#ff4d4d' },
  ])
  const [newStatusText, setNewStatusText] = useState('')
  const [showCreateStatusModal, setShowCreateStatusModal] = useState(false)
  const [statusType, setStatusType] = useState('text') // 'text' | 'media' | 'link' | 'audio'
  const [statusMediaUri, setStatusMediaUri] = useState(null)
  const [statusLinkUrl, setStatusLinkUrl] = useState('')
  const [statusBgColor, setStatusBgColor] = useState('#6366f1') // Default Indigo
  const [starredMessages, setStarredMessages] = useState([])
  const [postContent, setPostContent] = useState('')
  const [postType, setPostType] = useState('text')
  const [mediaUrl, setMediaUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [referCode, setReferCode] = useState('')
  const [posting, setPosting] = useState(false)

  // Comments and Saves states
  const [savedPostIds, setSavedPostIds] = useState([])
  const [showCommentsModal, setShowCommentsModal] = useState(false)
  const [activeCommentsPost, setActiveCommentsPost] = useState(null)
  const [newCommentText, setNewCommentText] = useState('')
  const [commenting, setCommenting] = useState(false)

  // Smart URL preview states
  const [urlPreview, setUrlPreview] = useState(null) // { title, description, image, url }
  const [fetchingPreview, setFetchingPreview] = useState(false)

  // App Mode & Blocking States
  const [appMode, setAppMode] = useState('social')
  const [currentUserBlockedList, setCurrentUserBlockedList] = useState([])
  const [selectedUserProfile, setSelectedUserProfile] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [showAccountModal, setShowAccountModal] = useState(false)

  // ── Chat Settings States ──
  const [showChatSettings, setShowChatSettings] = useState(false)
  const [messageTextSize, setMessageTextSize] = useState(15)
  const [chatWallpaper, setChatWallpaper] = useState('classic_dark')
  const [nameColor, setNameColor] = useState('#c8ff00')
  const [themeColor, setThemeColor] = useState('#c8ff00')
  const [isDayMode, setIsDayMode] = useState(false)
  const [useInAppBrowser, setUseInAppBrowser] = useState(true)
  const [appIconPreset, setAppIconPreset] = useState('default')

  // ── Notification Settings States ──
  const [showNotifSettings, setShowNotifSettings] = useState(false)
  const [notifMessageShow, setNotifMessageShow] = useState(true)
  const [notifMessageSound, setNotifMessageSound] = useState(true)
  const [notifMessageVibrate, setNotifMessageVibrate] = useState(true)
  const [notifGroupShow, setNotifGroupShow] = useState(true)
  const [notifGroupSound, setNotifGroupSound] = useState(true)
  const [notifGroupVibrate, setNotifGroupVibrate] = useState(true)
  const [notifCallRingtone, setNotifCallRingtone] = useState(true)
  const [notifCallVibrate, setNotifCallVibrate] = useState(true)
  const [notifInAppSounds, setNotifInAppSounds] = useState(true)
  const [notifInAppVibrate, setNotifInAppVibrate] = useState(true)
  const [notifInAppPreviews, setNotifInAppPreviews] = useState(true)

  // ── Privacy & Security States ──
  const [showPrivacySettings, setShowPrivacySettings] = useState(false)
  const [twoStepEnabled, setTwoStepEnabled] = useState(false)
  const [twoStepPin, setTwoStepPin] = useState('')
  const [autoDeleteTimer, setAutoDeleteTimer] = useState('off') // off, 24h, 7d, 30d
  const [passcodeEnabled, setPasscodeEnabled] = useState(false)
  const [passcodePin, setPasscodePin] = useState('')
  const [passkeyEnabled, setPasskeyEnabled] = useState(false)
  const [inboxSearchQuery, setInboxSearchQuery] = useState('')
  const [socialSearchQuery, setSocialSearchQuery] = useState('')
  const [activeDevices, setActiveDevices] = useState([
    { id: '1', name: 'Windows 11 PC (Chrome)', location: 'Karachi, PK', status: 'Active Now' },
    { id: '2', name: 'iPhone 15 Pro Max', location: 'Islamabad, PK', status: 'Last active 2 hrs ago' },
    { id: '3', name: 'Samsung Galaxy S24', location: 'Lahore, PK', status: 'Last active 1 day ago' },
  ])

  // ── Data & Storage States ──
  const [showDataStorage, setShowDataStorage] = useState(false)
  const [storageCacheSize, setStorageCacheSize] = useState('240.5 MB')
  const [networkSent, setNetworkSent] = useState('1.2 GB')
  const [networkReceived, setNetworkReceived] = useState('4.5 GB')
  const [autoDownloadWifi, setAutoDownloadWifi] = useState(true)
  const [autoDownloadMobile, setAutoDownloadMobile] = useState(false)
  const [mediaQuality, setMediaQuality] = useState('standard') // compressed, standard, source
  const [useProxy, setUseProxy] = useState(false)
  const [proxyServer, setProxyServer] = useState('proxy.voidchat.private')
  const [proxyPort, setProxyPort] = useState('1080')

  // ── Chat Folder (Secret Vault) States ──
  const [showChatFolder, setShowChatFolder] = useState(false)
  const [secretChatIds, setSecretChatIds] = useState([]) // Array of chat IDs in secret folder
  const [secretFolderPin, setSecretFolderPin] = useState('') // PIN to unlock (empty means not set)
  const [useBiometricsForFolder, setUseBiometricsForFolder] = useState(false)
  const [isFolderUnlocked, setIsFolderUnlocked] = useState(false)
  const [showFolderAuthModal, setShowFolderAuthModal] = useState(false)
  const [folderAuthPinInput, setFolderAuthPinInput] = useState('')
  const [folderAuthAction, setFolderAuthAction] = useState(null) // 'open_folder' or 'manage_folder'
  const [tempPinSetup, setTempPinSetup] = useState('')
  const [pinSetupStep, setPinSetupStep] = useState(0) // 0: inactive, 1: enter pin, 2: confirm pin
  const [authError, setAuthError] = useState('')
  const [isBioScanning, setIsBioScanning] = useState(false)
  const [showSecretFolderChats, setShowSecretFolderChats] = useState(false)

  // ── New Settings States ──
  const [showDevicesModal, setShowDevicesModal] = useState(false)
  const [showPowerSavingModal, setShowPowerSavingModal] = useState(false)
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('English')

  // ── Power Saving Preferences ──
  const [powerSaveMode, setPowerSaveMode] = useState('smart') // smart, always, disabled
  const [autoPlayGifs, setAutoPlayGifs] = useState(true)
  const [autoPlayVideos, setAutoPlayVideos] = useState(false)
  const [disableAnimations, setDisableAnimations] = useState(false)
  const [lowDataMode, setLowDataMode] = useState(false)

  // ── VOID Premium States ──
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [isPremiumUser, setIsPremiumUser] = useState(false)
  const [showPremiumQR, setShowPremiumQR] = useState(false)

  // ── Group Creation States ──
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [newGroupIsPaid, setNewGroupIsPaid] = useState(false)
  const [newGroupMonthlyFee, setNewGroupMonthlyFee] = useState('0')
  const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false)
  const [selectedGroupUsers, setSelectedGroupUsers] = useState([]) // array of contact IDs

  // ── Status Privacy & Lifespan States ──
  const [showStatusPrivacyModal, setShowStatusPrivacyModal] = useState(false)
  const [statusPrivacyOption, setStatusPrivacyOption] = useState('contacts') // 'contacts' | 'except' | 'only'
  const [statusPrivacySelectedUsers, setStatusPrivacySelectedUsers] = useState([])

  // ── Chat Lists (state so updates propagate) ──
  const [chatModeChats, setChatModeChats] = useState([
    { id: '4', name: 'Ali Bhai', color: '#10b981', unread: 1, streak: 8, phoneNumber: '+92 312 9876543' },
  ])
  const [socialModeChats, setSocialModeChats] = useState([
    { id: '2', name: 'Inklab Group', color: '#ff4d4d', unread: 12, streak: 0 },
    { id: '3', name: 'Anonymous_42', color: '#6366f1', unread: 0, streak: 23 },
  ])

  // ── Translation Dictionary ──
  const T = {
    English: {
      chats: 'CHATS',
      contacts: 'CONTACTS',
      settings: 'Settings',
      feed: 'Feed',
      reels: 'Reels',
      inbox: 'Inbox',
      refer: 'Refer & Earn',
      profile: 'Profile',
      vault: 'Secret Vault',
      locked: 'Locked 🔒',
      encrypted: '🔐 Encrypted chat',
      devices: 'Devices',
      powerSaving: 'Power Saving',
      language: 'Language',
      premium: 'VOID Premium',
      account: 'Account',
      chatSetting: 'Chat setting',
      privacySecurity: 'Privacy & security',
      notifications: 'Notifications',
      dataStorage: 'Data and storage',
      voidCoins: 'Void coins',
      vaultDescription: 'Secure folder for personal chats',
      logout: 'Logout',
    },
    Urdu: {
      chats: 'چیٹس',
      contacts: 'رابطے',
      settings: 'سیٹنگز',
      feed: 'فیڈ',
      reels: 'ریلز',
      inbox: 'ان باکس',
      refer: 'ریفر اور کمائیں',
      profile: 'پروفائل',
      vault: 'خفیہ والٹ',
      locked: 'مقفل 🔒',
      encrypted: '🔐 محفوظ شدہ چیٹ',
      devices: 'آلات',
      powerSaving: 'بجلی کی بچت',
      language: 'زبان',
      premium: 'ووائڈ پریمیم',
      account: 'اکاؤنٹ',
      chatSetting: 'چیٹ سیٹنگز',
      privacySecurity: 'رازداری اور سیکیورٹی',
      notifications: 'اطلاعات',
      dataStorage: 'ڈیٹا اور اسٹوریج',
      voidCoins: 'ووائڈ کوائنز',
      vaultDescription: 'ذاتی چیٹس کے لیے محفوظ فولڈر',
      logout: 'لاگ آؤٹ',
    },
    Hindi: {
      chats: 'चैट्स',
      contacts: 'संपर्क',
      settings: 'सेटिंग्स',
      feed: 'फ़ीड',
      reels: 'रील्स',
      inbox: 'इनबॉक्स',
      refer: 'रेफ़र और कमाएँ',
      profile: 'प्रोफ़ाइल',
      vault: 'गुप्त वॉल्ट',
      locked: 'लॉक 🔒',
      encrypted: '🔐 एन्क्रिप्टेड चैट',
      devices: 'उपकरण',
      powerSaving: 'पावर सेविंग',
      language: 'भाषा',
      premium: 'वॉइड प्रीमियम',
      account: 'खाता',
      chatSetting: 'चैट सेटिंग्स',
      privacySecurity: 'गोपनीयता और सुरक्षा',
      notifications: 'नोटिफिकेशन्स',
      dataStorage: 'डेटा और स्टोरेज',
      voidCoins: 'वॉइड कॉइन्स',
      vaultDescription: 'व्यक्तिगत चैट के लिए सुरक्षित फ़ोल्डर',
      logout: 'लॉग आउट',
    },
    Spanish: {
      chats: 'CHATS',
      contacts: 'CONTACTOS',
      settings: 'Ajustes',
      feed: 'Novedades',
      reels: 'Reels',
      inbox: 'Bandeja',
      refer: 'Recomendar',
      profile: 'Perfil',
      vault: 'Bóveda Secreta',
      locked: 'Cerrado 🔒',
      encrypted: '🔐 Chat encriptado',
      devices: 'Dispositivos',
      powerSaving: 'Ahorro de batería',
      language: 'Idioma',
      premium: 'VOID Premium',
      account: 'Cuenta',
      chatSetting: 'Ajustes de chat',
      privacySecurity: 'Privacidad y seguridad',
      notifications: 'Notificaciones',
      dataStorage: 'Datos y almacenamiento',
      voidCoins: 'Monedas VOID',
      vaultDescription: 'Carpeta segura para chats privados',
      logout: 'Cerrar sesión',
    },
    Arabic: {
      chats: 'الدردشات',
      contacts: 'جهات الاتصال',
      settings: 'الإعدادات',
      feed: 'المنشورات',
      reels: 'المقاطع',
      inbox: 'الرسائل',
      refer: 'شارك واربح',
      profile: 'الملف الشخصي',
      vault: 'القبو السري',
      locked: 'مقفل 🔒',
      encrypted: '🔐 دردشة مشفرة',
      devices: 'الأجهزة',
      powerSaving: 'توفير الطاقة',
      language: 'اللغة',
      premium: 'وويد بريميوم',
      account: 'الحساب',
      chatSetting: 'إعدادات الدردشة',
      privacySecurity: 'الخصوصية والأمان',
      notifications: 'الإشعارات',
      dataStorage: 'البيانات والتخزين',
      voidCoins: 'عملات وويد',
      vaultDescription: 'مجلد آمن للدردشات الشخصية',
      logout: 'تسجيل الخروج',
    },
    French: {
      chats: 'DISCUSSIONS',
      contacts: 'CONTACTS',
      settings: 'Paramètres',
      feed: 'Flux',
      reels: 'Reels',
      inbox: 'Boîte',
      refer: 'Parrainer',
      profile: 'Profil',
      vault: 'Coffre Secret',
      locked: 'Verrouillé 🔒',
      encrypted: '🔐 Chat chiffré',
      devices: 'Appareils',
      powerSaving: 'Économie d\'énergie',
      language: 'Langue',
      premium: 'VOID Premium',
      account: 'Compte',
      chatSetting: 'Paramètres du chat',
      privacySecurity: 'Confidentialité et sécurité',
      notifications: 'Notifications',
      dataStorage: 'Données et stockage',
      voidCoins: 'Pièces VOID',
      vaultDescription: 'Dossier sécurisé pour chats privés',
      logout: 'Déconnexion',
    },
    German: {
      chats: 'CHATS',
      contacts: 'KONTAKTE',
      settings: 'Einstellungen',
      feed: 'Feed',
      reels: 'Reels',
      inbox: 'Postfach',
      refer: 'Werben & Verdienen',
      profile: 'Profil',
      vault: 'Tresor',
      locked: 'Gesperrt 🔒',
      encrypted: '🔐 Verschlüsselter Chat',
      devices: 'Geräte',
      powerSaving: 'Energiesparmodus',
      language: 'Sprache',
      premium: 'VOID Premium',
      account: 'Konto',
      chatSetting: 'Chat-Einstellungen',
      privacySecurity: 'Datenschutz & Sicherheit',
      notifications: 'Benachrichtigungen',
      dataStorage: 'Daten & Speicher',
      voidCoins: 'VOID Münzen',
      vaultDescription: 'Sicherer Ordner für private Chats',
      logout: 'Abmelden',
    },
    Russian: {
      chats: 'ЧАТЫ',
      contacts: 'КОНТАКТЫ',
      settings: 'Настройки',
      feed: 'Лента',
      reels: 'Рилс',
      inbox: 'Входящие',
      refer: 'Рефералы',
      profile: 'Профиль',
      vault: 'Секретный сейф',
      locked: 'Заблокировано 🔒',
      encrypted: '🔐 Зашифрованный чат',
      devices: 'Устройства',
      powerSaving: 'Энергосбережение',
      language: 'Язык',
      premium: 'VOID Premium',
      account: 'Аккаунт',
      chatSetting: 'Настройки чата',
      privacySecurity: 'Конфиденциальность',
      notifications: 'Уведомления',
      dataStorage: 'Данные и хранилище',
      voidCoins: 'Монеты VOID',
      vaultDescription: 'Секретная папка для личных чатов',
      logout: 'Выйти',
    },
    Chinese: {
      chats: '聊天',
      contacts: '联系人',
      settings: '设置',
      feed: '动态',
      reels: '视频',
      inbox: '收件箱',
      refer: '推荐有礼',
      profile: '个人资料',
      vault: '加密金库',
      locked: '已锁定 🔒',
      encrypted: '🔐 加密聊天',
      devices: '设备管理',
      powerSaving: '省电模式',
      language: '语言设置',
      premium: 'VOID 会员',
      account: '账号设置',
      chatSetting: '聊天设置',
      privacySecurity: '隐私与安全',
      notifications: '通知设置',
      dataStorage: '数据与存储',
      voidCoins: 'VOID 代币',
      vaultDescription: '私人聊天的安全文件夹',
      logout: '退出登录',
    },
    Japanese: {
      chats: 'チャット',
      contacts: '連絡先',
      settings: '設定',
      feed: 'フィード',
      reels: 'リール',
      inbox: '受信トレイ',
      refer: '紹介コード',
      profile: 'プロフィール',
      vault: '秘密の金庫',
      locked: 'ロック中 🔒',
      encrypted: '🔐 暗号化チャット',
      devices: '接続デバイス',
      powerSaving: '省電力モード',
      language: '言語',
      premium: 'VOID プレミアム',
      account: 'アカウント',
      chatSetting: 'チャット設定',
      privacySecurity: 'プライバシーとセキュリティ',
      notifications: '通知',
      dataStorage: 'データとストレージ',
      voidCoins: 'VOID コイン',
      vaultDescription: 'プライベートチャット用安全フォルダ',
      logout: 'ログアウト',
    },
  }

  const t = (key) => {
    const lang = T[currentLanguage] || T.English
    return lang[key] || T.English[key] || key
  }

  // Account form fields states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [bioText, setBioText] = useState('')
  const [usernameText, setUsernameText] = useState('')
  const [birthdayText, setBirthdayText] = useState('')

  // ── Separate Profiles for Chat and Social Mode ──
  const [chatUsername, setChatUsername] = useState('chat_user')
  const [chatAvatar, setChatAvatar] = useState('💬')
  const [chatBio, setChatBio] = useState('Secure chat profile 🔐')

  const [socialUsername, setSocialUsername] = useState('social_user')
  const [socialAvatar, setSocialAvatar] = useState('🌐')
  const [socialBio, setSocialBio] = useState('Social life on VOID 🌟')

  const [tempAvatar, setTempAvatar] = useState('')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  const handleOpenAccountSettings = () => {
    if (appMode === 'chat') {
      setUsernameText(chatUsername)
      setBioText(chatBio)
      setTempAvatar(chatAvatar)
    } else {
      setUsernameText(socialUsername)
      setBioText(socialBio)
      setTempAvatar(socialAvatar)
    }
    setShowAccountModal(true)
  }

  // Streak States
  const [showStreak, setShowStreak] = useState(false)
  const [users, setUsers] = useState([])

  // ── Fetch Registered Users for Global Discovery ──
  useEffect(() => {
    const fetchGlobalUsers = async () => {
      try {
        const res = await getUsers()
        if (res.data && res.data.users) {
          setUsers(res.data.users)
        }
      } catch (e) {}
    }
    fetchGlobalUsers()
  }, [])

  useEffect(() => {
    if (inboxSearchQuery.trim().length > 0) {
      getUsers().then(res => {
        if (res.data && res.data.users) {
          setUsers(res.data.users)
        }
      }).catch(() => {})
    }
  }, [inboxSearchQuery])
  const [selectedStreakUsers, setSelectedStreakUsers] = useState([])
  const [streakContent, setStreakContent] = useState('🔥 Streak!')
  const [streakType, setStreakType] = useState('text') // text or image
  const [streakImage, setStreakImage] = useState('')
  const [sendingStreak, setSendingStreak] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // ── Dynamic Theme & Styling Objects ──
  const theme = {
    bg: isDayMode ? '#f4f4f5' : '#060608',
    cardBg: isDayMode ? '#ffffff' : '#0e0e14',
    text: isDayMode ? '#18181b' : '#f0f0ff',
    subText: isDayMode ? '#71717a' : '#8b8ba7',
    border: isDayMode ? '#e4e4e7' : '#1e1e2c',
    primary: themeColor,
  }

  const [customAlert, setCustomAlert] = useState(null)
  const Alert = {
    alert: (title, message, buttons = []) => {
      setCustomAlert({
        title,
        message,
        buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }]
      })
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      loadFeed()
      loadBalance()
      claimDailyBonus()
      loadReferCode()
      loadBlockedUsers()
      loadUsers()
    }
  }, [isLoggedIn])

  // Load custom persisted fields (firstName, lastName, birthday) from AsyncStorage on mount
  useEffect(() => {
    const loadPersistedProfile = async () => {
      try {
        const savedFirst = await AsyncStorage.getItem('user_first_name')
        const savedLast = await AsyncStorage.getItem('user_last_name')
        const savedBirth = await AsyncStorage.getItem('user_birthday')
        
        const savedChatUser = await AsyncStorage.getItem('chat_username')
        const savedChatBio = await AsyncStorage.getItem('chat_bio')
        const savedChatAvatar = await AsyncStorage.getItem('chat_avatar')

        const savedSocialUser = await AsyncStorage.getItem('social_username')
        const savedSocialBio = await AsyncStorage.getItem('social_bio')
        const savedSocialAvatar = await AsyncStorage.getItem('social_avatar')

        if (savedFirst) setFirstName(savedFirst)
        if (savedLast) setLastName(savedLast)
        if (savedBirth) setBirthdayText(savedBirth)

        if (savedChatUser) setChatUsername(savedChatUser)
        if (savedChatBio) setChatBio(savedChatBio)
        if (savedChatAvatar) setChatAvatar(savedChatAvatar)

        if (savedSocialUser) setSocialUsername(savedSocialUser)
        if (savedSocialBio) setSocialBio(savedSocialBio)
        if (savedSocialAvatar) setSocialAvatar(savedSocialAvatar)

        // Load Data & Storage & Chat Folder states
        const savedCache = await AsyncStorage.getItem('storage_cache_size')
        if (savedCache !== null) setStorageCacheSize(savedCache)

        const savedWifi = await AsyncStorage.getItem('auto_download_wifi')
        if (savedWifi !== null) setAutoDownloadWifi(savedWifi === 'true')

        const savedMobile = await AsyncStorage.getItem('auto_download_mobile')
        if (savedMobile !== null) setAutoDownloadMobile(savedMobile === 'true')

        const savedQuality = await AsyncStorage.getItem('media_quality')
        if (savedQuality !== null) setMediaQuality(savedQuality)

        const savedProxy = await AsyncStorage.getItem('use_proxy')
        if (savedProxy !== null) setUseProxy(savedProxy === 'true')

        const savedProxyServer = await AsyncStorage.getItem('proxy_server')
        if (savedProxyServer !== null) setProxyServer(savedProxyServer)

        const savedProxyPort = await AsyncStorage.getItem('proxy_port')
        if (savedProxyPort !== null) setProxyPort(savedProxyPort)

        const savedSecretIds = await AsyncStorage.getItem('secret_chat_ids')
        if (savedSecretIds !== null) setSecretChatIds(JSON.parse(savedSecretIds))

        const savedFolderPin = await AsyncStorage.getItem('secret_folder_pin')
        if (savedFolderPin !== null) setSecretFolderPin(savedFolderPin)

        const savedUseBio = await AsyncStorage.getItem('use_biometrics_for_folder')
        if (savedUseBio !== null) setUseBiometricsForFolder(savedUseBio === 'true')

        // Load new preference states
        const savedLang = await AsyncStorage.getItem('app_language')
        if (savedLang !== null) setCurrentLanguage(savedLang)

        const savedPowerMode = await AsyncStorage.getItem('power_save_mode')
        if (savedPowerMode !== null) setPowerSaveMode(savedPowerMode)

        const savedAutoGifs = await AsyncStorage.getItem('auto_play_gifs')
        if (savedAutoGifs !== null) setAutoPlayGifs(savedAutoGifs === 'true')

        const savedAutoVideos = await AsyncStorage.getItem('auto_play_videos')
        if (savedAutoVideos !== null) setAutoPlayVideos(savedAutoVideos === 'true')

        const savedAnimations = await AsyncStorage.getItem('disable_animations')
        if (savedAnimations !== null) setDisableAnimations(savedAnimations === 'true')

        const savedLowData = await AsyncStorage.getItem('low_data_mode')
        if (savedLowData !== null) setLowDataMode(savedLowData === 'true')

        const savedIsPremium = await AsyncStorage.getItem('is_premium_user')
        if (savedIsPremium !== null) setIsPremiumUser(savedIsPremium === 'true')

        const savedIconPreset = await AsyncStorage.getItem('app_icon_preset')
        if (savedIconPreset !== null) setAppIconPreset(savedIconPreset)

        const savedAvatars = await AsyncStorage.getItem('chat_avatars')
        if (savedAvatars !== null) {
          const parsed = JSON.parse(savedAvatars)
          setChatModeChats(prev => prev.map(chat => {
            if (parsed[chat.id]) {
              return { ...chat, avatar: parsed[chat.id] }
            }
            return chat
          }))
        }
      } catch (e) {}
    }
    loadPersistedProfile()
  }, [])

  useEffect(() => {
    if (currentUser) {
      if (!usernameText) setUsernameText(currentUser.username || '')
      if (!bioText) setBioText(currentUser.bio || '')
    }
  }, [currentUser])

  const saveSecretChatIds = async (ids) => {
    try {
      setSecretChatIds(ids)
      await AsyncStorage.setItem('secret_chat_ids', JSON.stringify(ids))
      await updatePreferences({ lockedChats: ids })
    } catch (e) {}
  }

  const saveSecretFolderPin = async (pin) => {
    try {
      setSecretFolderPin(pin)
      await AsyncStorage.setItem('secret_folder_pin', pin)
      await updatePreferences({ secretFolderPin: pin })
    } catch (e) {}
  }

  const saveUseBiometrics = async (val) => {
    try {
      setUseBiometricsForFolder(val)
      await AsyncStorage.setItem('use_biometrics_for_folder', val ? 'true' : 'false')
    } catch (e) {}
  }

  const moveToSecretFolder = (chatId) => {
    if (!secretChatIds.includes(chatId)) {
      const newIds = [...secretChatIds, chatId]
      saveSecretChatIds(newIds)
      Alert.alert('🔐 Secured', 'Chat moved to Secret Vault. Access it via the Vault row at the top of Chats.')
    }
  }

  const removeFromSecretFolder = (chatId) => {
    const newIds = secretChatIds.filter(id => id !== chatId)
    saveSecretChatIds(newIds)
    Alert.alert('🔓 Unlocked', 'Chat moved back to main inbox.')
  }

  const handleLockToggle = (chatId) => {
    if (secretChatIds.includes(chatId)) {
      removeFromSecretFolder(chatId)
    } else {
      if (!secretFolderPin) {
        Alert.alert('Passcode Required', 'Please set up your Secret Vault PIN from Settings first to lock chats!')
      } else {
        moveToSecretFolder(chatId)
        setShowChat(false)
      }
    }
  }

  const handleChangeAvatar = async (chatId, newAvatar) => {
    setChatModeChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, avatar: newAvatar }
      }
      return chat
    }))
    try {
      const savedAvatars = await AsyncStorage.getItem('chat_avatars') || '{}'
      const parsed = JSON.parse(savedAvatars)
      parsed[chatId] = newAvatar
      await AsyncStorage.setItem('chat_avatars', JSON.stringify(parsed))
    } catch (e) {}
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Please enter a Group Name!')
      return
    }
    try {
      const res = await createGroup({
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        isPaid: newGroupIsPaid,
        monthlyFee: parseFloat(newGroupMonthlyFee) || 0,
        isPrivate: newGroupIsPrivate
      })
      if (res.data.success) {
        const newGroupChat = {
          id: res.data.group._id,
          name: res.data.group.name,
          color: '#10b981',
          unread: 0,
          streak: 0,
          isGroup: true,
          phoneNumber: 'Group Chat',
          avatar: '👥'
        }
        setChatModeChats(prev => [newGroupChat, ...prev])
        Alert.alert('👥 Success', `Group "${newGroupName}" created successfully!`)
        setShowCreateGroupModal(false)
        setNewGroupName('')
        setNewGroupDesc('')
        setNewGroupIsPaid(false)
        setNewGroupMonthlyFee('0')
        setNewGroupIsPrivate(false)
      } else {
        Alert.alert('Error', res.data.message || 'Could not create group.')
      }
    } catch (e) {
      const errMsg = e.response?.data?.message || e.message || 'Group creation failed.'
      Alert.alert('Error', errMsg)
    }
  }

  const handleAddGroupMember = async (groupId, username) => {
    if (!username.trim()) return
    try {
      const res = await addGroupMember(groupId, { usernameToAdd: username.trim() })
      if (res.data.success) {
        Alert.alert('✅ Added', res.data.message)
      } else {
        Alert.alert('Error', res.data.message || 'Failed to add member.')
      }
    } catch (e) {
      const errMsg = e.response?.data?.message || e.message || 'Could not add member.'
      Alert.alert('Error', errMsg)
    }
  }

  const handleSaveProfile = async () => {
    try {
      await AsyncStorage.setItem('user_first_name', firstName)
      await AsyncStorage.setItem('user_last_name', lastName)
      await AsyncStorage.setItem('user_birthday', birthdayText)

      if (appMode === 'chat') {
        await AsyncStorage.setItem('chat_username', usernameText)
        await AsyncStorage.setItem('chat_bio', bioText)
        await AsyncStorage.setItem('chat_avatar', tempAvatar)
        setChatUsername(usernameText)
        setChatBio(bioText)
        setChatAvatar(tempAvatar)
      } else {
        await AsyncStorage.setItem('social_username', usernameText)
        await AsyncStorage.setItem('social_bio', bioText)
        await AsyncStorage.setItem('social_avatar', tempAvatar)
        setSocialUsername(usernameText)
        setSocialBio(bioText)
        setSocialAvatar(tempAvatar)
      }

      Alert.alert('Success', 'Profile saved successfully!')
      setShowAccountModal(false)
    } catch (e) {
      Alert.alert('Error', 'Failed to save profile.')
    }
  }

  // Android hardware back button handler
  useEffect(() => {
    const backAction = () => {
      if (showStreak) {
        setShowStreak(false)
        return true
      }
      if (showCreate) {
        setShowCreate(false)
        return true
      }
      if (selectedUserProfile) {
        setSelectedUserProfile(null)
        return true
      }
      if (showChat) {
        setShowChat(false)
        return true
      }
      if (showNotifs) {
        setShowNotifs(false)
        return true
      }
      if (showWallet) {
        setShowWallet(false)
        return true
      }
      if (showAccountModal) {
        setShowAccountModal(false)
        return true
      }
      if (showDataStorage) {
        setShowDataStorage(false)
        return true
      }
      if (showChatFolder) {
        setShowChatFolder(false)
        return true
      }
      if (showFolderAuthModal) {
        setShowFolderAuthModal(false)
        setPinSetupStep(0)
        return true
      }
      if (showSecretFolderChats) {
        setIsFolderUnlocked(false)
        setShowSecretFolderChats(false)
        return true
      }
      if (showDevicesModal) {
        setShowDevicesModal(false)
        return true
      }
      if (showPowerSavingModal) {
        setShowPowerSavingModal(false)
        return true
      }
      if (showLanguageModal) {
        setShowLanguageModal(false)
        return true
      }
      if (showPremiumModal) {
        setShowPremiumModal(false)
        return true
      }
      if (showCreateGroupModal) {
        setShowCreateGroupModal(false)
        return true
      }
      return false // allow default back (exit app)
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)
    return () => backHandler.remove()
  }, [showStreak, showCreate, selectedUserProfile, showChat, showNotifs, showWallet, showAccountModal, showDataStorage, showChatFolder, showFolderAuthModal, showSecretFolderChats, showDevicesModal, showPowerSavingModal, showLanguageModal, showPremiumModal, showCreateGroupModal])

  // Web browser back button integration (popstate and pushState)
  const modalOpenRef = useRef(false)

  useEffect(() => {
    if (Platform.OS !== 'web') return

    const anyOpen = !!(showCreate || showStreak || selectedUserProfile || showChat || showNotifs || showWallet || showAccountModal)

    if (anyOpen && !modalOpenRef.current) {
      window.history.pushState({ modalOpen: true }, '')
      modalOpenRef.current = true
    } else if (!anyOpen && modalOpenRef.current) {
      modalOpenRef.current = false
      if (window.history.state?.modalOpen) {
        window.history.back()
      }
    }
  }, [showCreate, showStreak, selectedUserProfile, showChat, showNotifs, showWallet, showAccountModal])

  useEffect(() => {
    if (Platform.OS !== 'web') return

    const handlePopState = () => {
      setShowCreate(false)
      setShowStreak(false)
      setSelectedUserProfile(null)
      setShowChat(false)
      setShowNotifs(false)
      setShowWallet(false)
      setShowAccountModal(false)
      modalOpenRef.current = false
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const isPostAuthorPremium = (post) => {
    if (!post || !post.user) return false
    const postUserId = post.user._id || post.user
    const myUserId = currentUser?._id
    if (myUserId && postUserId === myUserId) {
      return isPremiumUser
    }
    return !!post.user.isPremium
  }

  const loadUsers = async () => {
    try {
      const res = await getUsers()
      setUsers(res.data.users || [])
    } catch (e) {}
  }

  const loadBlockedUsers = async () => {
    try {
      const res = await getMe()
      setCurrentUserBlockedList(res.data.user.blockedUsers || [])
      setCurrentUser(res.data.user)
      setIsPremiumUser(!!res.data.user.isPremium)
      setSavedPostIds(res.data.user.savedPosts || [])

      // Sync cloud preferences with local state and AsyncStorage
      const { starredMessages, lockedChats, secretFolderPin } = res.data.user
      if (starredMessages) {
        await AsyncStorage.setItem('starred_messages', JSON.stringify(starredMessages))
      }
      if (lockedChats) {
        await AsyncStorage.setItem('secret_chat_ids', JSON.stringify(lockedChats))
        setSecretChatIds(lockedChats)
      }
      if (secretFolderPin) {
        await AsyncStorage.setItem('secret_folder_pin', secretFolderPin)
        setSecretFolderPin(secretFolderPin)
      }
    } catch (e) {}
  }

  const loadFeed = async () => {
    try {
      const res = await getFeed()
      setPosts(res.data.posts)
    } catch (e) {}
  }

  const loadBalance = async () => {
    try {
      const res = await getBalance()
      setVOIDBalance(res.data.balance)
      setPkrValue(res.data.pkrValue)
    } catch (e) {}
  }

  const claimDailyBonus = async () => {
    try {
      const res = await dailyLogin()
      Alert.alert('🎉 Daily Bonus!', res.data.message)
    } catch (e) {}
  }

  const loadReferCode = async () => {
    try {
      const res = await getMyCode()
      setReferCode(res.data.referCode)
    } catch (e) {}
  }

  const handleLike = async (postId) => {
    try {
      await likePost(postId)
      loadFeed()
      loadBalance()
    } catch (e) {}
  }

  const handleOpenLink = async (url) => {
    if (!url) return
    try {
      let formattedUrl = url.trim()
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'https://' + formattedUrl
      }
      if (useInAppBrowser) {
        await WebBrowser.openBrowserAsync(formattedUrl)
      } else {
        if (Platform.OS === 'web') {
          window.open(formattedUrl, '_blank')
        } else {
          const { Linking } = require('react-native')
          Linking.openURL(formattedUrl)
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open link!')
    }
  }

  const handlePost = async () => {
    if (postType === 'text' && !postContent.trim()) {
      Alert.alert('Error', 'Write something first!')
      return
    }
    if (postType === 'image' && !mediaUrl.trim()) {
      Alert.alert('Error', 'Please enter Image URL!')
      return
    }
    if (postType === 'video' && !mediaUrl.trim()) {
      Alert.alert('Error', 'Please enter Video URL!')
      return
    }
    if (postType === 'link' && !linkUrl.trim()) {
      Alert.alert('Error', 'Please enter Link URL!')
      return
    }

    setPosting(true)
    try {
      const res = await createPost({
        content: postContent,
        isAnonymous,
        postType,
        mediaUrl: postType === 'image' || postType === 'video' ? mediaUrl : '',
        linkUrl: postType === 'link' ? linkUrl : ''
      })
      Alert.alert('✅', res.data.message)
      setPostContent('')
      setMediaUrl('')
      setLinkUrl('')
      setPostType('text')
      setShowCreate(false)
      loadFeed()
      loadBalance()
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Error occurred!')
    }
    setPosting(false)
  }

  const handleSendStreak = async () => {
    if (selectedStreakUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one friend!')
      return
    }

    if (streakType === 'image' && !streakImage.trim()) {
      Alert.alert('Error', 'Please enter an image/photo URL!')
      return
    }

    setSendingStreak(true)
    let successCount = 0
    let totalVoidEarned = 0
    let finalStreakCount = 1

    try {
      for (const userId of selectedStreakUsers) {
        const content = streakType === 'image' 
          ? `[STREAK] 🖼️ Photo Snap: ${streakImage}`
          : `[STREAK] ${streakContent}`

        const res = await sendMessage({
          receiverId: userId,
          content: content
        })

        if (res.data.success) {
          successCount++
          if (res.data.VOIDEarned) {
            totalVoidEarned += res.data.VOIDEarned
          }
          if (res.data.streak) {
            finalStreakCount = res.data.streak
          }
        }
      }

      Alert.alert(
        '🔥 Streak Sent!',
        `Successfully sent to ${successCount} friend(s)!\nTotal VOID Earned: +${totalVoidEarned} VOID\nStreak: ${finalStreakCount} days! 🎉`
      )

      setSelectedStreakUsers([])
      setStreakContent('🔥 Streak!')
      setStreakImage('')
      setShowStreak(false)
      loadBalance()
      loadUsers()
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to send streak!')
    } finally {
      setSendingStreak(false)
    }
  }

  const handleModeChange = (mode) => {
    setAppMode(mode)
    if (mode === 'chat') {
      setActiveTab('inbox')
    } else {
      setActiveTab('feed')
    }
  }

  const pickStatusMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Photos permission is required to share image/video status!')
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      })
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setStatusMediaUri(result.assets[0].uri)
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image/video!')
    }
  }

  const handlePostStatus = () => {
    let content = ''
    let type = statusType
    let color = '#c8ff00'

    if (statusType === 'text') {
      if (!newStatusText.trim()) {
        Alert.alert('Error', 'Please write something first!')
        return
      }
      content = newStatusText.trim()
      color = statusBgColor
    } else if (statusType === 'media') {
      if (!statusMediaUri) {
        Alert.alert('Error', 'Please select an image or video first!')
        return
      }
      content = `[MEDIA] ${statusMediaUri}`
    } else if (statusType === 'link') {
      if (!statusLinkUrl.trim()) {
        Alert.alert('Error', 'Please enter a URL first!')
        return
      }
      content = `[LINK] ${statusLinkUrl.trim()}`
    } else if (statusType === 'audio') {
      content = `[AUDIO] 🎙️ Voice status update`
    }

    const durationHours = isPremiumUser ? 72 : 24
    const expiryTimestamp = Date.now() + durationHours * 3600 * 1000

    const newStatus = {
      id: Date.now().toString(),
      name: `@${currentUser?.username || 'You'}`,
      avatar: (currentUser?.username?.[0] || 'Y').toUpperCase(),
      time: 'Just now',
      content: content,
      color: color,
      isPremiumStatus: isPremiumUser,
      createdAt: Date.now(),
      expiresAt: expiryTimestamp
    }

    setMockStatuses([newStatus, ...mockStatuses])
    setNewStatusText('')
    setStatusMediaUri(null)
    setStatusLinkUrl('')
    setShowCreateStatusModal(false)
    Alert.alert(
      'Status Published 🚀',
      `Your status is live! ${isPremiumUser ? '👑 VOID Premium: Live for 72 Hours (3 Days)!' : '⏳ Normal User: Live for 24 Hours.'}`
    )
  }

  const handleSyncContacts = async () => {
    setShowContactsSyncModal(true)
    setSyncingContacts(true)
    try {
      let currentUsers = users
      if (currentUsers.length === 0) {
        const res = await getUsers()
        currentUsers = res.data.users || []
        setUsers(currentUsers)
      }

      const matched = []

      // On Web: Match all registered phone users directly
      if (Platform.OS === 'web') {
        currentUsers.forEach(u => {
          const ph = u.phone || u.phoneNumber || u.email || u.username || ''
          const cleanPh = ph.replace(/\D/g, '')
          if (cleanPh.length >= 7) {
            matched.push({
              deviceName: u.name || u.username || 'Phone User',
              user: u,
              matchedNumber: ph
            })
          }
        })
      } else {
        // On Native (Android / iOS)
        try {
          const { status } = await Contacts.requestPermissionsAsync()
          if (status === 'granted') {
            const { data } = await Contacts.getContactsAsync({
              fields: [Contacts.Fields.PhoneNumbers],
            })

            if (data && data.length > 0) {
              data.forEach(deviceContact => {
                if (!deviceContact.phoneNumbers || deviceContact.phoneNumbers.length === 0) return

                deviceContact.phoneNumbers.forEach(pn => {
                  if (!pn.number) return
                  const cleanPn = pn.number.replace(/\D/g, '')

                  currentUsers.forEach(regUser => {
                    const regPhoneStr = (regUser.phone || regUser.phoneNumber || regUser.username || regUser.email || '').replace(/\D/g, '')

                    if (regPhoneStr.length >= 7 && (cleanPn.endsWith(regPhoneStr) || regPhoneStr.endsWith(cleanPn))) {
                      if (!matched.some(m => String(m.user._id || m.user.id) === String(regUser._id || regUser.id))) {
                        matched.push({
                          deviceName: deviceContact.name || regUser.name || 'Contact',
                          user: regUser,
                          matchedNumber: pn.number
                        })
                      }
                    }
                  })
                })
              })
            }
          }
        } catch (e) {}

        // Fallback: If no device permissions or 0 matches found on phone, display all registered phone users
        if (matched.length === 0) {
          currentUsers.forEach(u => {
            const ph = u.phone || u.phoneNumber || u.email || u.username || ''
            const cleanPh = ph.replace(/\D/g, '')
            if (cleanPh.length >= 7) {
              matched.push({
                deviceName: u.name || u.username || 'Registered User',
                user: u,
                matchedNumber: ph
              })
            }
          })
        }
      }

      // Automatically add all matched users to active Inbox chats
      matched.forEach(item => {
        const u = item.user
        const newChatObj = {
          id: u._id || u.id,
          name: item.deviceName || u.name || u.username,
          username: u.username,
          phoneNumber: item.matchedNumber || u.email || u.username,
          color: '#10b981',
          avatar: (u.username || u.name || 'U')[0].toUpperCase(),
          streak: 0,
          unread: 0
        }
        setChatModeChats(prev => {
          if (!prev.some(c => String(c.id) === String(newChatObj.id))) {
            return [newChatObj, ...prev]
          }
          return prev
        })
      })

      setMatchedContacts(matched)
    } catch (err) {
      console.error('Contacts sync error:', err)
    } finally {
      setSyncingContacts(false)
    }
  }

  const handleSavePost = async (postId) => {
    try {
      const res = await savePost(postId)
      Alert.alert(res.data.isSaved ? '💾 Saved' : '🗑️ Unsaved', res.data.message)
      loadBlockedUsers()
    } catch (e) {
      Alert.alert('Error', 'Could not save post.')
    }
  }

  const handleSharePost = async (post) => {
    try {
      const content = `${post.isAnonymous ? 'Anonymous' : `@${post.user?.username || 'User'}`}: "${post.content}"\n\nShared from VOID CHAT 🔓`
      await Share.share({
        message: content,
      })
    } catch (e) {
      console.warn('Share error:', e)
    }
  }

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !activeCommentsPost) return
    setCommenting(true)
    try {
      const targetId = activeCommentsPost._id || activeCommentsPost.id
      await commentPost(targetId, { text: newCommentText })
      setNewCommentText('')
      
      const feedRes = await getFeed()
      const updatedPost = feedRes.data.posts.find(p => (p._id || p.id) === targetId)
      if (updatedPost) {
        setActiveCommentsPost(updatedPost)
      }
      loadFeed()
      loadBalance()
    } catch (e) {
      Alert.alert('Error', 'Could not post comment.')
    } finally {
      setCommenting(false)
    }
  }

  const handleToggleBlock = async (userId, username) => {
    if (!userId) return
    const isCurrentlyBlocked = currentUserBlockedList.includes(userId)
    const actionLabel = isCurrentlyBlocked ? 'unblock' : 'block'
    
    Alert.alert(
      `${isCurrentlyBlocked ? 'Unblock' : 'Block'} User`,
      `Are you sure you want to ${actionLabel} @${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isCurrentlyBlocked ? 'Unblock' : 'Block',
          style: isCurrentlyBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const res = await blockUser(userId)
              Alert.alert('Success', res.data.message)
              setSelectedUserProfile(null)
              loadBlockedUsers()
              loadFeed()
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to toggle block status')
            }
          }
        }
      ]
    )
  }

  const handleLogin = async (token, balance) => {
    await setToken(token)
    setVOIDBalance(balance)
    setIsLoggedIn(true)
  }

  const handleLogout = async () => {
    await setToken(null)
    setIsLoggedIn(false)
  }

  if (loadingAuth) {
    return (
      <View style={{ flex: 1, backgroundColor: '#060608', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#c8ff00', fontSize: 28, fontWeight: '900', letterSpacing: 3 }}>VOID</Text>
        <Icon name="lock_open" size={20} color="#c8ff0080" style={{ marginTop: 4 }} />
      </View>
    )
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />
  }

  const visibleChatModeChats = chatModeChats.filter(chat => !secretChatIds.includes(chat.id))

  const renderHeader = (showMoreOptions = true) => (
    <View style={[styles.header, { backgroundColor: theme.bg }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={[styles.logo, isPremiumUser && { color: appIconPreset === 'gold' ? '#ffd700' : (appIconPreset === 'holo' ? '#00ffff' : (appIconPreset === 'cyber' ? '#ec4899' : '#ffd700')) }]}>
          {isPremiumUser ? (appIconPreset === 'gold' ? 'VOID GOLD' : (appIconPreset === 'holo' ? 'VOID HOLO' : (appIconPreset === 'cyber' ? 'VOID CYBER' : 'VOID'))) : 'VOID'}
        </Text>

        {/* ── Mode Switcher Button (Social User ↔ Secret Chat User) ── */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            const nextMode = appMode === 'social' ? 'chat' : 'social'
            setAppMode(nextMode)
            if (nextMode === 'chat') {
              setActiveTab('inbox')
            } else {
              setActiveTab('feed')
            }
            Alert.alert(
              'Profile Mode Switched ⚡',
              `Switched to: ${nextMode === 'chat' ? '💬 Secret Chat User' : '🌐 Social User'} Mode`
            )
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: appMode === 'chat' ? '#161622' : '#0a1600',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: appMode === 'chat' ? '#3b82f650' : '#c8ff0050',
          }}
        >
          <Text style={{ fontSize: 11 }}>{appMode === 'chat' ? '💬' : '🌐'}</Text>
          <Text style={{ color: appMode === 'chat' ? '#60a5fa' : '#c8ff00', fontSize: 11, fontWeight: '800' }}>
            {appMode === 'chat' ? 'Chat User' : 'Social User'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={() => setShowWallet(true)} activeOpacity={0.85}>
          <View style={styles.VOIDBadge}>
            <Icon name="bolt" size={14} color="#c8ff00" />
            <Text style={styles.VOIDText}>{VOIDBalance}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowNotifs(true)} style={styles.notifIconBtn}>
          <Icon name="notifications" size={22} color="#9ca3af" />
        </TouchableOpacity>
        {showMoreOptions && (
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Void Settings',
                'Select an action:',
                [
                  { text: '👥 New Group', onPress: () => setShowCreateGroupModal(true) },
                  { text: '🌐 New Community', onPress: () => Alert.alert('New Community', 'Community creation is currently in invite-only beta.') },
                  { text: '📢 Broadcast List', onPress: () => Alert.alert('Broadcast List', 'Create a broadcast list to send messages to multiple users at once.') },
                  { text: '💻 Linked Devices', onPress: () => setShowDevicesModal(true) },
                  { text: '⭐ Starred Messages', onPress: async () => {
                    try {
                      const stored = await AsyncStorage.getItem('starred_messages') || '[]'
                      setStarredMessages(JSON.parse(stored))
                    } catch (e) {}
                    setShowStarredModal(true)
                  }},
                  { text: 'Cancel', style: 'cancel' }
                ]
              )
            }}
            style={{ padding: 4, marginLeft: 6 }}
          >
            <Icon name="more_vert" size={22} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  const renderFeedContent = () => (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
        <TextInput
          style={{
            backgroundColor: theme.cardBg,
            color: theme.text,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            fontSize: 13
          }}
          placeholder="🔍 Search users on Social..."
          placeholderTextColor="#4b5563"
          value={socialSearchQuery}
          onChangeText={setSocialSearchQuery}
        />
      </View>

      <ScrollView style={styles.content}>
        {socialSearchQuery.trim() !== '' ? (
          <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ color: theme.subText, fontSize: 12, fontWeight: '800' }}>Matched Social Users</Text>
            {users.filter(u => (u.username || u.name || '').toLowerCase().includes(socialSearchQuery.toLowerCase())).map(user => (
              <TouchableOpacity
                key={user._id || user.id}
                style={[styles.chatItem, { backgroundColor: theme.cardBg, borderColor: theme.border, borderWidth: 1, borderRadius: 14, padding: 12 }]}
                onPress={() => {
                  setSelectedUserProfile(user)
                  setSocialSearchQuery('')
                }}
              >
                <View style={[styles.chatAvatar, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.avatarText, { color: '#000' }]}>
                    {(user.username || user.name || 'U')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.chatInfo}>
                  <Text style={[styles.chatName, { color: theme.text }]}>@{user.username || user.name}</Text>
                  <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2 }}>🌐 Social Profile</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyFeed}>
            <Icon name="lock_open" size={52} color="#2a2a3a" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>
              Make your first post — earn 40 VOID!
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => setShowCreate(true)}
            >
              <Text style={styles.emptyBtnText}>Post Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map(post => (
            <View key={post._id} style={[styles.post, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.postHeader}>
                <TouchableOpacity 
                  style={[styles.avatar, {
                    backgroundColor: post.isAnonymous ? '#374151' : (isPostAuthorPremium(post) ? '#ffd700' : '#6366f1'),
                    borderWidth: (isPostAuthorPremium(post) && !post.isAnonymous) ? 2 : 0,
                    borderColor: '#ffd700'
                  }]}
                  onPress={() => {
                    if (post.isAnonymous) {
                      setSelectedUserProfile({ _id: post.user?._id || post.user, username: 'Anonymous', isAnonymous: true })
                    } else if (post.user) {
                      setSelectedUserProfile(post.user)
                    }
                  }}
                >
                  <Text style={[styles.avatarText, (isPostAuthorPremium(post) && !post.isAnonymous) && { color: '#050608', fontWeight: '900' }]}>
                    {post.isAnonymous ? '?' :
                      post.user?.username?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.postMeta}
                  onPress={() => {
                    if (post.isAnonymous) {
                      setSelectedUserProfile({ _id: post.user?._id || post.user, username: 'Anonymous', isAnonymous: true })
                    } else if (post.user) {
                      setSelectedUserProfile(post.user)
                    }
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.username, { color: theme.text }, (isPostAuthorPremium(post) && !post.isAnonymous) && { color: '#ffd700', fontWeight: '800' }]}>
                      {post.isAnonymous ? '🕵️ Anonymous' : `@${post.user?.username}`}
                    </Text>
                    {(isPostAuthorPremium(post) && !post.isAnonymous) && (
                      <Text style={{ fontSize: 11 }}>👑</Text>
                    )}
                  </View>
                  <Text style={[styles.postTime, { color: theme.subText }]}>🔐 Encrypted</Text>
                </TouchableOpacity>
                <View style={styles.VOIDEarned}>
                  <Text style={styles.VOIDEarnedText}>
                    +{post.VOIDEarned} VOID
                  </Text>
                </View>
              </View>
              {post.content ? (
                <Text style={[styles.postContent, { color: theme.text }]}>{post.content}</Text>
              ) : null}

              {/* 🖼️ Render Image Post */}
              {post.postType === 'image' && post.mediaUrl ? (
                <View style={styles.mediaContainer}>
                  <Image
                    source={{ uri: post.mediaUrl }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                </View>
              ) : null}

              {/* 🎥 Render Video Post */}
              {post.postType === 'video' && post.mediaUrl ? (
                <TouchableOpacity 
                  style={styles.videoPlayerCard}
                  activeOpacity={0.9}
                  onPress={() => handleOpenLink(post.mediaUrl)}
                >
                  <View style={styles.videoPlayerPlaceholder}>
                    <Icon name="smart_display" size={42} color="#6b7280" />
                    <Text style={styles.videoPlayText}>Tap to Open Video</Text>
                    <View style={styles.playButtonOverlay}>
                      <Text style={styles.playButtonText}>▶</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ) : null}

              {/* 🔗 Render Link Post */}
              {post.postType === 'link' && post.linkUrl ? (
                <TouchableOpacity
                  style={styles.linkCard}
                  activeOpacity={0.8}
                  onPress={() => handleOpenLink(post.linkUrl)}
                >
                  <View style={styles.linkIconContainer}>
                    <Text style={styles.linkIconEmoji}>🔗</Text>
                  </View>
                  <View style={styles.linkMeta}>
                    <Text style={styles.linkUrlText} numberOfLines={1}>
                      {post.linkUrl}
                    </Text>
                    <Text style={styles.linkTapText}>Tap to open link ↗</Text>
                  </View>
                </TouchableOpacity>
              ) : null}

              <View style={styles.postActions}>
                {/* Like Button */}
                <TouchableOpacity
                  style={[styles.actionBtn, (post.likes?.length > 0) && styles.actionBtnLiked]}
                  onPress={() => handleLike(post._id)}
                  activeOpacity={0.75}
                >
                  <Icon
                    name={post.likes?.length > 0 ? 'favorite' : 'favorite_border'}
                    size={18}
                    color={post.likes?.length > 0 ? '#f87171' : '#6b7280'}
                  />
                  <Text style={[styles.actionCount, post.likes?.length > 0 && styles.actionCountLiked]}>
                    {post.likes?.length || 0}
                  </Text>
                </TouchableOpacity>

                {/* Comment Button */}
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => {
                    setActiveCommentsPost(post)
                    setShowCommentsModal(true)
                  }}
                  activeOpacity={0.75}
                >
                  <Icon name="chat_bubble_outline" size={17} color="#6b7280" />
                  <Text style={styles.actionCount}>{post.comments?.length || 0}</Text>
                </TouchableOpacity>

                {/* Share Button */}
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => handleSharePost(post)}
                  activeOpacity={0.75}
                >
                  <Icon name="share" size={17} color="#6b7280" />
                  <Text style={styles.actionCount}>Share</Text>
                </TouchableOpacity>

                {/* Save Button */}
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => handleSavePost(post._id || post.id)} 
                  activeOpacity={0.75}
                >
                  <Icon
                    name={savedPostIds.includes(post._id || post.id) ? 'bookmark' : 'bookmark_border'}
                    size={17}
                    color={savedPostIds.includes(post._id || post.id) ? theme.primary : '#6b7280'}
                  />
                  <Text style={[styles.actionCount, savedPostIds.includes(post._id || post.id) && { color: theme.primary }]}>
                    {savedPostIds.includes(post._id || post.id) ? 'Saved' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Post Button */}
      <TouchableOpacity
        style={styles.floatingCreateBtn}
        activeOpacity={0.85}
        onPress={() => {
          setPostType('text')
          setShowCreate(true)
        }}
      >
        {/* Premium post button: outer ring + inner circle + label */}
        <View style={styles.fabRing}>
          <View style={styles.fabInner}>
            <Text style={styles.fabPlus}>+</Text>
          </View>
        </View>
        <Text style={styles.fabLabel}>Post</Text>
      </TouchableOpacity>
    </View>
  )

  const renderInboxContent = () => (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {appMode === 'chat' ? (
        <View style={{ flex: 1 }}>
          {/* WhatsApp Style Tab bar with Three Dots Menu */}
          <View style={{ flexDirection: 'row', backgroundColor: theme.cardBg, borderBottomWidth: 1, borderBottomColor: theme.border, alignItems: 'center' }}>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: chatInboxTab === 'chats' ? 2 : 0, borderBottomColor: theme.primary }}
              onPress={() => setChatInboxTab('chats')}
            >
              <Text style={{ color: chatInboxTab === 'chats' ? theme.primary : theme.subText, fontWeight: '800', fontSize: 14 }}>CHATS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: chatInboxTab === 'status' ? 2 : 0, borderBottomColor: theme.primary }}
              onPress={() => setChatInboxTab('status')}
            >
              <Text style={{ color: chatInboxTab === 'status' ? theme.primary : theme.subText, fontWeight: '800', fontSize: 14 }}>STATUS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => {
                if (chatInboxTab === 'status') {
                  setShowStatusPrivacyModal(true)
                } else {
                  setShowChatOptionsMenu(true)
                }
              }}
            >
              <Icon name="more_vert" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Search Bar for Hidden Vault Check */}
          <View style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.bg }}>
            <TextInput
              style={{
                backgroundColor: theme.cardBg,
                color: theme.text,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.border,
                fontSize: 13
              }}
              placeholder="Search chats..."
              placeholderTextColor="#4b5563"
              value={inboxSearchQuery}
              onChangeText={setInboxSearchQuery}
            />
          </View>

          {chatInboxTab === 'chats' ? (
            <ScrollView style={styles.content}>
              {/* Secret Vault Shortcut Row */}
              {((secretFolderPin && inboxSearchQuery === secretFolderPin) || (!secretFolderPin && inboxSearchQuery.toLowerCase() === 'vault')) && (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    backgroundColor: theme.cardBg,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                    gap: 14,
                    marginHorizontal: 12,
                    marginVertical: 12,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                  onPress={() => {
                    setFolderAuthAction('open_folder')
                    if (!secretFolderPin) {
                      setPinSetupStep(1)
                      setTempPinSetup('')
                      setAuthError('')
                      setShowFolderAuthModal(true)
                    } else {
                      setFolderAuthPinInput('')
                      setAuthError('')
                      setShowFolderAuthModal(true)
                    }
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDayMode ? '#c8ff0020' : '#c8ff0010', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#c8ff0025' }}>
                    <Icon name="lock" size={18} color={theme.primary} forceEmoji={true} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14 }}>Secret Vault</Text>
                    <Text style={{ color: theme.subText, fontSize: 11, marginTop: 1 }}>Secure folder for personal chats</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: '#c8ff00', fontSize: 11, fontWeight: '700' }}>Locked 🔒</Text>
                    <Text style={{ color: '#3a3a5a', fontSize: 14 }}>›</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Global Registered Users Search Results */}
              {inboxSearchQuery.trim() !== '' && (
                <View style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
                  {(() => {
                    const q = inboxSearchQuery.trim().toLowerCase().replace(/^@/, '')
                    const filtered = users.filter(u => {
                      const name = (u.name || '').toLowerCase()
                      const uname = (u.username || '').toLowerCase()
                      const email = (u.email || '').toLowerCase()
                      const phone = (u.phone || u.phoneNumber || '').toLowerCase()
                      const isSelf = currentUser && String(u._id || u.id) === String(currentUser._id || currentUser.id)
                      return !isSelf && (name.includes(q) || uname.includes(q) || email.includes(q) || phone.includes(q))
                    })
                    if (filtered.length === 0) {
                      return (
                        <View style={{ padding: 12, backgroundColor: theme.cardBg, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                          <Text style={{ color: theme.subText, fontSize: 12, textAlign: 'center' }}>
                            🔍 No registered user found matching "{inboxSearchQuery}"
                          </Text>
                        </View>
                      )
                    }
                    return filtered.map(u => (
                      <TouchableOpacity
                        key={u._id || u.id}
                        style={[styles.chatItem, { backgroundColor: theme.cardBg, borderColor: theme.primary, borderWidth: 1, borderRadius: 16, marginBottom: 8 }]}
                        onPress={() => {
                          const newChatObj = {
                            id: u._id || u.id,
                            name: u.name || u.username,
                            username: u.username,
                            phoneNumber: u.phone || u.phoneNumber || u.email || u.username,
                            color: '#c8ff00',
                            avatar: (u.username || u.name || 'U')[0].toUpperCase(),
                            streak: 0,
                            unread: 0
                          }
                          if (!chatModeChats.some(c => String(c.id) === String(newChatObj.id))) {
                            setChatModeChats(prev => [newChatObj, ...prev])
                          }
                          setShowChat(newChatObj)
                          setInboxSearchQuery('')
                        }}
                      >
                        <View style={[styles.chatAvatar, { backgroundColor: theme.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }]}>
                          <Text style={[styles.avatarText, { color: '#000', fontSize: 16, fontWeight: '900' }]}>
                            {(u.username || u.name || 'U')[0].toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.chatInfo}>
                          <Text style={[styles.chatName, { color: theme.text, fontSize: 14, fontWeight: '800' }]}>@{u.username || u.name}</Text>
                          <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '700', marginTop: 2 }}>⚡ Tap to start encrypted chat</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  })()}
                </View>
              )}

              {visibleChatModeChats.filter(chat => chat.name.toLowerCase().includes(inboxSearchQuery.toLowerCase())).map(chat => (
                <TouchableOpacity
                  key={chat.id}
                  style={[styles.chatItem, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}
                  onPress={() => setShowChat(chat)}
                  onLongPress={() => {
                    Alert.alert(
                      '🛡️ Secure Chat',
                      `Do you want to move ${chat.name} to the Secret Vault? It will be hidden from the main chat list.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Move to Vault', style: 'destructive', onPress: () => moveToSecretFolder(chat.id) }
                      ]
                    )
                  }}
                >
                  <View style={{ position: 'relative' }}>
                    <View style={[styles.chatAvatar, { backgroundColor: chat.color }]}>
                      <Text style={[styles.avatarText, { color: '#ffffff' }]}>{chat.avatar || chat.name[0]}</Text>
                    </View>
                    {chat.streak > 0 && (
                      <View style={styles.streakBadge}>
                        <Text style={styles.streakBadgeText}>
                          🔥{chat.streak}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.chatInfo}>
                    <Text style={[styles.chatName, { color: theme.text }]}>{chat.name}</Text>
                    <Text style={{ color: theme.subText, fontSize: 12, marginTop: 2 }}>{chat.phoneNumber}</Text>
                    <Text style={[styles.chatLast, { color: theme.subText }]}>🔐 Encrypted chat</Text>
                  </View>
                  <TouchableOpacity
                    style={{ padding: 10, marginRight: 8, justifyContent: 'center' }}
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert(
                        'Start Call',
                        `Select Call Type for ${chat.name}:`,
                        [
                          { text: '📞 Voice Call', onPress: () => setShowChat(chat) },
                          { text: '📹 Video Call', onPress: () => setShowChat(chat) },
                          { text: 'Cancel', style: 'cancel' }
                        ]
                      )
                    }}
                  >
                    <Icon name="call" size={20} color="#c8ff00" />
                  </TouchableOpacity>
                  {chat.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{chat.unread}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <ScrollView style={[styles.content, { padding: 16 }]} contentContainerStyle={{ gap: 16 }}>
              {/* Premium Status Creation Trigger Card */}
              <TouchableOpacity 
                activeOpacity={0.9}
                style={{
                  backgroundColor: theme.cardBg,
                  borderRadius: 22,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: theme.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12
                }}
                onPress={() => {
                  setStatusType('text')
                  setShowCreateStatusModal(true)
                }}
              >
                <View style={[styles.chatAvatar, { backgroundColor: theme.primary + '20', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.primary + '30' }]}>
                  <Text style={{ fontSize: 20 }}>✍️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '800' }}>Post a Status Update</Text>
                  <Text style={{ color: theme.subText, fontSize: 12 }}>What is on your mind today?</Text>
                </View>
                {/* Shortcuts */}
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity 
                    style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => {
                      setStatusType('text')
                      setShowCreateStatusModal(true)
                    }}
                  >
                    <Icon name="edit" size={16} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}
                    onPress={async () => {
                      setStatusType('media')
                      setShowCreateStatusModal(true)
                      await pickStatusMedia()
                    }}
                  >
                    <Icon name="photo_camera" size={16} color="#d946ef" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => {
                      setStatusType('link')
                      setShowCreateStatusModal(true)
                    }}
                  >
                    <Icon name="link" size={16} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => {
                      setStatusType('audio')
                      setShowCreateStatusModal(true)
                    }}
                  >
                    <Icon name="mic" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Status List */}
              <View style={{ gap: 12, paddingBottom: 30 }}>
                <Text style={{ color: theme.subText, fontWeight: '700', fontSize: 12, marginLeft: 4 }}>Recent Updates</Text>
                {mockStatuses.map(status => (
                  <View
                    key={status.id}
                    style={{
                      backgroundColor: theme.cardBg,
                      borderRadius: 20,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: theme.border,
                      gap: 10
                    }}
                  >
                    {/* Status Header with Delete Button */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={[styles.chatAvatar, { backgroundColor: status.color || '#c8ff00', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }]}>
                          <Text style={[styles.avatarText, { fontSize: 14 }]}>{status.avatar}</Text>
                        </View>
                        <View>
                          <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13 }}>{status.name}</Text>
                          <Text style={{ color: theme.subText, fontSize: 10 }}>{status.time}</Text>
                        </View>
                      </View>

                      {/* Delete Status Button */}
                      <TouchableOpacity
                        style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#ef444415', borderRadius: 10, borderWidth: 1, borderColor: '#ef444430' }}
                        onPress={() => {
                          Alert.alert(
                            'Delete Status',
                            'Are you sure you want to delete this status update?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => setMockStatuses(prev => prev.filter(s => s.id !== status.id))
                              }
                            ]
                          )
                        }}
                      >
                        <Text style={{ color: '#f87171', fontSize: 11, fontWeight: '700' }}>🗑️ Delete</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Status Content View (Full Image & No File Path Details) */}
                    {status.content.startsWith('[MEDIA] ') ? (
                      <View style={{ width: '100%', height: 260, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.border, backgroundColor: '#050508' }}>
                        <Image 
                          source={{ uri: status.content.replace('[MEDIA] ', '').trim() }} 
                          style={{ width: '100%', height: '100%' }} 
                          resizeMode="contain"
                        />
                      </View>
                    ) : status.content.startsWith('[LINK] ') ? (
                      <TouchableOpacity onPress={() => handleOpenLink(status.content.replace('[LINK] ', ''))} style={{ marginTop: 4 }}>
                        <Text style={{ color: '#3b82f6', fontSize: 13, textDecorationLine: 'underline', fontWeight: '700' }}>
                          🔗 {status.content.replace('[LINK] ', '')}
                        </Text>
                      </TouchableOpacity>
                    ) : status.content.startsWith('[AUDIO] ') ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, backgroundColor: theme.bg, padding: 10, borderRadius: 12, alignSelf: 'flex-start' }}>
                        <Icon name="mic" size={16} color="#ef4444" />
                        <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>🎙️ Voice Status (0:05)</Text>
                      </View>
                    ) : (
                      <View style={{
                        backgroundColor: status.color && status.color !== '#c8ff00' ? status.color : 'transparent',
                        padding: status.color && status.color !== '#c8ff00' ? 12 : 0,
                        borderRadius: 12,
                        marginTop: 4
                      }}>
                        <Text style={{ 
                          color: status.color && status.color !== '#c8ff00' ? '#ffffff' : theme.text, 
                          fontSize: 14, 
                          fontWeight: status.color && status.color !== '#c8ff00' ? '800' : 'normal',
                          lineHeight: 20 
                        }}>
                          {status.content}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={[styles.adBanner, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.adText, { color: theme.subText }]}>📢 Social DMs & Updates</Text>
          </View>

          {/* Social Mode User Search Results */}
          {inboxSearchQuery.trim() !== '' && (
            <View style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
              {(() => {
                const q = inboxSearchQuery.trim().toLowerCase()
                const filtered = users.filter(u => {
                  const name = (u.name || '').toLowerCase()
                  const uname = (u.username || '').toLowerCase()
                  const email = (u.email || '').toLowerCase()
                  const phone = (u.phone || u.phoneNumber || '').toLowerCase()
                  const isSelf = currentUser && String(u._id || u.id) === String(currentUser._id || currentUser.id)
                  return !isSelf && (name.includes(q) || uname.includes(q) || email.includes(q) || phone.includes(q))
                })
                if (filtered.length === 0) {
                  return (
                    <View style={{ padding: 12, backgroundColor: theme.cardBg, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 8 }}>
                      <Text style={{ color: theme.subText, fontSize: 12, textAlign: 'center' }}>
                        🔍 No registered user found matching "{inboxSearchQuery}"
                      </Text>
                    </View>
                  )
                }
                return filtered.map(u => (
                  <TouchableOpacity
                    key={u._id || u.id}
                    style={[styles.chatItem, { backgroundColor: theme.cardBg, borderColor: '#6366f1', borderWidth: 1, borderRadius: 16, marginBottom: 8 }]}
                    onPress={() => {
                      const newChatObj = {
                        id: u._id || u.id,
                        name: u.name || u.username,
                        username: u.username,
                        phoneNumber: u.phone || u.phoneNumber || u.email || u.username,
                        color: '#6366f1',
                        avatar: (u.username || u.name || 'U')[0].toUpperCase(),
                        streak: 0,
                        unread: 0
                      }
                      if (!socialModeChats.some(c => String(c.id) === String(newChatObj.id))) {
                        setSocialModeChats(prev => [newChatObj, ...prev])
                      }
                      setShowChat(newChatObj)
                      setInboxSearchQuery('')
                    }}
                  >
                    <View style={[styles.chatAvatar, { backgroundColor: '#6366f1', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={[styles.avatarText, { color: '#fff', fontSize: 16, fontWeight: '900' }]}>
                        {(u.username || u.name || 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.chatInfo}>
                      <Text style={[styles.chatName, { color: theme.text, fontSize: 14, fontWeight: '800' }]}>@{u.username || u.name}</Text>
                      <Text style={{ color: '#6366f1', fontSize: 11, fontWeight: '700', marginTop: 2 }}>⚡ Tap to send Social DM</Text>
                    </View>
                  </TouchableOpacity>
                ))
              })()}
            </View>
          )}

          {socialModeChats.filter(chat => chat.name.toLowerCase().includes(inboxSearchQuery.toLowerCase())).map(chat => (
            <TouchableOpacity
              key={chat.id}
              style={[styles.chatItem, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}
              onPress={() => setShowChat(chat)}
            >
              <View style={{ position: 'relative' }}>
                <View style={[styles.chatAvatar, { backgroundColor: chat.color }]}>
                  <Text style={styles.avatarText}>{chat.name[0]}</Text>
                </View>
                {chat.streak > 0 && (
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakBadgeText}>
                      🔥{chat.streak}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.chatInfo}>
                <Text style={[styles.chatName, { color: theme.text }]}>{chat.name}</Text>
                <Text style={[styles.chatLast, { color: theme.subText }]}>🔐 Social Chat Message</Text>
              </View>
              {chat.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{chat.unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  )

  const renderSettingsContent = () => (
    <ScrollView style={styles.content}>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Profile Card Header in Settings */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isPremiumUser ? '#1a1600' : (isDayMode ? '#ffffff' : '#0e0e14'),
          padding: 16,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: isPremiumUser ? '#ffd70040' : (isDayMode ? '#e4e4e7' : '#1e1e2c'),
          gap: 14
        }}>
          <View style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: isDayMode ? '#e4e4e7' : '#1e1e2d',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: isPremiumUser ? 2 : 0,
            borderColor: '#ffd700'
          }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: theme.text }}>
              {appMode === 'chat' ? chatAvatar : socialAvatar}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>
                @{appMode === 'chat' ? chatUsername : socialUsername}
              </Text>
              {isPremiumUser && (
                <View style={{ backgroundColor: '#ffd70020', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 0.5, borderColor: '#ffd70050' }}>
                  <Text style={{ color: '#ffd700', fontSize: 10, fontWeight: '800' }}>PREMIUM</Text>
                </View>
              )}
            </View>
            <Text style={{ color: theme.subText, fontSize: 12, marginTop: 2 }}>
              {appMode === 'chat' ? chatBio : socialBio}
            </Text>
          </View>
        </View>

        {/* Settings Menu List */}
        <View style={{ gap: 10 }}>
          {[
            { icon: 'person', label: t('account'), action: handleOpenAccountSettings },
            { icon: 'chat', label: t('chatSetting'), action: () => { setShowChatSettings(true) } },
            { icon: 'security', label: t('privacySecurity'), action: () => { setShowPrivacySettings(true) } },
            { icon: 'notifications', label: t('notifications'), action: () => { setShowNotifSettings(true) } },
            { icon: 'storage', label: t('dataStorage'), action: () => { setShowDataStorage(true) } },
            { icon: 'folder', label: t('vault'), action: () => {
              if (!secretFolderPin) {
                setPinSetupStep(1)
                setTempPinSetup('')
                setAuthError('')
                setFolderAuthAction('manage_folder')
                setShowFolderAuthModal(true)
              } else {
                setFolderAuthPinInput('')
                setAuthError('')
                setFolderAuthAction('manage_folder')
                setShowFolderAuthModal(true)
              }
            } },
            { icon: 'devices', label: t('devices'), action: () => { setShowDevicesModal(true) } },
            { icon: 'battery_saver', label: t('powerSaving'), action: () => { setShowPowerSavingModal(true) } },
            { icon: 'language', label: t('language'), action: () => { setShowLanguageModal(true) } },
            { icon: 'star', label: t('premium'), action: () => { setShowPremiumModal(true) }, isPremium: true },
            { icon: 'payments', label: t('voidCoins'), action: () => { setShowWallet(true) }, isCoins: true },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: item.isPremium ? '#1c1800' : '#0e0e14',
                borderRadius: 16,
                gap: 14,
                borderWidth: 1,
                borderColor: item.isPremium ? '#ffc80050' : '#1e1e2c',
              }}
              onPress={item.action}
            >
              <Icon name={item.icon} size={22} color={item.isPremium ? '#ffc800' : (item.isCoins ? '#c8ff00' : theme.primary)} forceEmoji={true} />
              <Text style={{
                flex: 1,
                color: item.isPremium ? '#ffc800' : '#f0f0ff',
                fontSize: 15,
                fontWeight: item.isPremium ? '800' : '600',
              }}>
                {item.label}
              </Text>
              <Text style={{ color: item.isPremium ? '#ffc800' : '#3a3a5a', fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  )

  const renderProfileContent = () => {
    const activeUsername = appMode === 'chat' ? chatUsername : socialUsername
    const activeAvatar = appMode === 'chat' ? chatAvatar : socialAvatar
    const activeBio = appMode === 'chat' ? chatBio : socialBio

    return (
      <ScrollView style={styles.content}>
        <View style={styles.profileScreen}>
          <View style={[
            styles.profileAvatar,
            { backgroundColor: isDayMode ? '#e4e4e7' : '#1e1e2d' },
            isPremiumUser && { borderWidth: 3, borderColor: '#ffd700', shadowColor: '#ffd700', shadowOpacity: 0.8, shadowRadius: 10, elevation: 8 }
          ]}>
            <Text style={[styles.profileAvatarText, { fontSize: 32 }, isPremiumUser && { color: '#ffd700' }]}>
              {activeAvatar || (activeUsername?.[0] || 'U').toUpperCase()}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <Text style={[styles.profileName, { color: theme.text }, isPremiumUser && { color: '#ffd700' }]}>@{activeUsername}</Text>
            {isPremiumUser && (
              <View style={{ backgroundColor: '#ffd70020', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 0.5, borderColor: '#ffd70050' }}>
                <Text style={{ color: '#ffd700', fontSize: 10, fontWeight: '800' }}>PREMIUM</Text>
              </View>
            )}
          </View>
          <Text style={[styles.profileBio, { color: theme.subText }, isPremiumUser && { color: '#d4af37' }]}>
            {activeBio}
          </Text>
          <View style={styles.profileStats}>
            {[
              { label: 'Posts', value: posts.length.toString() },
              { label: 'Followers', value: '0' },
              { label: 'VOID', value: VOIDBalance.toString() },
            ].map((stat, i) => (
              <View key={i} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {[
            { icon: 'redeem', label: t('refer'), action: () => setActiveTab('refer') },
            { icon: 'security', label: t('privacySecurity'), action: () => { setShowPrivacySettings(true) } },
            { icon: 'settings', label: t('account'), action: handleOpenAccountSettings },
            { icon: 'logout', label: t('logout'), action: handleLogout },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.profileMenuItem}
              onPress={item.action}
            >
              <Icon name={item.icon} size={20} color={theme.primary} forceEmoji={true} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }, isLargeScreen && { maxWidth: '100%', borderLeftWidth: 0, borderRightWidth: 0 }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {isLargeScreen ? (
        <View style={styles.splitLayoutContainer}>
          {/* Left Sidebar */}
          <View style={styles.sidebarContainer}>
            {/* Sidebar Branding Header */}
            {renderHeader(false)}

            {/* Sidebar Navigation */}
            <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a24', gap: 6 }}>
              {[
                { id: 'feed', icon: 'home', label: 'Feed' },
                { id: 'reels', icon: 'smart_display', label: 'Reels' },
                { id: 'inbox', icon: 'inbox', label: 'Inbox' },
                { id: 'settings', icon: 'settings', label: 'Settings' },
                { id: 'profile', icon: 'person', label: 'Profile' },
                { id: 'refer', icon: 'redeem', label: 'Refer & Earn' },
              ].map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    marginHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: activeTab === tab.id ? '#161622' : 'transparent',
                    gap: 12,
                  }}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Icon
                    name={tab.icon}
                    size={20}
                    color={activeTab === tab.id ? '#c8ff00' : '#8b8ba7'}
                    forceEmoji={true}
                  />
                  <Text style={{
                    color: activeTab === tab.id ? '#c8ff00' : '#f0f0ff',
                    fontSize: 14,
                    fontWeight: '700',
                  }}>
                    {t(tab.id) || tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Contextual Sidebar Content */}
            <View style={{ flex: 1 }}>
              {activeTab === 'inbox' && renderInboxContent()}
              {activeTab === 'settings' && renderSettingsContent()}
              {activeTab === 'profile' && renderProfileContent()}
              {(activeTab === 'feed' || activeTab === 'reels' || activeTab === 'refer') && (
                <View style={{ padding: 16, margin: 12, backgroundColor: '#0e0e14', borderRadius: 16, borderStyle: 'solid', borderWidth: 1, borderColor: '#1e1e2c', gap: 12 }}>
                  <Text style={{ color: '#ffd700', fontSize: 13, fontWeight: '800' }}>👑 VOID DASHBOARD</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#8b8ba7', fontSize: 12 }}>Your Balance</Text>
                    <Text style={{ color: '#c8ff00', fontSize: 18, fontWeight: '900' }}>{VOIDBalance} VOID</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#8b8ba7', fontSize: 12 }}>Estimated Value</Text>
                    <Text style={{ color: '#f0f0ff', fontSize: 14, fontWeight: '700' }}>Rs. {pkrValue}</Text>
                  </View>
                  <TouchableOpacity
                    style={{ backgroundColor: '#0a1600', paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#c8ff0030', alignItems: 'center', marginTop: 4 }}
                    onPress={() => setShowWallet(true)}
                  >
                    <Text style={{ color: '#c8ff00', fontSize: 12, fontWeight: '800' }}>Open Wallet</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Right Main Panel */}
          <View style={styles.mainContentContainer}>
            {activeTab === 'feed' && renderFeedContent()}
            {activeTab === 'reels' && <ReelsScreen />}
            {activeTab === 'refer' && <ReferScreen />}
            {activeTab === 'inbox' && (
              <View style={{ flex: 1 }}>
                {showChat ? (
                  <ChatScreen
                    contact={showChat}
                    onBack={() => setShowChat(false)}
                    onViewProfile={(profile) => setSelectedUserProfile(profile)}
                    blockedUsers={currentUserBlockedList}
                    messageTextSize={messageTextSize}
                    chatWallpaper={chatWallpaper}
                    nameColor={nameColor}
                    onBlockToggle={(id) => handleToggleBlock(id, '')}
                    onLockToggle={handleLockToggle}
                    onChangeAvatar={handleChangeAvatar}
                    isLocked={secretChatIds.includes(showChat?.id)}
                    onAddGroupMember={handleAddGroupMember}
                    isDayMode={isDayMode}
                  />
                ) : (
                  <View style={styles.desktopPlaceholder}>
                    <Icon name="lock" size={64} color="#1c1c28" forceEmoji={true} />
                    <Text style={styles.desktopPlaceholderText}>Select a conversation to start chat</Text>
                    <Text style={styles.desktopPlaceholderSubtext}>All messages are end-to-end encrypted and shielded by VOID</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      ) : (
        <>
          {/* Mobile Header Wrapper */}
          <View style={[styles.headerWrapper, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
            {renderHeader(true)}
            {/* Chat/Social Mode Toggle Row */}
            <View style={[styles.modeToggleRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.modeToggleFullBtn, appMode === 'chat' && styles.modeToggleFullActive]}
                onPress={() => handleModeChange('chat')}
              >
                <Text style={styles.modeToggleFullIcon}>💬</Text>
                <Text style={[styles.modeToggleFullText, appMode === 'chat' && { color: theme.primary }]}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeToggleFullBtn, appMode === 'social' && styles.modeToggleFullActive]}
                onPress={() => handleModeChange('social')}
              >
                <Text style={styles.modeToggleFullIcon}>🌐</Text>
                <Text style={[styles.modeToggleFullText, appMode === 'social' && { color: theme.primary }]}>Social</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mobile Main Content View */}
          <View style={{ flex: 1 }}>
            {activeTab === 'feed' && renderFeedContent()}
            {activeTab === 'reels' && <ReelsScreen />}
            {activeTab === 'inbox' && renderInboxContent()}
            {activeTab === 'settings' && renderSettingsContent()}
            {activeTab === 'refer' && <ReferScreen />}
            {activeTab === 'profile' && renderProfileContent()}
          </View>

          {/* Mobile Bottom Nav */}
          <View style={[styles.bottomNav, { backgroundColor: theme.cardBg, borderTopColor: theme.border, paddingBottom: Math.max(10, insets.bottom) }]}>
            {[
              { id: 'feed', icon: 'home', label: 'Feed' },
              { id: 'reels', icon: 'smart_display', label: 'Reels' },
              { id: 'streak', icon: 'camera_alt', label: '', special: true },
              { id: 'inbox', icon: 'inbox', label: 'Inbox' },
              { id: 'settings', icon: 'settings', label: 'Settings' },
            ].filter(tab => appMode === 'social' || (tab.id !== 'feed' && tab.id !== 'reels' && tab.id !== 'streak'))
             .map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.navBtn, tab.special && styles.navSpecial]}
                onPress={() => {
                  if (tab.id === 'streak') {
                    setShowStreak(true)
                  } else {
                    setActiveTab(tab.id)
                  }
                }}
              >
                <Icon
                  name={tab.icon}
                  size={tab.special ? 26 : 22}
                  color={
                    tab.special
                      ? '#050608'
                      : activeTab === tab.id
                      ? theme.primary
                      : theme.subText
                  }
                  style={tab.special ? {} : undefined}
                />
                {!tab.special && (
                  <Text style={[
                    styles.navLabel,
                    { color: theme.subText },
                    activeTab === tab.id && styles.navLabelActive,
                    activeTab === tab.id && { color: theme.primary }
                  ]}>
                    {t(tab.id)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Create Post Modal */}
      <Modal visible={showCreate} animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={styles.cancelBtn}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Post</Text>
            <TouchableOpacity
              style={[styles.postBtn, posting && { opacity: 0.6 }]}
              onPress={handlePost}
              disabled={posting}
            >
              <Text style={styles.postBtnText}>
                {posting ? 'Posting...' : 'Post +40 VOID'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Unified Smart Post Input ── */}
          <View style={{ padding: 16, gap: 12 }}>

            {/* Gallery Image Picker Button */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 12,
                borderRadius: 14,
                gap: 8,
              }}
              onPress={async () => {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
                if (permissionResult.granted === false) {
                  Alert.alert('Permission Denied', 'Permission to access gallery is required.')
                  return
                }
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  quality: 0.8,
                })
                if (!result.canceled && result.assets && result.assets.length > 0) {
                  const imageUri = result.assets[0].uri
                  setPostType('image')
                  setMediaUrl(imageUri)
                  setUrlPreview({ type: 'image', url: imageUri })
                  Alert.alert('Success', 'Photo attached successfully!')
                }
              }}
            >
              <Icon name="photo_camera" size={18} color={theme.primary} />
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>
                {postType === 'image' && mediaUrl ? 'Change Photo' : 'Attach Photo from Gallery'}
              </Text>
            </TouchableOpacity>

            {/* Main text input — handles text, URLs, image/video links */}
            <TextInput
              style={[styles.modalTextInput, { minHeight: 120 }]}
              placeholder={"What's on your mind?\n\nTip: Paste any URL — image, video, article link — and it will auto-preview!"}
              placeholderTextColor="#3a3a5a"
              value={postContent}
              onChangeText={(text) => {
                setPostContent(text)
                // Auto-detect URL in typed text
                const urlMatch = text.match(/https?:\/\/[^\s]+/)
                if (urlMatch) {
                  const detectedUrl = urlMatch[0]
                  // Check if it's an image URL
                  if (/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(detectedUrl)) {
                    setPostType('image')
                    setMediaUrl(detectedUrl)
                    setUrlPreview({ type: 'image', url: detectedUrl })
                  }
                  // Check if it's a video URL
                  else if (/\.(mp4|webm|mov)(\?.*)?$/i.test(detectedUrl) || detectedUrl.includes('youtube.com') || detectedUrl.includes('youtu.be')) {
                    setPostType('video')
                    setMediaUrl(detectedUrl)
                    setUrlPreview({ type: 'video', url: detectedUrl })
                  }
                  // Otherwise fetch link preview
                  else if (!urlPreview || urlPreview.url !== detectedUrl) {
                    setPostType('link')
                    setLinkUrl(detectedUrl)
                    setFetchingPreview(true)
                    setUrlPreview(null)
                    fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(detectedUrl)}`)
                      .then(r => r.json())
                      .then(data => {
                        const html = data.contents || ''
                        const titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i) ||
                                          html.match(/<title[^>]*>([^<]*)<\/title>/i)
                        const descMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i) ||
                                          html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
                        const imgMatch  = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i)
                        setUrlPreview({
                          type: 'link',
                          url: detectedUrl,
                          title: titleMatch?.[1] || detectedUrl,
                          description: descMatch?.[1] || '',
                          image: imgMatch?.[1] || null,
                        })
                      })
                      .catch(() => setUrlPreview({ type: 'link', url: detectedUrl, title: detectedUrl, description: '', image: null }))
                      .finally(() => setFetchingPreview(false))
                  }
                } else {
                  // No URL — reset to text
                  setPostType('text')
                  setMediaUrl('')
                  setLinkUrl('')
                  if (urlPreview) setUrlPreview(null)
                }
              }}
              multiline
              maxLength={1000}
            />

            {/* URL Preview Card */}
            {fetchingPreview && (
              <View style={styles.urlPreviewCard}>
                <Text style={{ color: '#4b5563', fontSize: 12 }}>🔍 Fetching link preview...</Text>
              </View>
            )}

            {urlPreview && !fetchingPreview && (
              <View style={styles.urlPreviewCard}>
                <TouchableOpacity
                  style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                  onPress={() => { setUrlPreview(null); setPostType('text'); setMediaUrl(''); setLinkUrl('') }}
                >
                  <Text style={{ color: '#4b5563', fontSize: 16 }}>✕</Text>
                </TouchableOpacity>

                {urlPreview.type === 'image' && (
                  <Image source={{ uri: urlPreview.url }} style={{ width: '100%', height: 160, borderRadius: 10 }} resizeMode="cover" />
                )}

                {urlPreview.type === 'video' && (
                  <View style={{ backgroundColor: '#0a0a10', borderRadius: 10, height: 80, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 32 }}>▶️</Text>
                    <Text style={{ color: '#8b8ba7', fontSize: 11, marginTop: 4 }} numberOfLines={1}>{urlPreview.url}</Text>
                  </View>
                )}

                {urlPreview.type === 'link' && (
                  <View style={{ gap: 6 }}>
                    {urlPreview.image ? (
                      <Image source={{ uri: urlPreview.image }} style={{ width: '100%', height: 130, borderRadius: 10 }} resizeMode="cover" />
                    ) : null}
                    <Text style={{ color: '#c8ff00', fontSize: 13, fontWeight: '700' }} numberOfLines={2}>{urlPreview.title}</Text>
                    {urlPreview.description ? (
                      <Text style={{ color: '#8b8ba7', fontSize: 11 }} numberOfLines={2}>{urlPreview.description}</Text>
                    ) : null}
                    <Text style={{ color: '#3a3a5a', fontSize: 10 }} numberOfLines={1}>{urlPreview.url}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Icon hints row */}
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', paddingVertical: 4 }}>
              <Text style={{ color: '#3a3a5a', fontSize: 11, flex: 1 }}>Supports:</Text>
              {['Text', 'Image', 'Video', 'Link'].map((label) => (
                <View key={label} style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#3a3a5a', fontSize: 12, fontWeight: '600' }}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Anonymous toggle */}
            <TouchableOpacity
              style={[styles.anonToggle, isAnonymous && styles.anonToggleActive]}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <Text>{isAnonymous ? '🕵️' : '👤'}</Text>
              <Text style={[styles.anonText, isAnonymous && { color: '#a5b4fc' }]}>
                {isAnonymous ? 'Anonymous Mode ON' : 'Public Post'}
              </Text>
            </TouchableOpacity>

            <View style={styles.VOIDInfoCard}>
              <Text style={styles.VOIDInfoTitle}>⚡ Post & earn VOID!</Text>
              <Text style={styles.VOIDInfoItem}>📝 Post → +40 VOID</Text>
              <Text style={styles.VOIDInfoItem}>❤️ Likes received → +2 VOID each</Text>
              <Text style={styles.VOIDInfoItem}>💬 Comments received → +5 VOID each</Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* User Profile Detail Modal (WhatsApp style) */}
      <Modal visible={!!selectedUserProfile} animationType="slide" transparent={true} onRequestClose={() => setSelectedUserProfile(null)}>
        <View style={styles.profileModalOverlay}>
          <View style={styles.profileModalContent}>
            
            {/* Header */}
            <View style={styles.profileModalHeader}>
              <TouchableOpacity onPress={() => setSelectedUserProfile(null)}>
                <Text style={styles.profileModalClose}>✕ Close</Text>
              </TouchableOpacity>
              <Text style={styles.profileModalTitle}>
                {selectedUserProfile?.isAnonymous ? 'Anonymous Profile' : 'User Profile'}
              </Text>
              <View style={{ width: 50 }} />
            </View>

            {/* Profile Card */}
            <ScrollView contentContainerStyle={styles.profileModalBody}>
              <View style={styles.profileModalAvatarContainer}>
                <View style={[styles.profileModalAvatar, selectedUserProfile?.isAnonymous && { borderColor: '#374151' }]}>
                  <Text style={[styles.profileModalAvatarText, selectedUserProfile?.isAnonymous && { color: '#6b7280' }]}>
                    {selectedUserProfile?.isAnonymous ? '?' : (selectedUserProfile?.username?.[0]?.toUpperCase() || selectedUserProfile?.name?.[0]?.toUpperCase() || '?')}
                  </Text>
                </View>
              </View>

              <Text style={styles.profileModalUsername}>
                {selectedUserProfile?.isAnonymous ? '🕵️ Anonymous User' : `@${selectedUserProfile?.username || selectedUserProfile?.name}`}
              </Text>
              
              <Text style={styles.profileModalBio}>
                {selectedUserProfile?.isAnonymous 
                  ? "Posts by blocked anonymous users will be hidden from your feed." 
                  : (selectedUserProfile?.bio || 'No bio yet • Privacy first 🔐')}
              </Text>

              {/* Stats - Hide if anonymous */}
              {!selectedUserProfile?.isAnonymous && (
                <View style={styles.profileModalStats}>
                  <View style={styles.profileModalStatItem}>
                    <Text style={styles.profileModalStatValue}>
                      {selectedUserProfile?.followers?.length || 0}
                    </Text>
                    <Text style={styles.profileModalStatLabel}>Followers</Text>
                  </View>
                  <View style={styles.profileModalStatItem}>
                    <Text style={styles.profileModalStatValue}>
                      {selectedUserProfile?.following?.length || 0}
                    </Text>
                    <Text style={styles.profileModalStatLabel}>Following</Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.profileModalActions}>
                <TouchableOpacity
                  style={[
                    styles.profileModalBlockBtn,
                    currentUserBlockedList.includes(selectedUserProfile?._id || selectedUserProfile?.id) && styles.profileModalUnblockBtn
                  ]}
                  onPress={() => handleToggleBlock(selectedUserProfile?._id || selectedUserProfile?.id, selectedUserProfile?.username || selectedUserProfile?.name)}
                >
                  <Text style={[
                    styles.profileModalBlockBtnText,
                    currentUserBlockedList.includes(selectedUserProfile?._id || selectedUserProfile?.id) && { color: '#34d399' }
                  ]}>
                    {currentUserBlockedList.includes(selectedUserProfile?._id || selectedUserProfile?.id) ? '🔓 Unblock User' : '🚫 Block User'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal
        visible={!!showChat}
        animationType="slide"
        onRequestClose={() => setShowChat(false)}
      >
        <ChatScreen
          contact={showChat}
          onBack={() => setShowChat(false)}
          onViewProfile={(profile) => setSelectedUserProfile(profile)}
          blockedUsers={currentUserBlockedList}
          messageTextSize={messageTextSize}
          chatWallpaper={chatWallpaper}
          nameColor={nameColor}
          onBlockToggle={(id) => handleToggleBlock(id, '')}
          onLockToggle={handleLockToggle}
          onChangeAvatar={handleChangeAvatar}
          isLocked={secretChatIds.includes(showChat?.id)}
          onAddGroupMember={handleAddGroupMember}
          isDayMode={isDayMode}
        />
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={showNotifs} animationType="slide" onRequestClose={() => setShowNotifs(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotifs(false)}>
              <Text style={styles.cancelBtn}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Notifications</Text>
            <View style={{ width: 60 }} />
          </View>
          <NotificationsScreen />
        </SafeAreaView>
      </Modal>

      {/* Send Streak Modal */}
      <Modal visible={showStreak} animationType="slide" onRequestClose={() => setShowStreak(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStreak(false)}>
              <Text style={styles.cancelBtn}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: '#fffc00' }]}>Send Streak 🔥</Text>
            <TouchableOpacity
              style={[styles.postBtn, { backgroundColor: '#fffc00' }, sendingStreak && { opacity: 0.6 }]}
              onPress={handleSendStreak}
              disabled={sendingStreak}
            >
              <Text style={[styles.postBtnText, { color: '#050608' }]}>
                {sendingStreak ? 'Sending...' : 'Send 🔥'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: 16, gap: 12, flex: 1 }}>
            {/* Search Friends */}
            <TextInput
              style={[styles.modalTextInputSmall, { backgroundColor: '#13131a', color: '#fff', padding: 12, borderRadius: 14 }]}
              placeholder="🔍 Search friends for Streak..."
              placeholderTextColor="#4b5563"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Streak Type Selector */}
            <View style={styles.tabBar}>
              {[
                { type: 'text', label: '📝 Text Snap' },
                { type: 'image', label: '📸 Photo Snap' }
              ].map(t => (
                <TouchableOpacity
                  key={t.type}
                  style={[styles.tabButton, streakType === t.type && [styles.tabButtonActive, { backgroundColor: '#fffc00', borderColor: '#fffc00' }]]}
                  onPress={() => setStreakType(t.type)}
                >
                  <Text style={[styles.tabButtonText, streakType === t.type && { color: '#050608', fontWeight: '900' }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Content Input */}
            {streakType === 'text' && (
              <View style={{ gap: 8 }}>
                <TextInput
                  style={[styles.modalTextInputSmall, { height: 60 }]}
                  placeholder="Streak message (e.g. 🔥 Streak!)"
                  placeholderTextColor="#4b5563"
                  value={streakContent}
                  onChangeText={setStreakContent}
                  maxLength={100}
                />
                
                {/* Suggestions */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {['🔥 Streak!', 'Good morning! ☀️', 'Daily Snap! 📸', 'Locked In 🔐'].map((s, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={{ backgroundColor: '#13131a', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#1e1e2c' }}
                      onPress={() => setStreakContent(s)}
                    >
                      <Text style={{ color: '#8b8ba7', fontSize: 11 }}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {streakType === 'image' && (
              <View style={{ gap: 8 }}>
                <TextInput
                  style={styles.modalTextInputSmall}
                  placeholder="Paste Image URL (e.g. https://...)"
                  placeholderTextColor="#4b5563"
                  value={streakImage}
                  onChangeText={setStreakImage}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                {streakImage.trim() ? (
                  <View style={{ height: 100, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#1e1e2c' }}>
                    <Image source={{ uri: streakImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </View>
                ) : null}
              </View>
            )}

            <Text style={{ color: '#fffc00', fontSize: 13, fontWeight: '800', marginTop: 10 }}>Select Friends:</Text>
            
            {/* Friends list scrollable */}
            <ScrollView style={{ flex: 1 }}>
              {[
                ...users.map(u => ({ id: u._id, name: `@${u.username}`, isReal: true, streak: u.streakDays || 0 })),
                { id: '3', name: 'Anonymous_42', isReal: false, streak: 23 },
                { id: '4', name: 'Ali Bhai', isReal: false, streak: 8 }
              ]
                .filter(friend => friend.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(friend => {
                  const isSelected = selectedStreakUsers.includes(friend.id)
                  return (
                    <TouchableOpacity
                      key={friend.id}
                      style={[
                        styles.chatItem, 
                        { 
                          backgroundColor: isSelected ? '#1e1c0e' : '#0e0e14', 
                          borderRadius: 14, 
                          marginBottom: 8, 
                          borderWidth: 1, 
                          borderColor: isSelected ? '#fffc0040' : '#1e1e2c' 
                        }
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedStreakUsers(prev => prev.filter(id => id !== friend.id))
                        } else {
                          setSelectedStreakUsers(prev => [...prev, friend.id])
                        }
                      }}
                    >
                      <View style={[styles.chatAvatar, { backgroundColor: '#fffc0020', borderWidth: 1, borderColor: '#fffc00' }]}>
                        <Text style={[styles.avatarText, { color: '#fffc00' }]}>
                          {friend.name.replace('@', '')[0]?.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.chatInfo}>
                        <Text style={styles.chatName}>{friend.name}</Text>
                        <Text style={{ color: '#ff9c00', fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                          🔥 {friend.streak} Days Streak
                        </Text>
                      </View>
                      <View style={{
                        width: 22, height: 22, borderRadius: 11, 
                        borderWidth: 2, borderColor: isSelected ? '#fffc00' : '#4b5563',
                        justifyContent: 'center', alignItems: 'center',
                        backgroundColor: isSelected ? '#fffc00' : 'transparent'
                      }}>
                        {isSelected && <Text style={{ color: '#050608', fontSize: 10, fontWeight: '900' }}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  )
                })}
            </ScrollView>

            <View style={[styles.VOIDInfoCard, { borderColor: '#fffc0030', backgroundColor: '#131100' }]}>
              <Text style={[styles.VOIDInfoTitle, { color: '#fffc00' }]}>⚡ Streak Rewards!</Text>
              <Text style={styles.VOIDInfoItem}>• Send a daily text/photo to friends to maintain the streak.</Text>
              <Text style={styles.VOIDInfoItem}>• Streak message pays standard coins + multiplier bonuses!</Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Wallet Modal */}
      <Modal visible={showWallet} animationType="slide" onRequestClose={() => setShowWallet(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowWallet(false)}>
              <Text style={styles.cancelBtn}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>VOID Wallet ⚡</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView style={styles.content}>
            <View style={{ padding: 16, gap: 12 }}>
              <View style={styles.walletCard}>
                <Text style={styles.walletLabel}>⚡ VOID Balance</Text>
                <Text style={styles.walletBalance}>{VOIDBalance} VOID</Text>
                <Text style={styles.walletPKR}>≈ {pkrValue} PKR</Text>
                <View style={styles.walletBtns}>
                  <TouchableOpacity style={styles.walletBtn}>
                    <Text style={styles.walletBtnText}>↑ Send</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.walletBtn}>
                    <Text style={styles.walletBtnText}>↓ Receive</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.walletBtn, styles.cashoutBtn]}>
                    <Text style={[styles.walletBtnText, styles.cashoutText]}>
                      💰 Cashout
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.miningCard}>
                <Text style={styles.miningTitle}>⛏️ VOID Mining Active!</Text>
                <Text style={styles.miningPoints}>{VOIDBalance} Points</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '8%' }]} />
                </View>
                <Text style={styles.miningNote}>
                  8.2M / 100M users — Real Coins at launch! 🚀
                </Text>
              </View>

              {/* Refer Section */}
              <View style={styles.referMiniCard}>
                <Text style={styles.referTitle}>🎁 Refer Code</Text>
                <Text style={styles.referCode}>{referCode}</Text>
                <TouchableOpacity
                  style={styles.referBtn}
                  onPress={() => {
                    setShowWallet(false)
                    setActiveTab('refer')
                  }}
                >
                  <Text style={styles.referBtnText}>
                    Full Refer Dashboard →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Account Settings Modal */}
      <Modal visible={showAccountModal} animationType="slide" onRequestClose={() => setShowAccountModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAccountModal(false)}>
              <Text style={styles.cancelBtn}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Account Settings</Text>
            <TouchableOpacity style={styles.postBtn} onPress={handleSaveProfile}>
              <Text style={styles.postBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, gap: 16 }}>
            {/* Avatar Selector */}
            <View style={{ alignItems: 'center', marginBottom: 10, marginTop: 5 }}>
              <TouchableOpacity 
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: isDayMode ? '#e4e4e7' : '#1e1e2d',
                  borderWidth: 1,
                  borderColor: theme.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative'
                }}
                onPress={() => setShowAvatarPicker(true)}
              >
                <Text style={{ fontSize: 36 }}>{tempAvatar || '💬'}</Text>
                <View style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: theme.primary,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: isDayMode ? '#ffffff' : '#0e0e14'
                }}>
                  <Icon name="photo_camera" size={12} color="#000000" />
                </View>
              </TouchableOpacity>
              <Text style={{ color: theme.subText, fontSize: 11, marginTop: 6 }}>Tap to change profile avatar</Text>
            </View>

            {/* Name fields */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: '#c8ff00', fontSize: 13, fontWeight: '800' }}>Your name</Text>
              <TextInput
                style={styles.modalTextInputSmall}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter First Name"
                placeholderTextColor="#4b5563"
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ color: '#c8ff00', fontSize: 13, fontWeight: '800' }}>Last name</Text>
              <TextInput
                style={styles.modalTextInputSmall}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter Last Name"
                placeholderTextColor="#4b5563"
              />
            </View>

            {/* Bio */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: '#c8ff00', fontSize: 13, fontWeight: '800' }}>Bio</Text>
              <TextInput
                style={styles.modalTextInputSmall}
                value={bioText}
                onChangeText={setBioText}
                placeholder="Write something about yourself..."
                placeholderTextColor="#4b5563"
              />
            </View>

            {/* User Info (email/phone) */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: '#c8ff00', fontSize: 13, fontWeight: '800' }}>Email/Phone Number</Text>
              <TextInput
                style={[styles.modalTextInputSmall, { color: '#8b8ba7' }]}
                value={currentUser?.email || ''}
                editable={false}
                placeholder="No email/phone linked"
                placeholderTextColor="#4b5563"
              />
            </View>

            {/* Username */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: '#c8ff00', fontSize: 13, fontWeight: '800' }}>Add username</Text>
              <TextInput
                style={styles.modalTextInputSmall}
                value={usernameText}
                onChangeText={setUsernameText}
                placeholder="Add username"
                placeholderTextColor="#4b5563"
              />
            </View>

            {/* Birthday */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: '#c8ff00', fontSize: 13, fontWeight: '800' }}>Birthday</Text>
              <TextInput
                style={styles.modalTextInputSmall}
                value={birthdayText}
                onChangeText={setBirthdayText}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#4b5563"
              />
            </View>

            {/* Add Account */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: '#0e0e14',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#1e1e2c',
                marginTop: 10,
              }}
              onPress={() => Alert.alert('Add Account', 'Create or log in to another account feature coming soon!')}
            >
              <Text style={{ fontSize: 18, marginRight: 10 }}>➕</Text>
              <Text style={{ color: '#f0f0ff', fontSize: 15, fontWeight: '600', flex: 1 }}>Add Account</Text>
              <Text style={{ color: '#3a3a5a', fontSize: 18 }}>›</Text>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: '#ef444415',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#ef444430',
                marginTop: 4,
              }}
              onPress={() => {
                setShowAccountModal(false)
                handleLogout()
              }}
            >
              <Text style={{ fontSize: 18, marginRight: 10 }}>🚪</Text>
              <Text style={{ color: '#f87171', fontSize: 15, fontWeight: '800', flex: 1 }}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Chat Settings Modal */}
      <Modal visible={showChatSettings} animationType="slide" onRequestClose={() => setShowChatSettings(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
          <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowChatSettings(false)}>
              <Text style={[styles.cancelBtn, { color: theme.primary }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Chat Settings</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, gap: 16 }}>
            {/* 1. Message Text Size */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Message Text Size</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 }}>
                <TouchableOpacity
                  style={[styles.sizeBtn, { borderColor: theme.border }]}
                  onPress={() => setMessageTextSize(p => Math.max(12, p - 1))}
                >
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>-</Text>
                </TouchableOpacity>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' }}>
                  {messageTextSize} px
                </Text>
                <TouchableOpacity
                  style={[styles.sizeBtn, { borderColor: theme.border }]}
                  onPress={() => setMessageTextSize(p => Math.min(24, p + 1))}
                >
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Change Chat Wallpaper */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Chat Wallpaper</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginTop: 8 }}>
                {[
                  { id: 'classic_dark', label: 'Classic Dark', color: '#0a0a0f' },
                  { id: 'solid_gray', label: 'Solid Gray', color: '#27272a' },
                  { id: 'neon_glow', label: 'Neon Glow', color: '#120024' },
                  { id: 'emerald_deep', label: 'Emerald Deep', color: '#021e10' },
                  { id: 'pastel_blue', label: 'Ocean Blue', color: '#0a1c2a' },
                  { id: 'aura_purple', label: 'Mystic Aura', color: '#1c052e' },
                  { id: 'sunset_dark', label: 'Sunset Crimson', color: '#24040a' },
                ].map(wp => (
                  <TouchableOpacity
                    key={wp.id}
                    style={[
                      styles.wallpaperPresetBtn,
                      { backgroundColor: wp.color, borderColor: chatWallpaper === wp.id ? theme.primary : theme.border }
                    ]}
                    onPress={() => setChatWallpaper(wp.id)}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{wp.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 3. Change Name Colour */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Name Color</Text>
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                {[
                  { color: '#c8ff00', label: 'Lime' },
                  { color: '#38bdf8', label: 'Sky' },
                  { color: '#facc15', label: 'Sunset' },
                  { color: '#f43f5e', label: 'Coral' },
                  { color: '#a855f7', label: 'Purple' },
                ].map(item => (
                  <TouchableOpacity
                    key={item.color}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: item.color, borderColor: nameColor === item.color ? '#ffffff' : 'transparent' }
                    ]}
                    onPress={() => setNameColor(item.color)}
                  />
                ))}
              </View>
            </View>

            {/* 4. Colour Theme */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>App Colour Theme</Text>
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                {[
                  { color: '#c8ff00', label: 'Volt' },
                  { color: '#00f0ff', label: 'Aqua' },
                  { color: '#ff007f', label: 'Pink' },
                  { color: '#ffd700', label: 'Gold' },
                  { color: '#10b981', label: 'Emerald' },
                ].map(item => (
                  <TouchableOpacity
                    key={item.color}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: item.color, borderColor: themeColor === item.color ? '#ffffff' : 'transparent' }
                    ]}
                    onPress={() => setThemeColor(item.color)}
                  />
                ))}
              </View>
            </View>

            {/* 5. Switch to Day Mode */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Day Mode</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleSwitch,
                    { backgroundColor: isDayMode ? theme.primary : '#3f3f46' }
                  ]}
                  onPress={() => setIsDayMode(!isDayMode)}
                >
                  <View style={[styles.toggleKnob, { transform: [{ translateX: isDayMode ? 20 : 2 }] }]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 6. Browse Theme presets */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Browse Themes</Text>
              <View style={{ gap: 8, marginTop: 8 }}>
                {[
                  { label: 'Cyberpunk Neon', primary: '#ff007f', name: '#00f0ff', wallpaper: 'neon_glow', dayMode: false },
                  { label: 'Deep Emerald', primary: '#10b981', name: '#c8ff00', wallpaper: 'emerald_deep', dayMode: false },
                  { label: 'Solarized Gold', primary: '#ffd700', name: '#f43f5e', wallpaper: 'solid_gray', dayMode: true },
                  { label: 'Ocean Breeze', primary: '#0ea5e9', name: '#38bdf8', wallpaper: 'pastel_blue', dayMode: false },
                  { label: 'Aura Purple', primary: '#a855f7', name: '#f43f5e', wallpaper: 'aura_purple', dayMode: false },
                  { label: 'Sunset Glow', primary: '#f97316', name: '#e11d48', wallpaper: 'sunset_dark', dayMode: false },
                  { label: 'Monochrome Slate', primary: '#9ca3af', name: '#f3f4f6', wallpaper: 'classic_dark', dayMode: false },
                ].map((combo, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.themeOptionRow, { borderColor: theme.border }]}
                    onPress={() => {
                      setThemeColor(combo.primary)
                      setNameColor(combo.name)
                      setChatWallpaper(combo.wallpaper)
                      setIsDayMode(combo.dayMode)
                      Alert.alert('Theme Applied', `${combo.label} theme activated!`)
                    }}
                  >
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700', flex: 1 }}>{combo.label}</Text>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: combo.primary }} />
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: combo.name }} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 7. In-App Browser Toggle */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>In-App Browser</Text>
                  <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2 }}>
                    Open links directly inside the app instead of default browser.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleSwitch,
                    { backgroundColor: useInAppBrowser ? theme.primary : '#3f3f46' }
                  ]}
                  onPress={() => setUseInAppBrowser(!useInAppBrowser)}
                >
                  <View style={[styles.toggleKnob, { transform: [{ translateX: useInAppBrowser ? 20 : 2 }] }]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 8. App Icon Changer */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>App Icon</Text>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, justifyContent: 'space-around' }}>
                {[
                  { id: 'default', label: 'Default', bg: '#060608', fg: '#c8ff00', labelStyle: {} },
                  { id: 'vintage', label: 'Vintage', bg: '#3e2723', fg: '#ffe082', labelStyle: {} },
                  { id: 'aqua', label: 'Aqua', bg: '#004d40', fg: '#00e5ff', labelStyle: {} },
                  { id: 'premium', label: 'Premium', bg: '#111111', fg: '#ffd700', labelStyle: { color: '#ffd700', fontWeight: '800' }, isPremium: true },
                ].map(icon => (
                  <TouchableOpacity
                    key={icon.id}
                    style={{ alignItems: 'center', gap: 6 }}
                    onPress={() => {
                      if (icon.isPremium) {
                        Alert.alert('👑 VOID Premium', 'Upgrade to VOID Premium to unlock this exclusive luxury app icon!')
                      } else {
                        setAppIconPreset(icon.id)
                        Alert.alert('App Icon Changed', `App icon set to ${icon.label}!`)
                      }
                    }}
                  >
                    <View style={[
                      styles.appIconPreviewTile,
                      {
                        backgroundColor: icon.bg,
                        borderColor: appIconPreset === icon.id ? theme.primary : '#3f3f46',
                        borderWidth: appIconPreset === icon.id ? 2.5 : 1.5,
                      }
                    ]}>
                      {icon.isPremium && (
                        <View style={styles.premiumIconCrownBadge}>
                          <Text style={{ fontSize: 9 }}>👑</Text>
                        </View>
                      )}
                      <Text style={{ color: icon.fg, fontSize: 20, fontWeight: '900', letterSpacing: 0.5 }}>V</Text>
                    </View>
                    <Text style={[{ color: theme.subText, fontSize: 11, fontWeight: '600' }, icon.labelStyle]}>
                      {icon.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Notification Settings Modal */}
      <Modal visible={showNotifSettings} animationType="slide" onRequestClose={() => setShowNotifSettings(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
          <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowNotifSettings(false)}>
              <Text style={[styles.cancelBtn, { color: theme.primary }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Notifications</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, gap: 16 }}>
            {/* 1. Message Notifications Section */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Message Notifications</Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>Show Notifications</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setNotifMessageShow(!notifMessageShow)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: notifMessageShow ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: notifMessageShow ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: notifMessageShow ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>Notification Sounds</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setNotifMessageSound(!notifMessageSound)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: notifMessageSound ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: notifMessageSound ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: notifMessageSound ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>Vibrate</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setNotifMessageVibrate(!notifMessageVibrate)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: notifMessageVibrate ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: notifMessageVibrate ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: notifMessageVibrate ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Group Notifications Section */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Group Notifications</Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>Show Notifications</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setNotifGroupShow(!notifGroupShow)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: notifGroupShow ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: notifGroupShow ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: notifGroupShow ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>Notification Sounds</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setNotifGroupSound(!notifGroupSound)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: notifGroupSound ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: notifGroupSound ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: notifGroupSound ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>Vibrate</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setNotifGroupVibrate(!notifGroupVibrate)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: notifGroupVibrate ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: notifGroupVibrate ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: notifGroupVibrate ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Call Notifications Section */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Call Notifications</Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>Ringtone</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setNotifCallRingtone(!notifCallRingtone)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: notifCallRingtone ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: notifCallRingtone ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: notifCallRingtone ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>Vibrate</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setNotifCallVibrate(!notifCallVibrate)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: notifCallVibrate ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: notifCallVibrate ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: notifCallVibrate ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. In-App Notifications Section */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>In-App Notifications</Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>In-App Sounds</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setNotifInAppSounds(!notifInAppSounds)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: notifInAppSounds ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: notifInAppSounds ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: notifInAppSounds ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>In-App Vibrate</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setNotifInAppVibrate(!notifInAppVibrate)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: notifInAppVibrate ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: notifInAppVibrate ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: notifInAppVibrate ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>In-App Previews</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setNotifInAppPreviews(!notifInAppPreviews)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: notifInAppPreviews ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: notifInAppPreviews ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: notifInAppPreviews ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 5. Reset Settings Option */}
            <TouchableOpacity
              style={{
                backgroundColor: theme.cardBg,
                borderColor: '#ef444450',
                borderWidth: 1,
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 8,
              }}
              onPress={() => {
                Alert.alert(
                  'Reset Notifications',
                  'Reset all notification settings to default?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Reset', style: 'destructive', onPress: () => {
                        setNotifMessageShow(true)
                        setNotifMessageSound(true)
                        setNotifMessageVibrate(true)
                        setNotifGroupShow(true)
                        setNotifGroupSound(true)
                        setNotifGroupVibrate(true)
                        setNotifCallRingtone(true)
                        setNotifCallVibrate(true)
                        setNotifInAppSounds(true)
                        setNotifInAppVibrate(true)
                        setNotifInAppPreviews(true)
                        Alert.alert('Reset Successful', 'All notification settings reset to defaults.')
                      }
                    }
                  ]
                )
              }}
            >
              <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 14 }}>Reset All Notification Settings</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Privacy & Security Settings Modal */}
      <Modal visible={showPrivacySettings} animationType="slide" onRequestClose={() => setShowPrivacySettings(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
          <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowPrivacySettings(false)}>
              <Text style={[styles.cancelBtn, { color: theme.primary }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Privacy & Security</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, gap: 16 }}>
            {/* 1. Two-step Verification */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Two-step Verification</Text>
              <Text style={{ color: theme.subText, fontSize: 12 }}>
                Require a 6-digit PIN when registering your phone number with VOID CHAT again.
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>
                  Status: {twoStepEnabled ? '🟢 Enabled' : '🔴 Disabled'}
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: twoStepEnabled ? '#ef444420' : 'rgba(255, 255, 255, 0.05)',
                    paddingHorizontal: 12, paddingVertical: 8,
                    borderRadius: 10, borderWidth: 1, borderColor: twoStepEnabled ? '#ef444480' : theme.border,
                  }}
                  onPress={() => {
                    if (twoStepEnabled) {
                      setTwoStepEnabled(false)
                      setTwoStepPin('')
                      Alert.alert('Disabled', 'Two-step verification has been disabled.')
                    } else {
                      Alert.alert(
                        'Set PIN',
                        'Two-step configuration request sent.',
                        [
                          { text: 'Cancel' },
                          {
                            text: 'Activate Default PIN',
                            onPress: () => {
                              setTwoStepPin('123456')
                              setTwoStepEnabled(true)
                              Alert.alert('Enabled', 'Two-step verification is now active with default PIN!')
                            }
                          }
                        ]
                      )
                    }
                  }}
                >
                  <Text style={{ color: twoStepEnabled ? '#ef4444' : theme.text, fontSize: 12, fontWeight: '700' }}>
                    {twoStepEnabled ? 'Disable' : 'Set PIN'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Auto-Delete Messages */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Auto-Delete Messages</Text>
              <Text style={{ color: theme.subText, fontSize: 12, marginBottom: 8 }}>
                Automatically self-destruct chat history after selected duration.
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {[
                  { id: 'off', label: 'Off' },
                  { id: '24h', label: '24 Hours' },
                  { id: '7d', label: '7 Days' },
                  { id: '30d', label: '1 Month' },
                ].map(timer => (
                  <TouchableOpacity
                    key={timer.id}
                    style={[
                      styles.wallpaperPresetBtn,
                      {
                        backgroundColor: autoDeleteTimer === timer.id ? theme.primary + '20' : 'rgba(255, 255, 255, 0.03)',
                        borderColor: autoDeleteTimer === timer.id ? theme.primary : theme.border,
                        paddingVertical: 8, paddingHorizontal: 12,
                      }
                    ]}
                    onPress={() => {
                      setAutoDeleteTimer(timer.id)
                      Alert.alert('Auto-Delete Updated', `Chat history will auto-delete after: ${timer.label}`)
                    }}
                  >
                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>{timer.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 3. Passcode Lock */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Passcode Lock</Text>
                  <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2 }}>
                    Require a passcode PIN to open the VOID CHAT app.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleSwitch,
                    { backgroundColor: passcodeEnabled ? theme.primary : '#3f3f46' }
                  ]}
                  onPress={() => {
                    if (passcodeEnabled) {
                      setPasscodeEnabled(false)
                      setPasscodePin('')
                      Alert.alert('Disabled', 'Passcode lock has been disabled.')
                    } else {
                      setPasscodePin('1234')
                      setPasscodeEnabled(true)
                      Alert.alert('App Locked', 'Passcode lock has been configured successfully!')
                    }
                  }}
                >
                  <View style={[styles.toggleKnob, { transform: [{ translateX: passcodeEnabled ? 20 : 2 }] }]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. Passkeys */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Passkeys (Biometrics)</Text>
                  <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2 }}>
                    Register cryptographic key with Windows Hello / FaceID / TouchID.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleSwitch,
                    { backgroundColor: passkeyEnabled ? theme.primary : '#3f3f46' }
                  ]}
                  onPress={() => {
                    if (!passkeyEnabled) {
                      setPasskeyEnabled(true)
                      Alert.alert('Success', 'Passkey successfully created on this device!')
                    } else {
                      setPasskeyEnabled(false)
                      Alert.alert('Removed', 'Biometric Passkey has been removed.')
                    }
                  }}
                >
                  <View style={[styles.toggleKnob, { transform: [{ translateX: passkeyEnabled ? 20 : 2 }] }]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 5. Blocked Users List */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Blocked Users ({currentUserBlockedList.length})</Text>
              <Text style={{ color: theme.subText, fontSize: 12, marginBottom: 8 }}>
                Contacts you block cannot call or message you.
              </Text>
              {currentUserBlockedList.length === 0 ? (
                <Text style={{ color: theme.subText, fontSize: 12, fontStyle: 'italic', paddingVertical: 4 }}>
                  No blocked contacts.
                </Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {currentUserBlockedList.map(blockedId => {
                    const matchedUser = chatModeChats.find(c => c.id === blockedId) || socialModeChats.find(c => c.id === blockedId)
                    const blockName = matchedUser ? matchedUser.name : `User #${blockedId}`
                    return (
                      <View key={blockedId} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                        <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{blockName}</Text>
                        <TouchableOpacity
                          style={{ backgroundColor: '#10b98120', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#10b98150' }}
                          onPress={() => handleToggleBlock(blockedId, blockName)}
                        >
                          <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '700' }}>Unblock</Text>
                        </TouchableOpacity>
                      </View>
                    )
                  })}
                </View>
              )}
            </View>

            {/* 6. Devices List (Active Sessions) */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Active Devices ({activeDevices.length})</Text>
              <Text style={{ color: theme.subText, fontSize: 12, marginBottom: 8 }}>
                Manage all device sessions currently logged in to your account.
              </Text>
              <View style={{ gap: 10 }}>
                {activeDevices.map(device => (
                  <View key={device.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{device.name}</Text>
                      <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2 }}>{device.location} • {device.status}</Text>
                    </View>
                    {device.id !== '1' && (
                      <TouchableOpacity
                        style={{ backgroundColor: '#ef444415', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#ef444430' }}
                        onPress={() => {
                          setActiveDevices(prev => prev.filter(d => d.id !== device.id))
                          Alert.alert('Session Terminated', `${device.name} has been signed out.`)
                        }}
                      >
                        <Text style={{ color: '#f87171', fontSize: 10, fontWeight: '700' }}>Terminate</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Data & Storage Modal */}
      <Modal visible={showDataStorage} animationType="slide" onRequestClose={() => setShowDataStorage(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
          <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowDataStorage(false)}>
              <Text style={[styles.cancelBtn, { color: theme.primary }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Data and Storage</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, gap: 16 }}>
            {/* Storage Usage Card */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Storage Usage</Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <Text style={{ color: theme.text, fontSize: 14 }}>Keep Media</Text>
                <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '700' }}>Forever</Text>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <View>
                  <Text style={{ color: theme.text, fontSize: 14 }}>Device Cache Size</Text>
                  <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2 }}>Cached media, images and temporary logs</Text>
                </View>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>{storageCacheSize}</Text>
              </View>

              <TouchableOpacity
                style={{ paddingVertical: 12, alignItems: 'center', marginTop: 8 }}
                onPress={() => {
                  Alert.alert(
                    'Clear Cache',
                    'Are you sure you want to delete all cached images, audio, and media files? Your chats will not be deleted.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Clear',
                        style: 'destructive',
                        onPress: async () => {
                          setStorageCacheSize('0 KB')
                          await AsyncStorage.setItem('storage_cache_size', '0 KB')
                          Alert.alert('Success', 'Cache cleared successfully!')
                        }
                      }
                    ]
                  )
                }}
              >
                <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 14 }}>Clear Local Cache</Text>
              </TouchableOpacity>
            </View>

            {/* Network Usage */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Network Usage</Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <Text style={{ color: theme.text, fontSize: 14 }}>Sent Data</Text>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{networkSent}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <Text style={{ color: theme.text, fontSize: 14 }}>Received Data</Text>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{networkReceived}</Text>
              </View>

              <TouchableOpacity
                style={{ paddingVertical: 12, alignItems: 'center', marginTop: 8 }}
                onPress={() => {
                  setNetworkSent('0 KB')
                  setNetworkReceived('0 KB')
                  Alert.alert('Reset Stats', 'Network usage statistics reset to 0.')
                }}
              >
                <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 14 }}>Reset Statistics</Text>
              </TouchableOpacity>
            </View>

            {/* Automatic Media Download */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Automatic Media Download</Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <Text style={{ color: theme.text, fontSize: 14 }}>When using Mobile Data</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={async () => {
                    const newVal = !autoDownloadMobile
                    setAutoDownloadMobile(newVal)
                    await AsyncStorage.setItem('auto_download_mobile', newVal ? 'true' : 'false')
                  }}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: autoDownloadMobile ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: autoDownloadMobile ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: autoDownloadMobile ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
                <Text style={{ color: theme.text, fontSize: 14 }}>When connected on Wi-Fi</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={async () => {
                    const newVal = !autoDownloadWifi
                    setAutoDownloadWifi(newVal)
                    await AsyncStorage.setItem('auto_download_wifi', newVal ? 'true' : 'false')
                  }}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: autoDownloadWifi ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: autoDownloadWifi ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: autoDownloadWifi ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Media Upload Quality */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Media Upload Quality</Text>
              
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                {['compressed', 'standard', 'source'].map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: mediaQuality === q ? theme.primary : theme.border,
                      backgroundColor: mediaQuality === q ? `${theme.primary}10` : 'transparent',
                      alignItems: 'center',
                    }}
                    onPress={async () => {
                      setMediaQuality(q)
                      await AsyncStorage.setItem('media_quality', q)
                    }}
                  >
                    <Text style={{ color: mediaQuality === q ? theme.primary : theme.text, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }}>
                      {q === 'compressed' ? 'Data Saver' : q === 'source' ? 'Original' : 'Standard'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Secure Connection Proxy */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Private Connection Proxy</Text>
              <Text style={{ color: theme.subText, fontSize: 11, marginTop: 4 }}>
                Route your traffic through a secure proxy server to mask your IP address.
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: useProxy ? 1 : 0, borderBottomColor: theme.border }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>Enable SOCKS5 Proxy</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={async () => {
                    const newVal = !useProxy
                    setUseProxy(newVal)
                    await AsyncStorage.setItem('use_proxy', newVal ? 'true' : 'false')
                  }}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: useProxy ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: useProxy ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: useProxy ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>

              {useProxy && (
                <View style={{ gap: 10, marginTop: 10 }}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 3 }}>
                      <Text style={{ color: theme.subText, fontSize: 11, marginBottom: 4 }}>Server</Text>
                      <TextInput
                        style={{ backgroundColor: '#161622', color: '#f0f0ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.border, fontSize: 13 }}
                        value={proxyServer}
                        onChangeText={async (val) => {
                          setProxyServer(val)
                          await AsyncStorage.setItem('proxy_server', val)
                        }}
                        placeholder="e.g. proxy.void.io"
                        placeholderTextColor="#4b5563"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.subText, fontSize: 11, marginBottom: 4 }}>Port</Text>
                      <TextInput
                        style={{ backgroundColor: '#161622', color: '#f0f0ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.border, fontSize: 13 }}
                        value={proxyPort}
                        onChangeText={async (val) => {
                          setProxyPort(val)
                          await AsyncStorage.setItem('proxy_port', val)
                        }}
                        keyboardType="numeric"
                        placeholder="1080"
                        placeholderTextColor="#4b5563"
                      />
                    </View>
                  </View>
                  <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '700', textAlign: 'right' }}>🔒 Proxy Connected</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Chat Folder / Vault Settings Modal */}
      <Modal visible={showChatFolder} animationType="slide" onRequestClose={() => setShowChatFolder(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
          <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowChatFolder(false)}>
              <Text style={[styles.cancelBtn, { color: theme.primary }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Secret Vault Settings</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, gap: 16 }}>
            {/* Folder Security Config */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Security Configuration</Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>Vault Security PIN</Text>
                  <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2 }}>{secretFolderPin ? 'Active (Passcode setup complete)' : 'Not Set'}</Text>
                </View>
                <TouchableOpacity
                  style={{ backgroundColor: `${theme.primary}15`, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: `${theme.primary}30` }}
                  onPress={() => {
                    setPinSetupStep(1)
                    setTempPinSetup('')
                    setAuthError('')
                    setShowFolderAuthModal(true)
                  }}
                >
                  <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>
                    {secretFolderPin ? 'Change PIN' : 'Set PIN'}
                  </Text>
                </TouchableOpacity>
              </View>

              {secretFolderPin ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>Enable Biometric Lock</Text>
                    <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2 }}>Unlock Secret Vault using Fingerprint</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => saveUseBiometrics(!useBiometricsForFolder)}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: useBiometricsForFolder ? theme.primary : '#27272a',
                      padding: 2,
                      justifyContent: 'center',
                      alignItems: useBiometricsForFolder ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: useBiometricsForFolder ? '#050608' : '#a1a1aa' }} />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* Locked Chats List management */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Vault Content ({secretChatIds.length} Chats)</Text>
              <Text style={{ color: theme.subText, fontSize: 12, marginTop: 4, marginBottom: 12 }}>
                These chats are hidden from your main inbox and require authentication to view.
              </Text>

              {secretChatIds.length === 0 ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ color: theme.subText, fontSize: 13, fontStyle: 'italic' }}>No chats secured yet</Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {chatModeChats.filter(c => secretChatIds.includes(c.id)).map(chat => (
                    <View key={chat.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: chat.color, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{chat.name[0]}</Text>
                        </View>
                        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{chat.name}</Text>
                      </View>
                      <TouchableOpacity
                        style={{ backgroundColor: '#ef444415', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#ef444430' }}
                        onPress={() => removeFromSecretFolder(chat.id)}
                      >
                        <Text style={{ color: '#f87171', fontSize: 11, fontWeight: '700' }}>Unlock</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Secret Vault Lock / PIN / Biometric Modal */}
      <Modal visible={showFolderAuthModal} transparent={true} animationType="fade" onRequestClose={() => setShowFolderAuthModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(5, 5, 8, 0.95)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 340, backgroundColor: '#0e0e14', borderRadius: 24, borderWidth: 1, borderColor: '#1e1e2c', padding: 24, alignItems: 'center', gap: 20 }}>
            {/* Vault Lock Header */}
            <View style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#c8ff0010', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#c8ff0025', marginBottom: 6 }}>
                <Icon name="lock" size={28} color="#c8ff00" forceEmoji={true} />
              </View>
              <Text style={{ color: '#f0f0ff', fontSize: 20, fontWeight: '900' }}>
                {pinSetupStep === 1 ? 'Setup Security PIN' : pinSetupStep === 2 ? 'Confirm Security PIN' : 'Secret Vault Locked'}
              </Text>
              <Text style={{ color: '#8b8ba7', fontSize: 13, textAlign: 'center', paddingHorizontal: 10 }}>
                {pinSetupStep === 1 ? 'Create a 4-digit PIN to secure your private chats.' : pinSetupStep === 2 ? 'Re-enter your 4-digit PIN to confirm.' : 'Enter PIN or scan fingerprint to access.'}
              </Text>
            </View>

            {/* Error Message */}
            {authError ? (
              <Text style={{ color: '#f87171', fontSize: 12, fontWeight: '700', textAlign: 'center' }}>
                ⚠️ {authError}
              </Text>
            ) : null}

            {/* PIN Dots Display */}
            <View style={{ flexDirection: 'row', gap: 16, marginVertical: 10 }}>
              {[1, 2, 3, 4].map((i) => {
                const len = pinSetupStep > 0 ? tempPinSetup.length : folderAuthPinInput.length
                const active = len >= i
                return (
                  <View
                    key={i}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      borderWidth: 2,
                      borderColor: active ? theme.primary : '#3a3a5a',
                      backgroundColor: active ? theme.primary : 'transparent',
                    }}
                  />
                )
              })}
            </View>

            {/* Keyboard Custom PIN Pad */}
            <View style={{ width: '100%', gap: 10 }}>
              {[
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                ['delete', 0, 'cancel']
              ].map((row, rIdx) => (
                <View key={rIdx} style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                  {row.map((btn, bIdx) => {
                    const isIcon = btn === 'delete' || btn === 'cancel'
                    return (
                      <TouchableOpacity
                        key={bIdx}
                        style={{
                          width: 66,
                          height: 66,
                          borderRadius: 33,
                          backgroundColor: isIcon ? 'transparent' : '#161622',
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderWidth: isIcon ? 0 : 1,
                          borderColor: '#1e1e2c',
                        }}
                        onPress={() => {
                          const currentText = pinSetupStep > 0 ? tempPinSetup : folderAuthPinInput
                          const setFunc = pinSetupStep > 0 ? setTempPinSetup : setFolderAuthPinInput

                          if (btn === 'delete') {
                            setFunc(currentText.slice(0, -1))
                          } else if (btn === 'cancel') {
                            setShowFolderAuthModal(false)
                            setPinSetupStep(0)
                          } else {
                            if (currentText.length < 4) {
                              const newText = currentText + btn
                              setFunc(newText)
                              
                              // Handle PIN compilation
                              if (newText.length === 4) {
                                // Defer to process complete PIN
                                setTimeout(() => {
                                  if (pinSetupStep === 1) {
                                    setTempPinSetup('')
                                    setPinSetupStep(2)
                                    AsyncStorage.setItem('temp_setup_pin', newText)
                                  } else if (pinSetupStep === 2) {
                                    AsyncStorage.getItem('temp_setup_pin').then((firstPin) => {
                                      if (newText === firstPin) {
                                        saveSecretFolderPin(newText)
                                        Alert.alert('PIN Setup Success', 'Your Secret Vault is now secured.')
                                        setPinSetupStep(0)
                                        setShowFolderAuthModal(false)
                                        if (folderAuthAction === 'open_folder') {
                                          setIsFolderUnlocked(true)
                                          setShowSecretFolderChats(true)
                                        } else {
                                          setShowChatFolder(true)
                                        }
                                      } else {
                                        setAuthError('PINs do not match. Try again.')
                                        setTempPinSetup('')
                                        setPinSetupStep(1)
                                      }
                                    })
                                  } else {
                                    if (newText === secretFolderPin) {
                                      setShowFolderAuthModal(false)
                                      if (folderAuthAction === 'open_folder') {
                                        setIsFolderUnlocked(true)
                                        setShowSecretFolderChats(true)
                                      } else {
                                        setShowChatFolder(true)
                                      }
                                    } else {
                                      setAuthError('Incorrect Security PIN. Access Denied!')
                                      setFolderAuthPinInput('')
                                    }
                                  }
                                }, 300)
                              }
                            }
                          }
                        }}
                      >
                        {btn === 'delete' ? (
                          <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '800' }}>Delete</Text>
                        ) : btn === 'cancel' ? (
                          <Text style={{ color: '#8b8ba7', fontSize: 13, fontWeight: '700' }}>Cancel</Text>
                        ) : (
                          <Text style={{ color: '#f0f0ff', fontSize: 20, fontWeight: '800' }}>{btn}</Text>
                        )}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              ))}
            </View>

            {/* Simulated Fingerprint Auth Option */}
            {pinSetupStep === 0 && useBiometricsForFolder && (
              <View style={{ width: '100%', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1e1e2c', paddingTop: 20, marginTop: 10 }}>
                <TouchableOpacity
                  style={{
                    alignItems: 'center',
                    gap: 8,
                    padding: 10
                  }}
                  onPress={() => {
                    setIsBioScanning(true)
                    setAuthError('')
                    setTimeout(() => {
                      setIsBioScanning(false)
                      setShowFolderAuthModal(false)
                      if (folderAuthAction === 'open_folder') {
                        setIsFolderUnlocked(true)
                        setShowSecretFolderChats(true)
                      } else {
                        setShowChatFolder(true)
                      }
                    }, 1500)
                  }}
                  disabled={isBioScanning}
                >
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: isBioScanning ? '#c8ff0020' : '#1e1e2c',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: isBioScanning ? '#c8ff0050' : 'transparent'
                  }}>
                    <Text style={{ fontSize: 24 }}>{isBioScanning ? '🌀' : '🖐️'}</Text>
                  </View>
                  <Text style={{ color: isBioScanning ? '#c8ff00' : theme.subText, fontSize: 12, fontWeight: '700' }}>
                    {isBioScanning ? 'Scanning Fingerprint...' : 'Scan Fingerprint to Unlock'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Secret Folder Chats Screen Modal */}
      <Modal visible={showSecretFolderChats} animationType="slide" onRequestClose={() => {
        setIsFolderUnlocked(false)
        setShowSecretFolderChats(false)
      }}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
          <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => {
              setIsFolderUnlocked(false)
              setShowSecretFolderChats(false)
            }}>
              <Text style={[styles.cancelBtn, { color: theme.primary }]}>← Back</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: theme.primary }}>🔐 Secret Vault</Text>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: '#ef444415', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#ef444430' }}
              onPress={() => {
                setIsFolderUnlocked(false)
                setShowSecretFolderChats(false)
                Alert.alert('Vault Locked', 'Secret Vault closed and locked successfully.')
              }}
            >
              <Text style={{ color: '#f87171', fontSize: 11, fontWeight: '700' }}>Lock Now</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={{ padding: 16, backgroundColor: '#0e0e14', borderBottomWidth: 1, borderBottomColor: '#1e1e2c', alignItems: 'center' }}>
              <Text style={{ color: '#8b8ba7', fontSize: 12, textAlign: 'center', fontStyle: 'italic' }}>
                Long press a chat inside this vault to move it back to your main Inbox.
              </Text>
            </View>

            {secretChatIds.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 40 }}>
                <Text style={{ fontSize: 44, marginBottom: 12 }}>🛡️</Text>
                <Text style={{ color: '#f0f0ff', fontSize: 16, fontWeight: '800', marginBottom: 4 }}>No Secured Chats</Text>
                <Text style={{ color: '#8b8ba7', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                  Long press any chat in your main inbox list and select "Move to Vault" to secure it here.
                </Text>
              </View>
            ) : (
              chatModeChats.filter(chat => secretChatIds.includes(chat.id)).map(chat => (
                <TouchableOpacity
                  key={chat.id}
                  style={styles.chatItem}
                  onPress={() => setShowChat(chat)}
                  onLongPress={() => {
                    Alert.alert(
                      '🔓 Unlock Chat',
                      `Move ${chat.name} back to the main chat list?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Unlock & Move', onPress: () => removeFromSecretFolder(chat.id) }
                      ]
                    )
                  }}
                >
                  <View style={{ position: 'relative' }}>
                    <View style={[styles.chatAvatar, { backgroundColor: chat.color }]}>
                      <Text style={styles.avatarText}>{chat.name[0]}</Text>
                    </View>
                    {chat.streak > 0 && (
                      <View style={styles.streakBadge}>
                        <Text style={styles.streakBadgeText}>
                          🔥{chat.streak}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.chatInfo}>
                    <Text style={styles.chatName}>{chat.name}</Text>
                    <Text style={{ color: '#8b8ba7', fontSize: 12, marginTop: 2 }}>{chat.phoneNumber}</Text>
                    <Text style={styles.chatLast}>💬 Secret chat open • End-to-End Encrypted</Text>
                  </View>
                  {chat.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{chat.unread}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Devices Modal */}
      <Modal visible={showDevicesModal} animationType="slide" onRequestClose={() => setShowDevicesModal(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
          <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowDevicesModal(false)}>
              <Text style={[styles.cancelBtn, { color: theme.primary }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('devices')}</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, gap: 16 }}>
            {/* Link Device */}
            <View style={{ alignItems: 'center', backgroundColor: '#ffd70010', borderWidth: 1, borderColor: '#ffd70030', padding: 20, borderRadius: 20, gap: 12 }}>
              <Text style={{ fontSize: 32 }}>💻</Text>
              <Text style={{ color: '#f0f0ff', fontSize: 15, fontWeight: '800' }}>Link VOID Desktop / Web</Text>
              <Text style={{ color: '#8b8ba7', fontSize: 11, textAlign: 'center', lineHeight: 16 }}>
                Scan a QR code on voidchat.com to instantly synchronize your encrypted chats.
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: '#ffd700', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
                onPress={() => {
                  setShowPremiumQR(true)
                  setTimeout(() => {
                    setShowPremiumQR(false)
                    const newDev = { id: (activeDevices.length + 1).toString(), name: 'macOS Desktop App', location: 'Karachi, PK', status: 'Active Now' }
                    setActiveDevices([newDev, ...activeDevices])
                    Alert.alert('Device Linked', 'New macOS Desktop App linked successfully via secure QR protocol!')
                  }, 2500)
                }}
              >
                <Text style={{ color: '#050608', fontSize: 13, fontWeight: '800' }}>Link Device via QR Code</Text>
              </TouchableOpacity>
            </View>

            {/* QR Scanner Mock Display */}
            {showPremiumQR && (
              <View style={{ backgroundColor: '#000', padding: 20, borderRadius: 20, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#ffd700' }}>
                <View style={{ width: 140, height: 140, backgroundColor: '#fff', padding: 10, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ width: '100%', height: '100%', borderWidth: 4, borderColor: '#000', borderRadius: 4, borderStyle: 'dashed' }} />
                </View>
                <Text style={{ color: '#ffd700', fontSize: 12, fontWeight: '700' }}>📸 Camera active: Scanning QR Matrix...</Text>
              </View>
            )}

            {/* Devices list */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Active Sessions ({activeDevices.length})</Text>
              <Text style={{ color: theme.subText, fontSize: 12, marginBottom: 8 }}>
                Other platforms currently logged into your VOID wallet and chat servers.
              </Text>
              <View style={{ gap: 10 }}>
                {activeDevices.map(device => (
                  <View key={device.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{device.name}</Text>
                      <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2 }}>{device.location} • {device.status}</Text>
                    </View>
                    {device.id !== '1' && (
                      <TouchableOpacity
                        style={{ backgroundColor: '#ef444415', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#ef444430' }}
                        onPress={() => {
                          setActiveDevices(prev => prev.filter(d => d.id !== device.id))
                          Alert.alert('Session Terminated', `${device.name} has been signed out.`)
                        }}
                      >
                        <Text style={{ color: '#f87171', fontSize: 10, fontWeight: '700' }}>Terminate</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Power Saving Modal */}
      <Modal visible={showPowerSavingModal} animationType="slide" onRequestClose={() => setShowPowerSavingModal(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
          <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowPowerSavingModal(false)}>
              <Text style={[styles.cancelBtn, { color: theme.primary }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('powerSaving')}</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, gap: 16 }}>
            {/* Battery Saver Status Card */}
            <View style={{ backgroundColor: '#10b98110', borderStyle: 'solid', borderWidth: 1, borderColor: '#10b98130', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#10b98120', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 20 }}>🔋</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f0f0ff', fontSize: 15, fontWeight: '800' }}>System Optimizer Active</Text>
                <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '700', marginTop: 2 }}>Battery optimization rating: Excellent</Text>
              </View>
            </View>

            {/* Threshold Settings */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Battery Saver Settings</Text>
              
              <View style={{ gap: 10, marginTop: 12 }}>
                {[
                  { id: 'disabled', label: 'Disabled (Always Max Power)' },
                  { id: 'smart', label: 'Smart Save (Enable below 20% battery)' },
                  { id: 'always', label: 'Always Enabled (Maximum Battery Life)' },
                ].map((mode) => (
                  <TouchableOpacity
                    key={mode.id}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: powerSaveMode === mode.id ? theme.primary : theme.border,
                      backgroundColor: powerSaveMode === mode.id ? `${theme.primary}10` : 'transparent',
                    }}
                    onPress={async () => {
                      setPowerSaveMode(mode.id)
                      await AsyncStorage.setItem('power_save_mode', mode.id)
                    }}
                  >
                    <Text style={{ color: powerSaveMode === mode.id ? theme.primary : theme.text, fontSize: 13, fontWeight: '700' }}>
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Save Switches */}
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.settingsSectionTitle, { color: theme.primary }]}>Fine-grained optimization</Text>

              {/* Autoplay gifs */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>Autoplay GIFs</Text>
                  <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2 }}>Requires more CPU and GPU operations</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={async () => {
                    const newVal = !autoPlayGifs
                    setAutoPlayGifs(newVal)
                    await AsyncStorage.setItem('auto_play_gifs', newVal ? 'true' : 'false')
                  }}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: autoPlayGifs ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: autoPlayGifs ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: autoPlayGifs ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>

              {/* Autoplay videos */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>Autoplay Reels & Videos</Text>
                  <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2 }}>Autoplay videos in feeds using hardware accelerations</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={async () => {
                    const newVal = !autoPlayVideos
                    setAutoPlayVideos(newVal)
                    await AsyncStorage.setItem('auto_play_videos', newVal ? 'true' : 'false')
                  }}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: autoPlayVideos ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: autoPlayVideos ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: autoPlayVideos ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>

              {/* Disable animations */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>Disable UI Transitions</Text>
                  <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2 }}>Disables high frame rate animations to conserve battery</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={async () => {
                    const newVal = !disableAnimations
                    setDisableAnimations(newVal)
                    await AsyncStorage.setItem('disable_animations', newVal ? 'true' : 'false')
                  }}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: disableAnimations ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: disableAnimations ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: disableAnimations ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>

              {/* Low data mode */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>Low Data Mode</Text>
                  <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2 }}>Reduces background server synchronization cycles</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={async () => {
                    const newVal = !lowDataMode
                    setLowDataMode(newVal)
                    await AsyncStorage.setItem('low_data_mode', newVal ? 'true' : 'false')
                  }}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: lowDataMode ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: lowDataMode ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: lowDataMode ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Language Modal */}
      <Modal visible={showLanguageModal} animationType="slide" onRequestClose={() => setShowLanguageModal(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
          <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <Text style={[styles.cancelBtn, { color: theme.primary }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('language')}</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
            <View style={[styles.settingsSection, { backgroundColor: theme.cardBg, borderColor: theme.border, gap: 4 }]}>
              {[
                { code: 'Afrikaans', flag: '🇿🇦', name: 'Afrikaans' },
                { code: 'Albanian', flag: '🇦🇱', name: 'Shqip' },
                { code: 'Amharic', flag: '🇪🇹', name: 'አማርኛ' },
                { code: 'Arabic', flag: '🇸🇦', name: 'العربية' },
                { code: 'Armenian', flag: '🇦🇲', name: 'Հայերեն' },
                { code: 'Azerbaijani', flag: '🇦🇿', name: 'Azərbaycanca' },
                { code: 'Bengali', flag: '🇧🇩', name: 'বাংলা' },
                { code: 'Bosnian', flag: '🇧🇦', name: 'Bosanski' },
                { code: 'Bulgarian', flag: '🇧🇬', name: 'Български' },
                { code: 'Catalan', flag: '🇪🇸', name: 'Català' },
                { code: 'Chinese', flag: '🇨🇳', name: '中文 (简体)' },
                { code: 'Croatian', flag: '🇭🇷', name: 'Hrvatski' },
                { code: 'Czech', flag: '🇨🇿', name: 'Čeština' },
                { code: 'Danish', flag: '🇩🇰', name: 'Dansk' },
                { code: 'Dutch', flag: '🇳🇱', name: 'Nederlands' },
                { code: 'English', flag: '🇺🇸', name: 'English' },
                { code: 'Esperanto', flag: '🌐', name: 'Esperanto' },
                { code: 'Estonian', flag: '🇪🇪', name: 'Eesti' },
                { code: 'Filipino', flag: '🇵🇭', name: 'Tagalog' },
                { code: 'Finnish', flag: '🇫🇮', name: 'Suomi' },
                { code: 'French', flag: '🇫🇷', name: 'Français' },
                { code: 'Galician', flag: '🇪🇸', name: 'Galego' },
                { code: 'Georgian', flag: '🇬🇪', name: 'ქართული' },
                { code: 'German', flag: '🇩🇪', name: 'Deutsch' },
                { code: 'Greek', flag: '🇬🇷', name: 'Ελληνικά' },
                { code: 'Gujarati', flag: '🇮🇳', name: 'ગુજરાતી' },
                { code: 'Hebrew', flag: '🇮🇱', name: 'עברית' },
                { code: 'Hindi', flag: '🇮🇳', name: 'हिंदी' },
                { code: 'Hungarian', flag: '🇭🇺', name: 'Magyar' },
                { code: 'Icelandic', flag: '🇮🇸', name: 'Íslenska' },
                { code: 'Indonesian', flag: '🇮🇩', name: 'Bahasa Indonesia' },
                { code: 'Irish', flag: '🇮🇪', name: 'Gaeilge' },
                { code: 'Italian', flag: '🇮🇹', name: 'Italiano' },
                { code: 'Japanese', flag: '🇯🇵', name: '日本語' },
                { code: 'Javanese', flag: '🇮🇩', name: 'Basa Jawa' },
                { code: 'Kannada', flag: '🇮🇳', name: 'ಕನ್ನಡ' },
                { code: 'Kazakh', flag: '🇰🇿', name: 'Қазақ тіли' },
                { code: 'Khmer', flag: '🇰🇭', name: 'ខ្មែរ' },
                { code: 'Korean', flag: '🇰🇷', name: '한국어' },
                { code: 'Kurdish', flag: '🌐', name: 'Kurdî' },
                { code: 'Kyrgyz', flag: '🇰🇬', name: 'Кыргызча' },
                { code: 'Lao', flag: '🇱🇦', name: 'ລາວ' },
                { code: 'Latvian', flag: '🇱🇻', name: 'Latviešu' },
                { code: 'Lithuanian', flag: '🇱🇹', name: 'Lietuvių' },
                { code: 'Macedonian', flag: '🇲🇰', name: 'Македонски' },
                { code: 'Malay', flag: '🇲🇾', name: 'Bahasa Melayu' },
                { code: 'Malayalam', flag: '🇮🇳', name: 'മലയാളം' },
                { code: 'Marathi', flag: '🇮🇳', name: 'मराठी' },
                { code: 'Mongolian', flag: '🇲🇳', name: 'Монгол' },
                { code: 'Nepali', flag: '🇳🇵', name: 'नेपाली' },
                { code: 'Norwegian', flag: '🇳🇴', name: 'Norsk' },
                { code: 'Persian', flag: '🇮🇷', name: 'فارسی' },
                { code: 'Polish', flag: '🇵🇱', name: 'Polski' },
                { code: 'Portuguese', flag: '🇵🇹', name: 'Português' },
                { code: 'Punjabi', flag: '🇮🇳', name: 'ਪੰਜਾਬੀ' },
                { code: 'Romanian', flag: '🇷🇴', name: 'Română' },
                { code: 'Russian', flag: '🇷🇺', name: 'Русский' },
                { code: 'Serbian', flag: '🇷🇸', name: 'Српски' },
                { code: 'Sindhi', flag: '🇵🇰', name: 'سنڌي' },
                { code: 'Slovak', flag: '🇸🇰', name: 'Slovenčina' },
                { code: 'Slovenian', flag: '🇸🇮', name: 'Slovenščina' },
                { code: 'Somali', flag: '🇸🇴', name: 'Soomaali' },
                { code: 'Spanish', flag: '🇪🇸', name: 'Español' },
                { code: 'Sundanese', flag: '🇮🇩', name: 'Basa Sunda' },
                { code: 'Swahili', flag: '🇰🇪', name: 'Kiswahili' },
                { code: 'Swedish', flag: '🇸🇪', name: 'Svenska' },
                { code: 'Tajik', flag: '🇹🇯', name: 'Тоҷикӣ' },
                { code: 'Tamil', flag: '🇮🇳', name: 'தமிழ்' },
                { code: 'Telugu', flag: '🇮🇳', name: 'తెలుగు' },
                { code: 'Thai', flag: '🇹🇭', name: 'ไทย' },
                { code: 'Turkish', flag: '🇹🇷', name: 'Türkçe' },
                { code: 'Ukrainian', flag: '🇺🇦', name: 'Українська' },
                { code: 'Urdu', flag: '🇵🇰', name: 'اردو' },
                { code: 'Uzbek', flag: '🇺🇿', name: 'Oʻzbekcha' },
                { code: 'Vietnamese', flag: '🇻🇳', name: 'Tiếng Việt' },
                { code: 'Welsh', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', name: 'Cymraeg' },
                { code: 'Xhosa', flag: '🇿🇦', name: 'isiXhosa' },
                { code: 'Yiddish', flag: '🌐', name: 'ייִديш' },
                { code: 'Yoruba', flag: '🇳🇬', name: 'Yorùbá' },
                { code: 'Zulu', flag: '🇿🇦', name: 'isiZulu' }
              ].map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: currentLanguage === lang.code ? `${theme.primary}10` : 'transparent',
                    borderWidth: 1,
                    borderColor: currentLanguage === lang.code ? theme.primary : 'transparent',
                  }}
                  onPress={async () => {
                    setCurrentLanguage(lang.code)
                    await AsyncStorage.setItem('app_language', lang.code)
                    setShowLanguageModal(false)
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <Text style={{ fontSize: 20 }}>{lang.flag}</Text>
                    <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>{lang.name}</Text>
                  </View>
                  {currentLanguage === lang.code && (
                    <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '800' }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Create Group Modal */}
      <Modal visible={showCreateGroupModal} animationType="slide" onRequestClose={() => setShowCreateGroupModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#050508' }}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: '#1e1e2c', borderBottomWidth: 1, backgroundColor: '#0e0e14' }]}>
            <TouchableOpacity onPress={() => setShowCreateGroupModal(false)}>
              <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '700' }}>← Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: '#f0f0ff', fontSize: 16, fontWeight: '900' }}>👥 Create New Group</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ gap: 20 }}>
            {/* Input Name */}
            <View style={{ gap: 8 }}>
              <Text style={{ color: '#8b8ba7', fontSize: 12, fontWeight: '800' }}>GROUP NAME</Text>
              <TextInput
                style={{
                  backgroundColor: '#0e0e14',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#1e1e2c',
                  color: '#f0f0ff',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 14,
                  fontWeight: '700'
                }}
                placeholder="Enter group name..."
                placeholderTextColor="#4b5563"
                value={newGroupName}
                onChangeText={setNewGroupName}
              />
            </View>

            {/* Input Description */}
            <View style={{ gap: 8 }}>
              <Text style={{ color: '#8b8ba7', fontSize: 12, fontWeight: '800' }}>DESCRIPTION</Text>
              <TextInput
                style={{
                  backgroundColor: '#0e0e14',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#1e1e2c',
                  color: '#f0f0ff',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 14,
                  minHeight: 80,
                  textAlignVertical: 'top'
                }}
                placeholder="What is this group about?"
                placeholderTextColor="#4b5563"
                value={newGroupDesc}
                onChangeText={setNewGroupDesc}
                multiline
              />
            </View>

            {/* Private Group Switch */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e1e2c' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f0f0ff', fontSize: 14, fontWeight: '700' }}>🔒 Private Group</Text>
                <Text style={{ color: '#8b8ba7', fontSize: 11, marginTop: 2 }}>Only invited users can see and join this group</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setNewGroupIsPrivate(!newGroupIsPrivate)}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: newGroupIsPrivate ? theme.primary : '#27272a',
                  padding: 2,
                  justifyContent: 'center',
                  alignItems: newGroupIsPrivate ? 'flex-end' : 'flex-start',
                }}
              >
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: newGroupIsPrivate ? '#050608' : '#a1a1aa' }} />
              </TouchableOpacity>
            </View>

            {/* Paid Group Settings */}
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e1e2c' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#f0f0ff', fontSize: 14, fontWeight: '700' }}>💰 Paid Membership</Text>
                  <Text style={{ color: '#8b8ba7', fontSize: 11, marginTop: 2 }}>Charge users monthly VOID fee to join this group</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setNewGroupIsPaid(!newGroupIsPaid)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: newGroupIsPaid ? theme.primary : '#27272a',
                    padding: 2,
                    justifyContent: 'center',
                    alignItems: newGroupIsPaid ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: newGroupIsPaid ? '#050608' : '#a1a1aa' }} />
                </TouchableOpacity>
              </View>

              {newGroupIsPaid && (
                <View style={{ gap: 8, marginTop: 4 }}>
                  <Text style={{ color: '#ffd700', fontSize: 11, fontWeight: '800' }}>MONTHLY SUBSCRIPTION FEE (VOID COINS)</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#0e0e14',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: '#ffc80030',
                      color: '#ffd700',
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 14,
                      fontWeight: '700'
                    }}
                    placeholder="Enter monthly fee in VOID..."
                    placeholderTextColor="#4b5563"
                    value={newGroupMonthlyFee}
                    onChangeText={setNewGroupMonthlyFee}
                    keyboardType="numeric"
                  />
                </View>
              )}
            </View>

            {/* Action Submit Button */}
            <TouchableOpacity
              style={{
                backgroundColor: theme.primary,
                paddingVertical: 16,
                borderRadius: 18,
                alignItems: 'center',
                marginTop: 20,
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10
              }}
              onPress={handleCreateGroup}
            >
              <Text style={{ color: '#050608', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 }}>
                👥 Launch Group
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* VOID Premium Modal */}
      <Modal visible={showPremiumModal} animationType="slide" onRequestClose={() => setShowPremiumModal(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: '#050508' }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: '#ffc80030', borderBottomWidth: 1, backgroundColor: '#0e0e14' }]}>
            <TouchableOpacity onPress={() => setShowPremiumModal(false)}>
              <Text style={{ color: '#ffc800', fontSize: 14, fontWeight: '700' }}>← Back</Text>
            </TouchableOpacity>
            <Text style={{ color: '#ffd700', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>👑 VOID PREMIUM</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, gap: 16 }}>
            {/* VIP Status Status card */}
            <View style={{
              backgroundColor: isPremiumUser ? '#1a1600' : '#0e0e14',
              borderRadius: 24,
              borderWidth: 2,
              borderColor: isPremiumUser ? '#ffd700' : '#1e1e2c',
              padding: 24,
              alignItems: 'center',
              gap: 12
            }}>
              <Text style={{ fontSize: 48 }}>👑</Text>
              <Text style={{ color: isPremiumUser ? '#ffd700' : '#f0f0ff', fontSize: 18, fontWeight: '900' }}>
                {isPremiumUser ? 'Active Elite Premium User' : 'Ascend to VOID Elite'}
              </Text>
              <Text style={{ color: '#8b8ba7', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                {isPremiumUser ? 'You have unlocked premium privacy enhancements, exclusive UI themes, and Double Streak coin bonuses!' : 'Unlock premium privacy features and turn your profile into a prestigious status symbol!'}
              </Text>

              {isPremiumUser ? (
                <View style={{ backgroundColor: '#ffd70020', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#ffd70050', marginTop: 6 }}>
                  <Text style={{ color: '#ffd700', fontSize: 12, fontWeight: '900' }}>💎 VIP STATUS SHIELD: ENABLED</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#ffd700',
                    width: '100%',
                    paddingVertical: 14,
                    borderRadius: 16,
                    alignItems: 'center',
                    marginTop: 10
                  }}
                  onPress={async () => {
                    try {
                      const res = await buyPremium()
                      if (res.data.success) {
                        setIsPremiumUser(true)
                        await AsyncStorage.setItem('is_premium_user', 'true')
                        await loadBalance()
                        await loadBlockedUsers()
                        Alert.alert('👑 Purchase Successful', 'Welcome to VOID Premium! Your account has been upgraded, and your VIP badge is now active!')
                      } else {
                        Alert.alert('❌ Purchase Failed', res.data.message || 'Error completing purchase.')
                      }
                    } catch (e) {
                      const errMsg = e.response?.data?.message || e.message || 'Could not complete purchase.'
                      Alert.alert('❌ Purchase Failed', errMsg)
                    }
                  }}
                >
                  <Text style={{ color: '#050608', fontSize: 14, fontWeight: '900' }}>
                    Buy Premium for 99 VOID Coins
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* List of Features */}
            <View style={[styles.settingsSection, { backgroundColor: '#0e0e14', borderColor: '#1e1e2c' }]}>
              <Text style={{ color: '#ffd700', fontSize: 13, fontWeight: '800', marginBottom: 12 }}>🔒 PREMIUM EXCLUSIVES</Text>

              {[
                { title: 'VIP Gold Badge 👑', desc: 'A prestigious Gold Badge displays next to your username on the feed, posts and messages.' },
                { title: 'Gold Glowing Profile Border ✨', desc: 'Your profile picture floats inside a golden neon glowing circular aura.' },
                { title: 'Double Streaks Booster 🔥', desc: 'Streak daily bonus rewards are doubled, letting you earn VOID coins twice as fast.' },
                { title: 'Custom App Launcher Icons 🎨', desc: 'Unlock premium launcher icons like Gold Vault, Hologram, and Cyberpunk.' },
                { title: 'Unlimited Proxy & VIP Servers ⚡', desc: 'Access ultra-fast servers with zero rate-limits on messaging operations.' }
              ].map((f, idx) => (
                <View key={idx} style={{ paddingVertical: 12, borderBottomWidth: idx === 4 ? 0 : 1, borderBottomColor: '#1e1e2c', gap: 4 }}>
                  <Text style={{ color: '#f0f0ff', fontSize: 14, fontWeight: '700' }}>{f.title}</Text>
                  <Text style={{ color: '#8b8ba7', fontSize: 11, lineHeight: 16 }}>{f.desc}</Text>
                </View>
              ))}
            </View>

            {/* Premium Theme Options (Visible only to Premium users) */}
            {isPremiumUser && (
              <View style={[styles.settingsSection, { backgroundColor: '#0e0e14', borderColor: '#ffc80030' }]}>
                <Text style={{ color: '#ffd700', fontSize: 13, fontWeight: '800', marginBottom: 12 }}>🎨 PREMIUM CUSTOMIZATION</Text>
                <Text style={{ color: '#8b8ba7', fontSize: 12, marginBottom: 12 }}>Choose your Premium App Launcher Icon:</Text>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {[
                    { id: 'gold', label: 'Gold Edition', color: '#ffd700', icon: '👑' },
                    { id: 'holo', label: 'Hologram', color: '#00ffff', icon: '💎' },
                    { id: 'cyber', label: 'Cyberpunk', color: '#ec4899', icon: '🧬' }
                  ].map((icon) => (
                    <TouchableOpacity
                      key={icon.id}
                      style={{
                        flex: 1,
                        backgroundColor: '#161622',
                        borderRadius: 14,
                        padding: 12,
                        alignItems: 'center',
                        borderWidth: appIconPreset === icon.id ? 2 : 1,
                        borderColor: appIconPreset === icon.id ? '#ffd700' : '#27272a',
                        gap: 6
                      }}
                      onPress={async () => {
                        setAppIconPreset(icon.id)
                        await AsyncStorage.setItem('app_icon_preset', icon.id)
                        Alert.alert('App Icon Selected', `Your Premium launcher icon preset has been set to: ${icon.label}`)
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{icon.icon}</Text>
                      <Text style={{ color: '#f0f0ff', fontSize: 11, fontWeight: '700', textAlign: 'center' }}>{icon.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Starred Messages Modal */}
      <Modal visible={showStarredModal} animationType="slide" onRequestClose={() => setShowStarredModal(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: '#060608' }]}>
          <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: '#1a1a24', backgroundColor: '#0e0e14' }]}>
            <TouchableOpacity onPress={() => setShowStarredModal(false)}>
              <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '700' }}>← Back</Text>
            </TouchableOpacity>
            <Text style={{ color: '#f0f0ff', fontSize: 16, fontWeight: '900' }}>⭐ Starred Messages</Text>
            <TouchableOpacity 
              onPress={async () => {
                try {
                  await AsyncStorage.removeItem('starred_messages');
                  setStarredMessages([]);
                  Alert.alert('Success', 'All starred messages cleared.');
                } catch (e) {}
              }}
              style={{ backgroundColor: '#ef444415', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#ef444430' }}
            >
              <Text style={{ color: '#f87171', fontSize: 11, fontWeight: '700' }}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, gap: 12 }}>
            {starredMessages.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 60 }}>
                <Text style={{ fontSize: 44, marginBottom: 12 }}>⭐</Text>
                <Text style={{ color: '#f0f0ff', fontSize: 16, fontWeight: '800', marginBottom: 4 }}>No Starred Messages</Text>
                <Text style={{ color: '#8b8ba7', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                  Long press any message inside a conversation and select "Star Message" to save it here.
                </Text>
              </View>
            ) : (
              starredMessages.map((msg, idx) => (
                <View key={idx} style={{ backgroundColor: '#0e0e14', borderStyle: 'solid', borderWidth: 1, borderColor: '#1e1e2c', borderRadius: 16, padding: 14, gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '800' }}>👤 {msg.contactName}</Text>
                    <Text style={{ color: '#6b7280', fontSize: 11 }}>{msg.time}</Text>
                  </View>
                  <Text style={{ color: '#f0f0ff', fontSize: 14, lineHeight: 20 }}>{msg.text}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                    <TouchableOpacity 
                      onPress={async () => {
                        try {
                          const updated = starredMessages.filter(m => m.id !== msg.id);
                          setStarredMessages(updated);
                          await AsyncStorage.setItem('starred_messages', JSON.stringify(updated));
                        } catch (e) {}
                      }}
                    >
                      <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Ultra-Premium 3-Dots Dropdown Options Modal ── */}
      <Modal
        visible={showChatOptionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChatOptionsMenu(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(5, 5, 10, 0.85)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}
          activeOpacity={1}
          onPress={() => setShowChatOptionsMenu(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: '#0e0e16',
              borderRadius: 28,
              borderWidth: 1.5,
              borderColor: theme.primary || '#c8ff00',
              width: '100%',
              maxWidth: 340,
              padding: 20,
              gap: 12,
              shadowColor: theme.primary || '#c8ff00',
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: 0.35,
              shadowRadius: 28,
              elevation: 20
            }}
          >
            {/* Header Badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#1e1e2d', paddingBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: (theme.primary || '#c8ff00') + '20', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: (theme.primary || '#c8ff00') + '40' }}>
                  <Text style={{ fontSize: 18 }}>⚡</Text>
                </View>
                <View>
                  <Text style={{ color: theme.primary || '#c8ff00', fontSize: 16, fontWeight: '900', letterSpacing: 0.8 }}>VOID OPTIONS</Text>
                  <Text style={{ color: theme.subText || '#8b8ba7', fontSize: 11 }}>Quick Shortcuts & Settings</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowChatOptionsMenu(false)} style={{ padding: 4 }}>
                <Text style={{ color: '#8b8ba7', fontSize: 14, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Menu Actions */}
            <View style={{ gap: 8 }}>
              {[
                { icon: 'groups', color: '#10b981', label: 'New Group', sub: 'Create end-to-end encrypted group', action: () => { setShowChatOptionsMenu(false); setShowCreateGroupModal(true); } },
                { icon: 'public', color: '#3b82f6', label: 'New Community', sub: 'Invite-only broadcast communities', action: () => { setShowChatOptionsMenu(false); Alert.alert('New Community', 'Community creation is currently in invite-only beta.'); } },
                { icon: 'campaign', color: '#ec4899', label: 'Broadcast List', sub: 'Send mass message to contacts', action: () => { setShowChatOptionsMenu(false); Alert.alert('Broadcast List', 'Broadcast lists feature coming soon.'); } },
                { icon: 'sync', color: '#f59e0b', label: 'Sync Contacts', sub: 'Scan phonebook for registered friends', action: () => { setShowChatOptionsMenu(false); handleSyncContacts(); } },
                { icon: 'devices', color: '#8b5cf6', label: 'Linked Devices', sub: 'Manage multi-device web sessions', action: () => { setShowChatOptionsMenu(false); setShowDevicesModal(true); } },
                { icon: 'star', color: '#eab308', label: 'Starred Messages', sub: 'View bookmarked chat messages', action: async () => {
                  setShowChatOptionsMenu(false);
                  try {
                    const stored = await AsyncStorage.getItem('starred_messages') || '[]';
                    setStarredMessages(JSON.parse(stored));
                  } catch (e) {}
                  setShowStarredModal(true);
                }},
              ].map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderRadius: 16,
                    backgroundColor: '#161622',
                    borderWidth: 1,
                    borderColor: '#1e1e2d'
                  }}
                  onPress={opt.action}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: opt.color + '18', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: opt.color + '30' }}>
                      <Icon name={opt.icon} size={18} color={opt.color} />
                    </View>
                    <View>
                      <Text style={{ color: '#f0f0ff', fontSize: 13, fontWeight: '800' }}>{opt.label}</Text>
                      <Text style={{ color: '#8b8ba7', fontSize: 10, marginTop: 1 }}>{opt.sub}</Text>
                    </View>
                  </View>
                  <Text style={{ color: '#4b5563', fontSize: 16 }}>›</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#ef444415',
                borderRadius: 16,
                paddingVertical: 12,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#ef444435',
                marginTop: 4
              }}
              onPress={() => setShowChatOptionsMenu(false)}
            >
              <Text style={{ color: '#f87171', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 }}>Close Menu ✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Comments Slide-up Modal */}
      <Modal visible={showCommentsModal} animationType="slide" transparent onRequestClose={() => setShowCommentsModal(false)}>
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setShowCommentsModal(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={{ 
              backgroundColor: '#0c0c12', 
              borderTopLeftRadius: 28, 
              borderTopRightRadius: 28, 
              height: '70%', 
              borderWidth: 1, 
              borderColor: '#1e1e2c',
              padding: 16
            }}
          >
            <View style={{ width: 40, height: 4, backgroundColor: '#2d2d3d', borderRadius: 2, alignSelf: 'center', marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900' }}>Comments ({activeCommentsPost?.comments?.length || 0})</Text>
              <TouchableOpacity onPress={() => setShowCommentsModal(false)} style={{ padding: 4 }}>
                <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '700' }}>Close</Text>
              </TouchableOpacity>
            </View>

            {/* Comment List */}
            <ScrollView style={{ flex: 1, marginBottom: 16 }} showsVerticalScrollIndicator={false}>
              {!activeCommentsPost?.comments || activeCommentsPost.comments.length === 0 ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>💬</Text>
                  <Text style={{ color: theme.subText, fontSize: 13, fontStyle: 'italic' }}>No comments yet. Be the first to reply!</Text>
                </View>
              ) : (
                activeCommentsPost.comments.map((comment, i) => (
                  <View 
                    key={i} 
                    style={{ 
                      flexDirection: 'row', 
                      gap: 12, 
                      paddingVertical: 12, 
                      borderBottomWidth: 1, 
                      borderBottomColor: '#161622',
                      alignItems: 'flex-start' 
                    }}
                  >
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#c8ff0030', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: theme.primary, fontWeight: '900', fontSize: 12 }}>
                        {comment.isAnonymous ? '🕵️' : (comment.user?.username?.[0] || 'U').toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13 }}>
                        {comment.isAnonymous ? 'Anonymous' : `@${comment.user?.username || 'User'}`}
                      </Text>
                      <Text style={{ color: theme.text, fontSize: 13, marginTop: 3, lineHeight: 18 }}>{comment.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Input Box */}
            <SafeAreaView style={{ flexDirection: 'row', gap: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1e1e2d', paddingTop: 10 }}>
              <TextInput
                style={{ 
                  flex: 1, 
                  backgroundColor: '#13131a', 
                  color: '#fff', 
                  borderRadius: 14, 
                  paddingHorizontal: 12, 
                  paddingVertical: 10,
                  fontSize: 13,
                  borderWidth: 1,
                  borderColor: '#1e1e2c'
                }}
                placeholder="Type a comment..."
                placeholderTextColor="#6b7280"
                value={newCommentText}
                onChangeText={setNewCommentText}
              />
              <TouchableOpacity 
                disabled={commenting || !newCommentText.trim()}
                onPress={handleAddComment}
                style={{ 
                  backgroundColor: theme.primary, 
                  paddingHorizontal: 16, 
                  paddingVertical: 10, 
                  borderRadius: 14,
                  opacity: (!newCommentText.trim() || commenting) ? 0.5 : 1
                }}
              >
                <Text style={{ color: '#000', fontWeight: '900', fontSize: 13 }}>Send</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Contacts Sync Modal */}
      <Modal visible={showContactsSyncModal} animationType="slide" onRequestClose={() => setShowContactsSyncModal(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
          <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowContactsSyncModal(false)}>
              <Text style={[styles.cancelBtn, { color: theme.primary }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Sync Contacts</Text>
            <TouchableOpacity onPress={handleSyncContacts} disabled={syncingContacts} style={{ padding: 6 }}>
              <Icon name="autorenew" size={22} color={theme.primary} style={syncingContacts && { opacity: 0.5 }} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
            {syncingContacts ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}>
                <Text style={{ fontSize: 32 }}>🔄</Text>
                <Text style={{ color: theme.text, fontWeight: '700' }}>Syncing device contacts...</Text>
                <Text style={{ color: theme.subText, fontSize: 12, textAlign: 'center' }}>
                  Scanning your phone book to match registered users on VOID CHAT.
                </Text>
              </View>
            ) : matchedContacts.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}>
                <Text style={{ fontSize: 44 }}>👥</Text>
                <Text style={{ color: theme.text, fontWeight: '800' }}>No Registered Contacts Found</Text>
                <Text style={{ color: theme.subText, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                  None of the numbers in your phone contacts are currently registered on VOID CHAT.
                </Text>
                <TouchableOpacity
                  style={{ backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 12 }}
                  onPress={handleSyncContacts}
                >
                  <Text style={{ color: '#050608', fontWeight: '800' }}>Rescan Contacts</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <View style={{ paddingVertical: 4, paddingHorizontal: 4 }}>
                  <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 12 }}>
                    REGISTERED FRIENDS ({matchedContacts.length})
                  </Text>
                </View>
                {matchedContacts.map((match, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      backgroundColor: theme.cardBg,
                      borderRadius: 16,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: theme.border,
                      alignItems: 'center',
                      gap: 12
                    }}
                    onPress={() => {
                      setShowContactsSyncModal(false)
                      setShowChat({
                        id: match.user._id || match.user.id,
                        name: `@${match.user.username}`,
                        color: '#6366f1',
                        phoneNumber: match.matchedNumber
                      })
                    }}
                  >
                    <View style={[styles.chatAvatar, { backgroundColor: '#6366f1', width: 44, height: 44, borderRadius: 22 }]}>
                      <Text style={[styles.avatarText, { fontSize: 14 }]}>
                        {match.deviceName[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14 }}>
                        {match.deviceName}
                      </Text>
                      <Text style={{ color: theme.primary, fontSize: 12, marginTop: 2 }}>
                        @{match.user.username} • Active on VOID
                      </Text>
                      <Text style={{ color: theme.subText, fontSize: 11, marginTop: 1 }}>
                        {match.matchedNumber}
                      </Text>
                    </View>
                    <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800', marginRight: 4 }}>
                      Chat 💬
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Avatar Picker Modal */}
      <Modal visible={showAvatarPicker} transparent={true} animationType="fade" onRequestClose={() => setShowAvatarPicker(false)}>
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }} 
          activeOpacity={1}
          onPress={() => setShowAvatarPicker(false)}
        >
          <View style={{
            width: '85%',
            backgroundColor: isDayMode ? '#ffffff' : '#0e0e14',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 20,
            gap: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
            elevation: 10
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>Select Avatar</Text>
              <TouchableOpacity onPress={() => setShowAvatarPicker(false)}>
                <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 14 }}>Close</Text>
              </TouchableOpacity>
            </View>

            {/* Custom Emoji Input */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800' }}>Use Custom Emoji / Character</Text>
              <TextInput
                style={{
                  backgroundColor: isDayMode ? '#f4f4f5' : '#1a1a24',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: theme.text,
                  fontSize: 14,
                  textAlign: 'center'
                }}
                maxLength={2}
                value={tempAvatar}
                onChangeText={(val) => setTempAvatar(val)}
                placeholder="Type emoji or letter..."
                placeholderTextColor="#4b5563"
              />
            </View>

            {/* Grid of Preset Avatars */}
            <Text style={{ color: theme.subText, fontSize: 12, fontWeight: '800', marginBottom: -4 }}>Premium Presets</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {['🤖', '👾', '🛸', '🚀', '🌌', '🎮', '🎧', '🔥', '⚡', '👑', '🐱', '🦊', '🦁', '🐼', '💬', '🌐'].map((avatar, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: tempAvatar === avatar ? `${theme.primary}20` : (isDayMode ? '#f4f4f5' : '#161622'),
                    borderWidth: 2,
                    borderColor: tempAvatar === avatar ? theme.primary : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  onPress={() => setTempAvatar(avatar)}
                >
                  <Text style={{ fontSize: 26 }}>{avatar}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: theme.primary,
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: 'center',
                marginTop: 10
              }}
              onPress={() => setShowAvatarPicker(false)}
            >
              <Text style={{ color: '#000000', fontWeight: '800', fontSize: 14 }}>Apply Avatar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Create Status Modal ── */}
      <Modal
        visible={showCreateStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateStatusModal(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(5, 5, 8, 0.85)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setShowCreateStatusModal(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={{
              backgroundColor: '#0e0e14',
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              borderWidth: 1,
              borderColor: '#1e1e2c',
              padding: 24,
              gap: 20
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: theme.primary, fontSize: 18, fontWeight: '900', letterSpacing: 0.5 }}>Create Status Update</Text>
              <TouchableOpacity onPress={() => setShowCreateStatusModal(false)} style={{ padding: 4 }}>
                <Text style={{ color: '#8b8ba7', fontSize: 14, fontWeight: '700' }}>✕ Close</Text>
              </TouchableOpacity>
            </View>

            {/* Premium Selector Tabs */}
            <View style={{ flexDirection: 'row', backgroundColor: '#161622', borderRadius: 16, padding: 4, gap: 4 }}>
              {[
                { type: 'text', label: '📝 Text' },
                { type: 'media', label: '📷 Media' },
                { type: 'link', label: '🔗 Link' },
                { type: 'audio', label: '🎙️ Voice' }
              ].map(tab => (
                <TouchableOpacity
                  key={tab.type}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: statusType === tab.type ? theme.primary : 'transparent'
                  }}
                  onPress={async () => {
                    setStatusType(tab.type)
                    if (tab.type === 'media') {
                      await pickStatusMedia()
                    }
                  }}
                >
                  <Text style={{
                    color: statusType === tab.type ? '#050608' : '#8b8ba7',
                    fontSize: 12,
                    fontWeight: '800'
                  }}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Dynamic Content Views */}
            {statusType === 'text' && (
              <View style={{ gap: 12 }}>
                {/* Background Color Palette */}
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <Text style={{ color: theme.subText, fontSize: 12, fontWeight: '700' }}>Background:</Text>
                  {['#6366f1', '#ec4899', '#14b8a6', '#8b5cf6', '#1e293b', '#c8ff00'].map(color => (
                    <TouchableOpacity
                      key={color}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: color,
                        borderWidth: statusBgColor === color ? 2 : 0,
                        borderColor: '#ffffff'
                      }}
                      onPress={() => setStatusBgColor(color)}
                    />
                  ))}
                </View>

                {/* Input Card with Dynamic Background */}
                <View style={{ backgroundColor: statusBgColor, borderRadius: 16, padding: 16, minHeight: 120, justifyContent: 'center' }}>
                  <TextInput
                    style={{
                      color: statusBgColor === '#c8ff00' ? '#000000' : '#ffffff',
                      fontSize: 16,
                      fontWeight: '800',
                      textAlign: 'center',
                      padding: 0
                    }}
                    placeholder="Type a status update..."
                    placeholderTextColor={statusBgColor === '#c8ff00' ? '#4b5563' : '#cbd5e1'}
                    multiline
                    value={newStatusText}
                    onChangeText={setNewStatusText}
                  />
                </View>
              </View>
            )}

            {statusType === 'media' && (
              <View style={{ gap: 12, alignItems: 'center' }}>
                <TouchableOpacity
                  style={{
                    width: '100%',
                    backgroundColor: '#161622',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#1e1e2c',
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                  onPress={pickStatusMedia}
                >
                  <Icon name="image" size={24} color="#d946ef" />
                  <Text style={{ color: '#f0f0ff', fontSize: 13, fontWeight: '700' }}>Choose Photo or Video</Text>
                </TouchableOpacity>

                {statusMediaUri ? (
                  <View style={{ width: '100%', height: 160, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1e1e2c' }}>
                    <Image source={{ uri: statusMediaUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </View>
                ) : (
                  <Text style={{ color: theme.subText, fontSize: 12 }}>No file selected</Text>
                )}
              </View>
            )}

            {statusType === 'link' && (
              <View style={{ gap: 12 }}>
                <Text style={{ color: theme.subText, fontSize: 12, fontWeight: '700' }}>Paste Link URL:</Text>
                <TextInput
                  style={{
                    backgroundColor: '#161622',
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: '#1e1e2c',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: '#f0f0ff',
                    fontSize: 13
                  }}
                  placeholder="https://example.com"
                  placeholderTextColor="#4b5563"
                  value={statusLinkUrl}
                  onChangeText={setStatusLinkUrl}
                  autoCapitalize="none"
                />
              </View>
            )}

            {statusType === 'audio' && (
              <View style={{ gap: 12, alignItems: 'center', paddingVertical: 10 }}>
                <TouchableOpacity
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: '#ef444420',
                    borderWidth: 2,
                    borderColor: '#ef444450',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onPress={() => Alert.alert('🎙️ Voice Status', 'Voice recording triggers mic, releasing saves as status')}
                >
                  <Icon name="mic" size={32} color="#ef4444" />
                </TouchableOpacity>
                <Text style={{ color: '#f0f0ff', fontSize: 13, fontWeight: '700' }}>Tap to Record Voice Status</Text>
                <Text style={{ color: theme.subText, fontSize: 12 }}>Record up to 30 seconds of audio update</Text>
              </View>
            )}

            {/* Post Button */}
            <TouchableOpacity
              style={{
                backgroundColor: theme.primary,
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
                marginTop: 10
              }}
              onPress={handlePostStatus}
            >
              <Text style={{ color: '#050608', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 }}>Share Status 🚀</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Status Privacy Settings Modal (WhatsApp Style) ── */}
      <Modal
        visible={showStatusPrivacyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusPrivacyModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(5, 5, 8, 0.88)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setShowStatusPrivacyModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: '#0e0e14',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderWidth: 1,
              borderColor: '#1e1e2c',
              padding: 22,
              gap: 16,
              maxHeight: '85%'
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1e1e2c', paddingBottom: 14 }}>
              <View style={{ gap: 2 }}>
                <Text style={{ color: theme.primary, fontSize: 18, fontWeight: '900', letterSpacing: 0.5 }}>🛡️ Status Privacy</Text>
                <Text style={{ color: theme.subText, fontSize: 12 }}>Who can see my status updates</Text>
              </View>
              <TouchableOpacity onPress={() => setShowStatusPrivacyModal(false)} style={{ padding: 4 }}>
                <Text style={{ color: '#8b8ba7', fontSize: 14, fontWeight: '700' }}>✕ Close</Text>
              </TouchableOpacity>
            </View>

            {/* Status Expiry Info Badge */}
            <View style={{ backgroundColor: isPremiumUser ? '#1a1600' : '#12121a', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: isPremiumUser ? '#ffd70040' : '#1e1e2c', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 22 }}>{isPremiumUser ? '👑' : '⏳'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: isPremiumUser ? '#ffd700' : theme.text, fontSize: 13, fontWeight: '800' }}>
                  {isPremiumUser ? 'VOID Premium Active (72 Hours)' : 'Normal User (24 Hours)'}
                </Text>
                <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2 }}>
                  {isPremiumUser 
                    ? 'Your status updates stay live for 3 Days (72h)!' 
                    : 'Statuses automatically expire after 24 Hours. Upgrade to Premium for 3-Day lifespan.'}
                </Text>
              </View>
            </View>

            {/* Privacy Radio Options */}
            <View style={{ gap: 10 }}>
              {[
                { id: 'contacts', title: '👥 My Contacts', desc: 'All your matched contacts on VOID CHAT' },
                { id: 'except', title: '🚫 My Contacts Except...', desc: 'Hide status updates from selected contacts' },
                { id: 'only', title: '🔒 Only Share With...', desc: 'Share status updates only with selected contacts' }
              ].map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: statusPrivacyOption === opt.id ? `${theme.primary}15` : '#161622',
                    padding: 14,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: statusPrivacyOption === opt.id ? theme.primary : '#1e1e2c',
                    gap: 12
                  }}
                  onPress={() => setStatusPrivacyOption(opt.id)}
                >
                  <View style={{
                    width: 20, height: 20, borderRadius: 10,
                    borderWidth: 2, borderColor: statusPrivacyOption === opt.id ? theme.primary : '#4b5563',
                    justifyContent: 'center', alignItems: 'center'
                  }}>
                    {statusPrivacyOption === opt.id && (
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary }} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: statusPrivacyOption === opt.id ? theme.primary : theme.text, fontSize: 14, fontWeight: '800' }}>{opt.title}</Text>
                    <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2 }}>{opt.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Contact Selector Checklist for Except & Only options */}
            {(statusPrivacyOption === 'except' || statusPrivacyOption === 'only') && (
              <View style={{ gap: 10, maxHeight: 180 }}>
                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800' }}>
                  {statusPrivacyOption === 'except' ? 'SELECT CONTACTS TO EXCLUDE:' : 'SELECT CONTACTS TO SHARE WITH:'}
                </Text>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8 }}>
                  {users.map(u => {
                    const uId = u._id || u.id
                    const isSelected = statusPrivacySelectedUsers.includes(uId)
                    return (
                      <TouchableOpacity
                        key={uId}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, backgroundColor: '#161622', borderRadius: 12, borderWidth: 1, borderColor: isSelected ? theme.primary : '#1e1e2c' }}
                        onPress={() => {
                          if (isSelected) {
                            setStatusPrivacySelectedUsers(prev => prev.filter(id => id !== uId))
                          } else {
                            setStatusPrivacySelectedUsers(prev => [...prev, uId])
                          }
                        }}
                      >
                        <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>@{u.username || u.name}</Text>
                        <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: isSelected ? theme.primary : '#4b5563', backgroundColor: isSelected ? theme.primary : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                          {isSelected && <Text style={{ color: '#000', fontSize: 11, fontWeight: '900' }}>✓</Text>}
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={{
                backgroundColor: theme.primary,
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 6,
                marginTop: 6
              }}
              onPress={() => {
                setShowStatusPrivacyModal(false)
                const label = statusPrivacyOption === 'contacts' ? 'My Contacts' : (statusPrivacyOption === 'except' ? 'My Contacts Except...' : 'Only Share With...')
                Alert.alert('Status Privacy Saved ⚡', `Privacy updated: ${label}`)
              }}
            >
              <Text style={{ color: '#050608', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 }}>Save Status Privacy ⚡</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Custom Premium Alert Modal ── */}
      <Modal
        visible={!!customAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCustomAlert(null)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(5, 5, 8, 0.9)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          activeOpacity={1}
          onPress={() => setCustomAlert(null)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={{
              width: '100%',
              maxWidth: 320,
              backgroundColor: '#0e0e14',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: theme.primary || '#c8ff00',
              padding: 24,
              alignItems: 'center',
              gap: 16,
              shadowColor: theme.primary || '#c8ff00',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 8
            }}
          >
            {/* Alert Accent Indicator */}
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: (theme.primary || '#c8ff00') + '15', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: (theme.primary || '#c8ff00') + '25' }}>
              <Text style={{ fontSize: 20 }}>🔔</Text>
            </View>

            {/* Content */}
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{ color: theme.text || '#f0f0ff', fontSize: 16, fontWeight: '900', textAlign: 'center', letterSpacing: 0.3 }}>
                {customAlert?.title}
              </Text>
              {customAlert?.message ? (
                <Text style={{ color: theme.subText || '#8b8ba7', fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                  {customAlert?.message}
                </Text>
              ) : null}
            </View>

            {/* Buttons Row / Column */}
            <View style={{ width: '100%', gap: 10, marginTop: 4 }}>
              {customAlert?.buttons.map((btn, idx) => {
                const isDestructive = btn.style === 'destructive'
                const isCancel = btn.style === 'cancel'
                
                return (
                  <TouchableOpacity
                    key={idx}
                    style={{
                      width: '100%',
                      backgroundColor: isDestructive 
                        ? '#ef4444' 
                        : (isCancel ? '#161622' : (theme.primary || '#c8ff00')),
                      borderWidth: isCancel ? 1 : 0,
                      borderColor: '#1e1e2c',
                      paddingVertical: 12,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onPress={() => {
                      setCustomAlert(null)
                      if (btn.onPress) btn.onPress()
                    }}
                  >
                    <Text style={{
                      color: isDestructive 
                        ? '#ffffff' 
                        : (isCancel ? '#8b8ba7' : '#050608'),
                      fontSize: 13,
                      fontWeight: '800'
                    }}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  // ── Core layout ─────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#060608',
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  splitLayoutContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#060608',
  },
  sidebarContainer: {
    width: 320,
    borderRightWidth: 1,
    borderRightColor: '#1a1a24',
    backgroundColor: '#0a0a0f',
  },
  mainContentContainer: {
    flex: 1,
    backgroundColor: '#060608',
  },
  desktopPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#060608',
  },
  desktopPlaceholderText: {
    color: '#f0f0ff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  desktopPlaceholderSubtext: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },
  content:   { flex: 1 },

  // ── Header ──────────────────────────────────────────────────
  headerWrapper: {
    backgroundColor: '#060608',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a24',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#060608',
  },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0e0e14',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e1e2c',
    overflow: 'hidden',
  },
  modeToggleFullBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    borderRadius: 18,
  },
  modeToggleFullActive: {
    backgroundColor: '#1c1800',
    borderWidth: 1,
    borderColor: '#ffc80050',
  },
  modeToggleFullIcon: { fontSize: 16 },
  modeToggleFullText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '700',
  },
  logo: {
    fontSize: 20, fontWeight: '900', color: '#c8ff00', letterSpacing: 2,
    textShadowColor: '#c8ff0040',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  VOIDBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0a1600', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#c8ff0035',
    shadowColor: '#c8ff00', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  VOIDText:  { color: '#c8ff00', fontSize: 12, fontWeight: '800' },
  notifBtn:  { fontSize: 22 },

  // Settings icon wrapper
  settingsIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#2a2a40',
  },

  // ── Feed ────────────────────────────────────────────────────
  emptyFeed: { alignItems: 'center', paddingTop: 80, paddingBottom: 40, gap: 16 },
  emptyIcon: { fontSize: 56 },
  emptyText: { color: '#6b7280', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    backgroundColor: '#c8ff00', paddingHorizontal: 28, paddingVertical: 13,
    borderRadius: 22,
    shadowColor: '#c8ff00', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55, shadowRadius: 14, elevation: 8,
  },
  emptyBtnText: { color: '#050608', fontWeight: '900', fontSize: 14 },

  post: {
    marginHorizontal: 12, marginTop: 10, padding: 16,
    backgroundColor: '#0e0e14', borderRadius: 18,
    borderWidth: 1, borderColor: '#1e1e2c',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#1e1e2c',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  postMeta:   { flex: 1, marginLeft: 12 },
  username:   { color: '#f0f0ff', fontWeight: '700', fontSize: 14 },
  postTime:   { color: '#4b5568', fontSize: 11, marginTop: 2 },
  VOIDEarned: {
    backgroundColor: '#0a1600', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1, borderColor: '#c8ff0025',
  },
  VOIDEarnedText: { color: '#c8ff00', fontSize: 11, fontWeight: '700' },
  postContent: { color: '#dcdcee', fontSize: 14, lineHeight: 22, marginBottom: 14 },
  postActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 50,
    backgroundColor: '#0d0d14',
    borderWidth: 1,
    borderColor: '#ffffff0d',
  },
  actionBtnLiked: {
    backgroundColor: '#1a0a14',
    borderColor: '#ff4d6d30',
  },
  actionIcon: {
    color: '#4b5563',
    fontSize: 15,
  },
  actionCount: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '600',
  },
  actionCountLiked: {
    color: '#ff4d6d',
  },
  actionText: { color: '#6b7280', fontSize: 13 },

  // ── Inbox ───────────────────────────────────────────────────
  adBanner: {
    margin: 12, padding: 12, backgroundColor: '#0e0e14',
    borderRadius: 12, borderWidth: 1, borderColor: '#1e1e2c',
  },
  adText: { color: '#6b7280', fontSize: 12 },
  chatItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#0f0f18', gap: 14,
  },
  chatAvatar: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
  },
  chatInfo: { flex: 1 },
  chatName:  { color: '#f0f0ff', fontWeight: '700', fontSize: 15 },
  chatLast:  { color: '#6b7280', fontSize: 12, marginTop: 3 },
  streakBadge: {
    position: 'absolute', bottom: -2, right: -4,
    backgroundColor: '#1a0a00', paddingHorizontal: 4, paddingVertical: 1,
    borderRadius: 8, borderWidth: 1, borderColor: '#fb923c30',
  },
  streakBadgeText: { color: '#fb923c', fontSize: 9, fontWeight: '700' },
  unreadBadge: {
    backgroundColor: '#c8ff00', borderRadius: 12,
    minWidth: 22, height: 22,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
    shadowColor: '#c8ff00', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55, shadowRadius: 6, elevation: 5,
  },
  unreadText: { color: '#050608', fontSize: 11, fontWeight: '900' },

  // ── Wallet ──────────────────────────────────────────────────
  walletCard: {
    backgroundColor: '#0a1600', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#c8ff0030',
    shadowColor: '#c8ff00', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18, shadowRadius: 20, elevation: 8,
  },
  walletLabel:   { color: '#c8ff00', fontSize: 12, fontWeight: '800', marginBottom: 10, letterSpacing: 1 },
  walletBalance: { color: '#c8ff00', fontSize: 38, fontWeight: '900', marginBottom: 4 },
  walletPKR:     { color: '#6b7280', fontSize: 14, marginBottom: 20 },
  walletBtns:    { flexDirection: 'row', gap: 10 },
  walletBtn: {
    flex: 1, paddingVertical: 12, backgroundColor: '#ffffff08',
    borderRadius: 14, borderWidth: 1, borderColor: '#ffffff18', alignItems: 'center',
  },
  walletBtnText: { color: '#f0f0ff', fontSize: 13, fontWeight: '700' },
  cashoutBtn: {
    backgroundColor: '#c8ff00',
    shadowColor: '#c8ff00', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  cashoutText: { color: '#050608', fontWeight: '900' },
  miningCard: {
    backgroundColor: '#080f00', borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: '#c8ff0018',
  },
  miningTitle:  { color: '#c8ff00', fontSize: 14, fontWeight: '800', marginBottom: 6 },
  miningPoints: { color: '#f0f0ff', fontSize: 24, fontWeight: '900', marginBottom: 12 },
  progressBar: {
    height: 6, backgroundColor: '#0d1a00', borderRadius: 4,
    marginBottom: 8, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#c8ff00', borderRadius: 4 },
  miningNote:   { color: '#6b7280', fontSize: 12 },
  referMiniCard: {
    backgroundColor: '#0e0e14', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: '#1e1e2c', alignItems: 'center',
  },
  referTitle: { color: '#f0f0ff', fontWeight: '800', marginBottom: 10 },
  referCode: {
    color: '#c8ff00', fontSize: 24, fontWeight: '900',
    letterSpacing: 3, marginBottom: 14,
  },
  referBtn: {
    backgroundColor: '#0a1600', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: '#c8ff0030',
  },
  referBtnText: { color: '#c8ff00', fontSize: 13, fontWeight: '700' },

  // ── Profile ─────────────────────────────────────────────────
  profileScreen: { padding: 24, alignItems: 'center' },
  profileAvatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#c8ff00',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    borderWidth: 3, borderColor: '#c8ff0060',
    shadowColor: '#c8ff00', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  profileAvatarText: { fontSize: 36, fontWeight: '900', color: '#050608' },
  profileName:  { color: '#f0f0ff', fontSize: 20, fontWeight: '900', marginBottom: 6 },
  profileBio:   { color: '#6b7280', fontSize: 13, marginBottom: 28 },
  profileStats: { flexDirection: 'row', gap: 36, marginBottom: 32 },
  statItem:     { alignItems: 'center' },
  statValue:    { color: '#c8ff00', fontSize: 22, fontWeight: '900' },
  statLabel:    { color: '#6b7280', fontSize: 12, marginTop: 2 },
  profileMenuItem: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    padding: 16, backgroundColor: '#0e0e14', borderRadius: 16,
    marginBottom: 10, gap: 14, borderWidth: 1, borderColor: '#1e1e2c',
  },
  menuIcon:  { fontSize: 20 },
  menuLabel: { flex: 1, color: '#f0f0ff', fontSize: 15, fontWeight: '600' },
  menuArrow: { color: '#3a3a5a', fontSize: 20 },

  // ── Bottom Navigation ────────────────────────────────────────
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center', paddingVertical: 10, 
    paddingBottom: Platform.OS === 'android' ? 28 : 18,
    backgroundColor: '#08080c',
    borderTopWidth: 1, borderTopColor: '#1a1a24',
  },
  navBtn:        { alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, minWidth: 52 },
  navSpecial: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#fffc00', // Snapchat Yellow
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#fffc00', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.65, shadowRadius: 14, elevation: 12,
    borderWidth: 2, borderColor: '#ffffff',
  },
  navIcon:        { fontSize: 22, color: '#3a3a5a' },
  navSpecialIcon: { color: '#050608', fontWeight: '900' },
  navActiveIcon:  { color: '#c8ff00' },
  navLabel:       { fontSize: 10, color: '#3a3a5a', marginTop: 3, fontWeight: '600' },
  navLabelActive: { color: '#c8ff00' },

  // ── Modals ──────────────────────────────────────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: '#060608',
    alignSelf: 'center',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#1a1a24',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#1a1a24',
  },
  cancelBtn:  { color: '#6b7280', fontSize: 15, fontWeight: '600' },
  modalTitle: { color: '#f0f0ff', fontSize: 17, fontWeight: '900' },
  postBtn: {
    backgroundColor: '#c8ff00', paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#c8ff00', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
  },
  postBtnText: { color: '#050608', fontWeight: '900', fontSize: 13 },
  modalInput: {
    backgroundColor: '#0e0e14', borderRadius: 16, padding: 16,
    minHeight: 110, borderWidth: 1, borderColor: '#1e1e2c',
  },
  inputText: { color: '#f0f0ff', fontSize: 15, lineHeight: 24 },
  anonToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    backgroundColor: '#0e0e14', borderRadius: 16,
    borderWidth: 1, borderColor: '#1e1e2c',
  },
  anonToggleActive: { backgroundColor: '#0e0c2e', borderColor: '#6366f1' },
  anonText:         { color: '#6b7280', fontWeight: '700' },
  VOIDInfoCard: {
    backgroundColor: '#0a1600', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#c8ff0018',
  },
  VOIDInfoTitle: { color: '#c8ff00', fontWeight: '800', fontSize: 13, marginBottom: 10 },
  VOIDInfoItem:  { color: '#6b7280', fontSize: 12, marginBottom: 5, lineHeight: 18 },
  textBox:       { gap: 10 },
  suggestion: {
    backgroundColor: '#0e0e14', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#1e1e2c',
  },
  suggestionText: { color: '#8b8ba7', fontSize: 13 },

  // ── Mode Toggle Styles ───────────────────────────────────────
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#0e0e14',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e1e2c',
    padding: 2,
    alignItems: 'center',
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
    gap: 4,
  },
  modeToggleActive: {
    backgroundColor: '#c8ff00',
  },
  modeToggleIcon: {
    fontSize: 14,
  },
  modeToggleText: {
    color: '#050608',
    fontSize: 12,
    fontWeight: '900',
  },

  // ── Profile Detail Modal Styles ──────────────────────────────
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  profileModalContent: {
    backgroundColor: '#0a0a0f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '60%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#1f1f2e',
    overflow: 'hidden',
  },
  profileModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f2e',
  },
  profileModalClose: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '700',
  },
  profileModalTitle: {
    color: '#f0f0ff',
    fontSize: 16,
    fontWeight: '900',
  },
  profileModalBody: {
    padding: 24,
    alignItems: 'center',
  },
  profileModalAvatarContainer: {
    marginBottom: 20,
    shadowColor: '#c8ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  profileModalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1c1c28',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#c8ff0050',
  },
  profileModalAvatarText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#c8ff00',
  },
  profileModalUsername: {
    color: '#f0f0ff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  profileModalBio: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  profileModalStats: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 32,
    backgroundColor: '#0e0e16',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e1e2e',
  },
  profileModalStatItem: {
    alignItems: 'center',
  },
  profileModalStatValue: {
    color: '#c8ff00',
    fontSize: 18,
    fontWeight: '900',
  },
  profileModalStatLabel: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  profileModalActions: {
    width: '100%',
    marginTop: 10,
  },
  profileModalBlockBtn: {
    width: '100%',
    paddingVertical: 15,
    backgroundColor: '#ef444415',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ef444460',
    alignItems: 'center',
  },
  profileModalUnblockBtn: {
    backgroundColor: '#10b98115',
    borderColor: '#10b98160',
  },
  profileModalBlockBtnText: {
    color: '#f87171',
    fontSize: 15,
    fontWeight: '800',
  },

  // ── New Media Post & Selector Styles ─────────────────────────
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1e1e2c',
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#c8ff00',
  },
  tabButtonText: {
    color: '#6b7280',
    fontWeight: '800',
    fontSize: 12,
  },
  tabButtonTextActive: {
    color: '#050608',
  },
  modalTextInput: {
    backgroundColor: '#0e0e14', borderRadius: 16, padding: 16,
    minHeight: 110, borderWidth: 1, borderColor: '#1e1e2c',
    color: '#f0f0ff', fontSize: 15, textAlignVertical: 'top',
  },
  modalTextInputSmall: {
    backgroundColor: '#0e0e14', borderRadius: 16, padding: 16,
    minHeight: 56, borderWidth: 1, borderColor: '#1e1e2c',
    color: '#f0f0ff', fontSize: 15,
  },
  mediaContainer: {
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#12121e',
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
  },
  videoPlayerCard: {
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  videoPlayerPlaceholder: {
    height: 180,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e1e2d',
    borderRadius: 16,
    position: 'relative',
  },
  videoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  videoPlayText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
  },
  playButtonOverlay: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#c8ff00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#c8ff00',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  playButtonText: {
    color: '#050608',
    fontSize: 18,
    marginLeft: 4,
    fontWeight: '900',
  },
  linkCard: {
    flexDirection: 'row',
    backgroundColor: '#0e0e14',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e1e2c',
    alignItems: 'center',
    gap: 14,
  },
  linkIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1e1e2c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkIconEmoji: {
    fontSize: 18,
  },
  linkMeta: {
    flex: 1,
    gap: 4,
  },
  linkUrlText: {
    color: '#a5b4fc',
    fontSize: 13,
    fontWeight: '700',
  },
  linkTapText: {
    color: '#4b5563',
    fontSize: 11,
    fontWeight: '600',
  },
  floatingCreateBtn: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#060608',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#c8ff0060',
    shadowColor: '#c8ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  fabRing: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#c8ff00',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#c8ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 6,
  },
  fabInner: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#c8ff00',
    justifyContent: 'center', alignItems: 'center',
  },
  fabPlus: {
    color: '#050608', fontSize: 18, fontWeight: '900',
    lineHeight: 22, marginTop: -1,
  },
  fabLabel: {
    color: '#c8ff00', fontSize: 13, fontWeight: '800',
    letterSpacing: 0.5,
  },
  floatingCreateIcon: {
    fontSize: 26,
    color: '#050608',
    fontWeight: '900',
  },
  urlPreviewCard: {
    backgroundColor: '#0e0e14',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e1e2c',
    padding: 12,
    gap: 8,
    overflow: 'hidden',
  },
  
  // Chat Settings styling classes
  settingsSection: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  settingsSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sizeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  wallpaperPresetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  appIconPreviewTile: {
    width: 54,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  premiumIconCrownBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ffd700',
    borderRadius: 7,
    width: 15,
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
})