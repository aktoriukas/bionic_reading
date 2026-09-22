const button = document.getElementById("bionic_reading_btn")
const persist = document.getElementById("persist_across_pages")

async function currentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}

async function isActive(tabId) {
  const [{ result = false } = {}] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => document.documentElement.dataset.bionicReadingActive === "true",
  })
  return result
}

async function toggle(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    files: ["src/convert.js"],
  })
}

async function render() {
  const tab = await currentTab()
  if (!tab?.id) return

  try {
    const active = await isActive(tab.id)
    button.dataset.active = active
    button.textContent = active ? "Turn off" : "Turn on"
  } catch {
    button.textContent = "Unavailable on this page"
    button.disabled = true
  }
}

button.addEventListener("click", async () => {
  const tab = await currentTab()
  if (!tab?.id) return

  await toggle(tab.id)
  await render()
})

persist.addEventListener("change", async () => {
  await chrome.storage.sync.set({ persistAcrossPages: persist.checked })
  if (!persist.checked) return

  try {
    const tab = await currentTab()
    if (tab?.id && !(await isActive(tab.id))) await toggle(tab.id)
  } catch {
    // The preference still applies to the next supported page.
  }
  await render()
})

chrome.storage.sync.get("persistAcrossPages").then(({ persistAcrossPages = false }) => {
  persist.checked = persistAcrossPages
})
render()
