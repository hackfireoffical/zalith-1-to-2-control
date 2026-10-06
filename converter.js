/* ZL1 → ZL2 control converter */
const GLFW = {
  32:"GLFW_KEY_SPACE",39:"GLFW_KEY_APOSTROPHE",44:"GLFW_KEY_COMMA",45:"GLFW_KEY_MINUS",46:"GLFW_KEY_PERIOD",47:"GLFW_KEY_SLASH",
  48:"GLFW_KEY_0",49:"GLFW_KEY_1",50:"GLFW_KEY_2",51:"GLFW_KEY_3",52:"GLFW_KEY_4",53:"GLFW_KEY_5",54:"GLFW_KEY_6",55:"GLFW_KEY_7",56:"GLFW_KEY_8",57:"GLFW_KEY_9",
  59:"GLFW_KEY_SEMICOLON",61:"GLFW_KEY_EQUAL",
  65:"GLFW_KEY_A",66:"GLFW_KEY_B",67:"GLFW_KEY_C",68:"GLFW_KEY_D",69:"GLFW_KEY_E",70:"GLFW_KEY_F",71:"GLFW_KEY_G",72:"GLFW_KEY_H",
  73:"GLFW_KEY_I",74:"GLFW_KEY_J",75:"GLFW_KEY_K",76:"GLFW_KEY_L",77:"GLFW_KEY_M",78:"GLFW_KEY_N",79:"GLFW_KEY_O",80:"GLFW_KEY_P",
  81:"GLFW_KEY_Q",82:"GLFW_KEY_R",83:"GLFW_KEY_S",84:"GLFW_KEY_T",85:"GLFW_KEY_U",86:"GLFW_KEY_V",87:"GLFW_KEY_W",88:"GLFW_KEY_X",89:"GLFW_KEY_Y",90:"GLFW_KEY_Z",
  91:"GLFW_KEY_LEFT_BRACKET",92:"GLFW_KEY_BACKSLASH",93:"GLFW_KEY_RIGHT_BRACKET",96:"GLFW_KEY_GRAVE_ACCENT",
  256:"GLFW_KEY_ESCAPE",257:"GLFW_KEY_ENTER",258:"GLFW_KEY_TAB",259:"GLFW_KEY_BACKSPACE",260:"GLFW_KEY_INSERT",261:"GLFW_KEY_DELETE",
  262:"GLFW_KEY_RIGHT",263:"GLFW_KEY_LEFT",264:"GLFW_KEY_DOWN",265:"GLFW_KEY_UP",266:"GLFW_KEY_PAGE_UP",267:"GLFW_KEY_PAGE_DOWN",268:"GLFW_KEY_HOME",269:"GLFW_KEY_END",
  280:"GLFW_KEY_CAPS_LOCK",281:"GLFW_KEY_SCROLL_LOCK",282:"GLFW_KEY_NUM_LOCK",283:"GLFW_KEY_PRINT_SCREEN",284:"GLFW_KEY_PAUSE",
  290:"GLFW_KEY_F1",291:"GLFW_KEY_F2",292:"GLFW_KEY_F3",293:"GLFW_KEY_F4",294:"GLFW_KEY_F5",295:"GLFW_KEY_F6",296:"GLFW_KEY_F7",297:"GLFW_KEY_F8",298:"GLFW_KEY_F9",299:"GLFW_KEY_F10",300:"GLFW_KEY_F11",301:"GLFW_KEY_F12",
  340:"GLFW_KEY_LEFT_SHIFT",341:"GLFW_KEY_LEFT_CONTROL",342:"GLFW_KEY_LEFT_ALT",343:"GLFW_KEY_LEFT_SUPER",344:"GLFW_KEY_RIGHT_SHIFT",345:"GLFW_KEY_RIGHT_CONTROL",346:"GLFW_KEY_RIGHT_ALT",347:"GLFW_KEY_RIGHT_SUPER",348:"GLFW_KEY_MENU"
};

