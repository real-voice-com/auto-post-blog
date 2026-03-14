// === Amazon Link Management ===

// Amazonリンク行を追加
function addAmazonRow() {
  const container = document.getElementById("amazon-rows");
  const row = document.createElement("div");
  row.className = "amazon-row";
  row.innerHTML =
    '<input type="text" name="amazon_label[]" placeholder="商品名（例：ELECOM モニターライト）" />' +
    '<input type="url" name="amazon_url[]" placeholder="https://amzn.to/XXXXXXX" />' +
    '<button type="button" class="btn-remove" onclick="removeAmazonRow(this)">削除</button>';
  container.appendChild(row);
}

// Amazonリンク行を削除
function removeAmazonRow(btn) {
  btn.parentElement.remove();
}

// === Expense Management (must be defined first) ===

// 費用行を追加
function addExpenseRow() {
  const container = document.getElementById("expense-rows");
  const row = document.createElement("div");
  row.className = "expense-row";
  row.innerHTML =
    '<input type="text" name="expense_name[]" placeholder="項目" required />' +
    '<input type="number" name="expense_amount[]" placeholder="金額" min="0" required oninput="updateTotal()" />' +
    '<button type="button" class="btn-remove" onclick="removeExpenseRow(this)">削除</button>';
  container.appendChild(row);
  saveFormData();
}

// 費用行を削除
function removeExpenseRow(btn) {
  btn.parentElement.remove();
  updateTotal();
  saveFormData();
}

// 合計金額を自動計算
function updateTotal() {
  var amounts = document.querySelectorAll('input[name="expense_amount[]"]');
  var total = 0;
  amounts.forEach(function (input) {
    total += Number(input.value) || 0;
  });
  document.getElementById("expense-total-display").textContent = total.toLocaleString();
}

// === Form Persistence (localStorage) ===

const STORAGE_KEY = "autoPostBlogForm";

// Load saved form data on page load
document.addEventListener("DOMContentLoaded", function () {
  loadFormData();
});

// Auto-save form data on input
document.addEventListener("input", function (e) {
  if (e.target.form) {
    saveFormData();
  }
});

document.addEventListener("change", function (e) {
  if (e.target.form) {
    saveFormData();
  }
});

function saveFormData() {
  try {
    const form = document.querySelector("form");
    const data = {
      genre: form.querySelector('input[name="genre"]:checked')?.value || "",
      date: form.querySelector('input[name="date"]')?.value || "",
      titleDraft: form.querySelector('input[name="titleDraft"]')?.value || "",
      text: form.querySelector('textarea[name="text"]')?.value || "",
      rating: form.querySelector('input[name="rating"]:checked')?.value || "",
      expenses: [],
    };

    // Save expense rows
    const expenseNames = form.querySelectorAll('input[name="expense_name[]"]');
    const expenseAmounts = form.querySelectorAll('input[name="expense_amount[]"]');
    for (let i = 0; i < expenseNames.length; i++) {
      data.expenses.push({
        name: expenseNames[i].value,
        amount: expenseAmounts[i].value,
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save form data:", e);
  }
}

function loadFormData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const data = JSON.parse(saved);
    const form = document.querySelector("form");

    // Restore genre
    if (data.genre) {
      const genreInput = form.querySelector(
        `input[name="genre"][value="${data.genre}"]`
      );
      if (genreInput) genreInput.checked = true;
    }

    // Restore date
    if (data.date) {
      const dateInput = form.querySelector('input[name="date"]');
      if (dateInput) dateInput.value = data.date;
    }

    // Restore title
    if (data.titleDraft) {
      const titleInput = form.querySelector('input[name="titleDraft"]');
      if (titleInput) titleInput.value = data.titleDraft;
    }

    // Restore text
    if (data.text) {
      const textInput = form.querySelector('textarea[name="text"]');
      if (textInput) textInput.value = data.text;
    }

    // Restore rating
    if (data.rating) {
      const ratingInput = form.querySelector(
        `input[name="rating"][value="${data.rating}"]`
      );
      if (ratingInput) {
        ratingInput.checked = true;
        // Trigger star highlighting
        document.querySelectorAll(".star-label").forEach((el, i) => {
          el.classList.toggle("active", i < data.rating);
        });
      }
    }

    // Restore expenses
    if (data.expenses && data.expenses.length > 0) {
      const container = document.getElementById("expense-rows");
      container.innerHTML = ""; // Clear default row

      data.expenses.forEach(function (expense) {
        const row = document.createElement("div");
        row.className = "expense-row";
        row.innerHTML =
          '<input type="text" name="expense_name[]" placeholder="項目" required value="' +
          (expense.name || "") +
          '" />' +
          '<input type="number" name="expense_amount[]" placeholder="金額" min="0" required value="' +
          (expense.amount || "") +
          '" oninput="updateTotal()" />' +
          '<button type="button" class="btn-remove" onclick="removeExpenseRow(this)">削除</button>';
        container.appendChild(row);
      });

      updateTotal();
    }
  } catch (e) {
    console.error("Failed to load form data:", e);
  }
}

// Debug log helper
function debugLog(message) {
  const debugDiv = document.getElementById("debug-log");
  if (debugDiv) {
    debugDiv.style.display = "block";
    const timestamp = new Date().toLocaleTimeString();
    debugDiv.textContent += `[${timestamp}] ${message}\n`;
  }
  console.log(message);
}

// Debug htmx events
document.body.addEventListener("htmx:beforeRequest", function (event) {
  debugLog("✓ htmx:beforeRequest - フォーム送信開始");
  console.log("htmx:beforeRequest", event.detail);
  const submitButton = event.detail.elt.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
  }
});

