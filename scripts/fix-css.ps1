# Read the CSS file
$css = Get-Content "src/index.css" -Raw

# 1. Add mobile base styles to body rule
$oldBody = @"
    body {
      background: var(--black);
      color: var(--cream);
      font-family: 'DM Sans', sans-serif;
      font-weight: 300;
      min-height: 100vh;
      overflow-x: hidden;
    }
"@

$newBody = @"
    html {
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
    }

    body {
      background: var(--black);
      color: var(--cream);
      font-family: 'DM Sans', sans-serif;
      font-weight: 300;
      min-height: 100vh;
      overflow-x: hidden;
      -webkit-tap-highlight-color: transparent;
      -webkit-text-size-adjust: 100%;
    }

    /* Prevent iOS zoom on input focus */
    input, select, textarea {
      font-size: 16px;
    }
"@

$css = $css.Replace($oldBody, $newBody)

# 2. Remove first breakpoint block (lines ~2215-2501)
# Find and remove the block between start marker and end marker
$startIdx = $css.IndexOf("RESPONSIVE BREAKPOINTS")
if ($startIdx -ge 0) {
    # Go back to find the comment start
    $commentStart = $css.LastIndexOf("/* ", $startIdx)
    # Find the end: "Small phones" block closing brace before CHECKOUT
    $checkoutIdx = $css.IndexOf("/* " + [char]0x2550 + [char]0x2550 + " CHECKOUT", $startIdx)
    if ($checkoutIdx -gt 0) {
        # Go back to capture trailing whitespace
        # $checkoutIdx marks where the CHECKOUT section begins
        $blockStart = $css.LastIndexOf("`n", $commentStart)
        if ($blockStart -lt 0) { $blockStart = $commentStart }
        $css = $css.Substring(0, $blockStart) + "`r`n`r`n    /* responsive rules moved to end of file */`r`n`r`n    " + $css.Substring($checkoutIdx)
    }
}

# 3. Remove second breakpoint block (MOBILE RESPONSIVE OVERRIDES section)
$overridesIdx = $css.IndexOf("MOBILE RESPONSIVE OVERRIDES")
if ($overridesIdx -ge 0) {
    $commentStart2 = $css.LastIndexOf("/* ", $overridesIdx)
    $blockStart2 = $css.LastIndexOf("`n", $commentStart2)
    # Find the end: after @media(max-width:420px) block, before CHATBOT WIDGET
    $chatbotIdx = $css.IndexOf("CHATBOT WIDGET", $overridesIdx)
    if ($chatbotIdx -gt 0) {
        $css = $css.Substring(0, $blockStart2) + "`r`n`r`n    " + $css.Substring($css.LastIndexOf("/* ", $chatbotIdx))
    }
}

# 4. Remove the chatbot mobile breakpoint at the very end (we'll consolidate it)
$chatbotMobileIdx = $css.IndexOf("/* Responsive adjustments for mobile chatbot */")
if ($chatbotMobileIdx -ge 0) {
    $css = $css.Substring(0, $chatbotMobileIdx).TrimEnd() + "`r`n`r`n"
}