const SPECIAL = {
  [-1]: { type: "launcher_event", key: "launcher.event.switch_keyboard" },
  [-2]: { type: "launcher_event", key: "launcher.event.switch_menu" },
  [-3]: { type: "key", key: "GLFW_MOUSE_BUTTON_LEFT" },
  [-4]: { type: "key", key: "GLFW_MOUSE_BUTTON_RIGHT" },
  [-5]: { type: "launcher_event", key: "launcher.event.switch_ime" },
  [-6]: { type: "key", key: "GLFW_MOUSE_BUTTON_MIDDLE" },
  [-7]: { type: "launcher_event", key: "launcher.event.scroll_up" },
  [-8]: { type: "launcher_event", key: "launcher.event.scroll_down" },
  [-9]: { type: "launcher_event", key: "launcher.event.switch_menu" }
};

function uid(len) {
  len = len || 12;
  var hex = "0123456789abcdef", s = "";
  for (var i = 0; i < len; i++) s += hex[(Math.random() * 16) | 0];
  return s;
}
function tstr(v) { return { default: String(v == null ? "" : v), matchQueue: [] }; }
function argbToUint(c) { return c == null ? 0x80000000 : (c >>> 0); }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function evalDynamic(expr, refW, refH, btnW, btnH, margin) {
  if (expr == null || expr === "") return 0;
  var s = String(expr).trim();
  if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s);
  var map = { screen_width: refW, screen_height: refH, width: btnW, height: btnH, margin: margin, top: 0, left: 0, right: refW - btnW, bottom: refH - btnH, preferred_scale: 1 };
  s = s.replace(/\$\{([a-zA-Z_]+)\}/g, function(_, k) { return map[k] === undefined ? "0" : String(map[k]); });
  if (!/^[\d\s+\-*/().]+$/.test(s)) return 0;
  try { var v = Function('"use strict"; return (' + s + ');')(); return typeof v === "number" && isFinite(v) ? v : 0; } catch (e) { return 0; }
}

function visibilityFromBtn(btn) {
  var inGame = btn.displayInGame !== false, inMenu = btn.displayInMenu !== false;
  if (inGame && inMenu) return "always";
  if (inGame && !inMenu) return "in_game";
  if (!inGame && inMenu) return "in_menu";
  return "always";
}

function keyEventsFromKeycodes(keycodes) {
  var events = [];
  if (!Array.isArray(keycodes)) return events;
  for (var i = 0; i < keycodes.length; i++) {
    var kc = keycodes[i];
    if (kc == null || kc === 0) continue;
    if (SPECIAL[kc]) { events.push({ type: SPECIAL[kc].type, key: SPECIAL[kc].key }); continue; }
    var name = GLFW[kc];
    if (name) events.push({ type: "key", key: name });
    else if (kc > 0) events.push({ type: "key", key: "GLFW_KEY_" + kc });
  }
  return events;
}

function makeStyleFromBtn(btn) {
  var id = uid(12);
  var bg = argbToUint(btn.bgColor != null ? btn.bgColor : 0x4D000000);
  var stroke = argbToUint(btn.strokeColor != null ? btn.strokeColor : 0xFFFFFFFF);
  var alpha = typeof btn.opacity === "number" ? clamp(btn.opacity, 0, 1) : 1;
  var radius = typeof btn.cornerRadius === "number" ? clamp(btn.cornerRadius, 0, 100) : 0;
  var borderW = typeof btn.strokeWidth === "number" ? btn.strokeWidth : 0;
  var radiusObj = { topStart: radius, topEnd: radius, bottomEnd: radius, bottomStart: radius };
  var styleBlock = {
    alpha: alpha, pressedAlpha: clamp(alpha * 0.85, 0, 1),
    backgroundColor: bg, pressedBackgroundColor: bg,
    contentColor: 0xFFFFFFFF, pressedContentColor: 0xFFFFFFFF,
    borderWidth: borderW, pressedBorderWidth: borderW,
    borderColor: stroke, pressedBorderColor: stroke,
    borderRadius: radiusObj, pressedBorderRadius: { topStart: radius, topEnd: radius, bottomEnd: radius, bottomStart: radius }
  };
  return {
    name: (btn.name || "style") + "_" + id.slice(0, 4), uuid: id,
    animateSwap: false, commonStyle: false,
    lightStyle: styleBlock,
    darkStyle: JSON.parse(JSON.stringify(styleBlock))
  };
}

