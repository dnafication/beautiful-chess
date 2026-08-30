/**
 * The one type family the whole table uses, and the four weights it is drawn
 * in. Centralised here so every Player Edge, the promotion prompt and the new
 * game confirmation read as one considered scale rather than reaching for
 * whatever weight looks bold enough in the moment.
 *
 * Manrope replaces the OS system font (San Francisco / Roboto): a single
 * custom face gives the table its own identity without adding ornament,
 * matching the "unornamented visual language" ADR 0004 already commits the
 * piece artwork to.
 *
 * Each entry names a specific static font file rather than a numeric
 * `fontWeight`, which is what a statically-loaded Google Font requires in
 * React Native — pairing a numeric weight with the wrong static face renders
 * as synthetic (faked) bold instead of the real one.
 */
export const fontFamily = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
} as const;
