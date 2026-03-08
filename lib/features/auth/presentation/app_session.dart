import 'package:flutter/foundation.dart';
import 'package:flutter_sonicwave/features/auth/data/server_profile_store.dart';
import 'package:flutter_sonicwave/features/auth/domain/server_profile.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_client.dart';

enum AppSessionStatus { bootstrapping, unauthenticated, authenticated }

class AppSession extends ChangeNotifier {
  AppSession({
    required ServerProfileStore profileStore,
    required SubsonicClientFactory clientFactory,
  }) : _profileStore = profileStore,
       _clientFactory = clientFactory;

  final ServerProfileStore _profileStore;
  final SubsonicClientFactory _clientFactory;

  AppSessionStatus _status = AppSessionStatus.bootstrapping;
  AppSessionStatus get status => _status;

  ServerProfile? _profile;
  ServerProfile? get profile => _profile;

  SubsonicApi? _client;
  SubsonicApi? get client => _client;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  bool get isBusy => _status == AppSessionStatus.bootstrapping;

  Future<void> bootstrap() async {
    _status = AppSessionStatus.bootstrapping;
    _errorMessage = null;
    notifyListeners();

    final profile = await _profileStore.read();
    if (profile == null) {
      _setSignedOut();
      return;
    }

    await _authenticate(profile, persistProfile: false);
  }

  Future<bool> signIn({
    required String serverUrl,
    required String username,
    required String password,
  }) async {
    final candidateProfile = ServerProfile(
      baseUrl: serverUrl,
      username: username,
      password: password,
    );
    return _authenticate(candidateProfile, persistProfile: true);
  }

  Future<void> signOut() async {
    await _profileStore.clear();
    _closeClient();
    _setSignedOut();
  }

  Future<bool> _authenticate(
    ServerProfile profile, {
    required bool persistProfile,
  }) async {
    _status = AppSessionStatus.bootstrapping;
    _errorMessage = null;
    notifyListeners();

    _closeClient();
    final client = _clientFactory(profile);
    try {
      await client.call('ping');
    } on Object catch (error) {
      client.close();
      _status = AppSessionStatus.unauthenticated;
      _errorMessage = _buildConnectionError(profile: profile, error: error);
      notifyListeners();
      return false;
    }

    _client = client;
    _profile = profile;
    _status = AppSessionStatus.authenticated;
    notifyListeners();

    if (persistProfile) {
      await _profileStore.write(profile);
    }

    return true;
  }

  String _buildConnectionError({
    required ServerProfile profile,
    required Object error,
  }) {
    final details = error.toString();
    final urlHint = profile.baseUrl.startsWith('http://')
        ? ' Your server uses http://. On Apple platforms, this can be blocked by transport security policy.'
        : '';
    return 'Unable to connect to Subsonic server. '
        'Verify URL and credentials. '
        'Technical details: $details.$urlHint';
  }

  void _setSignedOut() {
    _status = AppSessionStatus.unauthenticated;
    _profile = null;
    _client = null;
    _errorMessage = null;
    notifyListeners();
  }

  void _closeClient() {
    _client?.close();
    _client = null;
  }

  @override
  void dispose() {
    _closeClient();
    super.dispose();
  }
}
