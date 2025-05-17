# BirdTracker

## About
Master Thesis project
![scheduleV6](https://github.com/user-attachments/assets/a3b9c464-2741-457f-81ca-d6f55e65b11c)

## Updates
---

### Week 20
- Single Vis
  - Variable visualizations
  	- Calculate color scales for continous and categorical data that adjust based on filter
  	- Primary visualization
  	- Secondary visualization
  - Legend
  - Filter
  - Helpers
  	- Generalized line
  	- Time markers
  	- Min/max values arrows (from the primary vis)
  	- Pop-up with higlight

### Week 17-19
- Data loading
  - UI
  - data parsing
  - loading optimazation
- Map controls
  - Slides (instead of bookmarks that didn't supported 3D view and saving environmnent)
  - Basemaps setup
  - Thematic layers setup
  - Additional timeline controls

   
### Week 13-16
- planning
- literature review
- brainstorming and prototypes

### Week 11&12

#### 🚀 New Features
- Basic scene
- Map components (search, basemap, light, measurements, bookmarks, elevation pro)
- Template UI
  
#### 🛠 Improvements
- none

#### 🐛 Bug Fixes
- none
---

## ArcGIS Maps SDK for JavaScript template

### Prerequisites

- Node.js 20.0+

The template comes set up with Prettier for formatting. Take a look at their [editor integration docs](https://prettier.io/docs/en/editors) to integrate it into your development environment.

## Run project locally

To start:
```
npm install
npm run dev
```
Then open your browser at http://localhost:3000/

### Create productive build

```
npm run build
```
The `dist` folder then contains all the files for the web app.
In order to use the `gh-pages` approach, see the following instructions. Make sure you remove an existing `dist` folder if it has been created from a previous build.

### Licensing

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
