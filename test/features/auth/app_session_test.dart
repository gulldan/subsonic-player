import 'package:flutter_sonicwave/features/auth/data/server_profile_store.dart';
import 'package:flutter_sonicwave/features/auth/domain/server_profile.dart';
import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/fakes.dart';

class _ThrowingServerProfileStore implements ServerProfileStore {
  @override
  Future<void> clear() async {}

  @override
  Future<ServerProfile?> read() async {
    throw StateError('preferences unavailable');
  }

  @override
  Future<void> write(ServerProfile profile) async {}
}

void main() {
  test('bootstrap signs out when no stored profile', () async {
    final store = InMemoryServerProfileStore();
    final api = FakeSubsonicApi();
    final session = AppSession(profileStore: store, clientFactory: (_) => api);

    await session.bootstrap();

    expect(session.status, AppSessionStatus.unauthenticated);
    expect(session.profile, isNull);
  });

  test('signIn authenticates and persists profile on success', () async {
    final store = InMemoryServerProfileStore();
    final api = FakeSubsonicApi();
    final session = AppSession(profileStore: store, clientFactory: (_) => api);

    final ok = await session.signIn(
      serverUrl: 'https://demo.navidrome.org',
      username: 'demo',
      password: 'demo',
    );

    expect(ok, isTrue);
    expect(session.status, AppSessionStatus.authenticated);
    expect(session.profile?.username, 'demo');
    expect(store.profile?.baseUrl, 'https://demo.navidrome.org');
    expect(api.callCount, 1);
  });

  test(
    'signIn can skip persisting credentials when rememberMe is off',
    () async {
      final store = InMemoryServerProfileStore()
        ..profile = const ServerProfile(
          baseUrl: 'https://old.example.com',
          username: 'old-user',
          password: 'old-pass',
        );
      final api = FakeSubsonicApi();
      final session = AppSession(
        profileStore: store,
        clientFactory: (_) => api,
      );

      final ok = await session.signIn(
        serverUrl: 'https://demo.navidrome.org',
        username: 'demo',
        password: 'demo',
        rememberMe: false,
      );

      expect(ok, isTrue);
      expect(session.status, AppSessionStatus.authenticated);
      expect(store.profile, isNull);
    },
  );

  test('signIn fails with readable error when ping fails', () async {
    final store = InMemoryServerProfileStore();
    final api = FakeSubsonicApi(callError: Exception('401 unauthorized'));
    final session = AppSession(profileStore: store, clientFactory: (_) => api);

    final ok = await session.signIn(
      serverUrl: 'https://demo.navidrome.org',
      username: 'demo',
      password: 'wrong',
    );

    expect(ok, isFalse);
    expect(session.status, AppSessionStatus.unauthenticated);
    expect(session.errorMessage, contains('401 unauthorized'));
    expect(store.profile, isNull);
    expect(api.closed, isTrue);
  });

  test('bootstrap authenticates using persisted profile', () async {
    final store = InMemoryServerProfileStore()
      ..profile = const ServerProfile(
        baseUrl: 'https://stored.example.com',
        username: 'stored-user',
        password: 'stored-pass',
      );
    final api = FakeSubsonicApi();
    final session = AppSession(profileStore: store, clientFactory: (_) => api);

    await session.bootstrap();

    expect(session.status, AppSessionStatus.authenticated);
    expect(session.profile?.username, 'stored-user');
  });

  test('bootstrap recovers when profile store throws', () async {
    final session = AppSession(
      profileStore: _ThrowingServerProfileStore(),
      clientFactory: (_) => FakeSubsonicApi(),
    );

    await session.bootstrap();

    expect(session.status, AppSessionStatus.unauthenticated);
    expect(
      session.errorMessage,
      contains('Saved session could not be restored'),
    );
  });

  test('signOut clears profile and closes client', () async {
    final store = InMemoryServerProfileStore();
    final api = FakeSubsonicApi();
    final session = AppSession(profileStore: store, clientFactory: (_) => api);

    await session.signIn(
      serverUrl: 'https://demo.navidrome.org',
      username: 'demo',
      password: 'demo',
    );
    await session.signOut();

    expect(session.status, AppSessionStatus.unauthenticated);
    expect(session.client, isNull);
    expect(api.closed, isTrue);
  });
}
