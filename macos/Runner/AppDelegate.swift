import Cocoa
import FlutterMacOS
import MediaPlayer

@main
class AppDelegate: FlutterAppDelegate, NSWindowDelegate {
  private var mediaBridge: MacosMediaBridge?
  private weak var trackedWindow: NSWindow?

  override func applicationDidFinishLaunching(_ notification: Notification) {
    NSApp.appearance = NSAppearance(named: .darkAqua)
    super.applicationDidFinishLaunching(notification)
  }

  override func applicationShouldTerminateAfterLastWindowClosed(
    _ sender: NSApplication
  ) -> Bool {
    false
  }

  override func applicationSupportsSecureRestorableState(
    _ app: NSApplication
  ) -> Bool {
    true
  }

  override func applicationShouldHandleReopen(
    _ sender: NSApplication,
    hasVisibleWindows flag: Bool
  ) -> Bool {
    if !flag {
      showMainWindow()
    }
    return true
  }

  func windowShouldClose(_ sender: NSWindow) -> Bool {
    sender.orderOut(nil)
    return false
  }

  func connectMainWindow(
    _ window: NSWindow,
    flutterViewController: FlutterViewController
  ) {
    trackedWindow = window
    window.delegate = self
    window.appearance = NSAppearance(named: .darkAqua)
    window.titleVisibility = .visible
    window.titlebarAppearsTransparent = false
    window.isMovableByWindowBackground = false
    window.backgroundColor = .windowBackgroundColor
    window.isOpaque = true
    window.toolbar = nil

    guard mediaBridge == nil else {
      return
    }

    mediaBridge = MacosMediaBridge(
      flutterViewController: flutterViewController,
      showWindow: { [weak self] in
        self?.showMainWindow()
      }
    )
  }

  private func showMainWindow() {
    guard let window = mainWindow else {
      return
    }

    activateApp()
    window.makeKeyAndOrderFront(nil)
  }

  private func activateApp() {
    if #available(macOS 14.0, *) {
      NSApp.activate()
      return
    }

    NSApp.activate(ignoringOtherApps: true)
  }

  private var mainWindow: NSWindow? {
    trackedWindow ?? NSApp.windows.first
  }
}

private final class MacosMediaBridge: NSObject, FlutterStreamHandler {
  private static let methodsChannelName =
    "flutter_sonicwave/macos_desktop/methods"
  private static let eventsChannelName =
    "flutter_sonicwave/macos_desktop/events"

  private let methodChannel: FlutterMethodChannel
  private let eventChannel: FlutterEventChannel
  private let statusItem = NSStatusBar.system.statusItem(
    withLength: NSStatusItem.variableLength
  )
  private let statusMenu = NSMenu()
  private let showWindow: () -> Void

  private var eventSink: FlutterEventSink?
  private var artworkTask: URLSessionDataTask?
  private var cachedArtwork: MPMediaItemArtwork?
  private var currentArtworkURL: URL?
  private var snapshot = PlaybackSnapshot()

  private let titleItem = NSMenuItem(title: "Aurio", action: nil, keyEquivalent: "")
  private let subtitleItem = NSMenuItem(
    title: "Self-hosted audio for desktop",
    action: nil,
    keyEquivalent: ""
  )
  private lazy var playPauseItem = NSMenuItem(
    title: "Play",
    action: #selector(handlePlayPause),
    keyEquivalent: ""
  )
  private lazy var nextTrackItem = NSMenuItem(
    title: "Next Track",
    action: #selector(handleNextTrack),
    keyEquivalent: ""
  )
  private lazy var previousTrackItem = NSMenuItem(
    title: "Previous Track",
    action: #selector(handlePreviousTrack),
    keyEquivalent: ""
  )
  private lazy var favoriteItem = NSMenuItem(
    title: "Favorite",
    action: #selector(handleFavorite),
    keyEquivalent: ""
  )
  private let ratingMenuItem = NSMenuItem(
    title: "Rating",
    action: nil,
    keyEquivalent: ""
  )
  private let ratingMenu = NSMenu(title: "Rating")
  private lazy var showWindowItem = NSMenuItem(
    title: "Show Aurio",
    action: #selector(handleShowWindow),
    keyEquivalent: ""
  )
  private lazy var quitItem = NSMenuItem(
    title: "Quit Aurio",
    action: #selector(handleQuit),
    keyEquivalent: "q"
  )