function convertButton(btn, refW, refH, margin) {
  var wDp = typeof btn.width === "number" ? btn.width : 50;
  var hDp = typeof btn.height === "number" ? btn.height : 50;
  var density = 2.5, wPx = wDp * density, hPx = hDp * density;
  var xPx = evalDynamic(btn.dynamicX, refW, refH, wPx, hPx, margin);
  var yPx = evalDynamic(btn.dynamicY, refW, refH, wPx, hPx, margin);
  var x = clamp(Math.round((xPx / Math.max(refW - wPx, 1)) * 10000), 0, 10000);
  var y = clamp(Math.round((yPx / Math.max(refH - hPx, 1)) * 10000), 0, 10000);
  var widthPercentage = clamp(Math.round((wPx / refH) * 10000), 100, 10000);
  var heightPercentage = clamp(Math.round((hPx / refH) * 10000), 100, 10000);
  var style = makeStyleFromBtn(btn);
  var events = keyEventsFromKeycodes(btn.keycodes);
  return {
    normal: {
      text: tstr(btn.name || "Btn"), uuid: uid(18),
      position: { x: x, y: y },
      buttonSize: { type: "percentage", widthDp: wDp, heightDp: hDp, widthPercentage: widthPercentage, heightPercentage: heightPercentage, widthReference: "screen_height", heightReference: "screen_height" },
      buttonStyle: style.uuid, textAlignment: "center",
      textBold: false, textItalic: false, textUnderline: false,
      visibilityType: visibilityFromBtn(btn), clickEvents: events,
      isSwipple: !!btn.isSwipeable, isPenetrable: !!btn.passThruEnabled, isToggleable: !!btn.isToggle
    },
    style: style
  };
}

function convertJoystick(joy, refW, refH, margin) {
  var wDp = typeof joy.width === "number" ? joy.width : 100;
  var hDp = typeof joy.height === "number" ? joy.height : 100;
  var density = 2.5, wPx = wDp * density, hPx = hDp * density;
  var xPx = evalDynamic(joy.dynamicX || joy.x, refW, refH, wPx, hPx, margin);
  var yPx = evalDynamic(joy.dynamicY || joy.y, refW, refH, wPx, hPx, margin);
  var x = clamp(Math.round((xPx / Math.max(refW - wPx, 1)) * 10000), 0, 10000);
  var y = clamp(Math.round((yPx / Math.max(refH - hPx, 1)) * 10000), 0, 10000);
  var sizePct = clamp(Math.round((Math.max(wPx, hPx) / refH) * 10000), 500, 5000);
  return {
    text: tstr(joy.name || "Joystick"), uuid: uid(18),
    position: { x: x, y: y },
    buttonSize: { type: "percentage", widthDp: wDp, heightDp: hDp, widthPercentage: sizePct, heightPercentage: sizePct, widthReference: "screen_height", heightReference: "screen_height" },
    buttonStyle: null, visibilityType: visibilityFromBtn(joy), deadzone: 0.1, triggerMode: "follow"
  };
}