# 5. Append consolidated responsive block
$consolidated = @"

    /* ══════════════════════════════════════════
       CONSOLIDATED RESPONSIVE BREAKPOINTS
    ══════════════════════════════════════════ */

    /* ── Tablet (≤1024px) ── */
    @media (max-width: 1024px) {
      .auth-left { display: none; }
      .auth-right { width: 100%; border-left: none; }
      .stats-row, .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .customer-stats-row { grid-template-columns: repeat(2, 1fr); }
      .admin-topbar { padding: 0 20px; }
      .admin-nav { padding: 0 12px; }
      .admin-body { padding: 20px; }
      .form-row { grid-template-columns: 1fr; }
      .checkout-modal { padding: 24px 20px !important; }

      /* Admin dashboard sidebar → horizontal scroll */
      .admin-dash-body {
        flex-direction: column;
        padding: 0 20px;
      }
      .admin-sidebar {
        width: 100%;
        flex-direction: row;
        overflow-x: auto;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
        gap: 8px;
        padding-top: 16px;
        padding-bottom: 4px;
      }
      .admin-sidebar::-webkit-scrollbar { display: none; }
      .admin-sidebar-btn {
        white-space: nowrap;
        padding: 12px 16px;
        font-size: 0.8rem;
      }
      .admin-main-content {
        margin-top: 16px;
        padding: 20px;
        min-height: auto;
      }
      .admin-dash-header { padding: 20px; }
      .admin-dash-title { font-size: 1.8rem; }
      .reviews-section { padding: 40px 20px 30px; }
    }

    /* ── Mobile (≤768px) ── */
    @media (max-width: 768px) {

      /* Navigation */
      nav {
        padding: 0 12px !important;
        height: 56px !important;
      }
      .nav-links { display: none !important; }
      .user-greeting { display: none !important; }
      .hamburger { display: flex; }
      .nav-hamburger { display: flex; }
      .track-btn, .notif-btn, .logout-btn { display: none !important; }
      .cart-btn-label { display: none; }
      .cart-btn { padding: 6px 10px !important; }
      .cart-btn span.cart-count { width: 16px; height: 16px; font-size: .6rem; }

      /* Bottom tab bar */
      .bottom-tab-bar { display: grid; }
      #customerView { padding-bottom: 64px; }

      /* Banner */
      .banner { height: 200px !important; }
      .banner-content h1 { font-size: clamp(1.8rem, 8vw, 3rem); }

      /* Filter bar */
      .filter-bar { padding: 12px 10px 8px !important; gap: 6px; }
      .filter-tab {
        padding: 8px 14px;
        font-size: .65rem;
        min-height: 36px;
      }

      /* Menu grid */
      .menu-section { padding: 14px 10px 70px !important; }
      .menu-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
      .card-img { height: 100px !important; }
      .card-body { padding: 8px !important; }
      .card-desc { display: none !important; }
      .card-name { font-size: 0.8rem !important; }
      .card-price { font-size: 0.88rem !important; }

      /* Touch targets — minimum 44x44px */
      .add-btn {
        width: 40px;
        height: 40px;
        font-size: 1.1rem;
        border-radius: 8px;
      }
      .qty-btn {
        width: 36px;
        height: 36px;
        font-size: 1rem;
        border-radius: 6px;
      }
      .tbl-btn {
        padding: 8px 14px;
        min-height: 44px;
      }
      .back-btn {
        min-height: 44px;
        padding: 10px 18px;
      }
      .notif-btn, .track-btn {
        min-height: 44px;
        padding: 10px 14px;
      }

      /* Cart — full-width bottom sheet */
      .cart-panel {
        width: 100% !important;
        border-left: none !important;
        border-top: 1px solid var(--border);
        top: auto !important;
        height: 90vh !important;
        border-radius: 16px 16px 0 0 !important;
      }

      /* Modals — bottom sheet pattern */
      .modal {
        width: 100% !important;
        max-width: 100vw !important;
        padding: 20px 16px !important;
        border-radius: 16px 16px 0 0 !important;
        max-height: 92vh;
        overflow-y: auto;
      }
      .modal-overlay { align-items: flex-end !important; }
      .track-modal {
        width: 100% !important;
        border-radius: 16px 16px 0 0 !important;
        max-height: 92vh;
      }
      .checkout-modal {
        width: 100% !important;
        border-radius: 16px 16px 0 0 !important;
      }
      .tracking-modal {
        width: 100% !important;
        padding: 20px 12px !important;
        border-radius: 16px 16px 0 0 !important;
        max-height: 90vh;
      }
      .form-row { grid-template-columns: 1fr; gap: 0; }

      /* Auth */
      .auth-right { padding: 24px 16px !important; }
      .auth-left { display: none !important; }

      /* Admin dashboard mobile */
      .admin-topbar { padding: 0 16px; height: 58px; }
      .admin-topbar-right .admin-user-info { display: none; }
      .admin-nav { padding: 0 8px; }
      .admin-tab {
        padding: 14px 16px;
        font-size: .65rem;
        letter-spacing: 1px;
      }
      .admin-body { padding: 14px; }
      .stats-row { grid-template-columns: 1fr 1fr; gap: 10px; }
      .stat-card { padding: 14px 16px; }
      .stat-value { font-size: 1.5rem; }
      .inv-table { overflow-x: auto; }
      .inv-table table { min-width: 600px; }

      /* Admin new dashboard mobile */
      .admin-dash-header {
        flex-direction: column;
        gap: 12px;
        padding: 16px 12px;
        align-items: flex-start;
      }
      .admin-dash-header-right {
        width: 100%;
        justify-content: flex-end;
      }
      .admin-dash-user-info { display: none; }
      .admin-exit-btn { padding: 5px 10px; font-size: 0.65rem; }
      .admin-mobile-menu-btn { display: flex; }
      .admin-dash-title { font-size: 1.3rem; }
      .admin-dash-subtitle { font-size: 0.72rem; }
      .admin-dash-body { padding: 0 10px; flex-direction: column; }
      .admin-sidebar {
        display: none;
        width: 100%;
        flex-direction: column;
        padding: 6px;
        background: var(--card-bg);
        border: 1px solid var(--border);
        border-radius: 8px;
        margin-bottom: 10px;
      }
      .admin-sidebar.open { display: flex; }
      .admin-sidebar-btn { padding: 10px 14px; font-size: 0.75rem; }
      .admin-main-content {
        padding: 12px;
        min-height: 350px;
        margin-top: 0;
        border-radius: 8px;
      }
      .admin-content-title { font-size: 1.1rem; margin-bottom: 12px; }
      .admin-content-header { flex-direction: column; align-items: flex-start; }

      /* Show mobile cards, hide desktop tables */
      .mobile-only { display: flex !important; }
      .desktop-only { display: none !important; }

      /* Admin status select */
      .admin-status-select { font-size: 0.72rem; padding: 5px 8px; }

      /* Notification panels */
      .notif-panel {
        position: fixed !important;
        left: 8px !important;
        right: 8px !important;
        top: 58px !important;
        width: auto !important;
      }
      .admin-notif-panel {
        right: 8px;
        left: 8px;
        width: auto;
      }

      /* Reviews */
      .reviews-section { padding: 24px 12px 20px; }
      .reviews-grid { grid-template-columns: 1fr !important; }
      .reviews-summary {
        flex-direction: column !important;
        padding: 14px !important;
        gap: 12px !important;
      }
      .reviews-summary > div:first-child {
        border-right: none !important;
        padding-right: 0 !important;
        border-bottom: 1px solid var(--border);
        padding-bottom: 12px;
      }

      /* Landing page */
      .landing-nav { padding: 0 12px !important; height: 52px !important; }
      .features-strip { grid-template-columns: 1fr !important; }
      .feature-item {
        border-right: none !important;
        border-bottom: 1px solid var(--border);
        padding: 18px 16px;
      }
      .feature-item:last-child { border-bottom: none; }

      /* Toast above bottom nav */
      .toast {
        bottom: 70px !important;
        width: calc(100% - 24px);
        text-align: center;
        white-space: normal;
      }

      /* Chatbot */
      .chatbot-window {
        bottom: 64px;
        right: 12px;
        left: 12px;
        width: auto;
        height: 55vh;
      }
      .chatbot-toggle-btn {
        bottom: 64px;
        right: 12px;
      }
    }

    /* ── Small phones (≤420px) ── */
    @media (max-width: 420px) {
      .menu-grid { grid-template-columns: 1fr !important; }
      .admin-tab { padding: 12px 10px; font-size: .6rem; }
      .admin-dash-title { font-size: 1.2rem; }
      .admin-order-card-body {
        flex-direction: column;
        align-items: flex-start;
      }
      .admin-inv-card-top { flex-wrap: wrap; }
      .hero-actions {
        flex-direction: column;
        gap: 10px;
      }
      .hero-btn {
        width: 100%;
        text-align: center;
      }
      .stat-card { padding: 10px 12px; }
      .stat-value { font-size: 1.2rem; }
    }
"@

$css = $css + $consolidated

# Write the file
Set-Content "src/index.css" -Value $css -NoNewline

Write-Host "CSS updated successfully!"
