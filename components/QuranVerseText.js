import React, { useMemo } from 'react';
import { Text } from 'react-native';
import { verseWords } from '../utils/quranReaderText';

function QuranVerseText({ verse, playingKey, word, selection, onHold, theme: t, language }) {
  const tokens = useMemo(() => verseWords(verse), [verse]);
  const active = playingKey === verse.key ? word : null;
  const selected = selection?.key === verse.key ? selection : null;
  return <Text selectable={false} suppressHighlighting>{tokens.map((token, index) => {
    const open = onHold ? () => onHold(verse.key, token) : undefined;
    const highlighted = active && token.from < active.to && token.to > active.from;
    const picked = selected && (selected.from === undefined || token.from < selected.to && token.to > selected.from);
    return <Text key={token.from} selectable={false}>
      {verse.text.slice(index ? tokens[index - 1].to : 0, token.from)}
      <Text selectable={false} suppressHighlighting onLongPress={open}
        accessibilityHint={language === 'ar' ? 'اضغط مطولاً للتفسير أو الاستماع' : 'Hold for Tafsir or listening options'}
        accessibilityActions={open ? [{ name: 'longpress', label: language === 'ar' ? 'التفسير والاستماع' : 'Tafsir and listening options' }] : undefined}
        onAccessibilityAction={e => { if (e.nativeEvent.actionName === 'longpress') open?.(); }}
        style={highlighted ? { backgroundColor: '#F7D788', color: '#19382B' } : picked ? { backgroundColor: t.isDark ? '#375C49' : '#D9EBD8' } : undefined}>{token.text}</Text>
      {index === tokens.length - 1 ? verse.text.slice(token.to) : ''}
    </Text>;
  })}</Text>;
}
export default React.memo(QuranVerseText, (a, b) =>
  a.verse === b.verse && a.theme === b.theme && a.language === b.language && a.onHold === b.onHold &&
  (a.selection?.key === a.verse.key ? a.selection : null) === (b.selection?.key === b.verse.key ? b.selection : null) &&
  (a.playingKey === a.verse.key ? a.word : null) === (b.playingKey === b.verse.key ? b.word : null));
