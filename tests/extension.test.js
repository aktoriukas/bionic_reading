const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")

async function testConverter() {
  const boldedElements = []
  const context = {
    DOMParser: class {},
    Node: { TEXT_NODE: 3 },
    document: {
      createElement: () => ({}),
      documentElement: { dataset: {} },
      getElementsByTagName: (tag) => (tag === "br-bold" ? boldedElements : []),
      head: { appendChild: () => {} },
    },
  }

  vm.runInNewContext(fs.readFileSync("src/convert.js", "utf8"), context)
  assert.equal(
    context.highlightText("reading 123 well-known"),
    '<br-bold class="br-bold">read</br-bold>ing 123 <br-bold class="br-bold">we</br-bold>ll-<br-bold class="br-bold">kno</br-bold>wn',
  )
  assert.equal(context.document.documentElement.dataset.bionicReadingActive, "true")

  const states = []
  boldedElements.push({ classList: { toggle: (_, state) => states.push(state) } })
  context.main()
  context.main()
  assert.deepEqual(states, [false, true])
}

async function testPersistenceAndShortcut() {
  let onUpdated
  let onCommand
  let active = false
  const injections = []
  const context = {
    chrome: {
      commands: { onCommand: { addListener: (listener) => (onCommand = listener) } },
      scripting: {
        executeScript: async (options) => {
          if (options.func) return [{ result: active }]
          injections.push(options.target.tabId)
          active = !active
          return []
        },
      },
      storage: { sync: { get: async () => ({ persistAcrossPages: true }) } },
      tabs: {
        onUpdated: { addListener: (listener) => (onUpdated = listener) },
        query: async () => [{ id: 9 }],
      },
    },
  }

  vm.runInNewContext(fs.readFileSync("src/bg.js", "utf8"), context)
  await onUpdated(7, { status: "loading" })
  await onUpdated(7, { status: "complete" })
  await onUpdated(7, { status: "complete" })
  await onCommand("toggle-bionic-reading")
  assert.deepEqual(injections, [7, 9])
}

async function testPopupControls() {
  let active = false
  let savedPreference
  const listeners = {}
  const button = {
    dataset: {},
    addEventListener: (_, listener) => (listeners.button = listener),
  }
  const persist = {
    checked: false,
    addEventListener: (_, listener) => (listeners.persist = listener),
  }
  const context = {
    document: {
      getElementById: (id) => (id === "bionic_reading_btn" ? button : persist),
    },
    chrome: {
      scripting: {
        executeScript: async (options) => {
          if (options.func) return [{ result: active }]
          assert.equal(options.target.tabId, 3)
          active = !active
          return []
        },
      },
      storage: {
        sync: {
          get: async () => ({ persistAcrossPages: false }),
          set: async ({ persistAcrossPages }) => (savedPreference = persistAcrossPages),
        },
      },
      tabs: { query: async () => [{ id: 3 }] },
    },
  }

  vm.runInNewContext(fs.readFileSync("src/index.js", "utf8"), context)
  await new Promise(setImmediate)
  assert.equal(button.textContent, "Turn on")

  await listeners.button()
  assert.equal(button.textContent, "Turn off")

  active = false
  persist.checked = true
  await listeners.persist()
  assert.equal(savedPreference, true)
  assert.equal(active, true)
}

Promise.all([testConverter(), testPersistenceAndShortcut(), testPopupControls()])
  .then(() => console.log("Extension checks passed"))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
