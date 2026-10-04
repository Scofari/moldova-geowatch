# LuciadRIA integration status

The workspace had no @luciad/ria package or license. No paid SDK was downloaded or redistributed. The OSS implementation is complete; the LuciadRIA class is a guarded customer integration boundary, not a simulated implementation.

Primary references:

- [Getting started/license requirement](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/)
- [Customer distribution contents](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/articles/guide/getting_started/distribution_contents.html)
- [Development versus deployment license initialization](https://dev.luciad.com/portal/productDocumentation/LuciadRIA/docs/articles/tutorial/getting_started/deployment.html)

To integrate legitimately:

1. Obtain an authorized customer SDK and appropriate license from Hexagon. Review the exact SDK version's APIs and customer distribution rights.
2. Install its supplied npm package privately. Keep registry tokens/private .npmrc, vendor packages and license files out of Git and public artifacts unless specifically allowed by the vendor agreement.
3. In a private integration module, initialize the real vendor license as documented for that version; implement MapAdapter with actual LuciadRIA WebGLMap/model/layer APIs. The map needs a country/options context, click selection, viewport events, independent layer groups and destruction.
4. Register `window.createLicensedLuciadAdapter = (options) => new YourRealLuciadAdapter(options)` **before** React creates the map. Import that private module in your customer build entry point. Do not import Leaflet in this integration.
5. Set root `VITE_MAP_PROVIDER=luciad` and restart Vite. The checked-in LuciadMapAdapter delegates every method to this authorized module; without registration it reports a clear initialization error.
6. Run all interaction checks again, including projection order, bbox, map picking, resizing, independent visibility, weather/report selection and event cleanup. A valid SDK/license is necessary for this verification.

Keep the customer integration in an ignored vendor directory or a separate private package, and explicitly include it in your local licensed build. There is no undocumented runtime download or license bypass. Browser-loaded license text is visible to the browser; use the vendor's permitted delivery mechanism and do not assume it can be hidden like a backend credential.

Returning to the verified free renderer: `VITE_MAP_PROVIDER=oss`. No component outside src/map imports the Luciad SDK.

Remaining limitation: a fully implemented LuciadRIA renderer can only be supplied and verified when the authorized SDK and license are available. Selecting luciad alone does not install them.
