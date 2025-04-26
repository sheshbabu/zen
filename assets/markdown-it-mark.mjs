export default function ins_plugin (md) {
    // Insert each marker as a separate text token, and add it to delimiter list
    //
    function tokenize (state, silent) {
      const start = state.pos
      const marker = state.src.charCodeAt(start)
  
      if (silent) { return false }
  
      if (marker !== 0x3D/* = */) { return false }
  
      const scanned = state.scanDelims(state.pos, true)
      let len = scanned.length
      const ch = String.fromCharCode(marker)
  
      if (len < 2) { return false }
  
      if (len % 2) {
        const token = state.push('text', '', 0)
        token.content = ch
        len--
      }
  
      for (let i = 0; i < len; i += 2) {
        const token = state.push('text', '', 0)
        token.content = ch + ch
  
        if (!scanned.can_open && !scanned.can_close) { continue }
  
        state.delimiters.push({
          marker,
          length: 0,     // disable "rule of 3" length checks meant for emphasis
          jump: i / 2, // 1 delimiter = 2 characters
          token: state.tokens.length - 1,
          end: -1,
          open: scanned.can_open,
          close: scanned.can_close
        })
      }
  
      state.pos += scanned.length
  
      return true
    }
  
    // Walk through delimiter list and replace text tokens with tags
    //
    function postProcess (state, delimiters) {
      const loneMarkers = []
      const max = delimiters.length
  
      for (let i = 0; i < max; i++) {
        const startDelim = delimiters[i]
  
        if (startDelim.marker !== 0x3D/* = */) {
          continue
        }
  
        if (startDelim.end === -1) {
          continue
        }
  
        const endDelim = delimiters[startDelim.end]
  
        const token_o = state.tokens[startDelim.token]
        token_o.type = 'mark_open'
        token_o.tag = 'mark'
        token_o.nesting = 1
        token_o.markup = '=='
        token_o.content = ''
  
        const token_c = state.tokens[endDelim.token]
        token_c.type = 'mark_close'
        token_c.tag = 'mark'
        token_c.nesting = -1
        token_c.markup = '=='
        token_c.content = ''
  
        if (state.tokens[endDelim.token - 1].type === 'text' &&
            state.tokens[endDelim.token - 1].content === '=') {
          loneMarkers.push(endDelim.token - 1)
        }
      }
  
      // If a marker sequence has an odd number of characters, it's splitted
      // like this: `~~~~~` -> `~` + `~~` + `~~`, leaving one marker at the
      // start of the sequence.
      //
      // So, we have to move all those markers after subsequent s_close tags.
      //
      while (loneMarkers.length) {
        const i = loneMarkers.pop()
        let j = i + 1
  
        while (j < state.tokens.length && state.tokens[j].type === 'mark_close') {
          j++
        }
  
        j--
  
        if (i !== j) {
          const token = state.tokens[j]
          state.tokens[j] = state.tokens[i]
          state.tokens[i] = token
        }
      }
    }
  
    md.inline.ruler.before('emphasis', 'mark', tokenize)
    md.inline.ruler2.before('emphasis', 'mark', function (state) {
      let curr
      const tokens_meta = state.tokens_meta
      const max = (state.tokens_meta || []).length
  
      postProcess(state, state.delimiters)
  
      for (curr = 0; curr < max; curr++) {
        if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
          postProcess(state, tokens_meta[curr].delimiters)
        }
      }
    })
  };