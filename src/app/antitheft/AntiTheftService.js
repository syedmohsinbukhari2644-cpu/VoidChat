// ─── VOID CHAT — Anti-Theft Ghost Mode Service ────────────────────────────────
// Handles: background location, Firestore sync, remote command polling, SOS email
import * as Location from 'expo-location'
import AsyncStorage from '@react-native-async-storage/async-storage'

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/azaad-app/databases/(default)/documents'
const ANTITHEFT_COL  = `${FIRESTORE_BASE}/antitheft`

// ── Storage Keys ──────────────────────────────────────────────────────────────
const KEY_GHOST_SETTINGS   = '@void_ghost_settings'
const KEY_GHOST_ACTIVE     = '@void_ghost_active'

// ── Polling interval ref (setInterval ID) ──────────────────────────────────
let _locationInterval = null
let _commandInterval  = null
let _selfieInterval   = null

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS — save/load ghost mode configuration
// ─────────────────────────────────────────────────────────────────────────────
export const saveGhostSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(KEY_GHOST_SETTINGS, JSON.stringify(settings))
  } catch (e) {}
}

export const loadGhostSettings = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEY_GHOST_SETTINGS)
    return raw ? JSON.parse(raw) : { enabled: false, pin: '', emergencyContact: '', userId: null }
  } catch (e) {
    return { enabled: false, pin: '', emergencyContact: '', userId: null }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PIN HASHING — simple hash for PIN storage (not cryptographic, local only)
// ─────────────────────────────────────────────────────────────────────────────
export const hashPin = (pin) => {
  let hash = 0
  for (let i = 0; i < pin.length; i++) {
    const chr = pin.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return String(Math.abs(hash))
}

export const verifyPin = (inputPin, storedHash) => {
  return hashPin(inputPin) === storedHash
}

// ─────────────────────────────────────────────────────────────────────────────
// REMOTE UNLOCK TOKEN — generates a time-locked token for website unlock
// ─────────────────────────────────────────────────────────────────────────────
export const generateUnlockToken = (userId, pinHash) => {
  const hour = Math.floor(Date.now() / (1000 * 60 * 60))
  return hashPin(`${userId}_${pinHash}_${hour}`)
}

export const verifyUnlockToken = (userId, pinHash, token) => {
  // Valid for current hour or previous hour (grace period)
  const hour = Math.floor(Date.now() / (1000 * 60 * 60))
  const tokenCurrent  = hashPin(`${userId}_${pinHash}_${hour}`)
  const tokenPrevious = hashPin(`${userId}_${pinHash}_${hour - 1}`)
  return token === tokenCurrent || token === tokenPrevious
}

// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const firestorePatch = async (url, fields) => {
  try {
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    })
  } catch (e) {}
}

