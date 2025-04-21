/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Iframe } from '../iframe.js';

describe('Iframe class', () => {
  let container;
  let iframeInstance;

  beforeEach(() => {
    // Reset DOM container
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    iframeInstance = new Iframe();
  });

  it('should initialize hidden elements', () => {
    expect(iframeInstance.element.className).toContain('village-hidden');
    expect(iframeInstance.spinner.className).toContain('village-hidden');
    expect(iframeInstance.spinner.className).toContain('village-loading');
  });

  it('should update classes based on url/module params', () => {
    // Hidden when no url/module
    iframeInstance.update({ token: null, partnerKey: null, userReference: null, url: null, module: null, config: { paths_cta: [] } });
    expect(iframeInstance.element.className).toBe('village-iframe village-hidden');
    expect(iframeInstance.spinner.className).toBe('village-iframe village-hidden village-loading');

    // Visible when url provided
    iframeInstance.update({ token: null, partnerKey: null, userReference: null, url: 'http://x', module: null, config: { paths_cta: [] } });
    expect(iframeInstance.element.className).toBe('village-iframe');
    expect(iframeInstance.spinner.className).toBe('village-iframe village-loading');
  });

  it('hideSpinner() should hide only the spinner', () => {
    // First make spinner visible
    iframeInstance.update({ token: null, partnerKey: null, userReference: null, url: 'http://x', module: null, config: { paths_cta: [] } });
    iframeInstance.hideSpinner();
    expect(iframeInstance.spinner.className).toBe('village-iframe village-hidden village-loading');
    // Element remains visible
    expect(iframeInstance.element.className).toBe('village-iframe');
  });

  it('render() should append element and spinner only once', () => {
    iframeInstance.update({ token: null, partnerKey: null, userReference: null, url: 'http://x', module: null, config: { paths_cta: [] } });
    iframeInstance.render(container);
    iframeInstance.render(container);
    // container should have exactly two children: spinner and iframe
    expect(container.children.length).toBe(2);
    expect(container.children[0]).toBe(iframeInstance.spinner);
    expect(container.children[1]).toBe(iframeInstance.element);
  });
});
