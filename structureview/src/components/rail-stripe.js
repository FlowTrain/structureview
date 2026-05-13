/**
 * RailStripe — accent stripe at top of viewport. Blue → Gold → Blue.
 * Pure decorative; aria-hidden. Honours the locomotive livery from the brief.
 */
'use strict';

function renderRailStripe() {
  return '<div class="sv-rail-stripe" aria-hidden="true"></div>';
}

module.exports = { renderRailStripe };
