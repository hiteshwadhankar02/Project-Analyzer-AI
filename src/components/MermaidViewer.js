import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'dark' });

const MermaidViewer = ({ chart }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!chart || !ref.current) return;

    // Generate a unique ID for each render to avoid clashes
    const renderId = `mermaid-${Math.random().toString(36).slice(2)}`;
    const container = ref.current;
    container.innerHTML = `<div class="mermaid">${chart}</div>`;

    // Render mermaid
    try {
      mermaid.init(undefined, container);
    } catch (e) {
      console.error('Mermaid render error:', e);
      container.innerHTML = '<pre class="text-red-300">Failed to render diagram</pre>';
    }
  }, [chart]);

  return (
    <div ref={ref} className="w-full overflow-x-auto">
      {/* Mermaid content renders here */}
    </div>
  );
};

export default MermaidViewer;
