let btn_active = document.getElementById("btn_active")

btn_active.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    files: ["src/convert.js"],
  })
})