const firestoreGet = async (url) => {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION — push current location to Firestore
// ─────────────────────────────────────────────────────────────────────────────
export const pushLocationToFirestore = async (userId, coords) => {
  const locationUrl = `${ANTITHEFT_COL}/${userId}/location/current`
  await firestorePatch(locationUrl, {
    lat:       { doubleValue: coords.latitude },
    lng:       { doubleValue: coords.longitude },
    accuracy:  { doubleValue: coords.accuracy || 0 },
    altitude:  { doubleValue: coords.altitude || 0 },
    timestamp: { stringValue: new Date().toISOString() },
    userId:    { stringValue: String(userId) }
  })

  // Also append to route history
  const routeUrl = `${ANTITHEFT_COL}/${userId}/route/${Date.now()}`
  await firestorePatch(routeUrl, {
    lat:       { doubleValue: coords.latitude },
    lng:       { doubleValue: coords.longitude },
    timestamp: { stringValue: new Date().toISOString() }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// INTRUDER LOG — save failed PIN attempt with timestamp
// ─────────────────────────────────────────────────────────────────────────────
export const logFailedAttempt = async (userId) => {
  const attemptUrl = `${ANTITHEFT_COL}/${userId}/intruders/${Date.now()}`
  try {
    const coords = await getCurrentLocation()
    await firestorePatch(attemptUrl, {
      timestamp:    { stringValue: new Date().toISOString() },
      lat:          { doubleValue: coords?.latitude || 0 },
      lng:          { doubleValue: coords?.longitude || 0 },
      event:        { stringValue: 'wrong_pin' }
    })
  } catch (e) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// GHOST STATUS — write active status to Firestore
// ─────────────────────────────────────────────────────────────────────────────
export const updateGhostStatus = async (userId, active) => {
  const settingsUrl = `${ANTITHEFT_COL}/${userId}/settings/config`
  await firestorePatch(settingsUrl, {
    ghostModeActive: { booleanValue: active },
    lastUpdated:     { stringValue: new Date().toISOString() },
    userId:          { stringValue: String(userId) }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND POLLING — check Firestore for remote commands from website
// ─────────────────────────────────────────────────────────────────────────────
export const checkRemoteCommand = async (userId) => {
  try {
    const commandUrl = `${ANTITHEFT_COL}/${userId}/commands/latest`
    const doc = await firestoreGet(commandUrl)
    if (!doc || !doc.fields) return null

    const fields = doc.fields
    const action    = fields.action?.stringValue
    const token     = fields.token?.stringValue
    const processed = fields.processed?.booleanValue

    if (processed) return null  // Already handled

    return { action, token, raw: fields }
  } catch (e) {
    return null
  }
}

export const markCommandProcessed = async (userId) => {
  const commandUrl = `${ANTITHEFT_COL}/${userId}/commands/latest`
  await firestorePatch(commandUrl, {
    processed: { booleanValue: true },
    processedAt: { stringValue: new Date().toISOString() }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// SOS ALERT — trigger email alert when ghost mode activates
// ─────────────────────────────────────────────────────────────────────────────
export const sendSOSAlert = async (userId, emergencyContact, coords) => {
  try {
    const alertUrl = `${ANTITHEFT_COL}/${userId}/alerts/${Date.now()}`
    await firestorePatch(alertUrl, {
      type:             { stringValue: 'SOS_GHOST_MODE' },
      emergencyContact: { stringValue: String(emergencyContact || '') },
      lat:              { doubleValue: coords?.latitude || 0 },
      lng:              { doubleValue: coords?.longitude || 0 },
      timestamp:        { stringValue: new Date().toISOString() },
      message:          { stringValue: '⚠️ VOID Ghost Mode activated — possible theft in progress.' }
    })
  } catch (e) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// ALARM COMMAND — write alarm command for website to trigger
// ─────────────────────────────────────────────────────────────────────────────
export const checkAlarmCommand = async (userId) => {
  try {
    const alarmUrl = `${ANTITHEFT_COL}/${userId}/commands/alarm`
    const doc = await firestoreGet(alarmUrl)
    if (!doc || !doc.fields) return false
    const triggered = doc.fields.triggered?.booleanValue
    const processed = doc.fields.processed?.booleanValue
    return triggered && !processed
  } catch (e) {
    return false
  }
}

export const markAlarmProcessed = async (userId) => {
  const alarmUrl = `${ANTITHEFT_COL}/${userId}/commands/alarm`
  await firestorePatch(alarmUrl, {
    processed:   { booleanValue: true },
    processedAt: { stringValue: new Date().toISOString() }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION HELPER — get current GPS coords
// ─────────────────────────────────────────────────────────────────────────────
export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return null
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    return loc.coords
  } catch (e) {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// START GHOST MODE — begins location tracking + command polling loops
// ─────────────────────────────────────────────────────────────────────────────
export const startGhostMode = async (userId, onUnlockCommand, onAlarmCommand, onTakeSelfie) => {
  await AsyncStorage.setItem(KEY_GHOST_ACTIVE, 'true')
  await updateGhostStatus(userId, true)

  // Initial location push
  const coords = await getCurrentLocation()
  if (coords) {
    await pushLocationToFirestore(userId, coords)
  }

  // Take initial selfie 3 seconds after Ghost Mode activates
  if (onTakeSelfie) {
    setTimeout(() => onTakeSelfie('ghost_mode_activated'), 3000)
  }

  // Location tracking every 5 minutes
  if (_locationInterval) clearInterval(_locationInterval)
  _locationInterval = setInterval(async () => {
    try {
      const c = await getCurrentLocation()
      if (c) await pushLocationToFirestore(userId, c)
    } catch (e) {}
  }, 5 * 60 * 1000)

  // Periodic selfie every 10 minutes
  if (_selfieInterval) clearInterval(_selfieInterval)
  _selfieInterval = setInterval(async () => {
    try {
      if (onTakeSelfie) onTakeSelfie('periodic_capture')
    } catch (e) {}
  }, 10 * 60 * 1000)

  // Remote command polling every 10 seconds
  if (_commandInterval) clearInterval(_commandInterval)
  _commandInterval = setInterval(async () => {
    try {
      // Check unlock command
      const cmd = await checkRemoteCommand(userId)
      if (cmd && cmd.action === 'unlock') {
        await markCommandProcessed(userId)
        if (onUnlockCommand) onUnlockCommand()
      }

      // Check alarm command
      const alarmTriggered = await checkAlarmCommand(userId)
      if (alarmTriggered) {
        await markAlarmProcessed(userId)
        if (onAlarmCommand) onAlarmCommand()
      }
    } catch (e) {}
  }, 10 * 1000)
}

// ─────────────────────────────────────────────────────────────────────────────
// STOP GHOST MODE — stops all loops and updates Firestore status
// ─────────────────────────────────────────────────────────────────────────────
export const stopGhostMode = async (userId) => {
  await AsyncStorage.setItem(KEY_GHOST_ACTIVE, 'false')
  await updateGhostStatus(userId, false)

  if (_locationInterval) {
    clearInterval(_locationInterval)
    _locationInterval = null
  }
  if (_commandInterval) {
    clearInterval(_commandInterval)
    _commandInterval = null
  }
  if (_selfieInterval) {
    clearInterval(_selfieInterval)
    _selfieInterval = null
  }
}
