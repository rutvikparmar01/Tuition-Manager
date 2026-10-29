import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { AppBar, Screen, StickyFooter } from '@/components/Screen';
import { updateTutorProfile } from '@/data/repo';
import { useEntitlement } from '@/hooks/useEntitlement';
import { formatPhone } from '@/lib/format';
import { useSession, useUid } from '@/store/session';
import { spacing } from '@/theme';

export default function ClassDetails() {
  const uid = useUid();
  const tutor = useSession((s) => s.tutor);
  const { canWrite } = useEntitlement();
  const [name, setName] = useState(tutor?.name ?? '');
  const [className, setClassName] = useState(tutor?.className ?? '');
  const valid = name.trim().length >= 2 && className.trim().length >= 2;

  return (
    <Screen>
      <AppBar title="Class details" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Field
          label="Your name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={canWrite}
          error={name.trim().length < 2 ? 'Enter your name' : undefined}
        />
        <Field
          label="Class name"
          value={className}
          onChangeText={setClassName}
          autoCapitalize="words"
          editable={canWrite}
          error={className.trim().length < 2 ? 'Enter a class name' : undefined}
        />
        <Field
          label="Mobile number"
          leading="+91"
          value={formatPhone(tutor?.phone ?? '')}
          editable={false}
          helper="This is the number you log in with."
        />
      </ScrollView>
      <StickyFooter>
        <Button
          title="Save"
          disabled={!canWrite || !valid}
          onPress={() => {
            updateTutorProfile(uid, { name: name.trim(), className: className.trim() });
            router.back();
          }}
        />
      </StickyFooter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.screen, gap: 14 },
});
