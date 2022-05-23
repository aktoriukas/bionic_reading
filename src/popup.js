// Initialize button with user's preferred color
let changeColor = document.getElementById("changeColor")

changeColor.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    files: ["src/convert.js"],
  })
})
