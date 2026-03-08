import 'package:flutter_sonicwave/features/auth/domain/server_profile.dart';

/// Persists the server profile used to restore a user session.
abstract class ServerProfileStore {
  /// Reads the last saved profile, or returns `null` when none exists.
  Future<ServerProfile?> read();

  /// Persists the given profile for later restoration.
  Future<void> write(ServerProfile profile);

  /// Deletes any stored profile.
  Future<void> clear();
}
