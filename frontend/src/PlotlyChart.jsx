import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function PlotlyChart({ id, traces, layout, config }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !traces || !layout) return;

    const getSize = () => ({
      w: Math.max(300, el.clientWidth - 8),
      h: Math.max(280, el.clientHeight - 8)
    });

    const { w, h } = getSize();

    const defaultAxisStyle = {
      gridcolor: 'rgba(148, 163, 184, 0.08)',
      zerolinecolor: 'rgba(148, 163, 184, 0.16)',
      linecolor: 'rgba(148, 163, 184, 0.16)',
      tickfont: { family: "'IBM Plex Mono', monospace", size: 11, color: '#94a3b8' },
      titlefont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, color: '#cbd5e1' }
    };

    const mergedLayout = {
      paper_bgcolor: 'rgba(0, 0, 0, 0)',
      plot_bgcolor: 'rgba(12, 17, 28, 0.45)',
      font: { family: "'Plus Jakarta Sans', sans-serif", color: '#e2e8f0', size: 12 },
      dragmode: 'zoom',
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: '#0C111C',
        bordercolor: 'rgba(56, 189, 248, 0.35)',
        font: { family: "'IBM Plex Mono', monospace", size: 11.5, color: '#f8fafc' }
      },
      width: w,
      height: h,
      margin: { l: 68, r: 24, t: 28, b: 92 },
      legend: {
        orientation: 'h',
        yanchor: 'top',
        y: -0.24,
        xanchor: 'left',
        x: 0,
        font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, color: '#cbd5e1' },
        bgcolor: 'rgba(0, 0, 0, 0)',
        borderwidth: 0
      },
      ...layout,
      xaxis: { ...defaultAxisStyle, ...(layout.xaxis || {}) },
      yaxis: { ...defaultAxisStyle, ...(layout.yaxis || {}) },
      ...(layout.yaxis2
        ? { yaxis2: { ...defaultAxisStyle, ...layout.yaxis2 } }
        : {})
    };

    const finalConfig = {
      responsive: true,
      scrollZoom: true,
      displayModeBar: true,
      displaylogo: false,
      doubleClick: 'reset+autosize',
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      ...config
    };

    Plotly.react(el, traces, mergedLayout, finalConfig);

    const handleResize = () => {
      if (el && el.clientWidth > 60) {
        const next = getSize();
        Plotly.relayout(el, { width: next.w, height: next.h });
      }
    };

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(handleResize);
      ro.observe(el);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (ro) ro.disconnect();
    };
  }, [traces, layout, config]);

  return <div id={id} ref={containerRef} className="plotly-box" />;
}
