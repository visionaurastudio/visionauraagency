/* =============================================================
   VISION AURA STUDIO — script.js
   Vanilla JS only. Enhances the existing HTML/CSS; does not
   alter the visual design.
   ============================================================= */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /* ===========================================================
     0. SMALL HELPERS
     =========================================================== */

  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.prototype.slice.call(
      (scope || document).querySelectorAll(selector)
    );
  }

  function trapFocus(container, event) {
    var focusable = qsa(
      'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
      container
    ).filter(function (el) {
      return el.offsetParent !== null;
    });

    if (focusable.length === 0) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function guardImages() {
    qsa('img').forEach(function (img) {
      img.addEventListener('error', function () {
        img.style.display = 'none';
      });
    });
  }

  /* ===========================================================
     1. LOADING SCREEN
     =========================================================== */

  var LOADER_RING_CIRCUMFERENCE = 339.292;
  var LOADER_STEP_MS = 260;
  var LOADER_HOLD_MS = 200;
  var LOADER_PROGRESS_VALUES = [0, 25, 50, 75, 100];

  function runLoader() {
    var loader = qs('#loader');
    if (!loader) return;

    var ringProgress = qs('#loader-ring-progress', loader);

    document.body.style.overflow = 'hidden';

    function setProgress(percent) {
      if (!ringProgress) return;

      var offset =
        LOADER_RING_CIRCUMFERENCE * (1 - percent / 100);

      ringProgress.style.strokeDashoffset = String(offset);
    }

    function finishLoad() {
      loader.setAttribute('aria-hidden', 'true');
      loader.classList.add('is-hiding');

      loader.addEventListener(
        'transitionend',
        function () {
          if (loader.parentNode) {
            loader.parentNode.removeChild(loader);
          }
        },
        { once: true }
      );

      window.setTimeout(function () {
        if (loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      }, 600);

      document.body.style.overflow = '';
      document.body.classList.add('is-loaded');
    }

    if (prefersReducedMotion) {
      setProgress(100);
      window.setTimeout(finishLoad, 200);
      return;
    }

    var stepIndex = 0;

    setProgress(LOADER_PROGRESS_VALUES[0]);

    function nextStep() {
      stepIndex++;

      if (stepIndex < LOADER_PROGRESS_VALUES.length) {
        setProgress(LOADER_PROGRESS_VALUES[stepIndex]);

        window.setTimeout(
          nextStep,
          LOADER_STEP_MS
        );
      } else {
        window.setTimeout(
          finishLoad,
          LOADER_HOLD_MS
        );
      }
    }

    window.setTimeout(
      nextStep,
      LOADER_STEP_MS
    );
  }

  /* ===========================================================
     2. SMOOTH SCROLL
     =========================================================== */

  function initSmoothScroll() {
    qsa('a[href^="#"]').forEach(function (link) {
      var targetId = link.getAttribute('href');

      if (!targetId || targetId === '#') return;

      var target = qs(targetId);

      if (!target) return;

      link.addEventListener('click', function (event) {
        if (link.closest('[data-opens-booking]')) {
          return;
        }

        event.preventDefault();

        target.scrollIntoView({
          behavior: prefersReducedMotion
            ? 'auto'
            : 'smooth',
          block: 'start'
        });
      });
    });
  }

  /* ===========================================================
     3. MODAL SYSTEM
     =========================================================== */

  var activeModal = null;
  var lastFocusedElement = null;

  function openModal(innerHTML, labelledBy) {
    closeModal();

    var overlay = document.createElement('div');

    overlay.className = 'vas-modal-overlay';

    overlay.setAttribute(
      'role',
      'presentation'
    );

    overlay.style.cssText =
      'position:fixed;inset:0;z-index:1000;' +
      'background:rgba(17,17,17,0.55);' +
      'display:flex;align-items:center;' +
      'justify-content:center;padding:24px;' +
      'opacity:0;transition:opacity 0.25s ease;';

    var dialog = document.createElement('div');

    dialog.className = 'vas-modal';

    dialog.setAttribute(
      'role',
      'dialog'
    );

    dialog.setAttribute(
      'aria-modal',
      'true'
    );

    if (labelledBy) {
      dialog.setAttribute(
        'aria-labelledby',
        labelledBy
      );
    }

    dialog.style.cssText =
      'background:#ffffff;max-width:480px;' +
      'width:100%;max-height:88vh;' +
      'overflow-y:auto;border-radius:4px;' +
      'padding:32px;position:relative;' +
      'font-family:inherit;color:#111111;' +
      'box-shadow:0 30px 60px rgba(17,17,17,0.25);' +
      'transform:translateY(12px);' +
      'transition:transform 0.25s ease;';

    var closeBtn = document.createElement('button');

    closeBtn.type = 'button';

    closeBtn.setAttribute(
      'aria-label',
      'Close'
    );

    closeBtn.innerHTML = '&times;';

    closeBtn.style.cssText =
      'position:absolute;top:16px;right:16px;' +
      'font-size:22px;line-height:1;' +
      'background:none;border:none;' +
      'color:#666666;cursor:pointer;' +
      'padding:4px 8px;';

    closeBtn.addEventListener(
      'click',
      closeModal
    );

    closeBtn.addEventListener(
      'mouseenter',
      function () {
        closeBtn.style.color = '#b3873f';
      }
    );

    closeBtn.addEventListener(
      'mouseleave',
      function () {
        closeBtn.style.color = '#666666';
      }
    );

    dialog.appendChild(closeBtn);

    var content = document.createElement('div');

    content.innerHTML = innerHTML;

    dialog.appendChild(content);

    overlay.appendChild(dialog);

    document.body.appendChild(overlay);

    document.body.style.overflow = 'hidden';

    lastFocusedElement = document.activeElement;

    window.requestAnimationFrame(function () {
      overlay.style.opacity = '1';
      dialog.style.transform = 'translateY(0)';
    });

    overlay.addEventListener(
      'click',
      function (event) {
        if (event.target === overlay) {
          closeModal();
        }
      }
    );

    function onKeydown(event) {
      if (event.key === 'Escape') {
        closeModal();
      } else if (event.key === 'Tab') {
        trapFocus(dialog, event);
      }
    }

    document.addEventListener(
      'keydown',
      onKeydown
    );

    activeModal = {
      overlay: overlay,
      dialog: dialog,
      onKeydown: onKeydown
    };

    var firstField = qs(
      'input, textarea, select, button:not([aria-label="Close"])',
      dialog
    );

    if (firstField) {
      window.setTimeout(function () {
        firstField.focus();
      }, 60);
    } else {
      closeBtn.focus();
    }

    return dialog;
  }

  function closeModal() {
    if (!activeModal) return;

    var overlay = activeModal.overlay;

    document.removeEventListener(
      'keydown',
      activeModal.onKeydown
    );

    overlay.style.opacity = '0';

    window.setTimeout(function () {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 250);

    document.body.style.overflow = '';

    if (
      lastFocusedElement &&
      typeof lastFocusedElement.focus === 'function'
    ) {
      lastFocusedElement.focus();
    }

    activeModal = null;
  }

  /* ===========================================================
     4. BOOK A CALL
     =========================================================== */

  /*
   * GOOGLE APPS SCRIPT BACKEND
   *
   * IMPORTANT:
   * This is your deployed Google Apps Script Web App URL.
   */

  var BOOKING_ENDPOINT_URL =
    'https://script.google.com/macros/s/AKfycbyTRp3t3UNBfgHhwj1BfsDNE2P7UVlClfrjJb6sSEHVTwzY-jJCXY0ixdLzYQnAyL0VWg/exec';

  function bookingModalMarkup() {
    return (
      '<h3 id="booking-modal-title" style="font-size:18px;font-weight:700;letter-spacing:0.02em;margin:0 0 4px;">BOOK A CALL</h3>' +

      '<p style="font-size:13px;color:#666666;margin:0 0 22px;">Tell us about your project and we\u2019ll get back to you.</p>' +

      '<form id="vas-modal-booking-form" novalidate>' +

      '<div style="display:flex;flex-direction:column;gap:14px;">' +

      fieldMarkup(
        'vas-mb-name',
        'text',
        'Name',
        true
      ) +

      fieldMarkup(
        'vas-mb-email',
        'email',
        'Email',
        true
      ) +

      fieldMarkup(
        'vas-mb-phone',
        'tel',
        'Phone / WhatsApp',
        true
      ) +

      '<div style="display:flex;flex-direction:column;gap:6px;">' +

      '<label for="vas-mb-service" style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#666666;">Service</label>' +

      '<select id="vas-mb-service" name="service" required style="border:1px solid #e7e5e0;border-radius:2px;padding:10px 12px;color:#111111;background:#ffffff;">' +

      '<option value="">Select a service</option>' +

      '<option value="website">Website</option>' +

      '<option value="automation">Automation</option>' +

      '<option value="editing">Editing</option>' +

      '</select>' +

      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +

      fieldMarkup(
        'vas-mb-date',
        'date',
        'Date',
        true
      ) +

      fieldMarkup(
        'vas-mb-time',
        'time',
        'Time',
        true
      ) +

      '</div>' +

      '<div style="display:flex;flex-direction:column;gap:6px;">' +

      '<label for="vas-mb-details" style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#666666;">Project details</label>' +

      '<textarea id="vas-mb-details" name="details" rows="3" style="border:1px solid #e7e5e0;border-radius:2px;padding:10px 12px;color:#111111;resize:vertical;"></textarea>' +

      '</div>' +

      '<button type="submit" style="margin-top:4px;padding:14px 28px;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;background:#111111;color:#ffffff;border:1px solid #111111;border-radius:2px;">CONFIRM BOOKING</button>' +

      '</div>' +

      '</form>'
    );
  }

  function fieldMarkup(
    id,
    type,
    label,
    required
  ) {
    return (
      '<div style="display:flex;flex-direction:column;gap:6px;">' +

      '<label for="' +
      id +
      '" style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#666666;">' +

      label +

      '</label>' +

      '<input type="' +
      type +
      '" id="' +
      id +
      '" name="' +
      id +
      '"' +

      (required ? ' required' : '') +

      ' style="border:1px solid #e7e5e0;border-radius:2px;padding:10px 12px;color:#111111;">' +

      '</div>'
    );
  }

  function successMarkup() {
    return (
      '<div style="text-align:center;padding:12px 0;">' +

      '<p style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#b3873f;margin:0 0 10px;">Request received</p>' +

      '<p style="font-size:15px;color:#111111;margin:0;">We\u2019ll get back to you shortly.</p>' +

      '</div>'
    );
  }

  /*
   * Extract booking data from either:
   * - Modal booking form
   * - Hero booking card
   */

  function extractBookingPayload(
    form,
    sourceLabel
  ) {
    function val(id) {
      var el = qs(
        '#' + id,
        form
      );

      return el
        ? el.value.trim()
        : '';
    }

    var isModalForm =
      !!qs(
        '#vas-mb-name',
        form
      );

    if (isModalForm) {
      return {
        name: val('vas-mb-name'),
        email: val('vas-mb-email'),
        phone: val('vas-mb-phone'),
        service: val('vas-mb-service'),
        date: val('vas-mb-date'),
        time: val('vas-mb-time'),
        details: val('vas-mb-details'),
        source:
          sourceLabel ||
          'Booking Modal'
      };
    }

    return {
      name: val('booking-name'),
      email: val('booking-email'),
      phone: '',
      service: '',
      date: val('booking-date'),
      time: val('booking-time'),
      details: val('booking-need'),
      source:
        sourceLabel ||
        'Hero Booking Card'
    };
  }

  /*
   * SEND BOOKING TO GOOGLE APPS SCRIPT
   */

  function submitBooking(payload) {
    if (
      !BOOKING_ENDPOINT_URL ||
      BOOKING_ENDPOINT_URL.indexOf(
        'PASTE_YOUR'
      ) === 0
    ) {
      return Promise.reject(
        new Error(
          'Booking system is not connected yet. Please contact us directly for now.'
        )
      );
    }

    return fetch(
      BOOKING_ENDPOINT_URL,
      {
        method: 'POST',

        /*
         * text/plain keeps the request simple
         * and avoids a CORS preflight.
         */
        headers: {
          'Content-Type':
            'text/plain;charset=utf-8'
        },

        body: JSON.stringify(
          payload
        )
      }
    )
      .then(function (response) {
        if (!response.ok) {
          throw new Error(
            'Server responded with an error. Please try again.'
          );
        }

        return response.json();
      })

      .then(function (data) {
        if (
          !data ||
          data.success !== true
        ) {
          throw new Error(
            (data && data.error) ||
              'Booking could not be saved. Please try again.'
          );
        }

        return data;
      });
  }

  function setFormSubmittingState(
    submitBtn,
    isSubmitting
  ) {
    if (!submitBtn) return;

    submitBtn.disabled =
      isSubmitting;

    if (isSubmitting) {
      submitBtn.dataset.originalLabel =
        submitBtn.textContent;

      submitBtn.textContent =
        'SENDING\u2026';
    } else if (
      submitBtn.dataset.originalLabel
    ) {
      submitBtn.textContent =
        submitBtn.dataset.originalLabel;
    }
  }

  function showBookingError(
    form,
    message
  ) {
    var errorEl = qs(
      '.booking-form-error',
      form
    );

    if (!errorEl) {
      errorEl =
        document.createElement(
          'p'
        );

      errorEl.className =
        'booking-form-error';

      errorEl.style.cssText =
        'font-size:13px;color:#b3873f;margin:12px 0 0;line-height:1.5;';

      form.appendChild(
        errorEl
      );
    }

    errorEl.textContent =
      message;
  }

  function clearBookingError(
    form
  ) {
    var errorEl = qs(
      '.booking-form-error',
      form
    );

    if (
      errorEl &&
      errorEl.parentNode
    ) {
      errorEl.parentNode.removeChild(
        errorEl
      );
    }
  }

  function handleBookingSubmit(
    form,
    onSuccess,
    sourceLabel
  ) {
    form.addEventListener(
      'submit',
      function (event) {
        event.preventDefault();

        var submitBtn = qs(
          'button[type="submit"]',
          form
        );

        if (
          submitBtn &&
          submitBtn.disabled
        ) {
          return;
        }

        var requiredFields =
          qsa(
            '[required]',
            form
          );

        var valid = true;

        requiredFields.forEach(
          function (field) {
            if (
              !field.value ||
              !field.value.trim()
            ) {
              valid = false;

              field.style.borderColor =
                '#b3873f';
            } else {
              field.style.borderColor =
                '#e7e5e0';
            }
          }
        );

        if (!valid) return;

        clearBookingError(
          form
        );

        setFormSubmittingState(
          submitBtn,
          true
        );

        var payload =
          extractBookingPayload(
            form,
            sourceLabel
          );

        submitBooking(
          payload
        )
          .then(function () {
            onSuccess();
          })

          .catch(function (err) {
            setFormSubmittingState(
              submitBtn,
              false
            );

            showBookingError(
              form,
              (err &&
                err.message) ||
                'Something went wrong. Please try again.'
            );
          });
      }
    );
  }

  function initBooking() {
    var triggers = [
      qs('#nav-book-call'),
      qs('#hero-book-call'),
      qs('#final-cta-book-call')
    ].filter(Boolean);

    triggers.forEach(
      function (trigger) {
        trigger.setAttribute(
          'data-opens-booking',
          'true'
        );

        trigger.addEventListener(
          'click',
          function (event) {
            event.preventDefault();

            var dialog =
              openModal(
                bookingModalMarkup(),
                'booking-modal-title'
              );

            var modalForm =
              qs(
                '#vas-modal-booking-form',
                dialog
              );

            if (modalForm) {
              handleBookingSubmit(
                modalForm,

                function () {
                  dialog.innerHTML =
                    '';

                  var closeBtn =
                    document.createElement(
                      'button'
                    );

                  closeBtn.type =
                    'button';

                  closeBtn.setAttribute(
                    'aria-label',
                    'Close'
                  );

                  closeBtn.innerHTML =
                    '&times;';

                  closeBtn.style.cssText =
                    'position:absolute;top:16px;right:16px;font-size:22px;line-height:1;background:none;border:none;color:#666666;cursor:pointer;padding:4px 8px;';

                  closeBtn.addEventListener(
                    'click',
                    closeModal
                  );

                  dialog.appendChild(
                    closeBtn
                  );

                  var successWrap =
                    document.createElement(
                      'div'
                    );

                  successWrap.innerHTML =
                    successMarkup();

                  dialog.appendChild(
                    successWrap
                  );
                },

                'Booking Modal (' +
                  trigger.id +
                  ')'
              );
            }
          }
        );
      }
    );

    /*
     * HERO BOOKING CARD
     */

    var heroForm =
      qs('#booking-form');

    if (heroForm) {
      handleBookingSubmit(
        heroForm,

        function () {
          var card =
            qs('.booking-card');

          if (!card) return;

          card.innerHTML =
            '<h3 class="booking-card-title">BOOK A CALL</h3>' +
            successMarkup();
        },

        'Hero Booking Card'
      );
    }
  }

  /* ===========================================================
     5. CATEGORY FILTER
     =========================================================== */

  function initCategoryFilter() {
    var buttons = qsa(
      '.category-btn',
      qs('#work-categories')
    );

    var groups = qsa(
      '.work-group',
      qs('#project-grid')
    );

    if (
      !buttons.length ||
      !groups.length
    ) {
      return;
    }

    function applyFilter(
      category
    ) {
      groups.forEach(
        function (group) {
          var matches =
            category === 'all' ||
            group.dataset.group ===
              category;

          if (matches) {
            group.style.display =
              '';

            window.requestAnimationFrame(
              function () {
                group.style.opacity =
                  '1';

                group.style.transform =
                  'translateY(0)';
              }
            );
          } else {
            group.style.opacity =
              '0';

            group.style.transform =
              'translateY(8px)';

            window.setTimeout(
              function () {
                if (
                  group.style.opacity ===
                  '0'
                ) {
                  group.style.display =
                    'none';
                }
              },
              350
            );
          }
        }
      );
    }

    buttons.forEach(
      function (button) {
        button.addEventListener(
          'click',
          function () {
            buttons.forEach(
              function (btn) {
                btn.classList.remove(
                  'is-active',
                  'active'
                );
              }
            );

            button.classList.add(
              'is-active',
              'active'
            );

            applyFilter(
              button.dataset.category
            );
          }
        );
      }
    );
  }

  /* ===========================================================
     6. PROJECT MODAL
     =========================================================== */

  function initProjectModal() {
    document.addEventListener(
      'click',
      function (event) {
        var link =
          event.target.closest(
            '.project-link'
          );

        if (!link) return;

        /*
         * Real external project links:
         * let browser open normally.
         */
        if (
          link.getAttribute(
            'target'
          ) === '_blank'
        ) {
          return;
        }

        event.preventDefault();

        var card =
          link.closest(
            '.project-card'
          );

        if (!card) return;

        var title =
          qs(
            '.project-title',
            card
          );

        var type =
          qs(
            '.project-type',
            card
          );

        var image =
          qs(
            '.project-image img',
            card
          );

        var category =
          card.dataset.category ||
          '';

        var isEditing =
          category ===
          'editing';

        var markup =
          '<h3 id="project-modal-title" style="font-size:20px;font-weight:700;margin:0 0 4px;">' +

          (title
            ? title.textContent.trim()
            : 'Project') +

          '</h3>' +

          '<p style="font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#666666;margin:0 0 20px;">' +

          (type
            ? type.textContent.trim()
            : '') +

          '</p>' +

          (image
            ? '<div style="width:100%;aspect-ratio:16/10;overflow:hidden;border-radius:2px;background:#f4f3f0;margin-bottom:20px;"><img src="' +
              image.getAttribute(
                'src'
              ) +
              '" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'"></div>'
            : '') +

          '<p style="font-size:14px;line-height:1.7;color:#111111;margin:0 0 4px;">Full case study details for this project are coming soon.</p>' +

          (isEditing
            ? '<p style="font-size:13px;color:#666666;margin-top:12px;">Video playback isn\u2019t available in this preview yet.</p>'
            : '');

        openModal(
          markup,
          'project-modal-title'
        );
      }
    );
  }

  /* ===========================================================
     7. TEAM PROFILE MODAL
     =========================================================== */

  var TEAM_BIOS = {
    KUSH:
      'Founder & Creative Lead at Vision Aura Studio. Building the vision, shaping the work, and leading the studio forward.',

    SONU:
      'Handles development at Vision Aura Studio, turning ideas into fast, reliable, well-built websites.',

    SUJAL:
      'Shapes the visual identity of every project at Vision Aura Studio, from layout to detail.',

    JATIN:
      "Brings footage to life at Vision Aura Studio, crafting edits that tell each brand's story."
  };

  var TEAM_BIO_FALLBACK =
    'Part of the Vision Aura Studio team.';

  /* ===========================================================
     PROJECT IMAGE BACKGROUND
     =========================================================== */

  function initProjectImageBackgrounds() {
    qsa(
      '.project-image'
    ).forEach(
      function (container) {
        var img =
          qs(
            'img',
            container
          );

        var src =
          img
            ? img.getAttribute(
                'src'
              )
            : null;

        if (!src) return;

        container.style.setProperty(
          '--project-bg',
          'url("' +
            src +
            '")'
        );
      }
    );
  }

  function initTeamModal() {
    qsa(
      '.person-card'
    ).forEach(
      function (card) {
        var link =
          qs(
            '.person-link',
            card
          );

        if (!link) return;

        link.addEventListener(
          'click',
          function (event) {
            event.preventDefault();

            var name =
              qs(
                '.person-name',
                card
              );

            var role =
              qs(
                '.person-role',
                card
              );

            var image =
              qs(
                '.person-image img',
                card
              );

            var nameText =
              name
                ? name.textContent.trim()
                : '';

            var bio =
              TEAM_BIOS[
                nameText
              ] ||
              TEAM_BIO_FALLBACK;

            var markup =
              (image
                ? '<div style="width:96px;height:96px;border-radius:2px;overflow:hidden;background:#eeece7;margin-bottom:18px;"><img src="' +
                  image.getAttribute(
                    'src'
                  ) +
                  '" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'"></div>'
                : '') +

              '<h3 id="team-modal-title" style="font-size:18px;font-weight:700;margin:0 0 4px;">' +

              nameText +

              '</h3>' +

              '<p style="font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#b3873f;margin:0 0 18px;">' +

              (role
                ? role.textContent.trim()
                : '') +

              '</p>' +

              '<p style="font-size:14px;line-height:1.7;color:#111111;margin:0;">' +

              bio +

              '</p>';

            openModal(
              markup,
              'team-modal-title'
            );
          }
        );
      }
    );
  }

  /* ===========================================================
     8. NAVBAR ON SCROLL
     =========================================================== */

  function initNavbarScroll() {
    var navbar =
      qs('.navbar');

    if (!navbar) return;

    navbar.style.transition =
      'box-shadow 0.25s ease, padding 0.25s ease';

    var ticking = false;

    function updateNavbar() {
      if (window.scrollY > 12) {
        navbar.style.boxShadow =
          '0 1px 0 rgba(17,17,17,0.05)';
      } else {
        navbar.style.boxShadow =
          'none';
      }

      ticking = false;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          window.requestAnimationFrame(
            updateNavbar
          );

          ticking = true;
        }
      },
      { passive: true }
    );

    updateNavbar();
  }

  /* ===========================================================
     MOBILE NAVIGATION TOGGLE
     =========================================================== */

  function initMobileNav() {
    var toggle =
      qs('#nav-toggle');

    var links =
      qs('#nav-links');

    if (
      !toggle ||
      !links
    ) {
      return;
    }

    function setOpen(
      isOpen
    ) {
      links.classList.toggle(
        'is-open',
        isOpen
      );

      toggle.classList.toggle(
        'is-open',
        isOpen
      );

      toggle.setAttribute(
        'aria-expanded',
        String(isOpen)
      );

      toggle.setAttribute(
        'aria-label',
        isOpen
          ? 'Close menu'
          : 'Open menu'
      );
    }

    toggle.addEventListener(
      'click',
      function () {
        setOpen(
          !links.classList.contains(
            'is-open'
          )
        );
      }
    );

    links.addEventListener(
      'click',
      function (event) {
        if (
          event.target.closest(
            'a'
          )
        ) {
          setOpen(false);
        }
      }
    );

    document.addEventListener(
      'keydown',
      function (event) {
        if (
          event.key ===
          'Escape'
        ) {
          setOpen(false);
        }
      }
    );

    document.addEventListener(
      'click',
      function (event) {
        if (
          !links.classList.contains(
            'is-open'
          )
        ) {
          return;
        }

        if (
          event.target.closest(
            '.navbar'
          )
        ) {
          return;
        }

        setOpen(false);
      }
    );

    window.addEventListener(
      'resize',
      function () {
        if (
          window.innerWidth >
          680
        ) {
          setOpen(false);
        }
      }
    );
  }

  /* ===========================================================
     9. SCROLL REVEALS
     =========================================================== */

  function initScrollReveals() {
    var targets =
      qsa(
        '.best-work, .selected-work, .work-page-projects, .people, .client-words, .studio, .final-cta'
      );

    if (!targets.length) {
      return;
    }

    if (
      prefersReducedMotion ||
      !(
        'IntersectionObserver' in
        window
      )
    ) {
      targets.forEach(
        function (el) {
          el.classList.add(
            'is-visible'
          );
        }
      );

      return;
    }

    targets.forEach(
      function (el) {
        el.classList.add(
          'is-hidden'
        );

        el.style.transform =
          'translateY(16px)';
      }
    );

    var observer =
      new IntersectionObserver(
        function (entries) {
          entries.forEach(
            function (entry) {
              if (
                entry.isIntersecting
              ) {
                entry.target.classList.remove(
                  'is-hidden'
                );

                entry.target.classList.add(
                  'is-visible'
                );

                entry.target.style.transform =
                  'translateY(0)';

                observer.unobserve(
                  entry.target
                );
              }
            }
          );
        },
        {
          threshold: 0.12
        }
      );

    targets.forEach(
      function (el) {
        observer.observe(el);
      }
    );
  }

  /* ===========================================================
     INIT
     =========================================================== */

  function init() {
    guardImages();
    runLoader();
    initSmoothScroll();
    initBooking();
    initCategoryFilter();
    initProjectModal();
    initProjectImageBackgrounds();
    initTeamModal();
    initMobileNav();
    initNavbarScroll();
    initScrollReveals();
  }

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      init
    );
  } else {
    init();
  }
})();