function convertZl1ToZl2(src, options) {
  var refW = options.refWidth || 1920, refH = options.refHeight || 1080, margin = 4, warnings = [];
  if (!src || typeof src !== "object") throw new Error("Input is not a JSON object.");
  if (src.editorVersion != null && src.layers) throw new Error("This looks like a Zalith Launcher 2 layout already (has editorVersion).");
  var buttons = Array.isArray(src.mControlDataList) ? src.mControlDataList : (Array.isArray(src.controlDataList) ? src.controlDataList : null);
  if (!buttons) throw new Error('Not a ZL1/Pojav control file: missing "mControlDataList".');
  var drawers = Array.isArray(src.mDrawerDataList) ? src.mDrawerDataList : [];
  var joysticks = Array.isArray(src.mJoystickDataList) ? src.mJoystickDataList : [];
  if (drawers.length) warnings.push("Drawer groups (" + drawers.length + ") flattened into buttons.");
  var styles = [], normalButtons = [], joystickButtons = [];
  for (var i = 0; i < buttons.length; i++) {
    var r = convertButton(buttons[i], refW, refH, margin);
    styles.push(r.style); normalButtons.push(r.normal);
  }
  for (var d = 0; d < drawers.length; d++) {
    var drawer = drawers[d];
    var childList = drawer.buttonProperties || drawer.buttons || drawer.mControlDataList || [];
    if (Array.isArray(childList)) {
      for (var c = 0; c < childList.length; c++) {
        var r2 = convertButton(childList[c], refW, refH, margin);
        styles.push(r2.style); normalButtons.push(r2.normal);
      }
    }
    if (drawer.name || drawer.keycodes) {
      var r3 = convertButton(drawer, refW, refH, margin);
      styles.push(r3.style); normalButtons.push(r3.normal);
    }
  }
  for (var j = 0; j < joysticks.length; j++) {
    try { joystickButtons.push(convertJoystick(joysticks[j], refW, refH, margin)); }
    catch (e) { warnings.push("Skipped a joystick: " + e.message); }
  }
  var always = normalButtons.filter(function(b) { return b.visibilityType === "always"; });
  var inGame = normalButtons.filter(function(b) { return b.visibilityType === "in_game"; });
  var inMenu = normalButtons.filter(function(b) { return b.visibilityType === "in_menu"; });
  function stripVis(list) { return list.map(function(b) { var o = {}; for (var k in b) o[k] = b[k]; o.visibilityType = "always"; return o; }); }
  var layers = [];
  if (always.length || joystickButtons.length) {
    layers.push({ name: "main", uuid: uid(12), hide: false, hideWhenMouse: true, hideWhenGamepad: true, visibilityType: "always", normalButtons: stripVis(always), textBoxes: [], joystickButtons: joystickButtons });
  }
  if (inGame.length) layers.push({ name: "in_game", uuid: uid(12), hide: false, hideWhenMouse: true, hideWhenGamepad: true, visibilityType: "in_game", normalButtons: stripVis(inGame), textBoxes: [], joystickButtons: [] });
  if (inMenu.length) layers.push({ name: "in_menu", uuid: uid(12), hide: false, hideWhenMouse: true, hideWhenGamepad: true, visibilityType: "in_menu", normalButtons: stripVis(inMenu), textBoxes: [], joystickButtons: [] });
  if (!layers.length) layers.push({ name: "main", uuid: uid(12), hide: false, hideWhenMouse: true, hideWhenGamepad: true, visibilityType: "always", normalButtons: [], textBoxes: [], joystickButtons: [] });
  return {
    layout: {
      info: { name: tstr(options.name || "Converted from ZL1"), author: tstr(options.author || "ZL1→ZL2 Converter"), description: tstr("Converted from Zalith Launcher 1 / Pojav"), versionCode: 1, versionName: "1.0" },
      layers: layers, styles: styles, joystickStyles: [], editorVersion: 12
    },
    stats: { buttons: normalButtons.length, joysticks: joystickButtons.length, styles: styles.length, layers: layers.length, drawers: drawers.length },
    warnings: warnings
  };
}

