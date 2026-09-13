// Shared logic for landing / study-material / result pages:
// navbar toggle, candidate modals + validation, redirect into exam.html

(function () {
  "use strict";

  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      navLinks.classList.toggle("open");
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { navLinks.classList.remove("open"); });
    });
  }

  document.querySelectorAll(".faq-question").forEach(function (btn) {
    btn.addEventListener("click", function () {
      btn.closest(".faq-item").classList.toggle("open");
    });
  });

  function openModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add("open");
  }
  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove("open");
  }

  document.querySelectorAll("[data-close-modal]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      closeModal(btn.getAttribute("data-close-modal"));
    });
  });
  document.querySelectorAll(".modal-overlay").forEach(function (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.classList.remove("open");
    });
  });

  function bindOpeners(ids, modalId) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("click", function (e) {
        e.preventDefault();
        openModal(modalId);
      });
    });
  }
  bindOpeners(["navExamBtn", "heroStartExam", "ctaStartExam", "footerExamLink"], "examModalOverlay");
  bindOpeners(["navPyqBtn", "footerPyqLink"], "comingSoonModalOverlay");

  // Radio option highlight
  document.querySelectorAll(".radio-group").forEach(function (group) {
    group.querySelectorAll("input[type=radio]").forEach(function (input) {
      input.addEventListener("change", function () {
        group.querySelectorAll(".radio-option").forEach(function (opt) { opt.classList.remove("checked"); });
        input.closest(".radio-option").classList.add("checked");
      });
    });
  });

  function validateForm(form) {
    var valid = true;
    var name = form.querySelector("input[name=name]");
    var nameField = form.querySelector("[data-field=name]");
    if (!name.value.trim()) {
      nameField.classList.add("invalid");
      valid = false;
    } else {
      nameField.classList.remove("invalid");
    }

    ["food", "color"].forEach(function (key) {
      var field = form.querySelector("[data-field=" + key + "]");
      var checked = form.querySelector("input[name=" + key + "]:checked");
      if (!checked) {
        field.classList.add("invalid");
        valid = false;
      } else {
        field.classList.remove("invalid");
      }
    });
    return valid;
  }

  function setupExamForm(formId, examType, redirectQuery) {
    var form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm(form)) return;

      var candidate = {
        name: form.querySelector("input[name=name]").value.trim(),
        food: form.querySelector("input[name=food]:checked").value,
        color: form.querySelector("input[name=color]:checked").value
      };
      localStorage.setItem("candidate_" + examType, JSON.stringify(candidate));
      // starting fresh clears any previous in-progress attempt of this type
      localStorage.removeItem("exam_state_" + examType);
      window.location.href = "exam.html?type=" + redirectQuery;
    });
  }

  setupExamForm("examForm", "regular", "regular");
  setupExamForm("pyqForm", "pyq", "pyq");
})();
