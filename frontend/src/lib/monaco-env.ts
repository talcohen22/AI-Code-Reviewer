// monaco-editor's exports map rewrites `monaco-editor/<path>` to
// `esm/vs/<path>.js`, so the worker specifiers carry no `esm/vs` prefix.
import cssWorker from "monaco-editor/language/css/css.worker?worker"
import editorWorker from "monaco-editor/editor/editor.worker?worker"
import htmlWorker from "monaco-editor/language/html/html.worker?worker"
import jsonWorker from "monaco-editor/language/json/json.worker?worker"
import tsWorker from "monaco-editor/language/typescript/ts.worker?worker"

type MonacoEnvironment = {
  getWorker: (workerId: string, label: string) => Worker
}

/**
 * Monaco is bundled from the local `monaco-editor` package rather than fetched
 * from a CDN, so the editor works offline and the e2e run never depends on the
 * network. That means wiring its workers up ourselves.
 */
;(self as unknown as { MonacoEnvironment: MonacoEnvironment }).MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    switch (label) {
      case "json":
        return new jsonWorker()
      case "css":
      case "scss":
      case "less":
        return new cssWorker()
      case "html":
      case "handlebars":
      case "razor":
        return new htmlWorker()
      case "typescript":
      case "javascript":
        return new tsWorker()
      default:
        return new editorWorker()
    }
  },
}