function $(id) { return document.getElementById(id); }
var inputEl = $("input"), outputEl = $("output"), statusEl = $("status"), statsEl = $("stats"), lastJson = null;

function setStatus(type, text) {
  statusEl.innerHTML = text ? '<div class="msg ' + type + '">' + escapeHtml(text) + '</div>' : "";
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function(c) { return { "&":"&","<":"<",">":">","\"":""","'":"&#39;" }[c]; });
}

function doConvert() {
  setStatus("", ""); statsEl.hidden = true;
  $("btnDownload").disabled = true; $("btnCopy").disabled = true;
  lastJson = null; outputEl.value = "";
  var src;
  try { src = JSON.parse(inputEl.value); } catch (e) { setStatus("err", "Invalid JSON: " + e.message); return; }
  var refWidth = parseInt($("refWidth").value, 10) || 1920;
  var refHeight = parseInt($("refHeight").value, 10) || 1080;
  try {
    var result = convertZl1ToZl2(src, {
      name: $("layoutName").value.trim() || "Converted from ZL1",
      author: $("layoutAuthor").value.trim() || "ZL1→ZL2 Converter",
      refWidth: refWidth, refHeight: refHeight
    });
    lastJson = result.layout;
    outputEl.value = JSON.stringify(result.layout, null, 2);
    $("btnDownload").disabled = false; $("btnCopy").disabled = false;
    statsEl.hidden = false;
    statsEl.innerHTML = '<div class="stat">Buttons: <strong>' + result.stats.buttons + '</strong></div><div class="stat">Joysticks: <strong>' + result.stats.joysticks + '</strong></div><div class="stat">Styles: <strong>' + result.stats.styles + '</strong></div><div class="stat">Layers: <strong>' + result.stats.layers + '</strong></div>';
    if (result.warnings.length) setStatus("warn", "Converted with notes:\n• " + result.warnings.join("\n• "));
    else setStatus("ok", "Conversion OK. Download the JSON and import it in Zalith Launcher 2 → Control list.");
  } catch (e) { setStatus("err", e.message || String(e)); }
}

$("btnConvert").addEventListener("click", doConvert);
$("btnDownload").addEventListener("click", function() {
  if (!lastJson) return;
  var name = ($("layoutName").value.trim() || "converted").replace(/[^\w\-]+/g, "_");
  var blob = new Blob([JSON.stringify(lastJson, null, 2)], { type: "application/json" });
  var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name + "_zl2.json"; a.click(); URL.revokeObjectURL(a.href);
});
$("btnCopy").addEventListener("click", function() {
  if (!outputEl.value) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(outputEl.value).then(function() { setStatus("ok", "Copied to clipboard."); }).catch(function() { outputEl.select(); setStatus("warn", "Copy manually."); });
  } else { outputEl.select(); setStatus("warn", "Copy manually."); }
});

var drop = $("dropzone"), fileInput = $("fileInput");

/* File input covers the whole drop zone — no programmatic .click() needed */
fileInput.addEventListener("change", function() {
  if (fileInput.files && fileInput.files[0]) readFile(fileInput.files[0]);
});

drop.addEventListener("dragover", function(e) {
  e.preventDefault();
  e.stopPropagation();
  drop.classList.add("dragover");
});
drop.addEventListener("dragleave", function(e) {
  e.preventDefault();
  drop.classList.remove("dragover");
});
drop.addEventListener("drop", function(e) {
  e.preventDefault();
  e.stopPropagation();
  drop.classList.remove("dragover");
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
    readFile(e.dataTransfer.files[0]);
  }
});

function readFile(f) {
  var reader = new FileReader();
  reader.onload = function() {
    inputEl.value = reader.result;
    if (!$("layoutName").dataset.touched) {
      $("layoutName").value = f.name.replace(/\.json$/i, "") || "Converted from ZL1";
    }
    doConvert();
  };
  reader.onerror = function() {
    setStatus("err", "Could not read file.");
  };
  reader.readAsText(f);
}

$("layoutName").addEventListener("input", function() { $("layoutName").dataset.touched = "1"; });

$("btnSample").addEventListener("click", function() {
  inputEl.value = JSON.stringify({
    mControlDataList: [
      { name: "W", keycodes: [87,0,0,0], dynamicX: "${margin} * 2 + ${width}", dynamicY: "${bottom} - ${margin} * 3 - ${height} * 2", width: 50, height: 50, isToggle: false, opacity: 1, bgColor: 1291845632, strokeColor: -1, strokeWidth: 0, cornerRadius: 0, isSwipeable: true, passThruEnabled: false, displayInGame: true, displayInMenu: false },
      { name: "A", keycodes: [65,0,0,0], dynamicX: "${margin}", dynamicY: "${bottom} - ${margin} * 2 - ${height}", width: 50, height: 50, isToggle: false, opacity: 1, bgColor: 1291845632, strokeColor: -1, strokeWidth: 0, cornerRadius: 0, isSwipeable: true, passThruEnabled: false, displayInGame: true, displayInMenu: false },
      { name: "S", keycodes: [83,0,0,0], dynamicX: "${margin} * 2 + ${width}", dynamicY: "${bottom} - ${margin}", width: 50, height: 50, isToggle: false, opacity: 1, bgColor: 1291845632, strokeColor: -1, strokeWidth: 0, cornerRadius: 0, isSwipeable: true, passThruEnabled: false, displayInGame: true, displayInMenu: false },
      { name: "D", keycodes: [68,0,0,0], dynamicX: "${margin} * 3 + ${width} * 2", dynamicY: "${bottom} - ${margin} * 2 - ${height}", width: 50, height: 50, isToggle: false, opacity: 1, bgColor: 1291845632, strokeColor: -1, strokeWidth: 0, cornerRadius: 0, isSwipeable: true, passThruEnabled: false, displayInGame: true, displayInMenu: false },
      { name: "Jump", keycodes: [32,0,0,0], dynamicX: "${right} - ${margin}", dynamicY: "${bottom} - ${margin}", width: 50, height: 50, isToggle: false, opacity: 1, bgColor: 1291845632, strokeColor: -1, strokeWidth: 0, cornerRadius: 0, isSwipeable: false, passThruEnabled: false, displayInGame: true, displayInMenu: false },
      { name: "MID", keycodes: [-6,0,0,0], dynamicX: "${right} - ${margin}", dynamicY: "${margin} * 2 + ${height}", width: 50, height: 50, isToggle: false, opacity: 1, bgColor: 1291845632, strokeColor: -1, strokeWidth: 0, cornerRadius: 0, isSwipeable: false, passThruEnabled: false, displayInGame: true, displayInMenu: true },
      { name: "PRI", keycodes: [-3,0,0,0], dynamicX: "${margin}", dynamicY: "${screen_height} - ${margin} * 3 - ${height} * 3", width: 50, height: 50, isToggle: false, opacity: 1, bgColor: 1291845632, strokeColor: -1, strokeWidth: 0, cornerRadius: 0, isSwipeable: false, passThruEnabled: false, displayInGame: true, displayInMenu: true },
      { name: "SEC", keycodes: [-4,0,0,0], dynamicX: "${margin} * 3 + ${width} * 2", dynamicY: "${screen_height} - ${margin} * 3 - ${height} * 3", width: 50, height: 50, isToggle: false, opacity: 1, bgColor: 1291845632, strokeColor: -1, strokeWidth: 0, cornerRadius: 0, isSwipeable: false, passThruEnabled: false, displayInGame: true, displayInMenu: true }
    ],
    mDrawerDataList: [], mJoystickDataList: [], scaledAt: 100, version: 8
  }, null, 2);
  $("layoutName").value = "Sample WASD";
  doConvert();
});