document.body.addEventListener("htmx:afterSwap", function (event) {
  debugLog(`✓ htmx:afterSwap - レスポンス受信 (status: ${event.detail.xhr.status})`);
  console.log("htmx:afterSwap", event.detail);
  const form = document.querySelector("form");
  const submitButton = form?.querySelector('button[type="submit"]');

  if (event.detail.target.id === "result" && event.detail.xhr.status === 200) {
    const responseText = event.detail.xhr.responseText;
    if (responseText.includes("success")) {
      debugLog("✓ 記事生成成功");
      localStorage.removeItem(STORAGE_KEY);
      // Keep button disabled on success
    } else if (responseText.includes("error")) {
      debugLog("✗ エラーが発生しました");
      // Re-enable button on error
      if (submitButton) {
        submitButton.disabled = false;
      }
    } else {
      debugLog("✓ インタビュー質問を表示しました");
      // Interview questions - re-enable button
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  } else if (submitButton) {
    // Re-enable on any other case (network error, etc)
    submitButton.disabled = false;
  }
});

document.body.addEventListener("htmx:responseError", function (event) {
  const status = event.detail.xhr.status;
  const responseText = event.detail.xhr.responseText || "レスポンスなし";
  debugLog(`✗ htmx:responseError - ステータス: ${status}`);
  debugLog(`エラー内容: ${responseText.substring(0, 500)}`);
  console.error("htmx:responseError", event.detail);
});

document.body.addEventListener("htmx:sendError", function (event) {
  debugLog("✗ htmx:sendError - ネットワークエラー");
  console.error("htmx:sendError", event.detail);
});

document.body.addEventListener("htmx:beforeSend", function (event) {
  debugLog("→ htmx:beforeSend - リクエスト送信直前");
});

document.body.addEventListener("htmx:afterRequest", function (event) {
  debugLog("← htmx:afterRequest - リクエスト完了");
});

// === Image Preview & Compression ===

const MAX_IMAGE_SIZE = 400 * 1024; // 400KB per image (reduced for AI model limits)
const MAX_DIMENSION = 1600; // Max width/height

// Keep track of compressed files across selections/deletions
let currentCompressedFiles = [];

function updateInputFiles() {
  const inputEl = document.getElementById("images");
  const dataTransfer = new DataTransfer();
  currentCompressedFiles.forEach((file) => {
    if (file !== null) dataTransfer.items.add(file);
  });
  inputEl.files = dataTransfer.files;
}

document.getElementById("images").addEventListener("change", async function (e) {
  const files = Array.from(e.target.files);
  const preview = document.getElementById("image-preview");
  preview.innerHTML = "";
  currentCompressedFiles = [];

  if (files.length === 0) return;

  for (const file of files) {
    try {
      const compressed = await compressImage(file);
      const index = currentCompressedFiles.length;
      currentCompressedFiles.push(compressed);

      const item = document.createElement("div");
      item.className = "preview-item";

      const img = document.createElement("img");
      img.src = URL.createObjectURL(compressed);
      img.alt = compressed.name;
      img.style.cursor = "pointer";

      // Click to zoom
      img.addEventListener("click", function () {
        const modal = document.createElement("div");
        modal.className = "image-modal";
        modal.innerHTML = '<img src="' + img.src + '" alt="' + img.alt + '">';
        modal.addEventListener("click", function () {
          modal.remove();
        });
        document.body.appendChild(modal);
      });

      const info = document.createElement("div");
      info.className = "preview-info";
      info.innerHTML =
        "<strong>" +
        compressed.name +
        "</strong><br>" +
        formatFileSize(compressed.size) +
        (compressed.size > file.size
          ? ""
          : " (圧縮: " +
            formatFileSize(file.size) +
            " → " +
            formatFileSize(compressed.size) +
            ")");

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-remove preview-delete";
      deleteBtn.textContent = "✕ 削除";
      deleteBtn.addEventListener("click", function () {
        currentCompressedFiles[index] = null;
        item.remove();
        updateInputFiles();
      });

      item.appendChild(img);
      item.appendChild(info);
      item.appendChild(deleteBtn);
      preview.appendChild(item);
    } catch (err) {
      console.error("Image compression failed:", err);
      alert("画像の処理に失敗しました: " + file.name);
    }
  }

  // Replace file input with compressed files
  updateInputFiles();
});

async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      const img = new Image();

      img.onload = function () {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize if too large
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = (height * MAX_DIMENSION) / width;
            width = MAX_DIMENSION;
          } else {
            width = (width * MAX_DIMENSION) / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels to get under MAX_IMAGE_SIZE
        let quality = 0.9;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to compress image"));
                return;
              }

              if (blob.size <= MAX_IMAGE_SIZE || quality <= 0.1) {
                // Success or lowest quality reached
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                // Try lower quality
                quality -= 0.1;
                tryCompress();
              }
            },
            "image/jpeg",
            quality
          );
        };

        tryCompress();
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
