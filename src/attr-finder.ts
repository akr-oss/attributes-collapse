export type Result = {
  attribute: string
  start: number
  end: number
}[]

export function getAttributeRanges(text: string, attributes: string[]): Result {
  const result: Result = []
  for (let i = 0; i < text.length; i++) {
    for (const attribute of attributes) {
      if (attribute === text.substring(i, i + attribute.length)) {
        const nextChar = text[i + attribute.length + 1]
        const isNextOkay =
          nextChar === '"' ? '"' : nextChar === "'" ? "'" : undefined
        if (isNextOkay) {
          const end = text.indexOf(isNextOkay, i + attribute.length + 2)
          if (end !== -1) {
            result.push({
              attribute,
              start: i,
              end: end + 1,
            })
            i = end + 1
          } else {
            return result
          }
        } else if (text[i + attribute.length + 1] === '{') {
          let nestedOpeningFound = 0
          for (let j = i + attribute.length + 2; j < text.length; j++) {
            if (text[j] === '{') {
              nestedOpeningFound++
            }
            if (text[j] === '}' && nestedOpeningFound === 0) {
              result.push({
                attribute,
                start: i,
                end: j + 1,
              })
              i = j + 1
              break
            }
            if (text[j] === '}') {
              nestedOpeningFound--
            }
          }
        }
      }
    }
  }
  return result
}