  init(
    flutterViewController: FlutterViewController,
    showWindow: @escaping () -> Void
  ) {
    methodChannel = FlutterMethodChannel(
      name: Self.methodsChannelName,
      binaryMessenger: flutterViewController.engine.binaryMessenger
    )
    eventChannel = FlutterEventChannel(
      name: Self.eventsChannelName,
      binaryMessenger: flutterViewController.engine.binaryMessenger
    )
    self.showWindow = showWindow
    super.init()

    eventChannel.setStreamHandler(self)
    methodChannel.setMethodCallHandler(handleMethodCall)
    configureStatusItem()
    configureRemoteCommands()
    applySnapshot()
  }

  func onListen(
    withArguments arguments: Any?,
    eventSink events: @escaping FlutterEventSink
  ) -> FlutterError? {
    eventSink = events
    return nil
  }

  func onCancel(withArguments arguments: Any?) -> FlutterError? {
    eventSink = nil
    return nil
  }

  private func handleMethodCall(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
    switch call.method {
    case "syncPlaybackState":
      guard let payload = call.arguments as? [String: Any] else {
        result(
          FlutterError(
            code: "invalid-args",
            message: "Expected syncPlaybackState to receive a map payload.",
            details: nil
          )
        )
        return
      }
      snapshot = PlaybackSnapshot(payload: payload)
      applySnapshot()
      result(nil)
    default:
      result(FlutterMethodNotImplemented)
    }
  }

  private func configureStatusItem() {
    statusItem.menu = statusMenu

    titleItem.isEnabled = false
    subtitleItem.isEnabled = false

    playPauseItem.target = self
    nextTrackItem.target = self
    previousTrackItem.target = self
    favoriteItem.target = self
    showWindowItem.target = self
    quitItem.target = self

    for rating in 0...5 {
      let title = rating == 0
        ? "Clear Rating"
        : String(repeating: "★", count: rating)
          + String(repeating: "☆", count: max(0, 5 - rating))
      let item = NSMenuItem(
        title: title,
        action: #selector(handleSetRating(_:)),
        keyEquivalent: ""
      )
      item.target = self
      item.tag = rating
      ratingMenu.addItem(item)
    }

    ratingMenuItem.submenu = ratingMenu

    statusMenu.items = [
      titleItem,
      subtitleItem,
      .separator(),
      playPauseItem,
      nextTrackItem,
      previousTrackItem,
      favoriteItem,
      ratingMenuItem,
      .separator(),
      showWindowItem,
      quitItem,
    ]
  }

