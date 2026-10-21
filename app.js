(() => {
  "use strict";

  const form = document.getElementById("applicationForm");
  const message = document.getElementById("message");
  const submitButton = document.getElementById("submitButton");
  const imageInput = document.getElementById("images");

  function showMessage(text, type = "") {
    if (!message) return;
    message.textContent = text;
    message.className = type;
  }

  if (!form || !message || !submitButton) {
    console.error("Application form setup failed: missing form, message, or submit button.");
    return;
  }

  if (typeof window.supabase === "undefined" ||
      typeof SUPABASE_URL === "undefined" ||
      typeof SUPABASE_PUBLISHABLE_KEY === "undefined" ||
      typeof APPLICATION_TABLE === "undefined" ||
      typeof IMAGE_BUCKET === "undefined") {
    showMessage("Setup error: Supabase did not load. Check config.js and your internet connection.", "err");
    console.error("Supabase configuration or library is missing.");
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  function safeFileName(name) {
    return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_").slice(-100) || "image";
  }

  function makeUniqueId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  form.addEventListener("submit", async (event) => {
    // Prevent the browser from adding form values to the page URL.
    event.preventDefault();
    if (submitButton.disabled) return;
    submitButton.disabled = true;
    showMessage("Submitting application...", "");
    const uploadedPaths = [];

    try {
      const formData = new FormData(form);
      const files = imageInput ? Array.from(imageInput.files || []) : [];
      const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

      // Validate all images before uploading any.
      for (const file of files) {
        if (!allowedTypes.has(file.type)) throw new Error(`${file.name}: only JPG, PNG, and WEBP images are allowed.`);
        if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name}: image exceeds the 5 MB limit.`);
      }

      for (const file of files) {
        const path = `${makeUniqueId()}-${safeFileName(file.name)}`;
        const { error } = await client.storage.from(IMAGE_BUCKET).upload(path, file, {
          contentType: file.type,
          upsert: false
        });
        if (error) throw new Error(`Image upload failed for ${file.name}: ${error.message}`);
        uploadedPaths.push(path);
      }

      const getText = (name) => String(formData.get(name) ?? "").trim();
      const row = {
        username: getText("username"),
        game_id: getText("game_id"),
        current_state: getText("current_state"),
        current_clan: getText("current_clan"),
        preferred_clan: getText("preferred_clan"),
        backup_clan: getText("backup_clan"),
        watchtower_level: getText("watchtower_level"),
        // Keep powers as text so values such as 250M remain valid and unchanged.
        overall_power: getText("overall_power"),
        first_march_power: getText("first_march_power"),
        second_march_power: getText("second_march_power"),
        third_march_power: getText("third_march_power"),
        reason: getText("reason"),
        image_urls: uploadedPaths,
        status: "pending"
      };

      const { error: insertError } = await client.from(APPLICATION_TABLE).insert(row);
      if (insertError) throw new Error(`Database error: ${insertError.message}`);
      form.reset();
      showMessage("✓ APPLICATION SUBMITTED SUCCESSFULLY!", "ok");
    } catch (error) {
      console.error("Application submission failed:", error);
      showMessage(`Could not submit: ${error?.message || String(error)}`, "err");
    } finally {
      submitButton.disabled = false;
    }
  });

  console.log("Application form initialized successfully.");
})();
