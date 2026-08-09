// ---------------------------------------------------------------------------
// App.jsx
//
// The top-level component - the root of the page. Its only job right now is to
// lay out a heading and the map beneath it.
//
// This file started as Vite's demo page (the spinning logos and click counter)
// and has been replaced entirely.
// ---------------------------------------------------------------------------

import USMap from './components/USMap'
import './App.css'

function App() {
  // Everything below `return` is JSX: HTML-like markup written inside
  // JavaScript. React turns it into the real elements the browser displays.
  //
  // Note `className` rather than `class` - `class` is a reserved word in
  // JavaScript, so React uses `className` to attach CSS classes instead.
  return (
    <main className="app">
      <header className="app-header">
        <h1>U.S. Electoral Map</h1>
        <p className="app-subtitle">
          All 50 states plus Washington, D.C. &mdash; with Alaska and Hawaii
          shown as insets in the lower left, not at their true geographic
          positions.
        </p>
      </header>

      {/*
        The map is wrapped in its own container so the card styling (border,
        padding, white background) lives on the wrapper rather than inside the
        map component. That keeps USMap.jsx focused purely on drawing geography.
      */}
      <div className="map-card">
        <USMap />
      </div>
    </main>
  )
}

export default App
