const CONTACT_EMAIL = "";

function buildMessage(form) {
  const data = new FormData(form);
  const company = data.get("company") || "未入力";
  const name = data.get("name") || "未入力";
  const topic = data.get("topic") || "未選択";
  const message = data.get("message") || "未入力";

  return [
    "建設DXコンサルタントTKへの相談",
    "",
    `会社名: ${company}`,
    `お名前: ${name}`,
    `相談内容: ${topic}`,
    "",
    "今の困りごと:",
    message
  ].join("\n");
}

function setNote(text) {
  const note = document.querySelector("[data-form-note]");
  if (!note) return;
  note.textContent = text;
}

function openMail(form) {
  const subject = encodeURIComponent("ホームページ・業務効率化の相談");
  const body = encodeURIComponent(buildMessage(form));
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

function copyContact(form) {
  const text = buildMessage(form);
  navigator.clipboard.writeText(text).then(
    () => setNote("相談内容をコピーしました。メールやチャットに貼り付けて送れます。"),
    () => setNote("コピーできませんでした。入力内容を選択してコピーしてください。")
  );
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) window.lucide.createIcons();

  const form = document.querySelector("[data-contact-form]");
  const copyButton = document.querySelector("[data-copy-contact]");

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      openMail(form);
      setNote(CONTACT_EMAIL ? "メールソフトを起動しました。" : "メールソフトを起動しました。宛先を入力して送信してください。");
    });
  }

  if (copyButton && form) {
    copyButton.addEventListener("click", () => copyContact(form));
  }
});
