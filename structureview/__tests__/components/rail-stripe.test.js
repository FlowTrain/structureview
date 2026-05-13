const { renderRailStripe } = require('../../src/components/rail-stripe');

describe('renderRailStripe', () => {
  test('renders a decorative stripe div', () => {
    expect(renderRailStripe()).toBe('<div class="sv-rail-stripe" aria-hidden="true"></div>');
  });
});
