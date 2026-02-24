// app/api/student/download-assignment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

export async function POST(request: NextRequest) {
  try {
    const { content, filename, metadata } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Parse the content and create formatted paragraphs
    const lines = content.split('\n')
    const docParagraphs: Paragraph[] = []

    // Add title page if metadata provided
    if (metadata?.courseName) {
      docParagraphs.push(
        new Paragraph({
          text: metadata.courseName,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
      )

      if (metadata.courseOfStudy) {
        docParagraphs.push(
          new Paragraph({
            text: metadata.courseOfStudy,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
        )
      }

      if (metadata.citationStyle) {
        docParagraphs.push(
          new Paragraph({
            text: `Citation Style: ${metadata.citationStyle}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
        )
      }

      if (metadata.wordCount) {
        docParagraphs.push(
          new Paragraph({
            text: `Word Count: ${metadata.wordCount}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
        )
      }

      // Add page break after title page
      docParagraphs.push(
        new Paragraph({
          text: '',
          pageBreakBefore: true,
        }),
      )
    }

    // Process content lines
    for (const line of lines) {
      const trimmed = line.trim()

      if (!trimmed) {
        // Empty line - add spacing
        docParagraphs.push(
          new Paragraph({
            text: '',
            spacing: { after: 200 },
          }),
        )
        continue
      }

      // Check for headings
      if (trimmed.startsWith('# ')) {
        // Main heading
        const headingText = trimmed.replace(/^#\s+/, '')
        docParagraphs.push(
          new Paragraph({
            text: headingText,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
        )
      } else if (trimmed.startsWith('## ')) {
        // Subheading
        const headingText = trimmed.replace(/^##\s+/, '')
        docParagraphs.push(
          new Paragraph({
            text: headingText,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),
        )
      } else if (trimmed.startsWith('### ')) {
        // Sub-subheading
        const headingText = trimmed.replace(/^###\s+/, '')
        docParagraphs.push(
          new Paragraph({
            text: headingText,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          }),
        )
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        // Bullet point
        const bulletText = trimmed.replace(/^[-•]\s+/, '')
        docParagraphs.push(
          new Paragraph({
            text: bulletText,
            bullet: {
              level: 0,
            },
            spacing: { after: 100 },
          }),
        )
      } else {
        // Regular paragraph - handle bold and italic
        const children: TextRun[] = []
        let currentText = trimmed
        let index = 0

        while (index < currentText.length) {
          // Check for **bold**
          const boldMatch = currentText.slice(index).match(/^\*\*(.+?)\*\*/)
          if (boldMatch) {
            children.push(
              new TextRun({
                text: boldMatch[1],
                bold: true,
              }),
            )
            index += boldMatch[0].length
            continue
          }

          // Check for *italic*
          const italicMatch = currentText.slice(index).match(/^\*(.+?)\*/)
          if (italicMatch) {
            children.push(
              new TextRun({
                text: italicMatch[1],
                italics: true,
              }),
            )
            index += italicMatch[0].length
            continue
          }

          // Regular text - find next formatting or end
          const nextFormatIndex = currentText
            .slice(index)
            .search(/\*/)
          
          if (nextFormatIndex === -1) {
            // No more formatting
            children.push(
              new TextRun({
                text: currentText.slice(index),
              }),
            )
            break
          } else {
            // Text before next formatting
            children.push(
              new TextRun({
                text: currentText.slice(index, index + nextFormatIndex),
              }),
            )
            index += nextFormatIndex
          }
        }

        docParagraphs.push(
          new Paragraph({
            children: children.length > 0 ? children : [new TextRun(trimmed)],
            spacing: { after: 200 },
            alignment: AlignmentType.JUSTIFIED,
          }),
        )
      }
    }

    // Create the document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: docParagraphs,
        },
      ],
    })

    // Generate the document buffer
    const buffer = await Packer.toBuffer(doc)
    const uint8Array = new Uint8Array(buffer)

    // Return as downloadable file
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename || 'assignment'}.docx"`,
      },
    })
  } catch (error) {
    console.error('Error generating DOCX:', error)
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    )
  }
}