# BirdTracker

## About

Developed as part of a Master's thesis at **Institute of Cartography and Geoinformation (IKG) at ETH Zurich**, this application addresses a gap in existing tools for movement ecologists by **integrating interactivity, 3D perspectives, and environmental data**.

## Code structure

- components/App.tsx: main structure of the application containing HTML, map settings, and calling data loading function
- utils.ts: helpers function that are erused across whole application
- mapControls.ts: setting map controls - basemaps, thematic layers and slides
- dataLoading.ts: data parsing, creating layers and modes and setting UI and functionality for the Group View
- singleVisualization.ts: setting UI and functionality for the Single View
- layers.ts: setting all path related layers
- timeslider.ts: managing the time control, animation and Follow mode
- charts.ts: setting up and controling the line chart and elevation profile
- weather.ts: setting weather functionality

## Licensing

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

A copy of the license is available in the repository's [license.txt](./license.txt) file.
