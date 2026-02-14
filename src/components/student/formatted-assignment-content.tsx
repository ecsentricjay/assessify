'use client'

/**
 * Component to format AI-generated assignment content
 * Converts markdown-style and special formatting to proper HTML/React components
 */
export function FormattedAssignmentContent({ content }: { content: string }) {
  // Parse content and convert markdown-style formatting to proper formatting
  const formatContent = (text: string) => {
    const lines = text.split('\n')
    const elements = []
    let currentParagraph: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      if (!trimmed) {
        // Empty line - end current paragraph
        if (currentParagraph.length > 0) {
          elements.push(
            <p key={`p-${i}`} className="mb-4 leading-relaxed">
              {formatLine(currentParagraph.join(' '))}
            </p>
          )
          currentParagraph = []
        }
      } else if (trimmed.startsWith('##')) {
        // Subheading (##)
        if (currentParagraph.length > 0) {
          elements.push(
            <p key={`p-${i}`} className="mb-4 leading-relaxed">
              {formatLine(currentParagraph.join(' '))}
            </p>
          )
          currentParagraph = []
        }
        const heading = trimmed.replace(/^#+\s*/, '')
        elements.push(
          <h3 key={`h3-${i}`} className="text-lg font-bold mt-6 mb-3 text-gray-900">
            {heading}
          </h3>
        )
      } else if (trimmed.startsWith('#')) {
        // Main heading (#)
        if (currentParagraph.length > 0) {
          elements.push(
            <p key={`p-${i}`} className="mb-4 leading-relaxed">
              {formatLine(currentParagraph.join(' '))}
            </p>
          )
          currentParagraph = []
        }
        const heading = trimmed.replace(/^#+\s*/, '')
        elements.push(
          <h2 key={`h2-${i}`} className="text-2xl font-bold mt-8 mb-4 text-gray-900">
            {heading}
          </h2>
        )
      } else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
        // List item
        if (currentParagraph.length > 0) {
          elements.push(
            <p key={`p-${i}`} className="mb-4 leading-relaxed">
              {formatLine(currentParagraph.join(' '))}
            </p>
          )
          currentParagraph = []
        }
        const itemText = trimmed.replace(/^[-•]\s*/, '')
        elements.push(
          <li key={`li-${i}`} className="ml-6 mb-2 text-gray-700">
            {formatLine(itemText)}
          </li>
        )
      } else if (trimmed.startsWith('>')) {
        // Blockquote
        if (currentParagraph.length > 0) {
          elements.push(
            <p key={`p-${i}`} className="mb-4 leading-relaxed">
              {formatLine(currentParagraph.join(' '))}
            </p>
          )
          currentParagraph = []
        }
        const quoteText = trimmed.replace(/^>\s*/, '')
        elements.push(
          <blockquote
            key={`bq-${i}`}
            className="italic border-l-4 border-gray-300 pl-4 py-2 mb-4 text-gray-600"
          >
            {formatLine(quoteText)}
          </blockquote>
        )
      } else {
        // Regular text
        currentParagraph.push(trimmed)
      }
    }

    // Handle remaining paragraph
    if (currentParagraph.length > 0) {
      elements.push(
        <p key="p-final" className="mb-4 leading-relaxed">
          {formatLine(currentParagraph.join(' '))}
        </p>
      )
    }

    return elements
  }

  const formatLine = (line: string) => {
    // Handle bold: **text** or __text__
    let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>')

    // Handle italic: *text* or _text_
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>')
    formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>')

    // Convert HTML string to React elements
    return (
      <span
        dangerouslySetInnerHTML={{ __html: formatted }}
        className="text-gray-800"
      />
    )
  }

  return (
    <div className="space-y-2">
      {formatContent(content)}
    </div>
  )
}
