const path = require('path')
const sourceMap = require('source-map')
const splitRE = /\r?\n/g

module.exports = function generateSourceMap(
  scriptResult,
  src,
  filename,
  renderFnStartLine,
  renderFnEndLine,
  templateLine
) {
  const file = path.basename(filename)

  let map
  if (scriptResult && scriptResult.map) {
    scriptResult.map.sources = [file]
    map = sourceMap.SourceMapGenerator.fromSourceMap(
      new sourceMap.SourceMapConsumer(scriptResult.map)
    )
  } else {
    map = new sourceMap.SourceMapGenerator()
    if (scriptResult) {
      scriptResult.code.split(splitRE).forEach(function(line, index) {
        map.addMapping({
          source: file,
          generated: {
            line: index + 1,
            column: 0
          },
          original: {
            line: index + 1,
            column: 0
          }
        })
      })
    }
  }

  const scriptFromExternalSrc = scriptResult && scriptResult.externalSrc

  // If script uses external file for content (using the src attribute) then
  // map result to this file, instead of original.
  const srcContent = scriptFromExternalSrc ? scriptResult.externalSrc : src

  map.setSourceContent(file, srcContent)

  // If script is from external src then the source map will only show the
  // script section. We won't map the generated render function to this file,
  // because the coverage report would be confusing
  if (scriptFromExternalSrc) {
    return map
  }

  for (; renderFnStartLine < renderFnEndLine; renderFnStartLine++) {
    map.addMapping({
      source: file,
      generated: {
        line: renderFnStartLine,
        column: 0
      },
      original: {
        line: templateLine,
        column: 0
      }
    })
  }

  return map
}