  private func configureRemoteCommands() {
    let commandCenter = MPRemoteCommandCenter.shared()

    commandCenter.togglePlayPauseCommand.isEnabled = true
    commandCenter.playCommand.isEnabled = true
    commandCenter.pauseCommand.isEnabled = true
    commandCenter.nextTrackCommand.isEnabled = true
    commandCenter.previousTrackCommand.isEnabled = true
    commandCenter.likeCommand.isEnabled = true
    commandCenter.dislikeCommand.isEnabled = true
    commandCenter.ratingCommand.isEnabled = true
    commandCenter.ratingCommand.maximumRating = 5
    commandCenter.changeShuffleModeCommand.isEnabled = true
    commandCenter.changeRepeatModeCommand.isEnabled = true
    commandCenter.changePlaybackPositionCommand.isEnabled = true

    commandCenter.togglePlayPauseCommand.addTarget { [weak self] _ in
      self?.emitCommand("togglePlayPause") ?? .commandFailed
    }
    commandCenter.playCommand.addTarget { [weak self] _ in
      self?.emitCommand("play") ?? .commandFailed
    }
    commandCenter.pauseCommand.addTarget { [weak self] _ in
      self?.emitCommand("pause") ?? .commandFailed
    }
    commandCenter.nextTrackCommand.addTarget { [weak self] _ in
      self?.emitCommand("nextTrack") ?? .commandFailed
    }
    commandCenter.previousTrackCommand.addTarget { [weak self] _ in
      self?.emitCommand("previousTrack") ?? .commandFailed
    }
    commandCenter.likeCommand.addTarget { [weak self] _ in
      self?.emitCommand("toggleFavorite") ?? .commandFailed
    }
    commandCenter.dislikeCommand.addTarget { [weak self] _ in
      self?.emitCommand("setRating", payload: ["value": 0]) ?? .commandFailed
    }
    commandCenter.ratingCommand.addTarget { [weak self] event in
      guard let ratingEvent = event as? MPRatingCommandEvent else {
        return .commandFailed
      }
      return self?.emitCommand(
        "setRating",
        payload: ["value": Int(ratingEvent.rating.rounded())]
      ) ?? .commandFailed
    }
    commandCenter.changeShuffleModeCommand.addTarget { [weak self] event in
      guard let shuffleEvent = event as? MPChangeShuffleModeCommandEvent else {
        return .commandFailed
      }
      let enabled = shuffleEvent.shuffleType != .off
      return self?.emitCommand(
        "setShuffle",
        payload: ["enabled": enabled]
      ) ?? .commandFailed
    }
    commandCenter.changeRepeatModeCommand.addTarget { [weak self] event in
      guard let repeatEvent = event as? MPChangeRepeatModeCommandEvent else {
        return .commandFailed
      }

      let mode: String
      switch repeatEvent.repeatType {
      case .all:
        mode = "all"
      case .one:
        mode = "one"
      default:
        mode = "off"
      }

      return self?.emitCommand(
        "setRepeatMode",
        payload: ["mode": mode]
      ) ?? .commandFailed
    }
    commandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
      guard
        let playbackEvent = event as? MPChangePlaybackPositionCommandEvent
      else {
        return .commandFailed
      }

      return self?.emitCommand(
        "seekToPosition",
        payload: ["seconds": playbackEvent.positionTime]
      ) ?? .commandFailed
    }
  }

  private func applySnapshot() {
    updateStatusItem()
    updateMenu()
    updateNowPlayingInfo()
    loadArtworkIfNeeded()
  }

  private func updateStatusItem() {
    guard let button = statusItem.button else {
      return
    }

    button.toolTip = snapshot.hasTrack
      ? "\(snapshot.title) — \(snapshot.artist)"
      : "\(snapshot.userLabel) · \(snapshot.serverLabel)"
    button.contentTintColor = snapshot.isPlaying
      ? NSColor.controlAccentColor
      : NSColor.secondaryLabelColor

    let symbolName = snapshot.isPlaying
      ? "waveform"
      : snapshot.hasTrack
      ? "pause.circle"
      : "music.note"

    button.title = ""
    button.imagePosition = .imageOnly

    if #available(macOS 11.0, *) {
      button.image = NSImage(
        systemSymbolName: symbolName,
        accessibilityDescription: "Aurio"
      )
      return
    }

    let fallbackTemplateName = snapshot.isPlaying
      ? NSImage.touchBarAudioOutputVolumeMediumTemplateName
      : snapshot.hasTrack
      ? NSImage.touchBarPauseTemplateName
      : NSImage.touchBarAudioOutputVolumeOffTemplateName
    button.image = NSImage(named: fallbackTemplateName)
  }

  private func updateMenu() {
    titleItem.title = snapshot.hasTrack ? snapshot.title : "Aurio"
    subtitleItem.title = snapshot.hasTrack
      ? snapshot.artist
      : snapshot.authenticated
      ? "\(snapshot.userLabel) · \(snapshot.serverLabel)"
      : "Self-hosted audio for desktop"

    playPauseItem.title = snapshot.isPlaying ? "Pause" : "Play"
    favoriteItem.title = snapshot.isFavorite ? "Unfavorite" : "Favorite"
    showWindowItem.title = snapshot.hasTrack
      ? "Show Aurio"
      : "Open Aurio"

    let hasTrack = snapshot.hasTrack
    playPauseItem.isEnabled = hasTrack
    nextTrackItem.isEnabled = hasTrack
    previousTrackItem.isEnabled = hasTrack
    favoriteItem.isEnabled = hasTrack
    ratingMenuItem.isEnabled = hasTrack

    for item in ratingMenu.items {
      item.state = item.tag == snapshot.rating ? .on : .off
      item.isEnabled = hasTrack
    }
  }

  private func updateNowPlayingInfo() {
    let infoCenter = MPNowPlayingInfoCenter.default()

    guard snapshot.hasTrack else {
      infoCenter.nowPlayingInfo = nil
      if #available(macOS 10.13.2, *) {
        infoCenter.playbackState = .stopped
      }
      return
    }

    var info: [String: Any] = [
      MPMediaItemPropertyTitle: snapshot.title,
      MPMediaItemPropertyArtist: snapshot.artist,
      MPNowPlayingInfoPropertyElapsedPlaybackTime:
        Double(snapshot.positionMs) / 1000,
      MPMediaItemPropertyPlaybackDuration:
        Double(snapshot.durationMs) / 1000,
      MPNowPlayingInfoPropertyPlaybackRate: snapshot.isPlaying ? 1.0 : 0.0,
      MPMediaItemPropertyRating: snapshot.rating,
    ]

    if let artwork = cachedArtwork {
      info[MPMediaItemPropertyArtwork] = artwork
    }

    infoCenter.nowPlayingInfo = info
    if #available(macOS 10.13.2, *) {
      infoCenter.playbackState = snapshot.isPlaying ? .playing : .paused
    }
  }

  private func loadArtworkIfNeeded() {
    guard snapshot.artworkUrl != currentArtworkURL else {
      return
    }

    artworkTask?.cancel()
    cachedArtwork = nil
    currentArtworkURL = snapshot.artworkUrl

    guard let artworkURL = snapshot.artworkUrl else {
      updateNowPlayingInfo()
      return
    }

    artworkTask = URLSession.shared.dataTask(with: artworkURL) { [weak self] data, _, _ in
      guard
        let self,
        let data,
        let image = NSImage(data: data)
      else {
        return
      }

      let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
      DispatchQueue.main.async {
        self.cachedArtwork = artwork
        self.updateNowPlayingInfo()
      }
    }
    artworkTask?.resume()
  }

  private func emitCommand(
    _ command: String,
    payload: [String: Any] = [:]
  ) -> MPRemoteCommandHandlerStatus {
    guard let eventSink else {
      return .noSuchContent
    }

    var event = payload
    event["command"] = command
    eventSink(event)
    return .success
  }

  @objc private func handlePlayPause() {
    _ = emitCommand("togglePlayPause")
  }

  @objc private func handleNextTrack() {
    _ = emitCommand("nextTrack")
  }

  @objc private func handlePreviousTrack() {
    _ = emitCommand("previousTrack")
  }

  @objc private func handleFavorite() {
    _ = emitCommand("toggleFavorite")
  }

  @objc private func handleSetRating(_ sender: NSMenuItem) {
    _ = emitCommand("setRating", payload: ["value": sender.tag])
  }

  @objc private func handleShowWindow() {
    showWindow()
  }

  @objc private func handleQuit() {
    NSApp.terminate(nil)
  }
}

