import * as vscode from 'vscode'
import { getAttributeRanges } from './attr-finder'

let statusBar: vscode.StatusBarItem
let enabled = true

export function activate({ subscriptions }: vscode.ExtensionContext) {
  let activeEditor = vscode.window.activeTextEditor

  if (activeEditor) {
    triggerUpdateDecorations()
  }

  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor
      if (editor) {
        triggerUpdateDecorations()
      }
    },
    null,
    subscriptions,
  )

  vscode.window.onDidChangeTextEditorSelection((event) => {
    if (activeEditor && event.textEditor === activeEditor) {
      triggerUpdateDecorations(event.selections)
    }
  })

  vscode.workspace.onDidOpenTextDocument(() => {
    triggerUpdateDecorations()
  })

  const toggleCommand = 'attributes-collapse.toggle'
  subscriptions.push(
    vscode.commands.registerCommand(toggleCommand, () => {
      enabled = !enabled
      statusBar.text = enabled ? `Disable AC` : `Enable AC`
      statusBar.tooltip = enabled
        ? `Disable Attributes Collapse`
        : `Enable Attributes Collapse`
      triggerUpdateDecorations()
    }),
  )

  statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  )
  statusBar.command = toggleCommand
  subscriptions.push(statusBar)

  statusBar.text = `Disable AC`
  statusBar.tooltip = `Disable Attributes Collapse`
  statusBar.show()
}

const commonDecoration = vscode.window.createTextEditorDecorationType({
  opacity: '0.3',
  textDecoration: 'none; display: none',
})

function updateDecorations(selections: readonly vscode.Selection[]) {
  const activeTextEditor = vscode.window.activeTextEditor
  const document = activeTextEditor?.document
  if (!document) {
    return
  }
  const decorations: vscode.DecorationOptions[] = []
  const workSpaceConfig = vscode.workspace.getConfiguration(
    'attributes-collapse',
    { languageId: document.languageId },
  )
  const text = document.getText()
  const ranges = getAttributeRanges(
    text,
    workSpaceConfig.attributes ?? ['className', 'class', 'tw'],
  )

  for (const range of ranges) {
    const startPos = document.positionAt(range.start)
    const endPos = document.positionAt(range.end)
    const rangeObj = new vscode.Range(startPos, endPos)
    const selected = selections.every((s) => !rangeObj.intersection(s))
    if (!selected) {
      continue
    }

    const decoration: vscode.DecorationOptions = {
      range: rangeObj,
      hoverMessage: {
        language: 'javascript',
        value: text.substring(range.start, range.end),
      },
      renderOptions: {
        before: {
          fontWeight: 'bolder',
          contentText: `[${range.attribute}]`,
          textDecoration: 'none; opacity: 0.3',
        },
      },
    }
    decorations.push(decoration)
  }
  activeTextEditor.setDecorations(commonDecoration, decorations)
}

function triggerUpdateDecorations(
  selections: readonly vscode.Selection[] = [],
) {
  const activeEditor = vscode.window.activeTextEditor
  if (!activeEditor) {
    return
  }
  const workSpaceConfig = vscode.workspace.getConfiguration(
    'attributes-collapse',
  )
  const enabledLanguageIds = workSpaceConfig.enabledLanguageIds ?? [
    'typescriptreact',
    'javascriptreact',
    'html',
    'typescript',
    'javascript',
    'vue-html',
    'vue',
    'php',
    'markdown',
    'coffeescript',
    'razor',
    'ruby',
    'rust',
  ]

  if (!enabledLanguageIds.includes(activeEditor.document.languageId)) {
    activeEditor.setDecorations(commonDecoration, [])
    return
  }
  if (!enabled) {
    activeEditor.setDecorations(commonDecoration, [])
    return
  }

  updateDecorations(selections)
}
