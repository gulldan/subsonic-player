import 'package:flutter_sonicwave/features/auth/domain/server_profile.dart';

abstract class ServerProfileStore {
  Future<ServerProfile?> read();
  Future<void> write(ServerProfile profile);
  Future<void> clear();
}
