export const getWordCountForGridSize = (size: number): number => {
    if (size >= 10) return 24;
    if (size >= 9) return 20;
    if (size >= 8) return 16;
    if (size >= 7) return 12;
    if (size >= 6) return 10;
    if (size >= 5) return 8;
  return 6;
};

// A mix of common hiragana for filling empty spaces
export const HIRAGANA_CHARS = [
  'あ', 'い', 'う', 'え', 'お',
  'か', 'き', 'く', 'け', 'こ',
  'さ', 'し', 'す', 'せ', 'そ',
  'た', 'ち', 'つ', 'て', 'と',
  'な', 'に', 'ぬ', 'ね', 'の',
  'は', 'ひ', 'ふ', 'へ', 'ほ',
  'ま', 'み', 'む', 'め', 'も',
  'や', 'ゆ', 'よ',
  'ら', 'り', 'る', 'れ', 'ろ',
  'わ', 'を', 'ん'
];
