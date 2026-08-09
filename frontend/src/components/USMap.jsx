// ---------------------------------------------------------------------------
// USMap.jsx
//
// Draws a static map of the 50 US states plus Washington, D.C.
//
// "Static" is deliberate at this stage: nothing here responds to clicks or
// hovers yet. The only job of this file is to prove the geography renders
// correctly, so that colouring and vote-counting can be added later on a
// foundation we know works.
// ---------------------------------------------------------------------------

// react-simple-maps gives us three building blocks. They are React components
// that ultimately produce plain SVG (Scalable Vector Graphics) - the same kind
// of shape-drawing markup a browser uses for icons and illustrations.
//
//   ComposableMap - the outer <svg> canvas. Owns the "projection" (see below).
//   Geographies   - loads the map data and hands us back a list of shapes.
//   Geography     - draws ONE shape (one state) as an SVG <path>.
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

// `feature` converts TopoJSON into GeoJSON. More on the difference below.
import { feature } from 'topojson-client'

// The actual map data: an official US Census outline of every state, published
// as the npm package "us-atlas". Because it is a .json file, Vite lets us
// `import` it directly and it becomes a normal JavaScript object.
//
// "10m" refers to the level of detail - 1:10,000,000 scale. There is also a
// more detailed (and much larger) 1:5,000,000 version available as states-5m.
import statesTopoJson from 'us-atlas/states-10m.json'

// ---------------------------------------------------------------------------
// Step 1: turn the map data into a list of drawable shapes
// ---------------------------------------------------------------------------
//
// The file we imported is in TopoJSON format. TopoJSON is a space-saving
// format: rather than storing each state as its own closed outline, it stores
// each *border segment* exactly once and describes states as combinations of
// those shared segments. The border between Kansas and Nebraska is therefore
// stored once, not twice. That makes the file much smaller, but it also means
// the data is not directly drawable.
//
// `feature()` expands it back into GeoJSON, where every state is a standalone
// shape with its own complete outline. That IS drawable.
//
// The second argument names which collection we want. This file contains two:
//   - `objects.states` -> 56 individual shapes (what we want)
//   - `objects.nation` -> 1 shape, the outline of the whole country
// Naming `objects.states` explicitly means we can never accidentally pick up
// the single-blob national outline.
//
// This runs once when the file is first loaded, NOT on every render. Anything
// written at the top level of a module like this happens a single time, which
// matters here because converting ~1 MB of geography is real work we do not
// want to repeat every time React redraws the screen.
const { features: allFeatures } = feature(statesTopoJson, statesTopoJson.objects.states)

// ---------------------------------------------------------------------------
// Step 2: keep only the 50 states + DC
// ---------------------------------------------------------------------------
//
// The 56 shapes are the 50 states, Washington D.C., and five US territories.
// Each shape is labelled with a FIPS code - a two-digit government ID number
// for the place (Alabama is "01", Alaska is "02", and so on).
//
// We drop the five territories for a concrete technical reason: the map
// projection we use below (see Step 3) only knows how to position places
// within the 50 states + DC. Asked to place American Samoa, it returns nothing
// at all, which would leave us with five invisible, empty shapes cluttering the
// output. Filtering them out here is cleaner than drawing nothing five times.
//
// (Adding these territories back later would mean choosing a different
// projection, or drawing them as separate manually-placed insets.)
const TERRITORY_FIPS_CODES = new Set([
  '60', // American Samoa
  '66', // Guam
  '69', // Northern Mariana Islands
  '72', // Puerto Rico
  '78', // US Virgin Islands
])

// String(...) guards against the ID arriving as a number rather than text:
// comparing the number 72 to the text "72" would silently fail, and the bug
// would show up as a stray shape rather than an error message.
const stateFeatures = allFeatures.filter(
  (geo) => !TERRITORY_FIPS_CODES.has(String(geo.id)),
)

// ---------------------------------------------------------------------------
// Step 3: colours and sizing, named once so they are easy to find and change
// ---------------------------------------------------------------------------

// Neutral grey - every state looks identical for now. When clicking is added,
// this becomes the "undecided" colour that red and blue replace.
const NEUTRAL_FILL = '#e2e5ea'
const BORDER_COLOR = '#9aa3af'

// These three numbers are not arbitrary, and they work together.
//
// The Earth is round and a screen is flat, so any map must "project" curved
// coordinates onto a flat surface. `geoAlbersUsa` is a projection built
// specifically for the United States, and it has one special behaviour we want:
// it does not put Alaska and Hawaii where they really are. Alaska is rescaled
// and both are repositioned into the lower-left corner as insets. That is a
// property of the projection itself, not something we position by hand.
//
// (Drawn at true position and scale, Alaska is enormous and sits far to the
// northwest, which would force the lower 48 into a small corner of the image.)
//
// The numbers below are the standard values this projection was designed
// around: at a scale of 1070, the whole country fits neatly into a 960x500 box.
// react-simple-maps automatically centres the projection at width/2, height/2 -
// here [480, 250] - which is exactly what the projection expects. Change one of
// these three and you will likely need to adjust the others to match.
const MAP_WIDTH = 960
const MAP_HEIGHT = 500
const MAP_SCALE = 1070

// ---------------------------------------------------------------------------
// Step 4: the component
// ---------------------------------------------------------------------------

function USMap() {
  return (
    <ComposableMap
      projection="geoAlbersUsa"
      width={MAP_WIDTH}
      height={MAP_HEIGHT}
      projectionConfig={{ scale: MAP_SCALE }}
      // The 960x500 above describes the map's internal coordinate system, not
      // its size on screen. This style lets the finished SVG stretch to fill
      // whatever container it sits in, keeping its proportions as it scales -
      // so the map stays sharp and correctly shaped at any window size.
      style={{ width: '100%', height: 'auto' }}
    >
      {/*
        <Geographies> does not render anything itself. Instead it processes the
        shape data and passes the results to a function, which returns the JSX
        to draw. That function is written between the tags below.

        This "a function as the child" arrangement is a React pattern called a
        render prop. It looks unusual at first; the practical effect is that
        <Geographies> handles the map maths and then says "here are your
        prepared shapes, you decide how to draw them."
      */}
      <Geographies geography={stateFeatures}>
        {({ geographies }) =>
          // `geographies` is an array of 51 prepared shapes. We turn each one
          // into a <Geography>, which renders as a single SVG <path>.
          //
          // .map() converts an array of data into an array of elements - the
          // standard way to render a list in React.
          geographies.map((geo) => (
            <Geography
              // React needs a stable, unique `key` for every item in a list so
              // it can tell them apart between redraws. `rsmKey` is an ID that
              // react-simple-maps generates for exactly this purpose.
              key={geo.rsmKey}
              geography={geo}
              fill={NEUTRAL_FILL}
              stroke={BORDER_COLOR}
              // Measured in the map's own coordinate units, so this stays
              // proportionally thin no matter how large the map is displayed.
              strokeWidth={0.5}
              // By default react-simple-maps dims a state on hover and on
              // click. We override all three states with identical styling so
              // the map is completely inert, matching "no interactivity yet".
              // `outline: none` also removes the browser's focus ring.
              //
              // When clicking is added later, this is the block that changes.
              style={{
                default: { outline: 'none' },
                hover: { outline: 'none' },
                pressed: { outline: 'none' },
              }}
            />
          ))
        }
      </Geographies>
    </ComposableMap>
  )
}

// `export default` makes this component available to other files. It is what
// allows App.jsx to write: import USMap from './components/USMap'
export default USMap
