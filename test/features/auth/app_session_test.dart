import 'package:flutter_sonicwave/features/auth/domain/server_profile.dart';
import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/fakes.dart';

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
    final api = FakeSubsonicApi(pingResult: true);
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
    final api = FakeSubsonicApi(pingResult: true);
    final session = AppSession(profileStore: store, clientFactory: (_) => api);

    await session.bootstrap();

    expect(session.status, AppSessionStatus.authenticated);
    expect(session.profile?.username, 'stored-user');
  });

  test('signOut clears profile and closes client', () async {
    final store = InMemoryServerProfileStore();
    final api = FakeSubsonicApi(pingResult: true);
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
