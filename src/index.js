let btn_active = document.getElementById("bionic_reading_btn")
const readingActive = document.cookie.includes("bionic_reading_active=true")
if (readingActive) {
  btn_active.innerText = "Deactivate"
} else {
  btn_active.innerText = "Activate"
}

btn_active.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  const readingActive = document.cookie.includes("bionic_reading_active=true")

  if (readingActive) {
    btn_active.innerText = "Activate"
    document.cookie = "bionic_reading_active=false"
  } else {
    btn_active.innerText = "Deactivate"
    document.cookie = "bionic_reading_active=true"
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    files: ["src/convert.js"],
  })
})
