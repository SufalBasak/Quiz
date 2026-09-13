// Loads data/materials.json and renders it as a course-content sidebar on
// the Study Material page. Clicking an item opens that file in the viewer
// panel and updates the header's Download button — nothing is shown until
// the user picks an item.

(function () {
  "use strict";

  var list = document.getElementById("studyList");
  var viewerWrap = document.getElementById("pdfFrameWrap");
  var titleEl = document.getElementById("studyContentTitle");
  var downloadBtn = document.getElementById("studyDownloadBtn");

  fetch("data/materials.json")
    .then(function (res) { return res.json(); })
    .then(renderList)
    .catch(function () {
      list.innerHTML = '<li class="materials-loading">Could not load the materials list.</li>';
    });

  function renderList(materials) {
    if (!materials || !materials.length) {
      list.innerHTML = '<li class="materials-loading">No study materials added yet.</li>';
      return;
    }

    list.innerHTML = "";
    materials.forEach(function (item, idx) {
      var li = document.createElement("li");
      li.className = "study-list-item";
      li.innerHTML =
        '<span class="study-item-icon">' + (idx + 1) + '</span>' +
        '<span class="study-item-title">' + escapeHtml(item.title) + '</span>';
      li.addEventListener("click", function () {
        selectItem(item, li);
      });
      list.appendChild(li);
    });
  }

  function selectItem(item, li) {
    list.querySelectorAll(".study-list-item").forEach(function (el) {
      el.classList.remove("active");
    });
    li.classList.add("active");

    titleEl.textContent = item.title;
    downloadBtn.href = item.file;
    downloadBtn.hidden = false;

    viewerWrap.innerHTML = '<iframe src="' + item.file + '" title="' + escapeHtml(item.title) + '"></iframe>';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