private struct PlaybackSnapshot {
  var authenticated = false
  var hasTrack = false
  var title = "Aurio"
  var artist = "Self-hosted audio for desktop"
  var serverLabel = "Subsonic"
  var userLabel = "Guest"
  var durationMs = 0
  var positionMs = 0
  var isPlaying = false
  var isFavorite = false
  var rating = 0
  var shuffleEnabled = false
  var repeatMode = "off"
  var artworkUrl: URL?

  init() {}

  init(payload: [String: Any]) {
    authenticated = payload["authenticated"] as? Bool ?? false
    hasTrack = payload["title"] is String
    title = payload["title"] as? String ?? "Aurio"
    artist = payload["artist"] as? String ?? "Self-hosted audio for desktop"
    serverLabel = payload["serverLabel"] as? String ?? "Subsonic"
    userLabel = payload["userLabel"] as? String ?? "Guest"
    durationMs = payload["durationMs"] as? Int ?? 0
    positionMs = payload["positionMs"] as? Int ?? 0
    isPlaying = payload["isPlaying"] as? Bool ?? false
    isFavorite = payload["isFavorite"] as? Bool ?? false
    rating = payload["rating"] as? Int ?? 0
    shuffleEnabled = payload["shuffleEnabled"] as? Bool ?? false
    repeatMode = payload["repeatMode"] as? String ?? "off"
    if let artworkString = payload["artworkUrl"] as? String {
      artworkUrl = URL(string: artworkString)
    } else {
      artworkUrl = nil
    }
  }
}
