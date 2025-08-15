export const parseTrackName = (trackName) => {
  const mixPattern = /\s*\(([^)]+)\)$/
  const mix = trackName.match(mixPattern)

  if (mix) {
    return {
      name: trackName.replace(mixPattern, '').trim(),
      mix: mix[1].trim()
    }
  }
  return { name: trackName.trim(), mix: null }
}
