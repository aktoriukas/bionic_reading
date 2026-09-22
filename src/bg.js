async function isActive(tabId) {
  const [{ result = false } = {}] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => document.documentElement.dataset.bionicReadingActive === "true",
  })
  return result
}

async function run(tabId, onlyIfInactive = false) {
  try {
    if (onlyIfInactive && (await isActive(tabId))) return

    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ["src/convert.js"],
    })
  } catch {
    // Chrome blocks extensions on internal pages and the Web Store.
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status !== "complete") return

  const { persistAcrossPages = false } = await chrome.storage.sync.get(
    "persistAcrossPages",
  )
  if (persistAcrossPages) await run(tabId, true)
})

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-bionic-reading") return

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) await run(tab.id)
})
