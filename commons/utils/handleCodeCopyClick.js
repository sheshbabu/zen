import { showToast } from "../components/Toast.jsx";

const COPIED_DURATION = 2000;

export default function handleCodeCopyClick(e) {
  const button = e.target.closest('.code-copy-button');
  if (button === null) {
    return false;
  }

  const code = button.closest('.code-block')?.querySelector('pre code');
  if (code == null) {
    return false;
  }

  navigator.clipboard.writeText(code.textContent)
    .then(() => {
      showCopiedState(button);
    })
    .catch(() => {
      showToast("Couldn't copy code.");
    });

  return true;
}

function showCopiedState(button) {
  if (button.dataset.copiedTimeoutId != null) {
    clearTimeout(parseInt(button.dataset.copiedTimeoutId, 10));
  }

  button.classList.add("is-copied");

  const timeoutId = setTimeout(() => {
    button.classList.remove("is-copied");
    delete button.dataset.copiedTimeoutId;
  }, COPIED_DURATION);

  button.dataset.copiedTimeoutId = timeoutId;
}
