import { expect, test } from '@jest/globals';
import { Redirect, Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

// Mirrors the guard structure of app/_layout.tsx and app/(auth)/_layout.tsx with plain screens,
// so the routing behaviour can be tested without native Firebase modules.
type Session = { signedIn: boolean; hasTutor: boolean };

function files(session: Session, withIndex: boolean) {
  const Root = () => (
    <Stack>
      {withIndex ? <Stack.Screen name="index" /> : null}
      <Stack.Protected guard={session.hasTutor}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!session.hasTutor}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
  const Auth = () => (
    <Stack>
      <Stack.Protected guard={!session.signedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={session.signedIn}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
    </Stack>
  );
  const Index = () =>
    !session.signedIn ? (
      <Redirect href="/login" />
    ) : (
      <Redirect href={session.hasTutor ? '/home' : '/onboarding'} />
    );
  const page = (name: string) => () => <Text>{name}</Text>;
  const base = {
    _layout: Root,
    '(auth)/_layout': Auth,
    '(auth)/login': page('LOGIN'),
    '(auth)/onboarding': page('ONBOARDING'),
    '(tabs)/_layout': () => <Stack />,
  };
  return withIndex
    ? { ...base, index: Index, '(tabs)/home': page('HOME') }
    : { ...base, '(tabs)/index': page('HOME') };
}

test('old layout: signed out at "/" is unmatched (bug repro)', async () => {
  const r = await renderRouter(files({ signedIn: false, hasTutor: false }, false), {
    initialUrl: '/',
  });
  expect(r.queryByText('LOGIN')).toBeNull();
  expect(r.queryByText(/unmatched/i)).toBeTruthy();
});

test.each([
  [{ signedIn: false, hasTutor: false }, 'LOGIN', '/login'],
  [{ signedIn: true, hasTutor: false }, 'ONBOARDING', '/onboarding'],
  [{ signedIn: true, hasTutor: true }, 'HOME', '/home'],
])('new layout: %o at "/" shows %s', async (session, text, path) => {
  const r = await renderRouter(files(session, true), { initialUrl: '/' });
  expect(r.getByText(text)).toBeTruthy();
  expect(r.getPathname()).toBe(path);
});

// The real root layout renders nothing until fonts + auth are ready, then mounts the Stack.
test('new layout: "/" still resolves when the root layout mounts the Stack late', async () => {
  const session: Session = { signedIn: false, hasTutor: false };
  const f = files(session, true);
  const Inner = f._layout;
  function LateRoot() {
    const [ready, setReady] = useState(false);
    useEffect(() => {
      const t = setTimeout(() => setReady(true), 10);
      return () => clearTimeout(t);
    }, []);
    return ready ? <Inner /> : null;
  }
  const r = await renderRouter({ ...f, _layout: LateRoot }, { initialUrl: '/' });
  expect(await r.findByText('LOGIN')).toBeTruthy();
  expect(r.getPathname()).toBe('/login');
});
